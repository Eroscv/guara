import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash } from "node:crypto";
import { ApiError } from "./errors.js";
import type { UpstreamConfig } from "./upstream.js";

// ===================================================================
// Acesso ao painel (/admin) pelo login da API da Guará (FastAPI).
//
//  - O navegador nunca fala com a API da Guará: fala com /api/admin/*, que
//    repassa. Assim o endereço dela (hoje um túnel provisório) e a chave
//    X-API-Key ficam só em variáveis de ambiente do servidor.
//  - O JWT que o /auth/login devolve vai pra um cookie HttpOnly (JavaScript
//    não lê), SameSite=Strict, restrito a /api/admin.
//  - A cada chamada, o token é conferido perguntando ao /auth/me da própria
//    API (não precisamos do segredo do JWT). O resultado fica 30 s em memória.
//  - Só entra quem tem role admin e está ativo.
// ===================================================================

export const COOKIE_NAME = "gm_admin";
const COOKIE_PATH = "/api/admin";
const JWT_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const ADMIN_ROLES = ["admin", "administrador", "superadmin", "sysadmin", "owner"];
const WHOAMI_TTL_MS = 30_000;
const TIMEOUT_MS = 25_000;
// Cabeçalho que o painel manda em toda escrita. Junto com SameSite=Strict, impede
// que outro site faça o navegador do admin disparar um POST/PATCH/DELETE.
export const CSRF_HEADER = "x-requested-with";
export const CSRF_VALUE = "guara-admin";

export interface AdminUser {
  id: string;
  email: string;
  nome: string | null;
  role: string;
  ativo: boolean;
  isAdmin: boolean;
}

// ---------------------------------------------------------------- upstream

// Endereço da API da Guará. Não é segredo (a API pede login/chave pra tudo, menos /health), então
// vai no código e o painel funciona sem variável nenhuma. GUARA_API_UPSTREAM, se existir, vence —
// é como se troca o endereço quando o túnel mudar, sem mexer no código.
export const DEFAULT_UPSTREAM = "https://airport-sing-drilling-recorders.trycloudflare.com";

export function authBase(): string {
  const base = ((process.env.GUARA_API_UPSTREAM || "").trim() || DEFAULT_UPSTREAM).replace(/\/+$/, "");
  if (!/^https?:\/\/[^\s]+$/.test(base)) throw new ApiError(500, "GUARA_API_UPSTREAM precisa ser um endereço http(s) válido.");
  return base;
}

/**
 * Configuração pra chamar os dados da API pelo painel. A credencial é o token do admin logado
 * (Authorization: Bearer). GUARA_API_UPSTREAM_KEY, se existir, vai junto como X-API-Key — serve
 * enquanto o servidor da API ainda só entende a chave.
 */
export function panelUpstream(bearer: string): UpstreamConfig {
  return { base: authBase(), key: (process.env.GUARA_API_UPSTREAM_KEY || "").trim(), bearer };
}

export async function authCall(method: string, path: string, opts: { token?: string; body?: unknown } = {}) {
  const base = authBase();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
        ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { detail: text.slice(0, 200) };
    }
    return { status: res.status, json };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[admin-auth] API da Guará não respondeu:", (e as Error)?.message);
    throw new ApiError(503, "A API da Guará não respondeu. Tente de novo em instantes.");
  } finally {
    clearTimeout(timer);
  }
}

// A API devolve { detail: "texto" } ou { detail: [ {msg, loc} ] }.
export function authError(status: number, json: any): ApiError {
  const d = json?.detail ?? json?.error ?? json?.message;
  const text = typeof d === "string" ? d : Array.isArray(d) ? d.map((x: any) => x?.msg).filter(Boolean).join("; ") : "";
  if (status === 401) return new ApiError(401, text || "Sessão expirada. Entre de novo.");
  if (status === 403) return new ApiError(403, text || "Sem permissão para isso.");
  if (status === 404) return new ApiError(404, text || "Não encontrado.");
  if (status === 409) return new ApiError(409, text || "Já existe um cadastro com esses dados.");
  if (status === 400 || status === 422) return new ApiError(400, text || "Dados inválidos.");
  // eslint-disable-next-line no-console
  console.error(`[admin-auth] erro ${status} na API da Guará.`);
  return new ApiError(503, "A API da Guará não respondeu direito. Tente de novo em instantes.");
}

// ---------------------------------------------------------------- usuário

export function toUser(json: any): AdminUser {
  const u = json?.user ?? json?.usuario ?? json ?? {};
  const role = String(u.role ?? u.papel ?? "").toLowerCase();
  const ativo = u.ativo ?? u.active ?? u.is_active ?? true;
  const isAdmin = ativo !== false && (ADMIN_ROLES.includes(role) || u.is_admin === true || u.admin === true);
  return {
    id: String(u.id ?? u.user_id ?? u.email ?? ""),
    email: String(u.email ?? ""),
    nome: u.nome ?? u.name ?? null,
    role,
    ativo: ativo !== false,
    isAdmin,
  };
}

const cache = new Map<string, { user: AdminUser; at: number }>();
const fingerprint = (token: string) => createHash("sha256").update(token).digest("hex");

/** Pergunta à API quem é o dono do token (com cache curto). */
export async function whoami(token: string): Promise<AdminUser> {
  const key = fingerprint(token);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < WHOAMI_TTL_MS) return hit.user;
  const r = await authCall("GET", "/auth/me", { token });
  if (r.status >= 400) {
    cache.delete(key);
    throw authError(r.status === 422 ? 401 : r.status, r.json);
  }
  const user = toUser(r.json);
  cache.set(key, { user, at: Date.now() });
  if (cache.size > 200) for (const k of cache.keys()) { cache.delete(k); if (cache.size <= 100) break; }
  return user;
}

export function forgetToken(token: string) {
  cache.delete(fingerprint(token));
}

// ---------------------------------------------------------------- cookie / pedido

export function readToken(req: VercelRequest): string | null {
  const raw = req.headers.cookie;
  if (raw) {
    for (const part of raw.split(/;\s*/)) {
      const i = part.indexOf("=");
      if (i > 0 && part.slice(0, i) === COOKIE_NAME) {
        const v = decodeURIComponent(part.slice(i + 1));
        if (JWT_RE.test(v)) return v;
      }
    }
  }
  const auth = req.headers.authorization;
  const bearer = (Array.isArray(auth) ? auth[0] : auth)?.replace(/^Bearer\s+/i, "");
  return bearer && JWT_RE.test(bearer) ? bearer : null;
}

/** exp do JWT (segundos), pra o cookie durar o mesmo que o token. */
function jwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1]!, "base64url").toString("utf8"));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: VercelResponse, token: string) {
  const exp = jwtExp(token);
  const maxAge = exp ? Math.min(Math.max(exp - Math.floor(Date.now() / 1000), 60), 7 * 86400) : 86400;
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${token}; Path=${COOKIE_PATH}; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`);
}

export function clearSessionCookie(res: VercelResponse) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=${COOKIE_PATH}; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}

export function assertSameSiteIntent(req: VercelRequest) {
  const method = (req.method || "GET").toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return;
  const v = req.headers[CSRF_HEADER];
  if ((Array.isArray(v) ? v[0] : v) !== CSRF_VALUE) throw new ApiError(403, "Pedido recusado.");
}

/**
 * Garante que quem chama é um admin logado no painel.
 * Devolve o usuário e o token (pra repassar ao /auth/* da API).
 */
export async function requireAdmin(req: VercelRequest): Promise<{ user: AdminUser; token: string }> {
  assertSameSiteIntent(req);
  const token = readToken(req);
  if (!token) throw new ApiError(401, "Não autenticado.");
  const user = await whoami(token);
  if (!user.isAdmin) {
    throw new ApiError(403, user.ativo ? `Esta conta (${user.role || "sem papel"}) não tem acesso ao painel.` : "Esta conta está desativada.");
  }
  return { user, token };
}

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApiError, handleCaught } from "../../_lib/errors.js";
import { getBody } from "../../_lib/http.js";
import {
  assertSameSiteIntent, authCall, authError, clearSessionCookie, forgetToken, readToken, requireAdmin, setSessionCookie, toUser, whoami,
} from "../../_lib/adminAuth.js";

export const config = { maxDuration: 30 };

// /api/admin/auth/* — entrar, sair, quem sou eu e gestão de usuários do painel.
// Tudo é repassado ao /auth/* da API da Guará (ver _lib/adminAuth.ts).

const ID_RE = /^[A-Za-z0-9._~-]{1,200}$/;
const notAllowed = () => new ApiError(405, "Método não permitido nesse endereço.");
const publicUser = (u: ReturnType<typeof toUser>) => ({ id: u.id, email: u.email, nome: u.nome, role: u.role, ativo: u.ativo });

function pick(body: any, keys: string[]) {
  const out: Record<string, unknown> = {};
  if (body && typeof body === "object") for (const k of keys) if (body[k] !== undefined) out[k] = body[k];
  return out;
}

function userId(raw: string | undefined) {
  if (!raw || !ID_RE.test(raw) || raw === "." || raw === "..") throw new ApiError(404, "Usuário não encontrado.");
  return encodeURIComponent(raw);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const segments = ([] as string[]).concat((req.query.route as string | string[]) || []);
    const [first, second] = segments;
    const method = req.method || "GET";

    // ---- entrar
    if (first === "login" && !second) {
      if (method !== "POST") throw notAllowed();
      assertSameSiteIntent(req);
      const body = getBody(req) as { email?: unknown; senha?: unknown };
      const email = typeof body.email === "string" ? body.email.trim() : "";
      const senha = typeof body.senha === "string" ? body.senha : "";
      if (!email || !senha) throw new ApiError(400, "Informe e-mail e senha.");

      const r = await authCall("POST", "/auth/login", { body: { email, senha } });
      if (r.status >= 400) throw authError(r.status, r.json);
      const token: unknown = r.json?.access_token ?? r.json?.token ?? r.json?.jwt;
      if (typeof token !== "string" || !token) {
        // eslint-disable-next-line no-console
        console.error("[admin-auth] /auth/login não devolveu access_token.");
        throw new ApiError(503, "A API da Guará respondeu de um jeito inesperado ao entrar.");
      }
      // Só quem é admin ganha o cookie; as outras contas existem na API mas não entram no painel.
      const user = await whoami(token);
      if (!user.isAdmin) {
        throw new ApiError(403, user.ativo ? `Esta conta (${user.role || "sem papel"}) não tem acesso ao painel.` : "Esta conta está desativada.");
      }
      setSessionCookie(res, token);
      res.status(200).json({ user: publicUser(user) });
      return;
    }

    // ---- sair (sempre funciona, mesmo sem sessão)
    if (first === "logout" && !second) {
      if (method !== "POST") throw notAllowed();
      assertSameSiteIntent(req);
      const token = readToken(req);
      if (token) forgetToken(token);
      clearSessionCookie(res);
      res.status(200).json({ ok: true });
      return;
    }

    // ---- daqui pra frente, só admin logado
    const { user, token } = await requireAdmin(req);

    if (first === "me" && !second) {
      if (method === "GET") {
        res.status(200).json({ user: publicUser(user) });
        return;
      }
      if (method === "PATCH") {
        const patch = pick(getBody(req), ["nome", "senha"]);
        if (!Object.keys(patch).length) throw new ApiError(400, "Nada para alterar.");
        const r = await authCall("PATCH", "/auth/me", { token, body: patch });
        if (r.status >= 400) throw authError(r.status, r.json);
        forgetToken(token);
        res.status(200).json({ user: publicUser(await whoami(token)) });
        return;
      }
      throw notAllowed();
    }

    if (first === "users") {
      if (!second) {
        if (method === "GET") {
          const r = await authCall("GET", "/auth/users", { token });
          if (r.status >= 400) throw authError(r.status, r.json);
          const list: any[] = Array.isArray(r.json) ? r.json : Array.isArray(r.json?.data) ? r.json.data : Array.isArray(r.json?.users) ? r.json.users : [];
          res.status(200).json({ data: list.map((u) => publicUser(toUser(u))) });
          return;
        }
        if (method === "POST") {
          const body = pick(getBody(req), ["email", "senha", "nome", "role"]);
          if (!body.email || !body.senha) throw new ApiError(400, "Informe e-mail e senha.");
          const r = await authCall("POST", "/auth/register", { token, body });
          if (r.status >= 400) throw authError(r.status, r.json);
          res.status(201).json(publicUser(toUser(r.json)));
          return;
        }
        throw notAllowed();
      }

      const id = userId(second);
      if (method === "PATCH") {
        const patch = pick(getBody(req), ["role", "ativo", "nome"]);
        if (!Object.keys(patch).length) throw new ApiError(400, "Nada para alterar.");
        const r = await authCall("PATCH", `/auth/users/${id}`, { token, body: patch });
        if (r.status >= 400) throw authError(r.status, r.json);
        res.status(200).json(publicUser(toUser(r.json)));
        return;
      }
      if (method === "DELETE") {
        const r = await authCall("DELETE", `/auth/users/${id}`, { token });
        if (r.status >= 400) throw authError(r.status, r.json);
        res.status(200).json({ deleted: decodeURIComponent(id) });
        return;
      }
      throw notAllowed();
    }

    throw new ApiError(404, "Endereço ou item não encontrado.");
  } catch (err) {
    handleCaught(res, err);
  }
}

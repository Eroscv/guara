import type { VercelResponse } from "@vercel/node";
import { ApiError } from "./errors.js";

// ===================================================================
// Modo "upstream": /api/public/v1 repassa as chamadas pra API externa da
// Guará (FastAPI, GUARA_API_UPSTREAM) e traduz as diferenças em relação ao
// manual (Guara-API-manual.pdf). Se GUARA_API_UPSTREAM não está definida,
// nada disto roda e a API nativa (Supabase + Vercel Postgres) responde.
//
// Regras de segurança:
//  - a chave do cliente (gm_...) é validada ANTES, contra o Postgres; ela
//    nunca é encaminhada. Pro servidor de origem vai só GUARA_API_UPSTREAM_KEY.
//  - só rotas da lista do manual são encaminhadas (segmentos validados),
//    e o endereço de origem vem só da variável de ambiente.
// ===================================================================

export type Resource = "leads" | "newsletter" | "tool_downloads" | "applications" | "posts" | "jobs" | "tools";
export type RouteKind = "summary" | "list" | "item" | "create";

export interface UpstreamConfig {
  base: string;
  key: string;
}

export function upstreamConfig(): UpstreamConfig | null {
  const base = (process.env.GUARA_API_UPSTREAM || "").trim().replace(/\/+$/, "");
  if (!base) return null;
  if (!/^https?:\/\/[^\s]+$/.test(base)) {
    throw new ApiError(500, "GUARA_API_UPSTREAM precisa ser um endereço http(s) válido.");
  }
  const key = (process.env.GUARA_API_UPSTREAM_KEY || "").trim();
  if (!key) throw new ApiError(500, "GUARA_API_UPSTREAM_KEY não está configurada.");
  return { base, key };
}

// ---------------------------------------------------------------- rotas

const CADASTROS: Resource[] = ["leads", "newsletter", "tool_downloads", "applications"];
const CONTENT_ALIAS: Record<string, Resource> = {
  blog: "posts",
  posts: "posts",
  vagas: "jobs",
  jobs: "jobs",
  ferramentas: "tools",
  tools: "tools",
};

const NOT_FOUND = "Endereço ou item não encontrado.";
const NOT_ALLOWED = "Método não permitido nesse endereço.";
const SEG_RE = /^[A-Za-z0-9._~-]{1,200}$/;

function checkId(id: string): string {
  if (!SEG_RE.test(id) || id === "." || id === "..") throw new ApiError(404, NOT_FOUND);
  return encodeURIComponent(id);
}

// Nomes dos caminhos na API de origem (nem sempre iguais aos do manual:
// ela só tem GET de item de vaga em /vagas/{id} e o de ferramenta em
// /ferramentas/{id}, enquanto criar/alterar/apagar usam /jobs e /tools).
const UPSTREAM_PATH: Record<Resource, { list: string; get: string; write: string }> = {
  leads: { list: "/leads", get: "/leads", write: "/leads" },
  newsletter: { list: "/newsletter", get: "/newsletter", write: "/newsletter" },
  tool_downloads: { list: "/tool_downloads", get: "/tool_downloads", write: "/tool_downloads" },
  applications: { list: "/applications", get: "/applications", write: "/applications" },
  posts: { list: "/posts", get: "/posts", write: "/posts" },
  jobs: { list: "/vagas", get: "/vagas", write: "/jobs" },
  tools: { list: "/ferramentas", get: "/ferramentas", write: "/tools" },
};

export interface MappedRoute {
  resource: Resource | null;
  kind: RouteKind;
  id?: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
}

export function mapRoute(method: string, segments: string[]): MappedRoute {
  const [first, second, third] = segments;
  if (!first || third !== undefined) throw new ApiError(404, NOT_FOUND);

  if (first === "summary") {
    if (second !== undefined) throw new ApiError(404, NOT_FOUND);
    if (method !== "GET") throw new ApiError(405, NOT_ALLOWED);
    return { resource: null, kind: "summary", method: "GET", path: "/summary" };
  }

  const isCadastro = (CADASTROS as string[]).includes(first);
  const resource = isCadastro ? (first as Resource) : CONTENT_ALIAS[first];
  if (!resource) throw new ApiError(404, NOT_FOUND);
  const paths = UPSTREAM_PATH[resource];

  if (second === undefined) {
    if (method === "GET") return { resource, kind: "list", method: "GET", path: paths.list };
    if (method === "POST" && !isCadastro) return { resource, kind: "create", method: "POST", path: paths.write };
    throw new ApiError(405, NOT_ALLOWED);
  }

  const id = checkId(second);
  if (method === "GET") return { resource, kind: "item", id, method: "GET", path: `${paths.get}/${id}` };
  if (method === "PATCH") return { resource, kind: "item", id, method: "PATCH", path: `${paths.write}/${id}` };
  if (method === "DELETE") return { resource, kind: "item", id, method: "DELETE", path: `${paths.write}/${id}` };
  throw new ApiError(405, NOT_ALLOWED);
}

// ---------------------------------------------------------------- filtros

const LIST_PARAMS: Record<Resource, string[]> = {
  leads: ["limit", "offset", "since"],
  newsletter: ["limit", "offset", "since"],
  tool_downloads: ["limit", "offset", "since"],
  applications: ["status", "limit", "offset", "since"],
  posts: ["status", "category", "tag", "q", "limit", "offset"],
  jobs: ["status", "department", "q", "limit", "offset"],
  tools: ["status", "category", "q", "limit", "offset"],
};

const STATUS_VALUES: Partial<Record<Resource, string[]>> = {
  applications: ["novo", "analise", "entrevista", "aprovado", "recusado"],
  posts: ["all", "active", "archived", "published", "draft", "scheduled"],
  jobs: ["all", "active", "archived", "open", "closed", "scheduled"],
  tools: ["all", "active", "archived", "published", "draft"],
};

// A API de origem aceita qualquer coisa (limit=999, status=xx dão 200); o
// manual manda 400. Valida aqui, no formato de erro do manual, e só encaminha
// parâmetros conhecidos e já normalizados.
export function validateListQuery(resource: Resource, qs: URLSearchParams) {
  const fieldErrors: Record<string, string[]> = {};
  const allowed = LIST_PARAMS[resource];
  const forward = new URLSearchParams();

  for (const [name] of qs) {
    if (!allowed.includes(name)) fieldErrors[name] = ["Filtro inexistente neste endereço."];
  }

  let limit = 50;
  if (qs.has("limit")) {
    const n = Number(qs.get("limit"));
    if (!Number.isInteger(n) || n < 1 || n > 200) fieldErrors.limit = ["limit deve ser um número inteiro entre 1 e 200."];
    else limit = n;
  }
  let offset = 0;
  if (qs.has("offset")) {
    const n = Number(qs.get("offset"));
    if (!Number.isInteger(n) || n < 0) fieldErrors.offset = ["offset deve ser um número inteiro maior ou igual a 0."];
    else offset = n;
  }
  if (qs.has("since")) {
    const d = new Date(qs.get("since") as string);
    if (Number.isNaN(d.getTime())) fieldErrors.since = ["since precisa ser uma data ISO 8601 válida."];
    else forward.set("since", d.toISOString());
  }
  if (qs.has("status")) {
    const v = qs.get("status") as string;
    const ok = STATUS_VALUES[resource] || [];
    if (!ok.includes(v)) fieldErrors.status = [`status deve ser um de: ${ok.join(", ")}.`];
    else forward.set("status", v);
  }
  for (const name of ["category", "tag", "q", "department"]) {
    const v = qs.get(name);
    if (v && allowed.includes(name)) forward.set(name, v);
  }

  if (Object.keys(fieldErrors).length) {
    throw new ApiError(400, "Dados inválidos", { formErrors: [], fieldErrors });
  }
  forward.set("limit", String(limit));
  forward.set("offset", String(offset));
  return { limit, offset, forward };
}

// ---------------------------------------------------------------- respostas

export function normalizeItem(resource: Resource | null, obj: any) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  if (resource === "posts" && "read_time" in obj && !("reading_time" in obj)) {
    const { read_time, ...rest } = obj;
    return { ...rest, reading_time: read_time };
  }
  return obj;
}

export function listOf(json: any): any[] {
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json.data)) return json.data;
  return [];
}

export function normalizeSummary(s: any) {
  const totals = s?.totais || {};
  const week = s?.ultimos_7_dias || {};
  const pair = (k: string) => ({ total: totals[k] ?? 0, last_7_days: week[k] ?? 0 });
  return {
    leads: pair("leads"),
    newsletter: pair("newsletter"),
    tool_downloads: pair("tool_downloads"),
    applications: pair("applications"),
    applications_pending: s?.candidaturas_por_status?.novo ?? 0,
    scheduled_posts: s?.agendados?.posts ?? 0,
    scheduled_jobs: s?.agendados?.vagas ?? 0,
  };
}

// Erros no formato do manual: { error, details: { formErrors, fieldErrors } }.
// A origem (FastAPI) devolve { detail }, e usa 422 pra qualquer validação —
// o manual usa 400 pra dados inválidos e deixa 422 só pra imagem com problema.
export function normalizeError(status: number, json: any): ApiError {
  const detail = json?.detail ?? json?.error ?? json?.message;

  if (status === 401 || status === 403) {
    // chave da origem recusada = configuração errada nossa; não vaza pro cliente
    // eslint-disable-next-line no-console
    console.error(`[upstream] a API de origem recusou a chave do servidor (${status}).`);
    return new ApiError(500, "Falha interna. Tente de novo.");
  }
  if (status === 404) return new ApiError(404, NOT_FOUND);
  if (status === 405) return new ApiError(405, NOT_ALLOWED);
  if (status === 409) return new ApiError(409, typeof detail === "string" ? detail : "Slug já existe.");
  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(`[upstream] erro ${status} na API de origem.`);
    return new ApiError(500, "Falha interna. Tente de novo.");
  }

  if (status === 400 || status === 422) {
    if (Array.isArray(detail)) {
      const fieldErrors: Record<string, string[]> = {};
      const formErrors: string[] = [];
      for (const d of detail) {
        const loc: unknown[] = Array.isArray(d?.loc) ? d.loc : [];
        const field = [...loc].reverse().find((x) => typeof x === "string" && !["body", "query", "path"].includes(x as string)) as string | undefined;
        const msg = String(d?.msg ?? "Valor inválido.");
        if (field) (fieldErrors[field] ||= []).push(msg);
        else formErrors.push(msg);
      }
      return new ApiError(400, "Dados inválidos", { formErrors, fieldErrors });
    }
    const message = typeof detail === "string" ? detail : detail?.error || "Dados inválidos";
    const details = detail && typeof detail === "object" ? detail.details ?? detail : undefined;
    return new ApiError(status, message, details);
  }

  return new ApiError(status, typeof detail === "string" ? detail : "Erro na requisição.");
}

// ---------------------------------------------------------------- chamada

const TIMEOUT_MS = 25000;
const MAX_COUNT_PAGES = 20;

async function callUpstream(cfg: UpstreamConfig, method: string, path: string, query?: string, body?: unknown) {
  const url = `${cfg.base}${path}${query ? `?${query}` : ""}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method,
      headers: {
        "X-API-Key": cfg.key,
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
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
    console.error("[upstream] falha de rede/timeout:", (e as Error)?.message);
    throw new ApiError(500, "Falha interna. Tente de novo.");
  } finally {
    clearTimeout(timer);
  }
}

// A origem devolve a lista pura, sem total. Se a página veio cheia, pagina o
// resto (mesmo tamanho de página) pra dar um count exato; se passar do teto de
// páginas, devolve o que contou com exact=false.
async function totalCount(cfg: UpstreamConfig, path: string, forward: URLSearchParams, limit: number, offset: number, firstLen: number) {
  if (firstLen < limit) return { count: offset + firstLen, exact: true };
  let count = offset + firstLen;
  let next = offset + limit;
  for (let i = 0; i < MAX_COUNT_PAGES; i++) {
    const q = new URLSearchParams(forward);
    q.set("offset", String(next));
    const r = await callUpstream(cfg, "GET", path, q.toString());
    if (r.status >= 400) break;
    const arr = listOf(r.json);
    count += arr.length;
    if (arr.length < limit) return { count, exact: true };
    next += limit;
  }
  return { count, exact: false };
}

export async function proxyRequest(
  res: VercelResponse,
  cfg: UpstreamConfig,
  input: { method: string; segments: string[]; qs: URLSearchParams; getBody: () => unknown }
) {
  const route = mapRoute(input.method, input.segments);

  if (route.kind === "summary") {
    const r = await callUpstream(cfg, "GET", route.path);
    if (r.status >= 400) throw normalizeError(r.status, r.json);
    res.status(200).json(normalizeSummary(r.json));
    return;
  }

  if (route.kind === "list") {
    const { limit, offset, forward } = validateListQuery(route.resource as Resource, input.qs);
    const r = await callUpstream(cfg, "GET", route.path, forward.toString());
    if (r.status >= 400) throw normalizeError(r.status, r.json);
    const data = listOf(r.json).map((i) => normalizeItem(route.resource, i));
    const { count, exact } = await totalCount(cfg, route.path, forward, limit, offset, data.length);
    res.status(200).json({ data, count, limit, offset, ...(exact ? {} : { has_more: true }) });
    return;
  }

  if (route.kind === "create") {
    const body = input.getBody();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new ApiError(400, "Dados inválidos", { formErrors: ["O corpo precisa ser um objeto JSON."], fieldErrors: {} });
    }
    const r = await callUpstream(cfg, "POST", route.path, undefined, body);
    if (r.status >= 400) throw normalizeError(r.status, r.json);
    res.status(201).json(normalizeItem(route.resource, r.json));
    return;
  }

  // item
  if (route.method === "GET") {
    const r = await callUpstream(cfg, "GET", route.path);
    if (r.status >= 400) throw normalizeError(r.status, r.json);
    res.status(200).json(normalizeItem(route.resource, r.json));
    return;
  }
  if (route.method === "PATCH") {
    const body = input.getBody();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new ApiError(400, "Dados inválidos", { formErrors: ["O corpo precisa ser um objeto JSON."], fieldErrors: {} });
    }
    const r = await callUpstream(cfg, "PATCH", route.path, undefined, body);
    if (r.status >= 400) throw normalizeError(r.status, r.json);
    res.status(200).json(normalizeItem(route.resource, r.json));
    return;
  }
  // DELETE
  const r = await callUpstream(cfg, "DELETE", route.path);
  if (r.status >= 400) throw normalizeError(r.status, r.json);
  res.status(200).json({ deleted: decodeURIComponent(route.id as string) });
}

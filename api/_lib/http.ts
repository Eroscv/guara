import type { VercelRequest } from "@vercel/node";
import { ApiError } from "./errors.js";

// Corpo JSON da requisição: a Vercel já entrega parseado, mas aceita string
// (e devolve 400 no formato do manual se vier JSON quebrado).
export function getBody(req: VercelRequest): unknown {
  if (req.body == null || req.body === "") return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      throw new ApiError(400, "Dados inválidos", { formErrors: ["JSON inválido."], fieldErrors: {} });
    }
  }
  return req.body;
}

// Host do site que recebeu a chamada — usado pra aceitar imagens hospedadas aqui mesmo.
export function siteHostFrom(req: VercelRequest): string | null {
  const h = req.headers["x-forwarded-host"] || req.headers.host;
  const v = Array.isArray(h) ? h[0] : h;
  return v ? v.split(":")[0] : null;
}

/**
 * Segmentos do caminho depois de `base` (ex.: base "/api/admin/auth" e URL
 * "/api/admin/auth/users/9" → ["users", "9"]).
 *
 * Lê da própria URL em vez de req.query.route: em produção, na Vercel, o parâmetro
 * do catch-all [...route] não chegava nestas funções (só funcionava com ?route=
 * na URL), e uma query string também não deve poder trocar a rota. A query só é
 * usada se a URL não bater com `base` (ex.: rodando atrás de um rewrite).
 */
export function routeSegments(req: VercelRequest, base: string): string[] {
  const path = new URL(req.url || "/", "http://localhost").pathname;
  if (path === base || path.startsWith(`${base}/`)) {
    return path
      .slice(base.length)
      .split("/")
      .filter(Boolean)
      .map((s) => {
        try {
          return decodeURIComponent(s);
        } catch {
          return s;
        }
      });
  }
  const q = req.query?.route;
  return ([] as string[]).concat((q as string | string[] | undefined) ?? []).filter(Boolean);
}

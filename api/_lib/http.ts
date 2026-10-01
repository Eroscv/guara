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

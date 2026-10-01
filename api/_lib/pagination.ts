import type { VercelRequest } from "@vercel/node";
import { ApiError } from "./errors";

export function parseQuery(req: VercelRequest): URLSearchParams {
  const url = new URL(req.url || "", "http://localhost");
  return url.searchParams;
}

export function parsePagination(qs: URLSearchParams) {
  const fieldErrors: Record<string, string[]> = {};

  let limit = 50;
  if (qs.has("limit")) {
    const n = Number(qs.get("limit"));
    if (!Number.isInteger(n) || n < 1 || n > 200) {
      fieldErrors.limit = ["limit deve ser um número inteiro entre 1 e 200."];
    } else {
      limit = n;
    }
  }

  let offset = 0;
  if (qs.has("offset")) {
    const n = Number(qs.get("offset"));
    if (!Number.isInteger(n) || n < 0) {
      fieldErrors.offset = ["offset deve ser um número inteiro maior ou igual a 0."];
    } else {
      offset = n;
    }
  }

  let since: string | null = null;
  if (qs.has("since")) {
    const raw = qs.get("since") as string;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) {
      fieldErrors.since = ["since precisa ser uma data ISO 8601 válida."];
    } else {
      since = d.toISOString();
    }
  }

  if (Object.keys(fieldErrors).length) {
    throw new ApiError(400, "Dados inválidos", { formErrors: [], fieldErrors });
  }

  return { limit, offset, since };
}

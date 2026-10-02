import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApiError, handleCaught } from "../../_lib/errors.js";
import { parseQuery } from "../../_lib/pagination.js";
import { getBody, routeSegments } from "../../_lib/http.js";
import { panelUpstream, requireAdmin } from "../../_lib/adminAuth.js";
import { proxyRequest } from "../../_lib/upstream.js";

// A API de origem fica atrás de um túnel e pode demorar; o padrão de 10s é curto.
export const config = { maxDuration: 30 };

// Back-end do painel /admin. O painel é cliente da API da Guará: este roteador
// confere a sessão de admin (cookie → /auth/me da API) e repassa a chamada com o token do
// próprio admin (Authorization: Bearer), no mesmo contrato do manual (Guara-API-manual.pdf):
// listas { data, count, limit, offset }, erros { error, details }, /summary etc.
// A tradução entre o manual e a API de origem é a mesma da API pública (_lib/upstream.ts).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const { token } = await requireAdmin(req);

    const segments = routeSegments(req, "/api/admin/v1");
    if (!segments.length) throw new ApiError(404, "Endereço ou item não encontrado.");

    await proxyRequest(res, panelUpstream(token), {
      method: req.method || "GET",
      segments,
      qs: parseQuery(req),
      getBody: () => getBody(req),
    });
  } catch (err) {
    handleCaught(res, err);
  }
}

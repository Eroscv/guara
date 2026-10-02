import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApiError, handleCaught } from "../../_lib/errors.js";
import { parseQuery } from "../../_lib/pagination.js";
import { getBody } from "../../_lib/http.js";
import { requireAdmin } from "../../_lib/adminAuth.js";
import { proxyRequest, upstreamConfig } from "../../_lib/upstream.js";

// A API de origem fica atrás de um túnel e pode demorar; o padrão de 10s é curto.
export const config = { maxDuration: 30 };

// Back-end do painel /admin. O painel é cliente da API da Guará: este roteador
// confere a sessão de admin (cookie → /auth/me da API) e repassa a chamada com
// a chave X-API-Key do servidor, no mesmo contrato do manual (Guara-API-manual.pdf):
// listas { data, count, limit, offset }, erros { error, details }, /summary etc.
// A tradução entre o manual e a API de origem é a mesma da API pública (_lib/upstream.ts).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  try {
    await requireAdmin(req);
    const upstream = upstreamConfig();
    if (!upstream) throw new ApiError(500, "A API da Guará não está configurada no servidor (variável GUARA_API_UPSTREAM).");

    const segments = ([] as string[]).concat((req.query.route as string | string[]) || []);
    if (!segments.length) throw new ApiError(404, "Endereço ou item não encontrado.");

    await proxyRequest(res, upstream, {
      method: req.method || "GET",
      segments,
      qs: parseQuery(req),
      getBody: () => getBody(req),
    });
  } catch (err) {
    handleCaught(res, err);
  }
}

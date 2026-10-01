import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, assertPostgresConfigured } from "../../_lib/db.js";
import { requireAdmin } from "../../_lib/requireAdmin.js";
import { ApiError, handleCaught } from "../../_lib/errors.js";
import { parsePagination, parseQuery } from "../../_lib/pagination.js";
import { getBody, siteHostFrom } from "../../_lib/http.js";
import { deleteNewsletter, listNewsletter } from "../../_lib/resources/newsletter.js";
import { deleteToolDownload, listToolDownloads } from "../../_lib/resources/toolDownloads.js";
import { createTool, deleteTool, getTool, listTools, patchTool } from "../../_lib/resources/tools.js";

export const config = { maxDuration: 30 };

// Back-end do painel /admin pro que mora no Vercel Postgres (newsletter,
// downloads de ferramentas e ferramentas). Leads, candidaturas, posts e vagas
// o painel lê direto do Supabase com a sessão do próprio admin (RLS).
//
// Diferente da API pública, aqui não há chave gm_...: a autorização é a sessão
// de admin do Supabase (requireAdmin). Mesmo domínio, então sem CORS.

async function counts() {
  assertPostgresConfigured();
  const [news, down] = await Promise.all([
    sql`select count(*)::int as total,
          count(*) filter (where created_at >= now() - interval '7 days')::int as week,
          count(*) filter (where created_at >= now() - interval '14 days' and created_at < now() - interval '7 days')::int as prev
        from newsletter`,
    sql`select count(*)::int as total,
          count(*) filter (where created_at >= now() - interval '7 days')::int as week,
          count(*) filter (where created_at >= now() - interval '14 days' and created_at < now() - interval '7 days')::int as prev
        from tool_downloads`,
  ]);
  return { newsletter: news.rows[0], tool_downloads: down.rows[0] };
}

const notAllowed = () => new ApiError(405, "Método não permitido nesse endereço.");

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await requireAdmin(req);
    const segments = ([] as string[]).concat((req.query.route as string | string[]) || []);
    const [first, second] = segments;
    const method = req.method || "GET";
    const qs = parseQuery(req);

    if (first === "counts" && !second) {
      if (method !== "GET") throw notAllowed();
      res.status(200).json(await counts());
      return;
    }

    // { "<slug da ferramenta>": nº de downloads } — o painel mostra em cada ferramenta.
    if (first === "downloads-by-tool" && !second) {
      if (method !== "GET") throw notAllowed();
      assertPostgresConfigured();
      const { rows } = await sql`
        select tool_slug, count(*)::int as n from tool_downloads where tool_slug is not null group by tool_slug
      `;
      res.status(200).json(Object.fromEntries(rows.map((r) => [r.tool_slug, r.n])));
      return;
    }

    if (first === "newsletter" || first === "tool_downloads") {
      if (!second) {
        if (method !== "GET") throw notAllowed();
        const { limit, offset, since } = parsePagination(qs);
        const list = first === "newsletter" ? listNewsletter : listToolDownloads;
        res.status(200).json(await list({ limit, offset, since }));
        return;
      }
      if (method !== "DELETE") throw notAllowed();
      const del = first === "newsletter" ? deleteNewsletter : deleteToolDownload;
      res.status(200).json(await del(second));
      return;
    }

    if (first === "tools") {
      const siteHost = siteHostFrom(req);
      if (!second) {
        if (method === "GET") {
          const { limit, offset, since } = parsePagination(qs);
          // O painel mostra tudo (inclusive arquivadas) e filtra na tela.
          res.status(200).json(await listTools({ limit, offset, since, status: qs.get("status") ?? "all", q: qs.get("q"), category: qs.get("category") }));
          return;
        }
        if (method === "POST") { res.status(201).json(await createTool(getBody(req), siteHost)); return; }
        throw notAllowed();
      }
      if (method === "GET") { res.status(200).json(await getTool(second)); return; }
      if (method === "PATCH") { res.status(200).json(await patchTool(second, getBody(req), siteHost)); return; }
      if (method === "DELETE") { res.status(200).json(await deleteTool(second)); return; }
      throw notAllowed();
    }

    throw new ApiError(404, "Endereço ou item não encontrado.");
  } catch (err) {
    handleCaught(res, err);
  }
}

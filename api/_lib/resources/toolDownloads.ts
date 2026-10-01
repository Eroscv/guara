import { sql, assertPostgresConfigured } from "../db";
import { ApiError } from "../errors";
import { cadastroPatchSchemas } from "../schemas";

export async function listToolDownloads(opts: { limit: number; offset: number; since: string | null }) {
  assertPostgresConfigured();
  const { rows } = opts.since
    ? await sql`select id,created_at,nome,email,empresa,cargo,tool_slug,tool_title from tool_downloads
        where created_at >= ${opts.since}
        order by created_at desc limit ${opts.limit} offset ${opts.offset}`
    : await sql`select id,created_at,nome,email,empresa,cargo,tool_slug,tool_title from tool_downloads
        order by created_at desc limit ${opts.limit} offset ${opts.offset}`;

  const { rows: countRows } = opts.since
    ? await sql`select count(*)::int as n from tool_downloads where created_at >= ${opts.since}`
    : await sql`select count(*)::int as n from tool_downloads`;

  return { data: rows, count: countRows[0]?.n ?? 0, limit: opts.limit, offset: opts.offset };
}

export async function getToolDownload(id: string) {
  assertPostgresConfigured();
  const { rows } = await sql`
    select id,created_at,nome,email,empresa,cargo,tool_slug,tool_title from tool_downloads where id = ${id} limit 1
  `;
  if (!rows[0]) throw new ApiError(404, "Item não encontrado.");
  return rows[0];
}

export async function patchToolDownload(id: string, body: unknown) {
  assertPostgresConfigured();
  const parsed = cadastroPatchSchemas.tool_downloads.safeParse(body);
  if (!parsed.success) throw new ApiError(400, "Dados inválidos", parsed.error.flatten());
  const b = parsed.data;
  if (!Object.keys(b).length) return getToolDownload(id);

  const { rows } = await sql`
    update tool_downloads set
      nome = coalesce(${b.nome ?? null}, nome),
      email = coalesce(${b.email ?? null}, email),
      empresa = coalesce(${b.empresa ?? null}, empresa),
      cargo = coalesce(${b.cargo ?? null}, cargo)
    where id = ${id}
    returning id,created_at,nome,email,empresa,cargo,tool_slug,tool_title
  `;
  if (!rows[0]) throw new ApiError(404, "Item não encontrado.");
  return rows[0];
}

export async function deleteToolDownload(id: string) {
  assertPostgresConfigured();
  const { rowCount } = await sql`delete from tool_downloads where id = ${id}`;
  if (!rowCount) throw new ApiError(404, "Item não encontrado.");
  return { deleted: id };
}

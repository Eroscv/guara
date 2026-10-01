import { sql, assertPostgresConfigured } from "../db";
import { ApiError } from "../errors";
import { cadastroPatchSchemas } from "../schemas";

export async function listNewsletter(opts: { limit: number; offset: number; since: string | null }) {
  assertPostgresConfigured();
  const { rows } = opts.since
    ? await sql`select id,created_at,email,pagina from newsletter where created_at >= ${opts.since}
        order by created_at desc limit ${opts.limit} offset ${opts.offset}`
    : await sql`select id,created_at,email,pagina from newsletter
        order by created_at desc limit ${opts.limit} offset ${opts.offset}`;

  const { rows: countRows } = opts.since
    ? await sql`select count(*)::int as n from newsletter where created_at >= ${opts.since}`
    : await sql`select count(*)::int as n from newsletter`;

  return { data: rows, count: countRows[0]?.n ?? 0, limit: opts.limit, offset: opts.offset };
}

export async function getNewsletter(id: string) {
  assertPostgresConfigured();
  const { rows } = await sql`select id,created_at,email,pagina from newsletter where id = ${id} limit 1`;
  if (!rows[0]) throw new ApiError(404, "Item não encontrado.");
  return rows[0];
}

export async function patchNewsletter(id: string, body: unknown) {
  assertPostgresConfigured();
  const parsed = cadastroPatchSchemas.newsletter.safeParse(body);
  if (!parsed.success) throw new ApiError(400, "Dados inválidos", parsed.error.flatten());
  const b = parsed.data;
  if (!Object.keys(b).length) return getNewsletter(id);

  const { rows } = await sql`
    update newsletter set
      email = coalesce(${b.email ?? null}, email),
      pagina = coalesce(${b.pagina ?? null}, pagina)
    where id = ${id}
    returning id,created_at,email,pagina
  `;
  if (!rows[0]) throw new ApiError(404, "Item não encontrado.");
  return rows[0];
}

export async function deleteNewsletter(id: string) {
  assertPostgresConfigured();
  const { rowCount } = await sql`delete from newsletter where id = ${id}`;
  if (!rowCount) throw new ApiError(404, "Item não encontrado.");
  return { deleted: id };
}

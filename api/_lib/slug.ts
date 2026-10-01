import type { SupabaseClient } from "@supabase/supabase-js";
import { sql } from "./db";
import { ApiError } from "./errors";

export function slugify(input: string): string {
  return (
    input
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 160) || "item"
  );
}

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function validateFormat(providedSlug: string): string {
  const s = providedSlug.trim().toLowerCase();
  if (!SLUG_RE.test(s)) {
    throw new ApiError(400, "Dados inválidos", {
      formErrors: [],
      fieldErrors: { slug: ["Use apenas letras minúsculas, números e hífen."] },
    });
  }
  return s;
}

// posts: slug é único no Supabase. Se o chamador mandou um slug, valida o
// formato e, se já existir, é 409. Sem slug: gera a partir do título, com
// sufixo numérico em caso de colisão (nunca dá 409 quando é automático).
export async function resolvePostSlug(
  db: SupabaseClient,
  title: string,
  providedSlug?: string | null,
  ignoreId?: string
): Promise<string> {
  if (providedSlug) {
    const s = validateFormat(providedSlug);
    let q = db.from("posts").select("id").eq("slug", s).limit(1);
    if (ignoreId) q = q.neq("id", ignoreId);
    const { data } = await q.maybeSingle();
    if (data) throw new ApiError(409, "Slug já existe.");
    return s;
  }
  const base = slugify(title);
  let candidate = base;
  let n = 2;
  for (;;) {
    let q = db.from("posts").select("id").eq("slug", candidate).limit(1);
    if (ignoreId) q = q.neq("id", ignoreId);
    const { data } = await q.maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${n++}`;
  }
}

// tools: mesma regra, só que contra a tabela "tools" no Vercel Postgres.
export async function resolveToolSlug(title: string, providedSlug?: string | null, ignoreId?: string): Promise<string> {
  if (providedSlug) {
    const s = validateFormat(providedSlug);
    const { rows } = ignoreId
      ? await sql`select id from tools where slug = ${s} and id <> ${ignoreId} limit 1`
      : await sql`select id from tools where slug = ${s} limit 1`;
    if (rows[0]) throw new ApiError(409, "Slug já existe.");
    return s;
  }
  const base = slugify(title);
  let candidate = base;
  let n = 2;
  for (;;) {
    const { rows } = ignoreId
      ? await sql`select id from tools where slug = ${candidate} and id <> ${ignoreId} limit 1`
      : await sql`select id from tools where slug = ${candidate} limit 1`;
    if (!rows[0]) return candidate;
    candidate = `${base}-${n++}`;
  }
}

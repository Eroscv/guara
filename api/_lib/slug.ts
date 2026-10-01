import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "./errors";

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160) || "item";
}

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Se o chamador mandou um slug: valida o formato e, se já existir, é 409
// ("Slug já existe" — explícito no manual). Se não mandou: gera a partir do
// título e, em caso de colisão, soma um sufixo numérico até achar um livre
// (gerar automaticamente nunca dá 409).
export async function resolveSlug(
  db: SupabaseClient,
  table: "posts" | "tools",
  title: string,
  providedSlug?: string | null,
  ignoreId?: string
): Promise<string> {
  if (providedSlug) {
    const s = providedSlug.trim().toLowerCase();
    if (!SLUG_RE.test(s)) {
      throw new ApiError(400, "Dados inválidos", {
        formErrors: [],
        fieldErrors: { slug: ["Use apenas letras minúsculas, números e hífen."] },
      });
    }
    let q = db.from(table).select("id").eq("slug", s).limit(1);
    if (ignoreId) q = q.neq("id", ignoreId);
    const { data } = await q.maybeSingle();
    if (data) throw new ApiError(409, "Slug já existe.");
    return s;
  }

  const base = slugify(title);
  let candidate = base;
  let n = 2;
  for (;;) {
    let q = db.from(table).select("id").eq("slug", candidate).limit(1);
    if (ignoreId) q = q.neq("id", ignoreId);
    const { data } = await q.maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${n++}`;
  }
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "../errors";
import { toolCreateSchema, toolPatchSchema } from "../schemas";
import { resolveSlug } from "../slug";
import { validateImages } from "../images";

const COLUMNS = "id,title,slug,description,category,image,benefits,published,file_name,file_path,file_url,file_content_type,archived,archived_at,created_at";
const MAX_FILE_BYTES = 50 * 1024 * 1024;

function base64Size(b64: string): number {
  const clean = b64.replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "");
  const padding = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
  return Math.floor((clean.length * 3) / 4) - padding;
}

async function uploadFile(db: SupabaseClient, slug: string, fileName: string, base64: string, contentType?: string) {
  const size = base64Size(base64);
  if (size > MAX_FILE_BYTES) {
    throw new ApiError(422, "Arquivo maior que 50MB.", { field: "file_base64" });
  }
  const clean = base64.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(clean, "base64");
  const path = `${slug}/${Date.now()}-${fileName}`;
  const { error } = await db.storage.from("tool-files").upload(path, buffer, {
    contentType: contentType || "application/octet-stream",
    upsert: false,
  });
  if (error) throw new ApiError(500, "Falha ao salvar o arquivo. Tente de novo.");
  return path;
}

function publicFileUrl(db: SupabaseClient, path: string) {
  const { data } = db.storage.from("tool-files").getPublicUrl(path);
  return data.publicUrl;
}

function serialize(db: SupabaseClient, row: any) {
  const { file_path, ...rest } = row;
  return { ...rest, file_url: file_path ? publicFileUrl(db, file_path) : row.file_url };
}

export async function listTools(
  db: SupabaseClient,
  opts: { limit: number; offset: number; since: string | null; status: string | null; q: string | null; category: string | null }
) {
  let q = db.from("tools").select(COLUMNS, { count: "exact" }).order("created_at", { ascending: false }).range(opts.offset, opts.offset + opts.limit - 1);

  if (opts.since) q = q.gte("created_at", opts.since);
  if (opts.category) q = q.eq("category", opts.category);
  if (opts.q) q = q.ilike("title", `%${opts.q}%`);

  if (opts.status) {
    const allowed = ["all", "active", "archived", "published", "draft"];
    if (!allowed.includes(opts.status)) {
      throw new ApiError(400, "Dados inválidos", { formErrors: [], fieldErrors: { status: [`status deve ser um de: ${allowed.join(", ")}.`] } });
    }
    if (opts.status === "active") q = q.eq("archived", false);
    else if (opts.status === "archived") q = q.eq("archived", true);
    else if (opts.status === "published") q = q.eq("published", true).eq("archived", false);
    else if (opts.status === "draft") q = q.eq("published", false).eq("archived", false);
  }

  const { data, error, count } = await q;
  if (error) throw new ApiError(500, "Falha interna. Tente de novo.");
  return { data: (data || []).map((r) => serialize(db, r)), count: count ?? 0, limit: opts.limit, offset: opts.offset };
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export async function getTool(db: SupabaseClient, idOrSlug: string) {
  const col = isUuid(idOrSlug) ? "id" : "slug";
  const { data, error } = await db.from("tools").select(COLUMNS).eq(col, idOrSlug).maybeSingle();
  if (error) throw new ApiError(500, "Falha interna. Tente de novo.");
  if (!data) throw new ApiError(404, "Ferramenta não encontrada.");
  return serialize(db, data);
}

export async function createTool(db: SupabaseClient, body: unknown, siteHost: string | null) {
  const parsed = toolCreateSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, "Dados inválidos", parsed.error.flatten());
  const b = parsed.data;

  if (b.image) await validateImages([{ field: "image", url: b.image }], siteHost);

  const slug = await resolveSlug(db, "tools", b.title, b.slug);

  let filePath: string | null = null;
  if (b.file_base64) {
    if (!b.file_name) {
      throw new ApiError(400, "Dados inválidos", { formErrors: [], fieldErrors: { file_name: ["Obrigatório junto com file_base64."] } });
    }
    filePath = await uploadFile(db, slug, b.file_name, b.file_base64, b.file_content_type);
  }

  const row: Record<string, unknown> = {
    title: b.title,
    slug,
    description: b.description ?? "",
    category: b.category ?? "",
    image: b.image ?? null,
    benefits: b.benefits ?? [],
    published: b.published ?? false,
    file_name: b.file_name ?? null,
    file_path: filePath,
    file_url: filePath ? null : b.file_url ?? null,
    file_content_type: b.file_content_type ?? null,
  };

  const { data, error } = await db.from("tools").insert(row).select(COLUMNS).single();
  if (error) throw new ApiError(500, "Falha interna. Tente de novo.");
  return serialize(db, data);
}

export async function patchTool(db: SupabaseClient, id: string, body: unknown, siteHost: string | null) {
  const parsed = toolPatchSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, "Dados inválidos", parsed.error.flatten());
  const b = parsed.data;

  const { data: current, error: findErr } = await db.from("tools").select(COLUMNS).eq("id", id).maybeSingle();
  if (findErr) throw new ApiError(500, "Falha interna. Tente de novo.");
  if (!current) throw new ApiError(404, "Ferramenta não encontrada.");

  if (b.image) await validateImages([{ field: "image", url: b.image }], siteHost);

  const patch: Record<string, unknown> = {};
  if (b.title !== undefined) patch.title = b.title;
  if (b.description !== undefined) patch.description = b.description;
  if (b.category !== undefined) patch.category = b.category;
  if (b.image !== undefined) patch.image = b.image;
  if (b.benefits !== undefined) patch.benefits = b.benefits;
  if (b.published !== undefined) patch.published = b.published;
  if (b.archived !== undefined) {
    patch.archived = b.archived;
    patch.archived_at = b.archived ? new Date().toISOString() : null;
  }
  if (b.slug !== undefined) {
    patch.slug = await resolveSlug(db, "tools", b.title ?? current.title, b.slug, id);
  }
  if (b.file_base64) {
    const fileName = b.file_name ?? current.file_name;
    if (!fileName) {
      throw new ApiError(400, "Dados inválidos", { formErrors: [], fieldErrors: { file_name: ["Obrigatório junto com file_base64."] } });
    }
    patch.file_path = await uploadFile(db, (patch.slug as string) ?? current.slug, fileName, b.file_base64, b.file_content_type);
    patch.file_name = fileName;
    patch.file_url = null;
  } else if (b.file_url !== undefined) {
    patch.file_url = b.file_url;
    patch.file_path = null;
    if (b.file_name !== undefined) patch.file_name = b.file_name;
  } else if (b.file_name !== undefined) {
    patch.file_name = b.file_name;
  }
  if (b.file_content_type !== undefined) patch.file_content_type = b.file_content_type;

  if (!Object.keys(patch).length) return serialize(db, current);

  const { data, error } = await db.from("tools").update(patch).eq("id", id).select(COLUMNS).maybeSingle();
  if (error) throw new ApiError(500, "Falha interna. Tente de novo.");
  if (!data) throw new ApiError(404, "Ferramenta não encontrada.");
  return serialize(db, data);
}

export async function deleteTool(db: SupabaseClient, id: string) {
  const { data } = await db.from("tools").select("file_path").eq("id", id).maybeSingle();
  if (data?.file_path) await db.storage.from("tool-files").remove([data.file_path as string]);
  const { error, count } = await db.from("tools").delete({ count: "exact" }).eq("id", id);
  if (error) throw new ApiError(500, "Falha interna. Tente de novo.");
  if (!count) throw new ApiError(404, "Ferramenta não encontrada.");
  return { deleted: id };
}

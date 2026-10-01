import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "../errors.js";
import { postCreateSchema, postPatchSchema } from "../schemas.js";
import { resolvePostSlug } from "../slug.js";
import { estimateReadingTime } from "../readingTime.js";
import { extractContentImages, validateImages } from "../images.js";

const COLUMNS = "id,title,slug,excerpt,content,cover_image,category,tags,author,status,published_at,scheduled_at,reading_time,images,archived,archived_at,created_at";

function serialize(row: any) {
  const { status, scheduled_at, published_at, ...rest } = row;
  const displayDate = scheduled_at || (published_at ? new Date(published_at).toISOString() : null);
  return {
    ...rest,
    published: status === "published",
    published_at: displayDate,
  };
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export async function listPosts(
  db: SupabaseClient,
  opts: { limit: number; offset: number; since: string | null; status: string | null; q: string | null; category: string | null; tag: string | null }
) {
  let q = db.from("posts").select(COLUMNS, { count: "exact" }).order("created_at", { ascending: false }).range(opts.offset, opts.offset + opts.limit - 1);

  if (opts.since) q = q.gte("created_at", opts.since);
  if (opts.category) q = q.eq("category", opts.category);
  if (opts.q) q = q.ilike("title", `%${opts.q}%`);
  if (opts.tag) q = q.contains("tags", [opts.tag]);

  if (opts.status) {
    const allowed = ["all", "active", "archived", "published", "draft", "scheduled"];
    if (!allowed.includes(opts.status)) {
      throw new ApiError(400, "Dados inválidos", { formErrors: [], fieldErrors: { status: [`status deve ser um de: ${allowed.join(", ")}.`] } });
    }
    const nowIso = new Date().toISOString();
    if (opts.status === "active") q = q.eq("archived", false);
    else if (opts.status === "archived") q = q.eq("archived", true);
    else if (opts.status === "draft") q = q.eq("status", "draft").eq("archived", false);
    else if (opts.status === "published") q = q.eq("status", "published").eq("archived", false).or(`scheduled_at.is.null,scheduled_at.lte.${nowIso}`);
    else if (opts.status === "scheduled") q = q.eq("status", "published").eq("archived", false).gt("scheduled_at", nowIso);
    // "all" = sem filtro extra
  }

  const { data, error, count } = await q;
  if (error) throw new ApiError(500, "Falha interna. Tente de novo.");
  return { data: (data || []).map(serialize), count: count ?? 0, limit: opts.limit, offset: opts.offset };
}

export async function getPost(db: SupabaseClient, idOrSlug: string) {
  const col = isUuid(idOrSlug) ? "id" : "slug";
  const { data, error } = await db.from("posts").select(COLUMNS).eq(col, idOrSlug).maybeSingle();
  if (error) throw new ApiError(500, "Falha interna. Tente de novo.");
  if (!data) throw new ApiError(404, "Post não encontrado.");
  return serialize(data);
}

export async function createPost(db: SupabaseClient, body: unknown, siteHost: string | null) {
  const parsed = postCreateSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, "Dados inválidos", parsed.error.flatten());
  const b = parsed.data;

  const coverImage = b.cover_image || b.image_url || null;
  const imageList = b.images || [];
  const contentImages = extractContentImages(b.content);
  await validateImages(
    [
      ...(coverImage ? [{ field: "cover_image", url: coverImage }] : []),
      ...imageList.map((url) => ({ field: "images", url })),
      ...contentImages.map((url) => ({ field: "content", url })),
    ],
    siteHost
  );

  const slug = await resolvePostSlug(db, b.title, b.slug);
  const scheduledAt = b.published_at ? new Date(b.published_at).toISOString() : null;
  const publishedDate = b.published_at ? b.published_at.slice(0, 10) : undefined;

  const row: Record<string, unknown> = {
    title: b.title,
    slug,
    content: b.content,
    excerpt: b.excerpt ?? "",
    cover_image: coverImage,
    images: imageList,
    category: b.category ?? "",
    tags: b.tags ?? [],
    author: b.author ?? "",
    status: b.published ? "published" : "draft",
    scheduled_at: scheduledAt,
    reading_time: estimateReadingTime(b.content),
  };
  if (publishedDate) row.published_at = publishedDate;

  const { data, error } = await db.from("posts").insert(row).select(COLUMNS).single();
  if (error) throw new ApiError(500, "Falha interna. Tente de novo.");
  return serialize(data);
}

export async function patchPost(db: SupabaseClient, id: string, body: unknown, siteHost: string | null) {
  const parsed = postPatchSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, "Dados inválidos", parsed.error.flatten());
  const b = parsed.data;

  const { data: current, error: findErr } = await db.from("posts").select(COLUMNS).eq("id", id).maybeSingle();
  if (findErr) throw new ApiError(500, "Falha interna. Tente de novo.");
  if (!current) throw new ApiError(404, "Post não encontrado.");

  const coverImage = b.cover_image ?? b.image_url;
  const imagesToCheck: { field: string; url: string }[] = [];
  if (coverImage) imagesToCheck.push({ field: "cover_image", url: coverImage });
  if (b.images) imagesToCheck.push(...b.images.map((url) => ({ field: "images", url })));
  if (b.content) imagesToCheck.push(...extractContentImages(b.content).map((url) => ({ field: "content", url })));
  if (imagesToCheck.length) await validateImages(imagesToCheck, siteHost);

  const patch: Record<string, unknown> = {};
  if (b.title !== undefined) patch.title = b.title;
  if (b.content !== undefined) {
    patch.content = b.content;
    patch.reading_time = estimateReadingTime(b.content);
  }
  if (b.excerpt !== undefined) patch.excerpt = b.excerpt;
  if (coverImage !== undefined) patch.cover_image = coverImage;
  if (b.images !== undefined) patch.images = b.images;
  if (b.category !== undefined) patch.category = b.category;
  if (b.tags !== undefined) patch.tags = b.tags;
  if (b.author !== undefined) patch.author = b.author;
  if (b.published !== undefined) patch.status = b.published ? "published" : "draft";
  if (b.published_at !== undefined) {
    patch.scheduled_at = new Date(b.published_at).toISOString();
    patch.published_at = b.published_at.slice(0, 10);
  }
  if (b.archived !== undefined) {
    patch.archived = b.archived;
    patch.archived_at = b.archived ? new Date().toISOString() : null;
  }
  if (b.slug !== undefined) {
    patch.slug = await resolvePostSlug(db, b.title ?? current.title, b.slug, id);
  }

  if (!Object.keys(patch).length) return serialize(current);

  const { data, error } = await db.from("posts").update(patch).eq("id", id).select(COLUMNS).maybeSingle();
  if (error) throw new ApiError(500, "Falha interna. Tente de novo.");
  if (!data) throw new ApiError(404, "Post não encontrado.");
  return serialize(data);
}

export async function deletePost(db: SupabaseClient, id: string) {
  const { error, count } = await db.from("posts").delete({ count: "exact" }).eq("id", id);
  if (error) throw new ApiError(500, "Falha interna. Tente de novo.");
  if (!count) throw new ApiError(404, "Post não encontrado.");
  return { deleted: id };
}

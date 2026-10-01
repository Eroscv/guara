import { put, del } from "@vercel/blob";
import { sql, assertPostgresConfigured } from "../db";
import { ApiError } from "../errors";
import { toolCreateSchema, toolPatchSchema } from "../schemas";
import { resolveToolSlug } from "../slug";
import { validateImages } from "../images";

const COLS =
  "id,title,slug,description,category,image,benefits,published,file_name,file_url,file_content_type,archived,archived_at,created_at";

const MAX_FILE_BYTES = 50 * 1024 * 1024;

function base64Size(b64: string): number {
  const clean = b64.replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "");
  const padding = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
  return Math.floor((clean.length * 3) / 4) - padding;
}

function assertBlobConfigured() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new ApiError(500, "Armazenamento de arquivos não configurado. Crie um Blob Store em Vercel → Storage e conecte ao projeto.");
  }
}

async function uploadFile(slug: string, fileName: string, base64: string, contentType?: string) {
  assertBlobConfigured();
  const size = base64Size(base64);
  if (size > MAX_FILE_BYTES) throw new ApiError(422, "Arquivo maior que 50MB.", { field: "file_base64" });
  const clean = base64.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(clean, "base64");
  const path = `tools/${slug}/${Date.now()}-${fileName}`;
  const blob = await put(path, buffer, {
    access: "public",
    contentType: contentType || "application/octet-stream",
    addRandomSuffix: false,
  });
  return blob.url;
}

export async function listTools(opts: {
  limit: number;
  offset: number;
  since: string | null;
  status: string | null;
  q: string | null;
  category: string | null;
}) {
  assertPostgresConfigured();
  if (opts.status) {
    const allowed = ["all", "active", "archived", "published", "draft"];
    if (!allowed.includes(opts.status)) {
      throw new ApiError(400, "Dados inválidos", { formErrors: [], fieldErrors: { status: [`status deve ser um de: ${allowed.join(", ")}.`] } });
    }
  }

  const conditions: string[] = [];
  const params: unknown[] = [];
  const push = (clause: string, val: unknown) => {
    params.push(val);
    conditions.push(clause.replace("$$", `$${params.length}`));
  };
  if (opts.since) push("created_at >= $$", opts.since);
  if (opts.category) push("category = $$", opts.category);
  if (opts.q) push("title ilike $$", `%${opts.q}%`);
  if (opts.status === "active") conditions.push("archived = false");
  else if (opts.status === "archived") conditions.push("archived = true");
  else if (opts.status === "published") conditions.push("published = true and archived = false");
  else if (opts.status === "draft") conditions.push("published = false and archived = false");

  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";
  params.push(opts.limit, opts.offset);
  const limitIdx = params.length - 1;
  const offsetIdx = params.length;

  const { rows } = await sql.query(
    `select ${COLS} from tools ${where} order by created_at desc limit $${limitIdx} offset $${offsetIdx}`,
    params
  );
  const { rows: countRows } = await sql.query(`select count(*)::int as n from tools ${where}`, params.slice(0, params.length - 2));

  return { data: rows, count: countRows[0]?.n ?? 0, limit: opts.limit, offset: opts.offset };
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export async function getTool(idOrSlug: string) {
  assertPostgresConfigured();
  const col = isUuid(idOrSlug) ? "id" : "slug";
  const { rows } = await sql.query(`select ${COLS} from tools where ${col} = $1 limit 1`, [idOrSlug]);
  if (!rows[0]) throw new ApiError(404, "Ferramenta não encontrada.");
  return rows[0];
}

export async function createTool(body: unknown, siteHost: string | null) {
  assertPostgresConfigured();
  const parsed = toolCreateSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, "Dados inválidos", parsed.error.flatten());
  const b = parsed.data;

  if (b.image) await validateImages([{ field: "image", url: b.image }], siteHost);

  const slug = await resolveToolSlug(b.title, b.slug);

  let fileUrl = b.file_url ?? null;
  if (b.file_base64) {
    if (!b.file_name) {
      throw new ApiError(400, "Dados inválidos", { formErrors: [], fieldErrors: { file_name: ["Obrigatório junto com file_base64."] } });
    }
    fileUrl = await uploadFile(slug, b.file_name, b.file_base64, b.file_content_type);
  }

  const { rows } = await sql`
    insert into tools (title, slug, description, category, image, benefits, published, file_name, file_url, file_content_type)
    values (${b.title}, ${slug}, ${b.description ?? ""}, ${b.category ?? ""}, ${b.image ?? null},
            ${(b.benefits ?? []) as any}, ${b.published ?? false}, ${b.file_name ?? null}, ${fileUrl}, ${b.file_content_type ?? null})
    returning id,title,slug,description,category,image,benefits,published,file_name,file_url,file_content_type,archived,archived_at,created_at
  `;
  return rows[0];
}

export async function patchTool(id: string, body: unknown, siteHost: string | null) {
  assertPostgresConfigured();
  const parsed = toolPatchSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, "Dados inválidos", parsed.error.flatten());
  const b = parsed.data;

  const { rows: currentRows } = await sql`select * from tools where id = ${id} limit 1`;
  const current = currentRows[0];
  if (!current) throw new ApiError(404, "Ferramenta não encontrada.");

  if (b.image) await validateImages([{ field: "image", url: b.image }], siteHost);

  let slug = current.slug;
  if (b.slug !== undefined) slug = await resolveToolSlug(b.title ?? current.title, b.slug, id);

  let fileUrl = current.file_url;
  let fileName = current.file_name;
  if (b.file_base64) {
    fileName = b.file_name ?? current.file_name;
    if (!fileName) {
      throw new ApiError(400, "Dados inválidos", { formErrors: [], fieldErrors: { file_name: ["Obrigatório junto com file_base64."] } });
    }
    fileUrl = await uploadFile(slug, fileName, b.file_base64, b.file_content_type);
  } else if (b.file_url !== undefined) {
    fileUrl = b.file_url;
    if (b.file_name !== undefined) fileName = b.file_name;
  } else if (b.file_name !== undefined) {
    fileName = b.file_name;
  }

  const archived = b.archived ?? current.archived;
  const archivedAt = b.archived !== undefined ? (b.archived ? new Date().toISOString() : null) : current.archived_at;

  const { rows } = await sql`
    update tools set
      title = ${b.title ?? current.title},
      slug = ${slug},
      description = ${b.description ?? current.description},
      category = ${b.category ?? current.category},
      image = ${b.image ?? current.image},
      benefits = ${(b.benefits ?? current.benefits) as any},
      published = ${b.published ?? current.published},
      file_name = ${fileName},
      file_url = ${fileUrl},
      file_content_type = ${b.file_content_type ?? current.file_content_type},
      archived = ${archived},
      archived_at = ${archivedAt},
      updated_at = now()
    where id = ${id}
    returning id,title,slug,description,category,image,benefits,published,file_name,file_url,file_content_type,archived,archived_at,created_at
  `;
  return rows[0];
}

export async function deleteTool(id: string) {
  assertPostgresConfigured();
  const { rows } = await sql`select file_url from tools where id = ${id} limit 1`;
  const fileUrl = rows[0]?.file_url as string | undefined;
  if (fileUrl && fileUrl.includes(".public.blob.vercel-storage.com/")) {
    await del(fileUrl).catch(() => {});
  }
  const { rowCount } = await sql`delete from tools where id = ${id}`;
  if (!rowCount) throw new ApiError(404, "Ferramenta não encontrada.");
  return { deleted: id };
}

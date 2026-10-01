import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "../errors.js";
import { cadastroPatchSchemas } from "../schemas.js";

// leads e applications: formulários que já existem no site, dados que já
// vivem no Supabase (o site e o admin continuam lendo/escrevendo aqui
// direto) — por isso ficaram fora da migração pro Vercel Postgres.
export type SupabaseCadastroResource = "leads" | "applications";
export const SUPABASE_CADASTRO_RESOURCES: SupabaseCadastroResource[] = ["leads", "applications"];

const TABLE: Record<SupabaseCadastroResource, string> = { leads: "leads", applications: "applications" };

const SELECT_COLUMNS: Record<SupabaseCadastroResource, string> = {
  leads: "id,created_at,nome,whatsapp,site,faturamento,solucao,extra",
  applications:
    "id,created_at,name,email,phone,linkedin,message,job_id,status,notes,resume_path,resume_url,jobs(title)",
};

function serializeApplication(row: any) {
  const { jobs, name, phone, message, ...rest } = row;
  return { ...rest, nome: name, telefone: phone, mensagem: message, job_title: jobs?.title ?? null };
}

export function serializeCadastro(resource: SupabaseCadastroResource, row: any) {
  if (resource === "applications") return serializeApplication(row);
  return row;
}

// resume_url do manual é um link assinado, válido por 1h (o bucket "resumes"
// é privado). Gera um novo a cada leitura a partir de resume_path.
async function withSignedResume(db: SupabaseClient, resource: SupabaseCadastroResource, rows: any[]) {
  if (resource !== "applications") return rows;
  await Promise.all(
    rows.map(async (r) => {
      if (!r.resume_path) return;
      const { data } = await db.storage.from("resumes").createSignedUrl(r.resume_path, 3600);
      if (data?.signedUrl) r.resume_url = data.signedUrl;
    })
  );
  return rows;
}

export async function listCadastro(
  db: SupabaseClient,
  resource: SupabaseCadastroResource,
  opts: { limit: number; offset: number; since: string | null; status: string | null }
) {
  if (opts.status && resource !== "applications") {
    throw new ApiError(400, "Dados inválidos", { formErrors: [], fieldErrors: { status: ["O filtro status só existe para /applications."] } });
  }
  if (opts.status) {
    const allowed = ["novo", "analise", "entrevista", "aprovado", "recusado"];
    if (!allowed.includes(opts.status)) {
      throw new ApiError(400, "Dados inválidos", { formErrors: [], fieldErrors: { status: [`status deve ser um de: ${allowed.join(", ")}.`] } });
    }
  }

  let q = db
    .from(TABLE[resource])
    .select(SELECT_COLUMNS[resource], { count: "exact" })
    .order("created_at", { ascending: false })
    .range(opts.offset, opts.offset + opts.limit - 1);

  if (opts.since) q = q.gte("created_at", opts.since);
  if (opts.status) q = q.eq("status", opts.status);

  const { data, error, count } = await q;
  if (error) throw new ApiError(500, "Falha interna. Tente de novo.");

  const rows = (data || []).map((r) => serializeCadastro(resource, r));
  await withSignedResume(db, resource, rows);
  return { data: rows, count: count ?? 0, limit: opts.limit, offset: opts.offset };
}

export async function getCadastro(db: SupabaseClient, resource: SupabaseCadastroResource, id: string) {
  const { data, error } = await db.from(TABLE[resource]).select(SELECT_COLUMNS[resource]).eq("id", id).maybeSingle();
  if (error) throw new ApiError(500, "Falha interna. Tente de novo.");
  if (!data) throw new ApiError(404, "Item não encontrado.");
  const row = serializeCadastro(resource, data);
  await withSignedResume(db, resource, [row]);
  return row;
}

const PATCH_MAP: Record<SupabaseCadastroResource, (body: any) => Record<string, unknown>> = {
  leads: (b) => b,
  applications: (b) => {
    const out: Record<string, unknown> = {};
    if ("status" in b) out.status = b.status;
    if ("notes" in b) out.notes = b.notes;
    if ("nome" in b) out.name = b.nome;
    if ("email" in b) out.email = b.email;
    if ("telefone" in b) out.phone = b.telefone;
    if ("linkedin" in b) out.linkedin = b.linkedin;
    return out;
  },
};

export async function patchCadastro(db: SupabaseClient, resource: SupabaseCadastroResource, id: string, body: unknown) {
  const schema = cadastroPatchSchemas[resource];
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, "Dados inválidos", parsed.error.flatten());

  const patch = PATCH_MAP[resource](parsed.data);
  if (!Object.keys(patch).length) return getCadastro(db, resource, id);

  const { data, error } = await db.from(TABLE[resource]).update(patch).eq("id", id).select(SELECT_COLUMNS[resource]).maybeSingle();
  if (error) throw new ApiError(500, "Falha interna. Tente de novo.");
  if (!data) throw new ApiError(404, "Item não encontrado.");
  const row = serializeCadastro(resource, data);
  await withSignedResume(db, resource, [row]);
  return row;
}

export async function deleteCadastro(db: SupabaseClient, resource: SupabaseCadastroResource, id: string) {
  if (resource === "applications") {
    const { data } = await db.from("applications").select("resume_path").eq("id", id).maybeSingle();
    if (data?.resume_path) await db.storage.from("resumes").remove([data.resume_path as string]);
  }
  const { error, count } = await db.from(TABLE[resource]).delete({ count: "exact" }).eq("id", id);
  if (error) throw new ApiError(500, "Falha interna. Tente de novo.");
  if (!count) throw new ApiError(404, "Item não encontrado.");
  return { deleted: id };
}

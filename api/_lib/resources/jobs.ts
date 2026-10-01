import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "../errors";
import { jobCreateSchema, jobPatchSchema } from "../schemas";

const COLUMNS = "id,title,department,location,work_model,description,responsibilities,requirements,status,is_open,scheduled_at,archived,archived_at,created_at";

const WORK_MODEL_DB: Record<string, string> = { Presencial: "presencial", Híbrido: "híbrido", Remoto: "remoto" };
const WORK_MODEL_API: Record<string, string> = { presencial: "Presencial", "híbrido": "Híbrido", remoto: "Remoto" };

function serialize(row: any) {
  const { status, scheduled_at, work_model, ...rest } = row;
  return { ...rest, work_model: WORK_MODEL_API[work_model] ?? work_model, publish_at: scheduled_at };
}

export async function listJobs(
  db: SupabaseClient,
  opts: { limit: number; offset: number; since: string | null; status: string | null; q: string | null; department: string | null }
) {
  let q = db.from("jobs").select(COLUMNS, { count: "exact" }).order("created_at", { ascending: false }).range(opts.offset, opts.offset + opts.limit - 1);

  if (opts.since) q = q.gte("created_at", opts.since);
  if (opts.department) q = q.eq("department", opts.department);
  if (opts.q) q = q.ilike("title", `%${opts.q}%`);

  if (opts.status) {
    const allowed = ["all", "active", "archived", "open", "closed", "scheduled"];
    if (!allowed.includes(opts.status)) {
      throw new ApiError(400, "Dados inválidos", { formErrors: [], fieldErrors: { status: [`status deve ser um de: ${allowed.join(", ")}.`] } });
    }
    const nowIso = new Date().toISOString();
    if (opts.status === "active") q = q.eq("archived", false);
    else if (opts.status === "archived") q = q.eq("archived", true);
    else if (opts.status === "closed") q = q.eq("status", "closed").eq("archived", false);
    else if (opts.status === "open") q = q.eq("status", "open").eq("archived", false).or(`scheduled_at.is.null,scheduled_at.lte.${nowIso}`);
    else if (opts.status === "scheduled") q = q.eq("status", "open").eq("archived", false).gt("scheduled_at", nowIso);
  }

  const { data, error, count } = await q;
  if (error) throw new ApiError(500, "Falha interna. Tente de novo.");
  return { data: (data || []).map(serialize), count: count ?? 0, limit: opts.limit, offset: opts.offset };
}

export async function getJob(db: SupabaseClient, id: string) {
  const { data, error } = await db.from("jobs").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new ApiError(500, "Falha interna. Tente de novo.");
  if (!data) throw new ApiError(404, "Vaga não encontrada.");
  return serialize(data);
}

export async function createJob(db: SupabaseClient, body: unknown) {
  const parsed = jobCreateSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, "Dados inválidos", parsed.error.flatten());
  const b = parsed.data;

  const row = {
    title: b.title,
    department: b.department ?? "",
    location: b.location ?? "",
    work_model: b.work_model ? WORK_MODEL_DB[b.work_model] : "remoto",
    description: b.description ?? "",
    responsibilities: b.responsibilities ?? [],
    requirements: b.requirements ?? [],
    status: b.is_open === false ? "closed" : "open",
    scheduled_at: b.publish_at ? new Date(b.publish_at).toISOString() : null,
  };

  const { data, error } = await db.from("jobs").insert(row).select(COLUMNS).single();
  if (error) throw new ApiError(500, "Falha interna. Tente de novo.");
  return serialize(data);
}

export async function patchJob(db: SupabaseClient, id: string, body: unknown) {
  const parsed = jobPatchSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, "Dados inválidos", parsed.error.flatten());
  const b = parsed.data;

  const patch: Record<string, unknown> = {};
  if (b.title !== undefined) patch.title = b.title;
  if (b.department !== undefined) patch.department = b.department;
  if (b.location !== undefined) patch.location = b.location;
  if (b.work_model !== undefined) patch.work_model = WORK_MODEL_DB[b.work_model];
  if (b.description !== undefined) patch.description = b.description;
  if (b.responsibilities !== undefined) patch.responsibilities = b.responsibilities;
  if (b.requirements !== undefined) patch.requirements = b.requirements;
  if (b.is_open !== undefined) patch.status = b.is_open ? "open" : "closed";
  if (b.publish_at !== undefined) patch.scheduled_at = b.publish_at ? new Date(b.publish_at).toISOString() : null;
  if (b.archived !== undefined) {
    patch.archived = b.archived;
    patch.archived_at = b.archived ? new Date().toISOString() : null;
  }

  if (!Object.keys(patch).length) return getJob(db, id);

  const { data, error } = await db.from("jobs").update(patch).eq("id", id).select(COLUMNS).maybeSingle();
  if (error) throw new ApiError(500, "Falha interna. Tente de novo.");
  if (!data) throw new ApiError(404, "Vaga não encontrada.");
  return serialize(data);
}

export async function deleteJob(db: SupabaseClient, id: string) {
  const { error, count } = await db.from("jobs").delete({ count: "exact" }).eq("id", id);
  if (error) throw new ApiError(500, "Falha interna. Tente de novo.");
  if (!count) throw new ApiError(404, "Vaga não encontrada.");
  return { deleted: id };
}

import type { VercelRequest } from "@vercel/node";
import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "./supabaseAdmin";
import { ApiError } from "./errors";

function hashKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

export function extractBearer(req: VercelRequest): string | null {
  const auth = req.headers["authorization"];
  const authStr = Array.isArray(auth) ? auth[0] : auth;
  if (authStr?.startsWith("Bearer ")) return authStr.slice(7).trim();
  const xApiKey = req.headers["x-api-key"];
  const xApiKeyStr = Array.isArray(xApiKey) ? xApiKey[0] : xApiKey;
  if (xApiKeyStr) return xApiKeyStr.trim();
  return null;
}

// Confere a chave Bearer/x-api-key contra api_keys (hash, não revogada) e
// atualiza last_used_at. Lança ApiError(401) se faltar, for inválida ou tiver
// sido desativada.
export async function requireApiKey(req: VercelRequest): Promise<{ id: string; name: string }> {
  const key = extractBearer(req);
  if (!key || !key.startsWith("gm_")) {
    throw new ApiError(401, "Chave ausente, inválida ou desativada.");
  }
  const admin = getSupabaseAdmin();
  const hash = hashKey(key);
  const { data, error } = (await admin
    .from("api_keys")
    .select("id,name,revoked_at")
    .eq("key_hash", hash)
    .maybeSingle()) as { data: { id: string; name: string; revoked_at: string | null } | null; error: unknown };

  if (error || !data || data.revoked_at) {
    throw new ApiError(401, "Chave ausente, inválida ou desativada.");
  }

  (admin.from("api_keys") as any)
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => {});

  return { id: data.id, name: data.name };
}

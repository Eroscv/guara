import type { VercelRequest } from "@vercel/node";
import { createHash } from "node:crypto";
import { sql, assertPostgresConfigured } from "./db.js";
import { ApiError } from "./errors.js";

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

// Confere a chave Bearer/x-api-key contra api_keys no Vercel Postgres
// (hash, não revogada) e atualiza last_used_at. Lança ApiError(401) se
// faltar, for inválida ou tiver sido desativada.
export async function requireApiKey(req: VercelRequest): Promise<{ id: string; name: string }> {
  const key = extractBearer(req);
  if (!key || !key.startsWith("gm_")) {
    throw new ApiError(401, "Chave ausente, inválida ou desativada.");
  }
  assertPostgresConfigured();
  const hash = hashKey(key);

  const { rows } = await sql<{ id: string; name: string; revoked_at: string | null }>`
    select id, name, revoked_at from api_keys where key_hash = ${hash} limit 1
  `;
  const row = rows[0];
  if (!row || row.revoked_at) {
    throw new ApiError(401, "Chave ausente, inválida ou desativada.");
  }

  sql`update api_keys set last_used_at = now() where id = ${row.id}`.catch(() => {});

  return { id: row.id, name: row.name };
}

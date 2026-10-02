import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomBytes, createHash } from "node:crypto";
import { sql, assertPostgresConfigured } from "../_lib/db.js";
import { requireAdmin } from "../_lib/adminAuth.js";
import { ApiError, handleCaught } from "../_lib/errors.js";

// Usada só pelo painel /admin/api-keys (React) pra criar e revogar chaves
// da API pública. A chave em si (gm_...) só existe na resposta do POST —
// depois disso só o hash fica salvo, igual o manual descreve.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const { user: admin } = await requireAdmin(req);
    assertPostgresConfigured();

    if (req.method === "GET") {
      const { rows } = await sql`
        select id, name, key_prefix, created_at, last_used_at, revoked_at
        from api_keys order by created_at desc
      `;
      res.status(200).json({ data: rows });
      return;
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      const name = String(body.name || "").trim();
      if (!name) throw new ApiError(400, "Dá um nome pra chave.");

      const key = `gm_${randomBytes(20).toString("hex")}`;
      const hash = createHash("sha256").update(key).digest("hex");
      const prefix = key.slice(0, 12);

      const { rows } = await sql`
        insert into api_keys (name, key_prefix, key_hash, created_by)
        values (${name}, ${prefix}, ${hash}, ${admin.email || null})
        returning id, name, key_prefix, created_at
      `;
      res.status(201).json({ ...rows[0], key });
      return;
    }

    if (req.method === "PATCH") {
      const id = (req.query.id as string) || "";
      if (!id) throw new ApiError(400, "Falta o id da chave.");
      const { rows } = await sql`
        update api_keys set revoked_at = now() where id = ${id}
        returning id, name, key_prefix, created_at, last_used_at, revoked_at
      `;
      if (!rows[0]) throw new ApiError(404, "Chave não encontrada.");
      res.status(200).json(rows[0]);
      return;
    }

    throw new ApiError(405, "Método não permitido.");
  } catch (err) {
    handleCaught(res, err);
  }
}

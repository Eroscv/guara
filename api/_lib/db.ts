import { sql } from "@vercel/postgres";
import { ApiError } from "./errors";

// Vercel injeta POSTGRES_URL sozinho assim que o banco (Storage → Postgres)
// é conectado ao projeto — não precisa copiar/colar nada em Environment
// Variables, diferente da service role key do Supabase.
export { sql };

export function assertPostgresConfigured() {
  if (!process.env.POSTGRES_URL) {
    throw new ApiError(
      500,
      "Banco de dados não configurado. Crie o Postgres em Vercel → Storage e conecte ao projeto."
    );
  }
}

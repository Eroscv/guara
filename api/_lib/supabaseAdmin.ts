import { createClient } from "@supabase/supabase-js";

// Cliente com a service role key: roda só no servidor (função Vercel), nunca
// no navegador. Bypassa RLS por completo — quem decide o que pode ou não é
// o código desta API, não política de banco. Por isso a SUPABASE_SERVICE_ROLE_KEY
// precisa estar configurada nas variáveis de ambiente do projeto na Vercel
// (Project Settings → Environment Variables), nunca commitada no repo.
const SUPABASE_URL = process.env.SUPABASE_URL || "https://cmbxrmtncrfhdcpbjxtx.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!SERVICE_ROLE_KEY) {
    throw new ConfigError(
      "SUPABASE_SERVICE_ROLE_KEY não está configurada nas variáveis de ambiente do projeto."
    );
  }
  if (!client) {
    client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export class ConfigError extends Error {}

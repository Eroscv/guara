import type { VercelRequest } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { ApiError } from "./errors.js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://cmbxrmtncrfhdcpbjxtx.supabase.co";
// Mesma chave pública usada no navegador (src/integrations/supabase/client.ts) — não é
// segredo. A verificação de admin não usa service role: o cliente abaixo assume a sessão
// do usuário (via o token que ele manda), então RLS ("Users can read own roles") decide.
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtYnhybXRuY3JmaGRjcGJqeHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0ODA1MjksImV4cCI6MjA5NTA1NjUyOX0.uzPevwziHY2ilNdP-ZnN6C9K7hq1Xs7u88_FTG3Awi8";

// Confere que quem está chamando é um admin logado no painel (/admin). O
// navegador manda o access_token da sessão Supabase no header Authorization.
export async function requireAdmin(req: VercelRequest): Promise<{ id: string; email: string | null }> {
  const auth = req.headers["authorization"];
  const token = (Array.isArray(auth) ? auth[0] : auth)?.replace(/^Bearer\s+/i, "");
  if (!token) throw new ApiError(401, "Não autenticado.");

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userErr } = await client.auth.getUser(token);
  if (userErr || !userData.user) throw new ApiError(401, "Sessão inválida ou expirada.");

  const { data: roles, error: roleErr } = await client.from("user_roles").select("role").eq("user_id", userData.user.id);
  if (roleErr) throw new ApiError(500, "Falha interna. Tente de novo.");
  const isAdmin = (roles || []).some((r: any) => r.role === "admin");
  if (!isAdmin) throw new ApiError(403, "Apenas administradores podem acessar isto.");

  return { id: userData.user.id, email: userData.user.email ?? null };
}

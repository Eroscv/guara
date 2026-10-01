import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/slug";
import "./admin-theme.css";

/** Liga o tema do painel no <html> enquanto o componente estiver montado. */
export function useAdminTheme() {
  useEffect(() => {
    const el = document.documentElement;
    el.classList.add("admin-theme");
    return () => el.classList.remove("admin-theme");
  }, []);
}

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

export const lines = (s: string) =>
  s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

/** ISO -> valor de <input type="datetime-local"> no fuso do navegador. */
export const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
};

/**
 * Envia um arquivo pro bucket público "blog-images" (só admin escreve — RLS) e
 * devolve o link público. Serve pra imagens e pros arquivos das ferramentas.
 */
export async function uploadAdminFile(file: File, folder: string) {
  const ext = file.name.match(/\.[^.]+$/)?.[0]?.toLowerCase() ?? "";
  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "arquivo";
  const path = `${folder}/${Date.now()}-${base}${ext}`;
  const { error } = await supabase.storage.from("blog-images").upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return supabase.storage.from("blog-images").getPublicUrl(path).data.publicUrl;
}

/** Planilha com ; e BOM, que o Excel em português abre sem bagunçar acento. */
export function toCsv(rows: Record<string, unknown>[], name: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0] ?? {});
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [keys.join(";"), ...rows.map((r) => keys.map((k) => esc(r[k])).join(";"))].join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Newsletter, downloads e ferramentas moram no Vercel Postgres, não no Supabase,
 * então o painel fala com /api/admin/v1 — que confere a sessão de admin pelo
 * token do próprio Supabase.
 */
export class AdminApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Chamada autenticada com a sessão do admin (o servidor confere o token no Supabase). */
export async function adminFetch<T = unknown>(url: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new AdminApiError(401, "Sessão expirada. Entre de novo.");
  const res = await fetch(url, {
    method: init.method ?? "GET",
    headers: { Authorization: `Bearer ${token}`, ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}) },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new AdminApiError(res.status, (json as { error?: string }).error || "Não foi possível completar a ação.");
  return json as T;
}

export const adminApi = <T = unknown>(path: string, init: { method?: string; body?: unknown } = {}) =>
  adminFetch<T>(`/api/admin/v1${path}`, init);

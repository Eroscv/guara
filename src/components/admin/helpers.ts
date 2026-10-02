import { useEffect } from "react";
import { upload } from "@vercel/blob/client";
import { slugify } from "@/lib/slug";
import "./admin-theme.css";

export { AdminApiError, adminApi, adminFetch, authApi } from "@/lib/admin-api";

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
 * Envia imagem ou arquivo pro Vercel Blob e devolve o link público. O arquivo vai
 * direto do navegador pro Blob (sem o limite de 4,5 MB das funções); o servidor só
 * emite o token, e só pra admin logado (/api/admin/upload).
 */
export async function uploadAdminFile(file: File, folder: "posts" | "jobs" | "tools" | "editor") {
  const ext = file.name.match(/\.[^.]+$/)?.[0]?.toLowerCase() ?? "";
  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "arquivo";
  const blob = await upload(`${folder}/${base}${ext}`, file, {
    access: "public",
    handleUploadUrl: "/api/admin/upload",
    headers: { "X-Requested-With": "guara-admin" },
  });
  return blob.url;
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

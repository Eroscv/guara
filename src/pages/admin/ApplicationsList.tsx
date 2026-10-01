import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { errorMessage, type Row } from "@/components/admin/contentConfig";
import { fmtDate, toCsv } from "@/components/admin/helpers";

// Situação e anotações só existem depois da migration 20261001000000 (API v1).
// Enquanto ela não foi aplicada, as linhas vêm sem esses campos e os controles somem.
const STATUS: Record<string, string> = { novo: "Novo", analise: "Em análise", entrevista: "Entrevista", aprovado: "Aprovado", recusado: "Recusado" };

const SELECT_CLS = "h-10 rounded-md border-2 border-foreground bg-card px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-brand-orange";

// O bucket "resumes" é privado: a coluna guarda o endereço do arquivo e o caminho é o que vem depois de /resumes/.
function resumePath(a: Row): string | null {
  if (a.resume_path) return String(a.resume_path);
  if (!a.resume_url) return null;
  try {
    const parts = new URL(a.resume_url).pathname.split("/");
    const i = parts.indexOf("resumes");
    return i >= 0 ? decodeURIComponent(parts.slice(i + 1).join("/")) : null;
  } catch {
    return String(a.resume_url);
  }
}

const ApplicationsList = () => {
  const qc = useQueryClient();
  const [job, setJob] = useState("");
  const [st, setSt] = useState("");
  const [opening, setOpening] = useState<string | null>(null);

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("applications").select("*, job:jobs(title)").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const hasStatus = data.some((a) => "status" in a);
  const jobTitle = (a: Row) => (a.job?.title as string | undefined) ?? "Vaga removida";
  const jobs = Array.from(new Set(data.map(jobTitle)));
  const list = data.filter((a) => (!job || jobTitle(a) === job) && (!st || a.status === st));

  const update = async (id: string, patch: { status?: string; notes?: string | null }) => {
    const { error } = await supabase.from("applications").update(patch as never).eq("id", id);
    if (error) {
      toast.error(errorMessage(error, "Não foi possível salvar."));
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin"] });
  };

  const openResume = async (a: Row) => {
    const path = resumePath(a);
    if (!path) return;
    setOpening(a.id);
    // Abre a aba antes do await: depois dele o navegador bloqueia o pop-up.
    const w = window.open("", "_blank");
    try {
      const { data, error } = await supabase.storage.from("resumes").createSignedUrl(path, 300);
      if (error || !data?.signedUrl) throw error ?? new Error("sem link");
      if (w) w.location.href = data.signedUrl;
    } catch {
      w?.close();
      toast.error("Não foi possível abrir o currículo.");
    } finally {
      setOpening(null);
    }
  };

  const remove = async (a: Row) => {
    if (!confirm(`Apagar a candidatura de ${a.name}? O currículo anexado também será apagado.`)) return;
    const path = resumePath(a);
    const { error } = await supabase.from("applications").delete().eq("id", a.id);
    if (error) {
      toast.error("Não foi possível apagar.");
      return;
    }
    if (path) await supabase.storage.from("resumes").remove([path]).catch(() => {});
    toast.success("Candidatura apagada");
    qc.invalidateQueries({ queryKey: ["admin", "applications"] });
  };

  const exportRows = () =>
    list.map((a) => ({
      data: fmtDate(a.created_at),
      vaga: jobTitle(a),
      nome: a.name,
      email: a.email,
      telefone: a.phone ?? "",
      linkedin: a.linkedin ?? "",
      mensagem: a.message ?? "",
      ...(hasStatus ? { situacao: STATUS[a.status] ?? a.status, anotacoes: a.notes ?? "" } : {}),
      curriculo: resumePath(a) ? "sim" : "não",
    }));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-extrabold">
          Candidaturas <span className="text-base text-muted-foreground">({list.length})</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {hasStatus && (
            <select aria-label="Filtrar por situação" className={SELECT_CLS} value={st} onChange={(e) => setSt(e.target.value)}>
              <option value="">Todas as situações</option>
              {Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          )}
          <select aria-label="Filtrar por vaga" className={SELECT_CLS} value={job} onChange={(e) => setJob(e.target.value)}>
            <option value="">Todas as vagas</option>
            {jobs.map((j) => <option key={j}>{j}</option>)}
          </select>
          <Button variant="outline" disabled={!list.length} onClick={() => toCsv(exportRows(), "candidaturas")}>
            <Download className="size-4" /> Exportar planilha
          </Button>
        </div>
      </div>

      {isLoading && <p>Carregando…</p>}
      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-foreground bg-card p-4 shadow-brut">
          <p className="text-sm font-semibold">Não foi possível carregar as candidaturas.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>Tentar de novo</Button>
        </div>
      )}
      {!isLoading && !error && !list.length && <p className="text-muted-foreground">Nenhuma candidatura ainda.</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {list.map((a) => (
          <article key={a.id} className="space-y-2 rounded-2xl border-2 border-foreground bg-card p-5 shadow-brut">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{jobTitle(a)}</p>
                <h3 className="break-words text-lg font-extrabold">{a.name}</h3>
              </div>
              <span className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(a.created_at)}</span>
            </div>
            <p className="break-words text-sm">
              <a className="underline" href={`mailto:${a.email}`}>{a.email}</a>
              {a.phone && <> · {a.phone}</>}
            </p>
            {a.linkedin && <a className="block break-all text-sm underline" href={a.linkedin} target="_blank" rel="noreferrer">{a.linkedin}</a>}
            {a.message && <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{a.message}</p>}

            {"status" in a && (
              <>
                <div className="flex items-center gap-2">
                  <label htmlFor={`st-${a.id}`} className="text-sm font-semibold">Situação:</label>
                  <select id={`st-${a.id}`} className="h-9 rounded-md border-2 border-foreground bg-card px-2 text-sm" value={a.status} onChange={(e) => update(a.id, { status: e.target.value })}>
                    {Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </div>
                <textarea
                  aria-label={`Anotações internas sobre ${a.name}`}
                  className="w-full rounded-md border-2 border-foreground/30 bg-background p-2 text-sm"
                  rows={2}
                  placeholder="Anotações internas (salva ao sair do campo)"
                  defaultValue={a.notes ?? ""}
                  maxLength={5000}
                  onBlur={(e) => e.target.value !== (a.notes ?? "") && update(a.id, { notes: e.target.value || null })}
                />
              </>
            )}

            <div className="flex items-center gap-2 pt-1">
              {resumePath(a) ? (
                <Button onClick={() => openResume(a)} disabled={opening === a.id}>
                  {opening === a.id ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />} Ver currículo
                </Button>
              ) : (
                <span className="text-sm text-muted-foreground">Sem currículo anexado</span>
              )}
              <Button variant="ghost" size="icon" onClick={() => remove(a)} aria-label={`Apagar candidatura de ${a.name}`}><Trash2 className="size-4" /></Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ApplicationsList;

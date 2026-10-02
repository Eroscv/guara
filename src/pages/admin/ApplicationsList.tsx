import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { errorMessage, fetchAllPages, type Row } from "@/components/admin/contentConfig";
import { adminApi, fmtDate, toCsv } from "@/components/admin/helpers";

// Candidaturas pela API da Guará: nome, email, telefone, linkedin, mensagem, job_title,
// status, notes e resume_url (link do currículo, válido por 1 hora).
const STATUS: Record<string, string> = { novo: "Novo", analise: "Em análise", entrevista: "Entrevista", aprovado: "Aprovado", recusado: "Recusado" };

const SELECT_CLS = "h-10 rounded-md border-2 border-foreground bg-card px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-brand-orange";

const ApplicationsList = () => {
  const qc = useQueryClient();
  const [job, setJob] = useState("");
  const [st, setSt] = useState("");
  const [opening, setOpening] = useState<string | null>(null);

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: () => fetchAllPages("/applications"),
  });

  const jobTitle = (a: Row) => (a.job_title as string | undefined) || "Sem vaga";
  const jobs = Array.from(new Set(data.map(jobTitle)));
  const list = data.filter((a) => (!job || jobTitle(a) === job) && (!st || a.status === st));

  const update = async (id: string, patch: { status?: string; notes?: string | null }) => {
    try {
      await adminApi(`/applications/${encodeURIComponent(id)}`, { method: "PATCH", body: patch });
      qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (e) {
      toast.error(errorMessage(e, "Não foi possível salvar."));
    }
  };

  // O link do currículo vale 1 hora; busca um novo na hora do clique (a lista pode estar aberta há tempo).
  const openResume = async (a: Row) => {
    setOpening(a.id);
    // Abre a aba antes do await: depois dele o navegador bloqueia o pop-up.
    const w = window.open("", "_blank");
    try {
      const fresh = await adminApi<Row>(`/applications/${encodeURIComponent(a.id)}`);
      if (!fresh.resume_url) throw new Error("sem currículo");
      if (w) w.location.href = fresh.resume_url;
    } catch {
      w?.close();
      toast.error("Não foi possível abrir o currículo.");
    } finally {
      setOpening(null);
    }
  };

  const remove = async (a: Row) => {
    if (!confirm(`Apagar a candidatura de ${a.nome}? O currículo anexado também será apagado.`)) return;
    try {
      await adminApi(`/applications/${encodeURIComponent(a.id)}`, { method: "DELETE" });
      toast.success("Candidatura apagada");
      qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (e) {
      toast.error(errorMessage(e, "Não foi possível apagar."));
    }
  };

  const exportRows = () =>
    list.map((a) => ({
      data: fmtDate(a.created_at),
      vaga: jobTitle(a),
      nome: a.nome,
      email: a.email,
      telefone: a.telefone ?? "",
      linkedin: a.linkedin ?? "",
      mensagem: a.mensagem ?? "",
      situacao: STATUS[a.status] ?? a.status ?? "",
      anotacoes: a.notes ?? "",
      curriculo: a.resume_url || a.resume_path ? "sim" : "não",
    }));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-extrabold">
          Candidaturas <span className="text-base text-muted-foreground">({list.length})</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <select aria-label="Filtrar por situação" className={SELECT_CLS} value={st} onChange={(e) => setSt(e.target.value)}>
            <option value="">Todas as situações</option>
            {Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
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
          <p className="text-sm font-semibold">{errorMessage(error, "Não foi possível carregar as candidaturas.")}</p>
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
                <h3 className="break-words text-lg font-extrabold">{a.nome}</h3>
              </div>
              <span className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(a.created_at)}</span>
            </div>
            <p className="break-words text-sm">
              <a className="underline" href={`mailto:${a.email}`}>{a.email}</a>
              {a.telefone && <> · {a.telefone}</>}
            </p>
            {a.linkedin && <a className="block break-all text-sm underline" href={a.linkedin} target="_blank" rel="noreferrer">{a.linkedin}</a>}
            {a.mensagem && <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{a.mensagem}</p>}

            <div className="flex items-center gap-2">
              <label htmlFor={`st-${a.id}`} className="text-sm font-semibold">Situação:</label>
              <select id={`st-${a.id}`} className="h-9 rounded-md border-2 border-foreground bg-card px-2 text-sm" value={a.status ?? "novo"} onChange={(e) => update(a.id, { status: e.target.value })}>
                {Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            <textarea
              aria-label={`Anotações internas sobre ${a.nome}`}
              className="w-full rounded-md border-2 border-foreground/30 bg-background p-2 text-sm"
              rows={2}
              placeholder="Anotações internas (salva ao sair do campo)"
              defaultValue={a.notes ?? ""}
              maxLength={5000}
              onBlur={(e) => e.target.value !== (a.notes ?? "") && update(a.id, { notes: e.target.value || null })}
            />

            <div className="flex items-center gap-2 pt-1">
              {a.resume_url || a.resume_path ? (
                <Button onClick={() => openResume(a)} disabled={opening === a.id}>
                  {opening === a.id ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />} Ver currículo
                </Button>
              ) : (
                <span className="text-sm text-muted-foreground">Sem currículo anexado</span>
              )}
              <Button variant="ghost" size="icon" onClick={() => remove(a)} aria-label={`Apagar candidatura de ${a.nome}`}><Trash2 className="size-4" /></Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ApplicationsList;

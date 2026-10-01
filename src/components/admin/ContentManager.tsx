import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ContentEditor } from "./ContentEditor";
import { CONFIG, STORES, errorMessage, type Kind, type Row } from "./contentConfig";

export function ContentManager({ kind }: { kind: Kind }) {
  const cfg = CONFIG[kind];
  const store = STORES[kind];
  const qc = useQueryClient();
  const [edit, setEdit] = useState<Row | null>(null);
  const [filter, setFilter] = useState("active");

  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ["admin", kind], queryFn: () => store.list() });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", kind] });

  // Arquivar só aparece onde a coluna existe (ferramentas sempre; posts/vagas depois da migration da API).
  const canArchive = kind === "tools" || data.some((r) => "archived" in r);
  const now = new Date();
  const stateOf = (r: Row) => cfg.state(r, now);

  const filters: [string, string][] = [
    ["active", "Ativos"],
    ...cfg.filters,
    ...(canArchive ? ([["archived", "Arquivados"]] as [string, string][]) : []),
    ["all", "Todos"],
  ];
  const matches = (r: Row, k: string) => (k === "all" ? true : k === "active" ? stateOf(r) !== "archived" : stateOf(r) === k);
  const shown = data.filter((r) => matches(r, filter));

  const run = async (fn: () => Promise<void>, ok?: string) => {
    try {
      await fn();
      if (ok) toast.success(ok);
      refresh();
    } catch (e) {
      toast.error(errorMessage(e, "Não foi possível completar a ação."));
    }
  };

  const toggle = (r: Row) => run(() => store.update(r.id, cfg.toggle(r)));
  const archive = (r: Row) => run(() => store.archive(r.id, !r.archived), r.archived ? "Desarquivado" : "Arquivado — saiu do site");
  const remove = (r: Row) => {
    if (!confirm(`Apagar "${r.title}"? Isso não dá para desfazer.`)) return;
    return run(() => store.remove(r.id), "Apagado");
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-extrabold">{cfg.title}</h2>
        <Button onClick={() => setEdit({})}><Plus className="size-4" /> {cfg.newLabel}</Button>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por situação">
        {filters.map(([k, l]) => (
          <button
            key={k}
            type="button"
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
            className={`rounded-full border-2 border-foreground px-3 py-1 text-sm font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-brand-orange ${filter === k ? "bg-foreground text-background" : "bg-card"}`}
          >
            {l} ({data.filter((r) => matches(r, k)).length})
          </button>
        ))}
      </div>

      {isLoading && <p>Carregando…</p>}
      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-foreground bg-card p-4 shadow-brut">
          <p className="text-sm font-semibold">{errorMessage(error, "Não foi possível carregar a lista.")}</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>Tentar de novo</Button>
        </div>
      )}
      {!isLoading && !error && !shown.length && <p className="text-muted-foreground">Nada aqui.</p>}

      <div className="space-y-3">
        {shown.map((r) => (
          <div key={r.id} className={`flex flex-wrap items-center gap-4 rounded-2xl border-2 border-foreground bg-card p-4 shadow-brut ${r.archived ? "opacity-60" : ""}`}>
            <div className="min-w-48 flex-1">
              <p className="font-bold">
                {r.title}
                {stateOf(r) === "scheduled" && <span className="ml-2 rounded-full border-2 border-foreground bg-accent px-2 py-0.5 text-xs">Agendado</span>}
                {r.archived && <span className="ml-2 rounded-full border border-foreground px-2 py-0.5 text-xs">Arquivado</span>}
              </p>
              <p className="text-sm text-muted-foreground">{cfg.sub(r)}</p>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <Switch checked={cfg.isOn(r)} onCheckedChange={() => toggle(r)} aria-label={`${cfg.switchLabel}: ${r.title}`} /> {cfg.switchText(r)}
            </label>
            {canArchive && (
              <Button variant="outline" size="icon" onClick={() => archive(r)} aria-label={r.archived ? "Desarquivar" : "Arquivar"} title={r.archived ? "Desarquivar" : "Arquivar"}>
                {r.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={() => setEdit(r)} aria-label={`Editar ${r.title}`}><Pencil className="size-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => remove(r)} aria-label={`Apagar ${r.title}`}><Trash2 className="size-4" /></Button>
          </div>
        ))}
      </div>

      {edit && <ContentEditor kind={kind} row={edit} onClose={() => setEdit(null)} onSaved={refresh} />}
    </section>
  );
}

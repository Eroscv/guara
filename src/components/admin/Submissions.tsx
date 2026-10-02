import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi, fmtDate, toCsv } from "./helpers";
import { fetchAllPages, errorMessage, type Row } from "./contentConfig";

export type SubmissionSource = "leads" | "newsletter" | "tool_downloads";

type Col = [key: string, label: string, get?: (r: Row) => string];

type Config = {
  title: string;
  csv: string;
  cols: Col[];
  load: () => Promise<Row[]>;
  remove: (id: string) => Promise<void>;
};

const CONFIG: Record<SubmissionSource, Config> = {
  // Contatos do formulário do site (campos do manual da API).
  leads: {
    title: "Contatos",
    csv: "contatos",
    cols: [
      ["nome", "Nome"],
      ["whatsapp", "WhatsApp"],
      ["site", "Site / @"],
      ["faturamento", "Faturamento"],
      ["solucao", "Solução"],
      ["extra", "Observação"],
    ],
    load: () => fetchAllPages("/leads"),
    remove: async (id) => {
      await adminApi(`/leads/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  },
  newsletter: {
    title: "Newsletter",
    csv: "newsletter",
    cols: [["email", "E-mail"], ["pagina", "Página"]],
    load: () => fetchAllPages("/newsletter"),
    remove: async (id) => {
      await adminApi(`/newsletter/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  },
  tool_downloads: {
    title: "Downloads de ferramentas",
    csv: "downloads",
    cols: [["tool_title", "Ferramenta"], ["nome", "Nome"], ["email", "E-mail"], ["empresa", "Empresa"], ["cargo", "Cargo"]],
    load: () => fetchAllPages("/tool_downloads"),
    remove: async (id) => {
      await adminApi(`/tool_downloads/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  },
};

export function Submissions({ source }: { source: SubmissionSource }) {
  const qc = useQueryClient();
  const cfg = CONFIG[source];
  const [q, setQ] = useState("");

  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ["admin", source], queryFn: cfg.load });

  const cell = (r: Row, [k, , get]: Col) => (get ? get(r) : String(r[k] ?? "")) || "—";

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter((r) => cfg.cols.some((c) => cell(r, c).toLowerCase().includes(s)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, q, source]);

  const remove = async (id: string) => {
    if (!confirm("Apagar este cadastro? Isso não dá para desfazer.")) return;
    try {
      await cfg.remove(id);
      toast.success("Cadastro apagado");
      qc.invalidateQueries({ queryKey: ["admin", source] });
    } catch (e) {
      toast.error(errorMessage(e, "Não foi possível apagar."));
    }
  };

  const colSpan = cfg.cols.length + 2;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-extrabold">
          {cfg.title} <span className="text-base text-muted-foreground">({q ? `${list.length} de ${data.length}` : data.length})</span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input aria-label={`Buscar em ${cfg.title.toLowerCase()}`} placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} className="w-56 pl-9" />
          </div>
          <Button variant="outline" onClick={() => toCsv(list, cfg.csv)} disabled={!list.length}>
            <Download className="size-4" /> Exportar planilha
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-foreground bg-card p-4 shadow-brut">
          <p className="text-sm font-semibold">{errorMessage(error, "Não foi possível carregar os cadastros.")}</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>Tentar de novo</Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border-2 border-foreground bg-card shadow-brut [&_th]:whitespace-nowrap [&_th]:text-xs [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-wider [&_thead]:bg-muted">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              {cfg.cols.map(([k, l]) => <TableHead key={k}>{l}</TableHead>)}
              <TableHead><span className="sr-only">Ações</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={colSpan}>Carregando…</TableCell></TableRow>}
            {!isLoading && !error && !list.length && (
              <TableRow><TableCell colSpan={colSpan} className="text-muted-foreground">{q ? "Nada encontrado para essa busca." : "Nenhum cadastro ainda."}</TableCell></TableRow>
            )}
            {list.map((r) => (
              <TableRow key={String(r.id)}>
                <TableCell className="whitespace-nowrap">{fmtDate(r.created_at as string)}</TableCell>
                {cfg.cols.map((c) => {
                  const text = cell(r, c);
                  return <TableCell key={c[0]} className="max-w-xs truncate" title={text.length > 40 ? text : undefined}>{text}</TableCell>;
                })}
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => remove(String(r.id))} aria-label={`Apagar cadastro de ${cell(r, cfg.cols[0]!)}`}>
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

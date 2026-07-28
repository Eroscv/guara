import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileText, Trash2, Search } from "lucide-react";
import { downloadCSV, downloadPDF } from "@/lib/export";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  empresa: string | null;
  segmento: string | null;
  mensagem: string | null;
  source: string | null;
  created_at: string;
}

const columns = [
  { key: "created_at", label: "Data" },
  { key: "nome", label: "Nome" },
  { key: "email", label: "Email" },
  { key: "telefone", label: "Telefone" },
  { key: "empresa", label: "Empresa" },
  { key: "segmento", label: "Segmento" },
  { key: "source", label: "Origem" },
  { key: "mensagem", label: "Mensagem" },
];

const LeadsList = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [q, setQ] = useState("");

  const load = async () => {
    if (!hasLoaded) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) toast.error("Erro ao carregar leads");
      setLeads((data as Lead[]) || []);
    } finally {
      setHasLoaded(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return leads;
    return leads.filter((l) =>
      [l.nome, l.email, l.empresa, l.telefone, l.segmento, l.source, l.mensagem]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s))
    );
  }, [leads, q]);

  const exportRows = filtered.map((l) => ({
    ...l,
    created_at: new Date(l.created_at).toLocaleString("pt-BR"),
  }));

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este lead?")) return;
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir");
    toast.success("Lead excluído");
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-heading font-bold">Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {filtered.length} de {leads.length} registros
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => downloadCSV(`leads-${Date.now()}.csv`, exportRows, columns)}
            disabled={!filtered.length}
          >
            <Download size={16} className="mr-2" /> CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => downloadPDF(`leads-${Date.now()}.pdf`, "Leads — Guará Media", exportRows, columns)}
            disabled={!filtered.length}
          >
            <FileText size={16} className="mr-2" /> PDF
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email, empresa…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Segmento</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !hasLoaded ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando…</TableCell></TableRow>
            ) : !filtered.length ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum lead encontrado.</TableCell></TableRow>
            ) : (
              filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap text-xs">{new Date(l.created_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="font-medium">{l.nome}</TableCell>
                  <TableCell>{l.email}</TableCell>
                  <TableCell>{l.telefone}</TableCell>
                  <TableCell>{l.empresa}</TableCell>
                  <TableCell>{l.segmento}</TableCell>
                  <TableCell><span className="text-xs px-2 py-1 rounded bg-muted">{l.source}</span></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(l.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LeadsList;

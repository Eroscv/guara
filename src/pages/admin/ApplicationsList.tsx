import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileText, Trash2, Search, ExternalLink, Eye, Loader2 } from "lucide-react";
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

interface ApplicationRow {
  id: string;
  job_id: string;
  name: string;
  email: string;
  phone: string | null;
  linkedin: string | null;
  message: string | null;
  resume_url: string | null;
  created_at: string;
  job?: { title: string | null } | null;
}

const columns = [
  { key: "created_at", label: "Data" },
  { key: "name", label: "Nome" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Telefone" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "job_title", label: "Vaga" },
  { key: "resume_url", label: "Currículo" },
  { key: "message", label: "Mensagem" },
];

const ApplicationsList = () => {
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [openingId, setOpeningId] = useState<string | null>(null);

  const load = async () => {
    if (!hasLoaded) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*, job:jobs(title)")
        .order("created_at", { ascending: false });
      if (error) toast.error("Erro ao carregar candidaturas");
      setRows((data as any) || []);
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
    if (!s) return rows;
    return rows.filter((r) =>
      [r.name, r.email, r.phone, r.linkedin, r.message, r.job?.title]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s))
    );
  }, [rows, q]);

  const exportRows = filtered.map((r) => ({
    ...r,
    created_at: new Date(r.created_at).toLocaleString("pt-BR"),
    job_title: r.job?.title ?? "",
  }));

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta candidatura?")) return;
    const { error } = await supabase.from("applications").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir");
    toast.success("Candidatura excluída");
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleViewResume = async (row: ApplicationRow) => {
    if (!row.resume_url) return;
    setOpeningId(row.id);
    try {
      const url = new URL(row.resume_url);
      const pathParts = url.pathname.split("/");
      const path = pathParts.slice(pathParts.indexOf("resumes") + 1).join("/");

      const { data, error } = await supabase.storage.from("resumes").createSignedUrl(path, 60);
      if (error || !data?.signedUrl) throw error || new Error("Não foi possível gerar o link");

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e.message || "Erro ao abrir currículo");
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-heading font-bold">Candidaturas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {filtered.length} de {rows.length} registros
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => downloadCSV(`candidaturas-${Date.now()}.csv`, exportRows, columns)}
            disabled={!filtered.length}
          >
            <Download size={16} className="mr-2" /> CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => downloadPDF(`candidaturas-${Date.now()}.pdf`, "Candidaturas — Guará Media", exportRows, columns)}
            disabled={!filtered.length}
          >
            <FileText size={16} className="mr-2" /> PDF
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email, vaga…"
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
              <TableHead>Vaga</TableHead>
              <TableHead>CV</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !hasLoaded ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando…</TableCell></TableRow>
            ) : !filtered.length ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma candidatura encontrada.</TableCell></TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-xs">{new Date(r.created_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell>{r.phone}</TableCell>
                  <TableCell>{r.job?.title ?? "—"}</TableCell>
                  <TableCell>
                    {r.resume_url ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto px-2 py-1 text-primary"
                        onClick={() => handleViewResume(r)}
                        disabled={openingId === r.id}
                      >
                        {openingId === r.id ? (
                          <Loader2 size={14} className="animate-spin mr-1" />
                        ) : (
                          <Eye size={14} className="mr-1" />
                        )}
                        Ver
                      </Button>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
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

export default ApplicationsList;

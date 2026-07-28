import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Copy, Search, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const statusLabel: Record<string, { label: string; variant: any }> = {
  open: { label: "Aberta", variant: "default" },
  draft: { label: "Rascunho", variant: "secondary" },
  closed: { label: "Fechada", variant: "outline" },
};

const JobsList = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [department, setDepartment] = useState<string>("all");

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const departments = useMemo(
    () => Array.from(new Set(jobs.map((j: any) => j.department).filter(Boolean))),
    [jobs],
  );

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return jobs.filter((j: any) => {
      if (s && !j.title.toLowerCase().includes(s) && !j.location?.toLowerCase().includes(s)) return false;
      if (status !== "all" && j.status !== status) return false;
      if (department !== "all" && j.department !== department) return false;
      return true;
    });
  }, [jobs, search, status, department]);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vaga excluída");
      qc.invalidateQueries({ queryKey: ["admin-jobs"] });
      qc.invalidateQueries({ queryKey: ["count", "jobs"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const duplicate = useMutation({
    mutationFn: async (j: any) => {
      const { id, created_at, updated_at, ...rest } = j;
      const { error } = await supabase.from("jobs").insert({
        ...rest,
        title: `${j.title} (cópia)`,
        status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vaga duplicada como rascunho");
      qc.invalidateQueries({ queryKey: ["admin-jobs"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-3xl">Vagas</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} de {jobs.length} vagas</p>
        </div>
        <Button asChild>
          <Link to="/admin/jobs/new"><Plus size={16} /> Nova vaga</Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por cargo ou localização..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="open">Abertas</SelectItem>
            <SelectItem value="draft">Rascunhos</SelectItem>
            <SelectItem value="closed">Fechadas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos depto.</SelectItem>
            {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cargo</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-40">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma vaga encontrada.</TableCell></TableRow>
            ) : filtered.map((j: any) => {
              const st = statusLabel[j.status] || statusLabel.draft;
              return (
                <TableRow key={j.id}>
                  <TableCell className="font-medium">{j.title}</TableCell>
                  <TableCell>{j.department}</TableCell>
                  <TableCell>{j.location}</TableCell>
                  <TableCell><Badge variant="secondary">{j.work_model}</Badge></TableCell>
                  <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button asChild variant="ghost" size="icon" title="Ver no site">
                        <a href={`/talentos/${j.id}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /></a>
                      </Button>
                      <Button variant="ghost" size="icon" title="Duplicar" onClick={() => duplicate.mutate(j)}>
                        <Copy size={16} />
                      </Button>
                      <Button asChild variant="ghost" size="icon" title="Editar">
                        <Link to={`/admin/jobs/${j.id}/edit`}><Pencil size={16} /></Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 size={16} /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir vaga?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => del.mutate(j.id)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default JobsList;

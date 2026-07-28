import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Copy, Search, ExternalLink, Lock } from "lucide-react";
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
import { slugify } from "@/lib/slug";

const ArticlesList = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return items.filter((a: any) => {
      if (s && !a.title.toLowerCase().includes(s) && !a.slug.toLowerCase().includes(s)) return false;
      if (status !== "all" && a.status !== status) return false;
      return true;
    });
  }, [items, search, status]);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Artigo excluído");
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      qc.invalidateQueries({ queryKey: ["count", "articles"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const duplicate = useMutation({
    mutationFn: async (a: any) => {
      const { id, created_at, updated_at, views, ...rest } = a;
      const { error } = await supabase.from("articles").insert({
        ...rest,
        title: `${a.title} (cópia)`,
        slug: slugify(`${a.slug}-copia-${Date.now()}`),
        status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Artigo duplicado como rascunho");
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-3xl">Artigos</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} de {items.length} artigos</p>
        </div>
        <Button asChild>
          <Link to="/admin/articles/new"><Plus size={16} /> Novo artigo</Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por título ou slug..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="published">Publicados</SelectItem>
            <SelectItem value="draft">Rascunhos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-40">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum artigo encontrado.</TableCell></TableRow>
            ) : filtered.map((a: any) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.title}</TableCell>
                <TableCell>
                  {a.status === "published" ? <Badge>Publicado</Badge> : <Badge variant="secondary">Rascunho</Badge>}
                </TableCell>
                <TableCell>
                  {a.gated ? <span className="inline-flex items-center gap-1 text-xs"><Lock size={12} /> Exclusivo</span> : "Aberto"}
                </TableCell>
                <TableCell>{a.views ?? 0}</TableCell>
                <TableCell>{new Date(a.published_at).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button asChild variant="ghost" size="icon" title="Ver no site">
                      <a href={`/artigos/${a.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /></a>
                    </Button>
                    <Button variant="ghost" size="icon" title="Duplicar" onClick={() => duplicate.mutate(a)}>
                      <Copy size={16} />
                    </Button>
                    <Button asChild variant="ghost" size="icon" title="Editar">
                      <Link to={`/admin/articles/${a.id}/edit`}><Pencil size={16} /></Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 size={16} /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir artigo?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => del.mutate(a.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ArticlesList;

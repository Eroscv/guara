import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import TagsInput from "@/components/admin/TagsInput";
import { toast } from "sonner";

type WorkModel = "remoto" | "híbrido" | "presencial";
type JobStatus = "draft" | "open" | "closed";

const empty = {
  title: "",
  department: "",
  location: "",
  work_model: "remoto" as WorkModel,
  description: "",
  requirements: [] as string[],
  responsibilities: [] as string[],
  is_open: true,
  status: "draft" as JobStatus,
  scheduled_at: null as string | null,
};

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const JobEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    supabase.from("jobs").select("*").eq("id", id!).single().then(({ data, error }) => {
      if (error) toast.error(error.message);
      else if (data) setForm({ ...empty, ...data });
      setLoading(false);
    });
  }, [id, isEdit]);

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async (e: React.FormEvent, publish?: boolean) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (publish) payload.status = "open";
      const { data, error } = isEdit
        ? await supabase.from("jobs").update(payload).eq("id", id!).select("id").maybeSingle()
        : await supabase.from("jobs").insert(payload).select("id").single();
      if (error) throw error;
      toast.success(isEdit ? "Vaga atualizada" : "Vaga criada");
      if (!isEdit && data?.id) navigate(`/admin/jobs/${data.id}/edit`);
      else navigate("/admin/jobs");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="max-w-4xl">
      <Link to="/admin/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft size={14} /> Voltar
      </Link>
      <h1 className="font-heading font-bold text-3xl mb-6">{isEdit ? "Editar vaga" : "Nova vaga"}</h1>

      <form onSubmit={(e) => save(e)} className="space-y-6 bg-card p-6 rounded-2xl shadow-card">
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/40">
          <div className="space-y-1.5 w-48">
            <Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v as JobStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="open">Aberta</SelectItem>
                <SelectItem value="closed">Fechada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Agendar abertura</Label>
            <Input
              type="datetime-local"
              value={toLocalInput(form.scheduled_at)}
              onChange={(e) => set("scheduled_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
              className="w-56"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Cargo *</Label>
          <Input required value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Departamento</Label>
            <Input value={form.department} onChange={(e) => set("department", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Localização</Label>
            <Input value={form.location} onChange={(e) => set("location", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Modelo de trabalho</Label>
            <Select value={form.work_model} onValueChange={(v) => set("work_model", v as WorkModel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="remoto">Remoto</SelectItem>
                <SelectItem value="híbrido">Híbrido</SelectItem>
                <SelectItem value="presencial">Presencial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Descrição</Label>
          <Textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Responsabilidades</Label>
          <TagsInput value={form.responsibilities} onChange={(v) => set("responsibilities", v)} placeholder="Digite e Enter para adicionar" />
        </div>
        <div className="space-y-1.5">
          <Label>Requisitos</Label>
          <TagsInput value={form.requirements} onChange={(v) => set("requirements", v)} placeholder="Digite e Enter para adicionar" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}><Save size={16} /> {saving ? "Salvando..." : "Salvar"}</Button>
          <Button type="button" variant="secondary" onClick={(e) => save(e, true)} disabled={saving}>Salvar e abrir vaga</Button>
          {isEdit && (
            <Button type="button" variant="outline" onClick={() => window.open(`/talentos/${id}`, "_blank")}>
              <Eye size={16} /> Visualizar
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={() => navigate("/admin/jobs")}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
};

export default JobEditor;

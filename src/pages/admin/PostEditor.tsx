import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImageUpload from "@/components/admin/ImageUpload";
import TagsInput from "@/components/admin/TagsInput";
import { slugify } from "@/lib/slug";
import { calcReadingTime } from "@/lib/reading-time";
import { toast } from "sonner";

const empty = {
  title: "",
  slug: "",
  excerpt: "",
  cover_image: null as string | null,
  category: "",
  tags: [] as string[],
  author: "",
  published_at: new Date().toISOString().split("T")[0],
  reading_time: 5,
  content: "",
  status: "draft" as "draft" | "published",
  scheduled_at: null as string | null,
};

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const PostEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    supabase.from("posts").select("*").eq("id", id!).single().then(({ data, error }) => {
      if (error) toast.error(error.message);
      else if (data) setForm({ ...empty, ...data, cover_image: data.cover_image ?? null });
      setLoading(false);
    });
  }, [id, isEdit]);

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleTitle = (v: string) => {
    set("title", v);
    if (!slugTouched) set("slug", slugify(v));
  };

  const save = async (publishNow?: boolean) => {
    setSaving(true);
    try {
      const auto = calcReadingTime(form.content);
      const payload: any = {
        ...form,
        slug: form.slug || slugify(form.title),
        reading_time: form.reading_time || auto,
        status: publishNow ? "published" : form.status,
      };
      const { data, error } = isEdit
        ? await supabase.from("posts").update(payload).eq("id", id!).select("id").maybeSingle()
        : await supabase.from("posts").insert(payload).select("id").single();
      if (error) throw error;
      toast.success(isEdit ? "Post atualizado" : "Post criado");
      if (!isEdit && data?.id) navigate(`/admin/posts/${data.id}/edit`);
      else navigate("/admin/posts");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const preview = () => {
    if (form.slug) window.open(`/blog/${form.slug}`, "_blank");
    else toast.info("Salve primeiro para visualizar");
  };

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="max-w-4xl">
      <Link to="/admin/posts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft size={14} /> Voltar
      </Link>
      <h1 className="font-heading font-bold text-3xl mb-6">{isEdit ? "Editar post" : "Novo post"}</h1>

      <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-6 bg-card p-6 rounded-2xl shadow-card">
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/40">
          <div className="flex items-center gap-3">
            <Switch
              checked={form.status === "published"}
              onCheckedChange={(v) => set("status", v ? "published" : "draft")}
            />
            <div>
              <Label className="text-sm font-medium">{form.status === "published" ? "Publicado" : "Rascunho"}</Label>
              <p className="text-xs text-muted-foreground">
                {form.status === "published" ? "Visível no site" : "Não aparece no site público"}
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Agendar publicação</Label>
            <Input
              type="datetime-local"
              value={toLocalInput(form.scheduled_at)}
              onChange={(e) => set("scheduled_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
              className="w-56"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Título *</Label>
          <Input required value={form.title} onChange={(e) => handleTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Slug (URL) *</Label>
          <Input required value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
        </div>
        <div className="space-y-1.5">
          <Label>Resumo</Label>
          <Textarea rows={2} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Imagem de capa</Label>
          <ImageUpload value={form.cover_image} onChange={(v) => set("cover_image", v)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Input value={form.category} onChange={(e) => set("category", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Autor</Label>
            <Input value={form.author} onChange={(e) => set("author", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Data de publicação</Label>
            <Input type="date" value={form.published_at} onChange={(e) => set("published_at", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Tempo de leitura (min) — auto: {calcReadingTime(form.content)}</Label>
            <Input type="number" min={1} value={form.reading_time} onChange={(e) => set("reading_time", Number(e.target.value))} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Tags</Label>
          <TagsInput value={form.tags} onChange={(v) => set("tags", v)} />
        </div>
        <div className="space-y-1.5">
          <Label>Conteúdo</Label>
          <RichTextEditor value={form.content} onChange={(v) => set("content", v)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}><Save size={16} /> {saving ? "Salvando..." : "Salvar"}</Button>
          <Button type="button" variant="secondary" onClick={() => save(true)} disabled={saving}>Salvar e publicar</Button>
          {isEdit && <Button type="button" variant="outline" onClick={preview}><Eye size={16} /> Visualizar</Button>}
          <Button type="button" variant="ghost" onClick={() => navigate("/admin/posts")}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
};

export default PostEditor;

import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, Eye, Linkedin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { slugify } from "@/lib/slug";
import { toast } from "sonner";
import {
  parseLinkedInEmbed,
  extractEmbedSrcFromHtml,
  buildEmbedHtml,
} from "@/lib/linkedin-embed";

const empty = {
  title: "",
  slug: "",
  excerpt: "",
  cover_image: null as string | null,
  gated: false,
  published_at: new Date().toISOString().split("T")[0],
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

const ArticleEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState(empty);
  const [linkedinInput, setLinkedinInput] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    supabase.from("articles").select("*").eq("id", id!).single().then(({ data, error }) => {
      if (error) toast.error(error.message);
      else if (data) {
        setForm({ ...empty, ...data, cover_image: data.cover_image ?? null });
        const src = extractEmbedSrcFromHtml(data.content);
        if (src) setLinkedinInput(src);
      }
      setLoading(false);
    });
  }, [id, isEdit]);

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleTitle = (v: string) => {
    set("title", v);
    if (!slugTouched) set("slug", slugify(v));
  };

  const save = async (e: React.FormEvent, publish?: boolean) => {
    e.preventDefault();
    const src = parseLinkedInEmbed(linkedinInput);
    if (!src) {
      toast.error("Cole a URL do post do LinkedIn ou o código <iframe> do Embed");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        slug: form.slug || slugify(form.title),
        content: buildEmbedHtml(src),
      };
      if (publish) payload.status = "published";
      const { data, error } = isEdit
        ? await supabase.from("articles").update(payload).eq("id", id!).select("id").maybeSingle()
        : await supabase.from("articles").insert(payload).select("id").single();
      if (error) throw error;
      toast.success(isEdit ? "Artigo atualizado" : "Artigo criado");
      if (!isEdit && data?.id) navigate(`/admin/articles/${data.id}/edit`);
      else navigate("/admin/articles");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  const previewSrc = parseLinkedInEmbed(linkedinInput);

  return (
    <div className="max-w-4xl">
      <Link to="/admin/articles" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft size={14} /> Voltar
      </Link>
      <h1 className="font-heading font-bold text-3xl mb-6">{isEdit ? "Editar post do LinkedIn" : "Novo post do LinkedIn"}</h1>

      <form onSubmit={(e) => save(e)} className="space-y-6 bg-card p-6 rounded-2xl shadow-card">
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
          <Label>Título interno *</Label>
          <Input required value={form.title} onChange={(e) => handleTitle(e.target.value)} placeholder="Usado apenas no painel admin" />
        </div>
        <div className="space-y-1.5">
          <Label>Slug (URL) *</Label>
          <Input required value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-2"><Linkedin size={16} /> Post do LinkedIn *</Label>
          <Input
            required
            value={linkedinInput}
            onChange={(e) => setLinkedinInput(e.target.value)}
            placeholder="Cole a URL do post ou o código <iframe> do Embed"
          />
          <p className="text-xs text-muted-foreground">
            Aceita URL pública do post (linkedin.com/posts/...), URL de embed ou o snippet `&lt;iframe&gt;` que o LinkedIn gera no botão "Embed".
          </p>
        </div>

        {previewSrc && (
          <div className="space-y-1.5">
            <Label>Pré-visualização</Label>
            <iframe
              src={previewSrc}
              width={504}
              height={542}
              frameBorder={0}
              allowFullScreen
              title="Pré-visualização"
              className="rounded-xl border bg-background"
            />
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Data de publicação</Label>
            <Input type="date" value={form.published_at} onChange={(e) => set("published_at", e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}><Save size={16} /> {saving ? "Salvando..." : "Salvar"}</Button>
          <Button type="button" variant="secondary" onClick={(e) => save(e, true)} disabled={saving}>Salvar e publicar</Button>
          {isEdit && (
            <Button type="button" variant="outline" onClick={() => form.slug && window.open(`/artigos`, "_blank")}>
              <Eye size={16} /> Ver na página
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={() => navigate("/admin/articles")}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
};

export default ArticleEditor;

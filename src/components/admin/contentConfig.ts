import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/slug";
import { calcReadingTime } from "@/lib/reading-time";
import { adminApi, AdminApiError, fmtDate, lines, toLocalInput } from "./helpers";

export type Kind = "posts" | "jobs" | "tools";
export type Row = Record<string, any>;
export type FieldType = "text" | "textarea" | "html" | "list" | "tags" | "image" | "file" | "select" | "datetime" | "switch" | "slug";
export type RowState = "on" | "scheduled" | "draft" | "closed" | "archived";

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  section: string;
  hint?: string;
  half?: boolean;
  placeholder?: string;
  options?: [string, string][];
};

export interface Store {
  list(): Promise<Row[]>;
  create(payload: Row): Promise<void>;
  update(id: string, payload: Row): Promise<void>;
  remove(id: string): Promise<void>;
  archive(id: string, next: boolean): Promise<void>;
}

export interface KindConfig {
  title: string;
  /** "postagem", "vaga"… — usado nos botões e títulos. */
  noun: string;
  newLabel: string;
  switchLabel: string;
  switchOn: string;
  switchOff: string;
  fields: Field[];
  /** Filtros específicos (além de "Ativos" e "Todos"). */
  filters: [RowState, string][];
  sub(r: Row): string;
  state(r: Row, now: Date): RowState;
  isOn(r: Row): boolean;
  /** Texto ao lado do interruptor da lista: diz em que estado a linha está agora. */
  switchText(r: Row): string;
  /** Campos a gravar pra ligar/desligar pelo interruptor da lista. */
  toggle(r: Row): Row;
  /** Valores iniciais do formulário a partir da linha (ou de uma nova). */
  toForm(r: Row): Row;
  /** Formulário → o que vai pro banco. */
  toPayload(v: Row, isNew: boolean): Row;
}

// Texto simples vira parágrafos; HTML do editor passa como está.
export function toHtml(s: string) {
  if (/<(p|h\d|ul|ol|div|img)\b/i.test(s)) return s;
  return s
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

const splitTags = (s: string) => String(s).split(",").map((t) => t.trim()).filter(Boolean);
const nowLocal = () => toLocalInput(new Date().toISOString());
const isFuture = (iso: string | null | undefined, now: Date) => !!iso && new Date(iso) > now;

export const CONFIG: Record<Kind, KindConfig> = {
  // ---- Blog (Supabase). Visível no site: status = published e scheduled_at vazio ou já passado.
  posts: {
    title: "Blog",
    noun: "postagem",
    newLabel: "Nova postagem",
    switchLabel: "Publicado",
    switchOn: "Visível no site",
    switchOff: "Rascunho — escondido do site",
    filters: [["on", "Publicados"], ["draft", "Rascunhos"], ["scheduled", "Agendados"]],
    sub: (r) =>
      `${r.category || "Sem categoria"} · ${isFuture(r.scheduled_at, new Date()) ? "Agendado para " + fmtDate(r.scheduled_at) : fmtDate(r.published_at)} · ${r.reading_time ?? 1} min de leitura`,
    state: (r, now) => (r.archived ? "archived" : r.status !== "published" ? "draft" : isFuture(r.scheduled_at, now) ? "scheduled" : "on"),
    isOn: (r) => r.status === "published",
    switchText: (r) => (r.status === "published" ? "Publicado" : "Rascunho"),
    toggle: (r) => ({ status: r.status === "published" ? "draft" : "published" }),
    fields: [
      { key: "title", label: "Título", type: "text", section: "Básico", placeholder: "Ex.: 5 tendências de marketing para 2027" },
      { key: "excerpt", label: "Resumo", type: "textarea", section: "Básico", placeholder: "Uma ou duas frases que aparecem na lista do blog" },
      { key: "category", label: "Categoria", type: "text", section: "Organização", half: true, placeholder: "Ex.: Estratégia" },
      { key: "author", label: "Autor", type: "text", section: "Organização", half: true, placeholder: "Ex.: Equipe Guará" },
      { key: "tags", label: "Tags", type: "text", hint: "Separe por vírgula", section: "Organização", placeholder: "ia, seo, conteúdo" },
      { key: "cover_image", label: "Imagem de capa", type: "image", section: "Capa" },
      { key: "content", label: "Texto do post", type: "html", hint: "Use a barra para títulos, listas, links e imagens.", section: "Conteúdo" },
      { key: "slug", label: "Endereço (slug)", type: "slug", hint: "Parte final do link do post. Nasce do título; mude só se precisar.", section: "Publicação" },
      { key: "published_at", label: "Data de publicação", type: "datetime", hint: "Escolha uma data futura para agendar. O post só aparece no site a partir dela.", section: "Publicação" },
      { key: "_on", label: "Publicado no site", type: "switch", section: "Publicação" },
    ],
    toForm: (r) => ({
      title: r.title ?? "",
      excerpt: r.excerpt ?? "",
      category: r.category ?? "",
      author: r.author ?? "",
      tags: (r.tags ?? []).join(", "),
      cover_image: r.cover_image ?? "",
      content: r.content ?? "",
      slug: r.slug ?? "",
      published_at: r.id ? toLocalInput(r.scheduled_at ?? r.published_at) : nowLocal(),
      _on: r.id ? r.status === "published" : false,
    }),
    toPayload: (v, isNew) => {
      const at = v.published_at ? new Date(v.published_at) : new Date();
      const future = at.getTime() > Date.now();
      const typedSlug = slugify(String(v.slug ?? ""));
      return {
        title: v.title.trim(),
        excerpt: v.excerpt.trim(),
        category: v.category.trim(),
        author: v.author.trim(),
        tags: splitTags(v.tags),
        cover_image: v.cover_image.trim() || null,
        content: toHtml(v.content),
        reading_time: calcReadingTime(v.content),
        published_at: at.toISOString(),
        scheduled_at: future ? at.toISOString() : null,
        status: v._on ? "published" : "draft",
        ...(typedSlug ? { slug: typedSlug } : isNew ? { slug: slugify(v.title) || "post", _autoSlug: true } : {}),
      };
    },
  },

  // ---- Vagas (Supabase). Visível: status = open e scheduled_at vazio ou já passado. is_open é sincronizado por trigger.
  jobs: {
    title: "Vagas",
    noun: "vaga",
    newLabel: "Nova vaga",
    switchLabel: "Aberta",
    switchOn: "Recebendo candidaturas",
    switchOff: "Fechada ou em rascunho",
    filters: [["on", "Abertas"], ["closed", "Fechadas"], ["draft", "Rascunhos"], ["scheduled", "Agendadas"]],
    sub: (r) =>
      [r.department, r.location, r.work_model, isFuture(r.scheduled_at, new Date()) ? "Abre em " + fmtDate(r.scheduled_at) : ""].filter(Boolean).join(" · "),
    state: (r, now) => (r.archived ? "archived" : r.status === "draft" ? "draft" : r.status === "closed" ? "closed" : isFuture(r.scheduled_at, now) ? "scheduled" : "on"),
    isOn: (r) => r.status === "open",
    switchText: (r) => (r.status === "open" ? "Aberta" : r.status === "closed" ? "Fechada" : "Rascunho"),
    toggle: (r) => ({ status: r.status === "open" ? "closed" : "open" }),
    fields: [
      { key: "title", label: "Cargo", type: "text", section: "Básico", placeholder: "Ex.: Designer Gráfico Pleno" },
      { key: "department", label: "Área", type: "text", section: "Básico", half: true, placeholder: "Ex.: Criação" },
      { key: "location", label: "Local", type: "text", section: "Básico", half: true, placeholder: "Ex.: São Paulo, SP" },
      { key: "work_model", label: "Modelo de trabalho", type: "select", section: "Básico", options: [["remoto", "Remoto"], ["híbrido", "Híbrido"], ["presencial", "Presencial"]] },
      { key: "description", label: "Descrição", type: "textarea", section: "Detalhes", placeholder: "Conte sobre a vaga e o time" },
      { key: "responsibilities", label: "Responsabilidades", type: "list", hint: "Um item por linha", section: "Detalhes", placeholder: "Uma responsabilidade por linha" },
      { key: "requirements", label: "Requisitos", type: "list", hint: "Um item por linha", section: "Detalhes", placeholder: "Um requisito por linha" },
      { key: "status", label: "Situação", type: "select", section: "Publicação", half: true, options: [["draft", "Rascunho"], ["open", "Aberta"], ["closed", "Fechada"]] },
      { key: "scheduled_at", label: "Abrir em (opcional)", type: "datetime", half: true, hint: "Deixe vazio para abrir já. Com data futura, a vaga só aparece a partir dela.", section: "Publicação" },
    ],
    toForm: (r) => ({
      title: r.title ?? "",
      department: r.department ?? "",
      location: r.location ?? "",
      work_model: r.work_model ?? "remoto",
      description: r.description ?? "",
      responsibilities: (r.responsibilities ?? []).join("\n"),
      requirements: (r.requirements ?? []).join("\n"),
      status: r.status ?? "draft",
      scheduled_at: toLocalInput(r.scheduled_at),
    }),
    toPayload: (v) => ({
      title: v.title.trim(),
      department: v.department.trim(),
      location: v.location.trim(),
      work_model: v.work_model,
      description: v.description.trim(),
      responsibilities: lines(v.responsibilities),
      requirements: lines(v.requirements),
      status: v.status,
      scheduled_at: v.scheduled_at ? new Date(v.scheduled_at).toISOString() : null,
    }),
  },

  // ---- Ferramentas (Vercel Postgres, via /api/admin/v1). A API é estrita: image/file_url não aceitam null.
  tools: {
    title: "Ferramentas",
    noun: "ferramenta",
    newLabel: "Nova ferramenta",
    switchLabel: "Publicada",
    switchOn: "Visível no site",
    switchOff: "Rascunho — escondida do site",
    filters: [["on", "Publicadas"], ["draft", "Rascunhos"]],
    sub: (r) => `${r.category || "Sem categoria"} · ${r.file_name ?? "sem arquivo"} · ${r._downloads ?? 0} download(s)`,
    state: (r) => (r.archived ? "archived" : r.published ? "on" : "draft"),
    isOn: (r) => !!r.published,
    switchText: (r) => (r.published ? "Publicada" : "Rascunho"),
    toggle: (r) => ({ published: !r.published }),
    fields: [
      { key: "title", label: "Título", type: "text", section: "Básico", placeholder: "Ex.: Planilha de orçamento de marketing" },
      { key: "description", label: "Descrição", type: "textarea", section: "Básico", placeholder: "O que é e para quem serve" },
      { key: "category", label: "Categoria", type: "text", section: "Básico", placeholder: "Ex.: Planilhas" },
      { key: "image", label: "Imagem", type: "image", section: "Imagem" },
      { key: "benefits", label: "O que a pessoa recebe", type: "list", hint: "Um item por linha", section: "Download", placeholder: "Modelo pronto\nFórmulas automáticas" },
      { key: "file_url", label: "Arquivo para download", type: "file", section: "Download" },
      { key: "_on", label: "Publicada no site", type: "switch", section: "Publicação" },
    ],
    toForm: (r) => ({
      title: r.title ?? "",
      description: r.description ?? "",
      category: r.category ?? "",
      image: r.image ?? "",
      benefits: (r.benefits ?? []).join("\n"),
      file_url: r.file_url ?? "",
      file_name: r.file_name ?? "",
      _on: r.id ? !!r.published : false,
    }),
    toPayload: (v) => ({
      title: v.title.trim(),
      description: v.description.trim(),
      category: v.category.trim(),
      benefits: lines(v.benefits),
      published: !!v._on,
      ...(v.image.trim() ? { image: v.image.trim() } : {}),
      ...(v.file_url.trim() ? { file_url: v.file_url.trim(), ...(v.file_name ? { file_name: v.file_name } : {}) } : {}),
    }),
  },
};

// ---------------------------------------------------------------------------
// Acesso aos dados
// ---------------------------------------------------------------------------

function supabaseStore(table: "posts" | "jobs", orderBy: string): Store {
  return {
    async list() {
      const { data, error } = await supabase.from(table).select("*").order(orderBy, { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
    async create(payload) {
      const { _autoSlug, ...row } = payload;
      const base: string | undefined = row.slug;
      // Slug nascido do título: se já existe, tenta de novo com um sufixo curto.
      // Slug digitado à mão que já existe é erro de verdade — não mexemos nele.
      for (let attempt = 0; attempt < 4; attempt++) {
        const slug = base && attempt > 0 ? `${base}-${Math.random().toString(36).slice(2, 6)}` : base;
        const { error } = await supabase.from(table).insert((slug ? { ...row, slug } : row) as never);
        if (!error) return;
        if (error.code !== "23505" || !_autoSlug) throw error;
      }
      throw Object.assign(new Error("slug duplicado"), { code: "23505" });
    },
    async update(id, payload) {
      const { error } = await supabase.from(table).update(payload as never).eq("id", id);
      if (error) throw error;
    },
    async remove(id) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    async archive(id, next) {
      const { error } = await supabase.from(table).update({ archived: next, archived_at: next ? new Date().toISOString() : null } as never).eq("id", id);
      if (error) throw error;
    },
  };
}

// A API devolve no máximo 200 por página.
export async function fetchAllPages<T = Row>(path: string, cap = 25): Promise<T[]> {
  const out: T[] = [];
  const sep = path.includes("?") ? "&" : "?";
  for (let page = 0; page < cap; page++) {
    const r = await adminApi<{ data: T[]; count: number }>(`${path}${sep}limit=200&offset=${page * 200}`);
    out.push(...r.data);
    if (!r.data.length || out.length >= r.count) break;
  }
  return out;
}

const toolsStore: Store = {
  async list() {
    const [tools, byTool] = await Promise.all([
      fetchAllPages("/tools"),
      adminApi<Record<string, number>>("/downloads-by-tool").catch(() => ({}) as Record<string, number>),
    ]);
    return tools.map((t) => ({ ...t, _downloads: byTool[t.slug] ?? 0 }));
  },
  async create(payload) {
    await adminApi("/tools", { method: "POST", body: payload });
  },
  async update(id, payload) {
    await adminApi(`/tools/${id}`, { method: "PATCH", body: payload });
  },
  async remove(id) {
    await adminApi(`/tools/${id}`, { method: "DELETE" });
  },
  async archive(id, next) {
    await adminApi(`/tools/${id}`, { method: "PATCH", body: { archived: next } });
  },
};

export const STORES: Record<Kind, Store> = {
  posts: supabaseStore("posts", "published_at"),
  jobs: supabaseStore("jobs", "created_at"),
  tools: toolsStore,
};

/** Mensagem pra mostrar na tela quando uma gravação falha. */
export function errorMessage(e: unknown, fallback = "Não foi possível salvar."): string {
  if (e instanceof AdminApiError) return e.message;
  const err = e as { code?: string; message?: string };
  if (err?.code === "23505") return "Já existe um item com esse endereço (slug). Troque o título ou o slug.";
  if (err?.code === "42501") return "Sua conta não tem permissão para isso.";
  return fallback;
}

import { slugify } from "@/lib/slug";
import { AdminApiError, adminApi, fmtDate, lines, toLocalInput } from "./helpers";

// Blog, vagas e ferramentas do painel, no contrato da API da Guará (Guara-API-manual.pdf):
// posts { published, published_at, archived… } · vagas { is_open, publish_at, archived… }
// · ferramentas { published, file_url, archived… }. "Agendado" = data futura.

export type Kind = "posts" | "jobs" | "tools";
export type Row = Record<string, any>;
export type FieldType = "text" | "textarea" | "html" | "list" | "image" | "file" | "select" | "datetime" | "switch" | "slug";
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
  /** Só aparece ao criar (a API não altera o slug depois). */
  onlyNew?: boolean;
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
  /** Filtros específicos (além de "Ativos", "Arquivados" e "Todos"). */
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
  /** Devolve um texto se faltar algo obrigatório. */
  validate?(v: Row): string | null;
  /** Formulário → o que vai pra API. */
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
const hasText = (html: string) => /<img\b/i.test(html) || html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0;

export const CONFIG: Record<Kind, KindConfig> = {
  posts: {
    title: "Blog",
    noun: "postagem",
    newLabel: "Nova postagem",
    switchLabel: "Publicado",
    switchOn: "Visível no site",
    switchOff: "Rascunho — escondido do site",
    filters: [["on", "Publicados"], ["draft", "Rascunhos"], ["scheduled", "Agendados"]],
    sub: (r) =>
      `${r.category || "Sem categoria"} · ${r.published && isFuture(r.published_at, new Date()) ? "Agendado para " : ""}${fmtDate(r.published_at)} · ${r.reading_time ?? 1} min de leitura`,
    state: (r, now) => (r.archived ? "archived" : !r.published ? "draft" : isFuture(r.published_at, now) ? "scheduled" : "on"),
    isOn: (r) => !!r.published,
    switchText: (r) => (r.published ? "Publicado" : "Rascunho"),
    toggle: (r) => ({ published: !r.published }),
    fields: [
      { key: "title", label: "Título", type: "text", section: "Básico", placeholder: "Ex.: 5 tendências de marketing para 2027" },
      { key: "excerpt", label: "Resumo", type: "textarea", section: "Básico", placeholder: "Uma ou duas frases que aparecem na lista do blog" },
      { key: "category", label: "Categoria", type: "text", section: "Organização", half: true, placeholder: "Ex.: Estratégia" },
      { key: "author", label: "Autor", type: "text", section: "Organização", half: true, placeholder: "Ex.: Equipe Guará" },
      { key: "tags", label: "Tags", type: "text", hint: "Separe por vírgula", section: "Organização", placeholder: "ia, seo, conteúdo" },
      { key: "cover_image", label: "Imagem de capa", type: "image", section: "Capa" },
      { key: "content", label: "Texto do post", type: "html", hint: "Use a barra para títulos, listas, links e imagens.", section: "Conteúdo" },
      { key: "slug", label: "Endereço (slug)", type: "slug", onlyNew: true, hint: "Parte final do link do post. Deixe vazio para gerar pelo título.", section: "Publicação" },
      { key: "published_at", label: "Data de publicação", type: "datetime", hint: "Escolha uma data futura para agendar. O post só aparece no site a partir dela.", section: "Publicação" },
      { key: "published", label: "Publicado no site", type: "switch", section: "Publicação" },
    ],
    toForm: (r) => ({
      title: r.title ?? "",
      excerpt: r.excerpt ?? "",
      category: r.category ?? "",
      author: r.author ?? "",
      tags: (r.tags ?? []).join(", "),
      cover_image: r.cover_image ?? "",
      content: r.content ?? "",
      slug: "",
      published_at: r.id ? toLocalInput(r.published_at) : nowLocal(),
      published: r.id ? !!r.published : false,
    }),
    validate: (v) => (hasText(v.content ?? "") ? null : "Escreva o texto do post."),
    toPayload: (v, isNew) => {
      const slug = slugify(String(v.slug ?? ""));
      return {
        title: v.title.trim(),
        excerpt: v.excerpt.trim(),
        category: v.category.trim(),
        author: v.author.trim(),
        tags: splitTags(v.tags),
        content: toHtml(v.content),
        published: !!v.published,
        published_at: (v.published_at ? new Date(v.published_at) : new Date()).toISOString(),
        // A API só aceita link https; vazio = não manda (não dá pra limpar uma capa já gravada)
        ...(v.cover_image.trim() ? { cover_image: v.cover_image.trim() } : {}),
        ...(isNew && slug ? { slug } : {}),
      };
    },
  },

  jobs: {
    title: "Vagas",
    noun: "vaga",
    newLabel: "Nova vaga",
    switchLabel: "Aberta",
    switchOn: "Recebendo candidaturas",
    switchOff: "Vaga fechada",
    filters: [["on", "Abertas"], ["closed", "Fechadas"], ["scheduled", "Agendadas"]],
    sub: (r) =>
      [r.department, r.location, r.work_model, r.is_open && isFuture(r.publish_at, new Date()) ? "Abre em " + fmtDate(r.publish_at) : ""].filter(Boolean).join(" · "),
    state: (r, now) => (r.archived ? "archived" : !r.is_open ? "closed" : isFuture(r.publish_at, now) ? "scheduled" : "on"),
    isOn: (r) => !!r.is_open,
    switchText: (r) => (r.is_open ? "Aberta" : "Fechada"),
    toggle: (r) => ({ is_open: !r.is_open }),
    fields: [
      { key: "title", label: "Cargo", type: "text", section: "Básico", placeholder: "Ex.: Designer Gráfico Pleno" },
      { key: "department", label: "Área", type: "text", section: "Básico", half: true, placeholder: "Ex.: Criação" },
      { key: "location", label: "Local", type: "text", section: "Básico", half: true, placeholder: "Ex.: São Paulo, SP" },
      { key: "work_model", label: "Modelo de trabalho", type: "select", section: "Básico", options: [["Remoto", "Remoto"], ["Híbrido", "Híbrido"], ["Presencial", "Presencial"]] },
      { key: "description", label: "Descrição", type: "textarea", section: "Detalhes", placeholder: "Conte sobre a vaga e o time" },
      { key: "responsibilities", label: "Responsabilidades", type: "list", hint: "Um item por linha", section: "Detalhes", placeholder: "Uma responsabilidade por linha" },
      { key: "requirements", label: "Requisitos", type: "list", hint: "Um item por linha", section: "Detalhes", placeholder: "Um requisito por linha" },
      { key: "publish_at", label: "Abrir em (opcional)", type: "datetime", hint: "Deixe vazio para aparecer na hora. Com data futura, a vaga só aparece a partir dela.", section: "Publicação" },
      { key: "is_open", label: "Vaga aberta", type: "switch", section: "Publicação" },
    ],
    toForm: (r) => ({
      title: r.title ?? "",
      department: r.department ?? "",
      location: r.location ?? "",
      work_model: r.work_model || "Remoto",
      description: r.description ?? "",
      responsibilities: (r.responsibilities ?? []).join("\n"),
      requirements: (r.requirements ?? []).join("\n"),
      publish_at: toLocalInput(r.publish_at),
      is_open: r.id ? !!r.is_open : false,
    }),
    toPayload: (v) => ({
      title: v.title.trim(),
      department: v.department.trim(),
      location: v.location.trim(),
      work_model: v.work_model,
      description: v.description.trim(),
      responsibilities: lines(v.responsibilities),
      requirements: lines(v.requirements),
      is_open: !!v.is_open,
      publish_at: v.publish_at ? new Date(v.publish_at).toISOString() : null,
    }),
  },

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
      { key: "published", label: "Publicada no site", type: "switch", section: "Publicação" },
    ],
    toForm: (r) => ({
      title: r.title ?? "",
      description: r.description ?? "",
      category: r.category ?? "",
      image: r.image ?? "",
      benefits: (r.benefits ?? []).join("\n"),
      file_url: r.file_url ?? "",
      file_name: r.file_name ?? "",
      published: r.id ? !!r.published : false,
    }),
    toPayload: (v) => ({
      title: v.title.trim(),
      description: v.description.trim(),
      category: v.category.trim(),
      benefits: lines(v.benefits),
      published: !!v.published,
      ...(v.image.trim() ? { image: v.image.trim() } : {}),
      ...(v.file_url.trim() ? { file_url: v.file_url.trim(), ...(v.file_name ? { file_name: v.file_name } : {}) } : {}),
    }),
  },
};

// ---------------------------------------------------------------------------
// Acesso aos dados (via /api/admin/v1 → API da Guará)
// ---------------------------------------------------------------------------

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

function apiStore(path: "/posts" | "/jobs" | "/tools", enrich?: (rows: Row[]) => Promise<Row[]>): Store {
  return {
    // status=all inclui os arquivados; o painel filtra na tela.
    async list() {
      const rows = await fetchAllPages(`${path}?status=all`);
      return enrich ? enrich(rows) : rows;
    },
    async create(payload) {
      await adminApi(path, { method: "POST", body: payload });
    },
    async update(id, payload) {
      await adminApi(`${path}/${encodeURIComponent(id)}`, { method: "PATCH", body: payload });
    },
    async remove(id) {
      await adminApi(`${path}/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    async archive(id, next) {
      await adminApi(`${path}/${encodeURIComponent(id)}`, { method: "PATCH", body: { archived: next } });
    },
  };
}

// Quantos downloads cada ferramenta teve (a API não devolve isso na lista).
async function withDownloads(tools: Row[]): Promise<Row[]> {
  try {
    const downloads = await fetchAllPages("/tool_downloads");
    const by: Record<string, number> = {};
    for (const d of downloads) if (d.tool_slug) by[d.tool_slug] = (by[d.tool_slug] ?? 0) + 1;
    return tools.map((t) => ({ ...t, _downloads: by[t.slug] ?? 0 }));
  } catch {
    return tools;
  }
}

export const STORES: Record<Kind, Store> = {
  posts: apiStore("/posts"),
  jobs: apiStore("/jobs"),
  tools: apiStore("/tools", withDownloads),
};

/** Mensagem pra mostrar na tela quando uma chamada falha. */
export function errorMessage(e: unknown, fallback = "Não foi possível salvar."): string {
  if (!(e instanceof AdminApiError)) return fallback;
  const d = e.details as any;
  // Dados inválidos (400): mostra o primeiro campo com problema
  const field = d?.fieldErrors && Object.entries(d.fieldErrors as Record<string, string[]>)[0];
  if (field) return `${e.message} — ${field[0]}: ${field[1]?.[0] ?? "valor inválido"}`;
  // Imagem com problema (422): mostra o motivo
  const img = Array.isArray(d) ? d[0] : Array.isArray(d?.images) ? d.images[0] : null;
  if (img?.problem) return `${e.message} ${img.problem}`;
  return e.message || fallback;
}

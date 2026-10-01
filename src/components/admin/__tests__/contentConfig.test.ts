import { describe, it, expect, vi, beforeEach } from "vitest";

const insert = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({ insert }), auth: { getSession: async () => ({ data: { session: null } }) } },
}));

import { CONFIG, STORES, errorMessage, toHtml, type Row } from "../contentConfig";

const NOW = new Date("2026-10-01T15:00:00Z");
const past = "2026-09-01T12:00:00Z";
const future = "2026-11-01T12:00:00Z";

beforeEach(() => insert.mockReset());

describe("posts — estado e agendamento (regra do site: published e scheduled_at vazio/passado)", () => {
  const st = (r: Row) => CONFIG.posts.state(r, NOW);
  it("classifica rascunho, publicado, agendado e arquivado", () => {
    expect(st({ status: "draft" })).toBe("draft");
    expect(st({ status: "published", scheduled_at: null })).toBe("on");
    expect(st({ status: "published", scheduled_at: past })).toBe("on");
    expect(st({ status: "published", scheduled_at: future })).toBe("scheduled");
    expect(st({ status: "published", archived: true })).toBe("archived");
  });
  it("o interruptor alterna published/draft", () => {
    expect(CONFIG.posts.toggle({ status: "published" })).toEqual({ status: "draft" });
    expect(CONFIG.posts.toggle({ status: "draft" })).toEqual({ status: "published" });
  });
  it("data futura vira scheduled_at; data passada não agenda nada", () => {
    const base = CONFIG.posts.toForm({});
    const fut = CONFIG.posts.toPayload({ ...base, title: "A", published_at: "2999-01-01T10:00", _on: true }, true);
    expect(fut.scheduled_at).toBe(new Date("2999-01-01T10:00").toISOString());
    expect(fut.status).toBe("published");
    const old = CONFIG.posts.toPayload({ ...base, title: "A", published_at: "2020-01-01T10:00", _on: true }, true);
    expect(old.scheduled_at).toBeNull();
  });
  it("novo post: slug nasce do título e é marcado como automático; slug digitado vence", () => {
    const base = CONFIG.posts.toForm({});
    const auto = CONFIG.posts.toPayload({ ...base, title: "5 Tendências de Marketing!" }, true);
    expect(auto.slug).toBe("5-tendencias-de-marketing");
    expect(auto._autoSlug).toBe(true);
    const typed = CONFIG.posts.toPayload({ ...base, title: "Qualquer", slug: "Meu Link" }, true);
    expect(typed.slug).toBe("meu-link");
    expect(typed._autoSlug).toBeUndefined();
  });
  it("editar não mexe no slug se ele ficou em branco; calcula tempo de leitura e limpa tags", () => {
    const base = CONFIG.posts.toForm({ id: "1", title: "T", slug: "" });
    const p = CONFIG.posts.toPayload({ ...base, title: "T", tags: " ia , seo,, ", content: "<p>" + "palavra ".repeat(400) + "</p>" }, false);
    expect("slug" in p).toBe(false);
    expect(p.tags).toEqual(["ia", "seo"]);
    expect(p.reading_time).toBe(2);
  });
  it("novo post nasce como rascunho (não publica sem querer)", () => {
    expect(CONFIG.posts.toForm({})._on).toBe(false);
  });
});

describe("vagas — status draft/open/closed", () => {
  const st = (r: Row) => CONFIG.jobs.state(r, NOW);
  it("estados e interruptor", () => {
    expect(st({ status: "draft" })).toBe("draft");
    expect(st({ status: "closed" })).toBe("closed");
    expect(st({ status: "open", scheduled_at: null })).toBe("on");
    expect(st({ status: "open", scheduled_at: future })).toBe("scheduled");
    expect(CONFIG.jobs.toggle({ status: "open" })).toEqual({ status: "closed" });
    expect(CONFIG.jobs.toggle({ status: "closed" })).toEqual({ status: "open" });
    expect(CONFIG.jobs.toggle({ status: "draft" })).toEqual({ status: "open" });
  });
  it("payload usa os valores do enum e não escreve is_open (um trigger sincroniza)", () => {
    const f = CONFIG.jobs.toForm({});
    const p = CONFIG.jobs.toPayload({ ...f, title: " Designer ", work_model: "híbrido", status: "open", requirements: "a\n\n b \n", scheduled_at: "" }, true);
    expect(p).toMatchObject({ title: "Designer", work_model: "híbrido", status: "open", requirements: ["a", "b"], scheduled_at: null });
    expect("is_open" in p).toBe(false);
  });
  it("o select de modelo só oferece valores do enum do banco", () => {
    const opts = CONFIG.jobs.fields.find((x) => x.key === "work_model")!.options!.map(([v]) => v);
    expect(opts).toEqual(["remoto", "híbrido", "presencial"]);
  });
});

describe("ferramentas — a API é estrita (image/file_url não aceitam null)", () => {
  it("omite imagem e arquivo vazios em vez de mandar null", () => {
    const p = CONFIG.tools.toPayload({ ...CONFIG.tools.toForm({}), title: "Checklist" }, true);
    expect(p).toEqual({ title: "Checklist", description: "", category: "", benefits: [], published: false });
  });
  it("manda file_name junto com file_url, e só com ele", () => {
    const f = CONFIG.tools.toForm({});
    const withFile = CONFIG.tools.toPayload({ ...f, title: "X", file_url: "https://x.co/a.pdf", file_name: "a.pdf", image: "https://x.co/i.jpg" }, true);
    expect(withFile).toMatchObject({ file_url: "https://x.co/a.pdf", file_name: "a.pdf", image: "https://x.co/i.jpg" });
    const orphanName = CONFIG.tools.toPayload({ ...f, title: "X", file_name: "a.pdf" }, true);
    expect("file_name" in orphanName).toBe(false);
  });
  it("subtítulo mostra downloads e estado reflete published/archived", () => {
    expect(CONFIG.tools.sub({ category: "Planilhas", file_name: "a.xlsx", _downloads: 3 })).toBe("Planilhas · a.xlsx · 3 download(s)");
    expect(CONFIG.tools.state({ published: true }, NOW)).toBe("on");
    expect(CONFIG.tools.state({ published: false }, NOW)).toBe("draft");
    expect(CONFIG.tools.state({ published: true, archived: true }, NOW)).toBe("archived");
  });
});

describe("rótulo do interruptor acompanha o estado da linha", () => {
  it("posts, vagas e ferramentas", () => {
    expect(CONFIG.posts.switchText({ status: "published" })).toBe("Publicado");
    expect(CONFIG.posts.switchText({ status: "draft" })).toBe("Rascunho");
    expect(CONFIG.jobs.switchText({ status: "open" })).toBe("Aberta");
    expect(CONFIG.jobs.switchText({ status: "closed" })).toBe("Fechada");
    expect(CONFIG.jobs.switchText({ status: "draft" })).toBe("Rascunho");
    expect(CONFIG.tools.switchText({ published: true })).toBe("Publicada");
    expect(CONFIG.tools.switchText({ published: false })).toBe("Rascunho");
  });
});

describe("toHtml", () => {
  it("texto puro vira parágrafos; HTML passa intacto", () => {
    expect(toHtml("um\n\ndois\nlinha")).toBe("<p>um</p><p>dois<br>linha</p>");
    expect(toHtml("<h2>Oi</h2><p>x</p>")).toBe("<h2>Oi</h2><p>x</p>");
  });
});

describe("gravação de posts no Supabase", () => {
  const payload = { title: "T", slug: "meu-post", _autoSlug: true };
  it("slug automático duplicado tenta de novo com sufixo e não vaza o campo interno", async () => {
    insert.mockResolvedValueOnce({ error: { code: "23505" } }).mockResolvedValueOnce({ error: null });
    await STORES.posts.create({ ...payload });
    expect(insert).toHaveBeenCalledTimes(2);
    expect(insert.mock.calls[0]![0]).toEqual({ title: "T", slug: "meu-post" });
    expect(insert.mock.calls[1]![0].slug).toMatch(/^meu-post-[a-z0-9]+$/);
    expect("_autoSlug" in insert.mock.calls[1]![0]).toBe(false);
  });
  it("slug digitado à mão que já existe falha sem alterar o que a pessoa escreveu", async () => {
    insert.mockResolvedValue({ error: { code: "23505" } });
    await expect(STORES.posts.create({ title: "T", slug: "meu-post" })).rejects.toMatchObject({ code: "23505" });
    expect(insert).toHaveBeenCalledTimes(1);
  });
  it("outros erros do banco não são engolidos", async () => {
    insert.mockResolvedValue({ error: { code: "42501", message: "rls" } });
    await expect(STORES.posts.create({ ...payload })).rejects.toMatchObject({ code: "42501" });
    expect(insert).toHaveBeenCalledTimes(1);
  });
});

describe("errorMessage", () => {
  it("traduz os erros que a pessoa consegue resolver", () => {
    expect(errorMessage({ code: "23505" })).toMatch(/endereço \(slug\)/);
    expect(errorMessage({ code: "42501" })).toMatch(/permissão/);
    expect(errorMessage(new Error("boom"), "Falhou.")).toBe("Falhou.");
  });
});

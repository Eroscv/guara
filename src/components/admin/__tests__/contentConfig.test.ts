import { describe, it, expect, vi, beforeEach } from "vitest";

// Chamadas à API são simuladas; o que importa aqui é o que o painel manda e como interpreta.
vi.mock("../helpers", async (orig) => ({ ...(await orig<typeof import("../helpers")>()), adminApi: vi.fn() }));

import { adminApi, AdminApiError } from "../helpers";
import { CONFIG, STORES, errorMessage, fetchAllPages, toHtml, type Row } from "../contentConfig";

const api = vi.mocked(adminApi);
const NOW = new Date("2026-10-01T15:00:00Z");
const past = "2026-09-01T12:00:00Z";
const future = "2026-11-01T12:00:00Z";

// chaves: mockReset() devolve o próprio mock, e o vitest chamaria esse retorno como função de limpeza
beforeEach(() => {
  api.mockReset();
});

describe("posts — publicado, agendado e arquivado (published, published_at, archived)", () => {
  const st = (r: Row) => CONFIG.posts.state(r, NOW);
  it("classifica cada estado", () => {
    expect(st({ published: false })).toBe("draft");
    expect(st({ published: true, published_at: past })).toBe("on");
    expect(st({ published: true, published_at: future })).toBe("scheduled");
    expect(st({ published: true, published_at: past, archived: true })).toBe("archived");
    expect(st({ published: false, published_at: future })).toBe("draft"); // rascunho com data futura continua rascunho
  });
  it("interruptor liga/desliga só o published; rótulo acompanha", () => {
    expect(CONFIG.posts.toggle({ published: true })).toEqual({ published: false });
    expect(CONFIG.posts.toggle({ published: false })).toEqual({ published: true });
    expect(CONFIG.posts.switchText({ published: true })).toBe("Publicado");
    expect(CONFIG.posts.switchText({ published: false })).toBe("Rascunho");
  });
  it("payload no contrato do manual: data em ISO, tags limpas, sem capa vazia, slug só ao criar", () => {
    const f = CONFIG.posts.toForm({});
    const novo = CONFIG.posts.toPayload({ ...f, title: " 5 Tendências ", tags: " ia , seo,, ", content: "<p>oi</p>", published: true, published_at: "2999-01-01T10:00", slug: "Meu Link" }, true);
    expect(novo).toMatchObject({ title: "5 Tendências", tags: ["ia", "seo"], published: true, slug: "meu-link", published_at: new Date("2999-01-01T10:00").toISOString() });
    expect("cover_image" in novo).toBe(false);
    expect("scheduled_at" in novo).toBe(false);
    const edit = CONFIG.posts.toPayload({ ...f, title: "T", content: "<p>x</p>", slug: "outro", cover_image: " https://x.co/c.jpg " }, false);
    expect("slug" in edit).toBe(false); // a API não altera o slug depois
    expect(edit.cover_image).toBe("https://x.co/c.jpg");
  });
  it("slug em branco ao criar não é enviado (a API gera pelo título)", () => {
    const p = CONFIG.posts.toPayload({ ...CONFIG.posts.toForm({}), title: "T", content: "<p>x</p>" }, true);
    expect("slug" in p).toBe(false);
  });
  it("exige texto no post (content é obrigatório na API), mas aceita só imagem", () => {
    const v = (content: string) => CONFIG.posts.validate!({ ...CONFIG.posts.toForm({}), content });
    expect(v("")).toMatch(/Escreva o texto/);
    expect(v("<p><br></p>")).toMatch(/Escreva o texto/);
    expect(v("<p>&nbsp;</p>")).toMatch(/Escreva o texto/);
    expect(v("<p>oi</p>")).toBeNull();
    expect(v('<img src="https://x.co/a.jpg">')).toBeNull();
  });
  it("novo post nasce como rascunho (não publica sem querer)", () => {
    expect(CONFIG.posts.toForm({}).published).toBe(false);
  });
});

describe("vagas — is_open e publish_at", () => {
  const st = (r: Row) => CONFIG.jobs.state(r, NOW);
  it("estados e interruptor", () => {
    expect(st({ is_open: false })).toBe("closed");
    expect(st({ is_open: true, publish_at: null })).toBe("on");
    expect(st({ is_open: true, publish_at: future })).toBe("scheduled");
    expect(st({ is_open: true, archived: true })).toBe("archived");
    expect(CONFIG.jobs.toggle({ is_open: true })).toEqual({ is_open: false });
    expect(CONFIG.jobs.switchText({ is_open: false })).toBe("Fechada");
  });
  it("publish_at vazio vai como null ('aparece na hora', como no manual)", () => {
    const f = CONFIG.jobs.toForm({});
    const p = CONFIG.jobs.toPayload({ ...f, title: " Designer ", work_model: "Híbrido", is_open: true, requirements: "a\n\n b \n", publish_at: "" }, true);
    expect(p).toMatchObject({ title: "Designer", work_model: "Híbrido", is_open: true, requirements: ["a", "b"], publish_at: null });
    const agendada = CONFIG.jobs.toPayload({ ...f, title: "X", publish_at: "2999-01-01T08:00" }, true);
    expect(agendada.publish_at).toBe(new Date("2999-01-01T08:00").toISOString());
  });
  it("nova vaga nasce fechada", () => {
    expect(CONFIG.jobs.toForm({}).is_open).toBe(false);
  });
});

describe("ferramentas — a API não aceita null em image/file_url", () => {
  it("omite imagem e arquivo vazios", () => {
    const p = CONFIG.tools.toPayload({ ...CONFIG.tools.toForm({}), title: "Checklist" }, true);
    expect(p).toEqual({ title: "Checklist", description: "", category: "", benefits: [], published: false });
  });
  it("manda file_name junto com file_url, e só com ele", () => {
    const f = CONFIG.tools.toForm({});
    expect(CONFIG.tools.toPayload({ ...f, title: "X", file_url: "https://x.co/a.pdf", file_name: "a.pdf", image: "https://x.co/i.jpg" }, true)).toMatchObject({ file_url: "https://x.co/a.pdf", file_name: "a.pdf", image: "https://x.co/i.jpg" });
    expect("file_name" in CONFIG.tools.toPayload({ ...f, title: "X", file_name: "a.pdf" }, true)).toBe(false);
  });
  it("subtítulo mostra downloads; estado reflete published/archived", () => {
    expect(CONFIG.tools.sub({ category: "Planilhas", file_name: "a.xlsx", _downloads: 3 })).toBe("Planilhas · a.xlsx · 3 download(s)");
    expect(CONFIG.tools.state({ published: true }, NOW)).toBe("on");
    expect(CONFIG.tools.state({ published: false }, NOW)).toBe("draft");
    expect(CONFIG.tools.state({ published: true, archived: true }, NOW)).toBe("archived");
  });
});

describe("toHtml", () => {
  it("texto puro vira parágrafos; HTML passa intacto", () => {
    expect(toHtml("um\n\ndois\nlinha")).toBe("<p>um</p><p>dois<br>linha</p>");
    expect(toHtml("<h2>Oi</h2><p>x</p>")).toBe("<h2>Oi</h2><p>x</p>");
  });
});

describe("acesso aos dados (/api/admin/v1)", () => {
  it("fetchAllPages pagina de 200 em 200 até juntar o count", async () => {
    const page = (n: number, from: number) => ({ data: Array.from({ length: n }, (_, i) => ({ id: from + i })), count: 250 });
    api.mockResolvedValueOnce(page(200, 0)).mockResolvedValueOnce(page(50, 200));
    const rows = await fetchAllPages("/leads");
    expect(rows).toHaveLength(250);
    expect(api.mock.calls.map((c) => c[0])).toEqual(["/leads?limit=200&offset=0", "/leads?limit=200&offset=200"]);
  });
  it("para quando a página vem vazia (nunca fica em loop)", async () => {
    api.mockResolvedValue({ data: [], count: 999 });
    expect(await fetchAllPages("/leads")).toEqual([]);
    expect(api).toHaveBeenCalledTimes(1);
  });
  it("lista de posts pede status=all (inclui arquivados); escreve nos endereços e métodos certos", async () => {
    api.mockResolvedValue({ data: [{ id: "p1" }], count: 1 });
    await STORES.posts.list();
    expect(api).toHaveBeenLastCalledWith("/posts?status=all&limit=200&offset=0");

    api.mockResolvedValue({});
    await STORES.posts.create({ title: "T" });
    expect(api).toHaveBeenLastCalledWith("/posts", { method: "POST", body: { title: "T" } });
    await STORES.jobs.update("j 1", { is_open: false });
    expect(api).toHaveBeenLastCalledWith("/jobs/j%201", { method: "PATCH", body: { is_open: false } });
    await STORES.tools.archive("t1", true);
    expect(api).toHaveBeenLastCalledWith("/tools/t1", { method: "PATCH", body: { archived: true } });
    await STORES.posts.remove("p1");
    expect(api).toHaveBeenLastCalledWith("/posts/p1", { method: "DELETE" });
  });
  it("ferramentas ganham a contagem de downloads por slug", async () => {
    api.mockImplementation(async (...args: unknown[]) => {
      return String(args[0]).startsWith("/tools")
        ? { data: [{ id: "t1", slug: "checklist" }, { id: "t2", slug: "planilha" }], count: 2 }
        : { data: [{ tool_slug: "checklist" }, { tool_slug: "checklist" }, { tool_slug: "outra" }, {}], count: 4 };
    });
    const tools = await STORES.tools.list();
    expect(tools.map((t) => t._downloads)).toEqual([2, 0]);
  });
  it("se os downloads falham, a lista de ferramentas ainda aparece", async () => {
    api.mockImplementation(async (...args: unknown[]) => {
      if (String(args[0]).startsWith("/tools")) return { data: [{ id: "t1", slug: "a" }], count: 1 };
      throw new AdminApiError(500, "falhou");
    });
    expect((await STORES.tools.list())[0]).toMatchObject({ id: "t1" });
  });
});

describe("errorMessage", () => {
  it("mostra o primeiro campo inválido, o motivo da imagem ou a mensagem da API", () => {
    expect(errorMessage(new AdminApiError(400, "Dados inválidos", { formErrors: [], fieldErrors: { title: ["Required"] } }))).toBe("Dados inválidos — title: Required");
    expect(errorMessage(new AdminApiError(422, "Imagem com problema.", { images: [{ field: "cover_image", problem: "Arquivo maior que 15MB." }] }))).toBe("Imagem com problema. Arquivo maior que 15MB.");
    expect(errorMessage(new AdminApiError(409, "Slug já existe."))).toBe("Slug já existe.");
    expect(errorMessage(new Error("boom"), "Falhou.")).toBe("Falhou.");
  });
});

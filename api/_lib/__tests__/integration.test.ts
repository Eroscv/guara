import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createHash, randomBytes } from "node:crypto";
import { sql } from "../db";
import handler from "../../public/v1/[...route]";

const KEY = `gm_${randomBytes(20).toString("hex")}`;
const HASH = createHash("sha256").update(KEY).digest("hex");

// req/res mínimos, no formato que a função Vercel recebe
async function call(method: string, path: string, opts: { body?: unknown; key?: string | null } = {}) {
  const [pathname, query = ""] = path.split("?");
  const route = pathname.replace(/^\/+/, "").split("/");
  const headers: Record<string, string> = { host: "guara-wheat.vercel.app" };
  if (opts.key !== null) headers.authorization = `Bearer ${opts.key ?? KEY}`;
  const req: any = { method, url: `/api/public/v1/${pathname}${query ? "?" + query : ""}`, headers, query: { route }, body: opts.body };
  let status = 0; let json: any;
  const res: any = {
    setHeader() {}, end() {},
    status(c: number) { status = c; return res; },
    json(b: unknown) { json = b; return res; },
  };
  await handler(req, res);
  return { status, json };
}

describe.skipIf(!process.env.POSTGRES_URL)("API v1 contra o Postgres real (roda só com POSTGRES_URL definida)", () => {
  beforeAll(async () => {
    await sql`insert into api_keys (name, key_prefix, key_hash) values ('teste-integracao', ${KEY.slice(0, 12)}, ${HASH})`;
  });
  afterAll(async () => {
    await sql`delete from tools where slug like 'teste-integracao%'`;
    await sql`delete from newsletter where email like 'teste-integracao%'`;
    await sql`delete from tool_downloads where tool_slug like 'teste-integracao%'`;
    await sql`delete from api_keys where key_hash = ${HASH}`;
  });

  it("401 sem chave, com chave errada e com chave sem prefixo gm_", async () => {
    expect((await call("GET", "tools", { key: null })).status).toBe(401);
    expect((await call("GET", "tools", { key: "gm_" + "0".repeat(40) })).status).toBe(401);
    expect((await call("GET", "tools", { key: "abc" })).status).toBe(401);
  });

  it("chave válida lista ferramentas e atualiza last_used_at", async () => {
    const r = await call("GET", "ferramentas");
    expect(r.status).toBe(200);
    expect(r.json).toMatchObject({ limit: 50, offset: 0 });
    await new Promise((r) => setTimeout(r, 400));
    const { rows } = await sql`select last_used_at from api_keys where key_hash = ${HASH}`;
    expect(rows[0].last_used_at).not.toBeNull();
  });

  it("POST /tools cria com slug automático e 201", async () => {
    const r = await call("POST", "tools", { body: { title: "Teste Integração Checklist", description: "d", category: "Teste", benefits: ["a", "b"], published: true, file_url: "https://example.com/x.pdf", file_name: "x.pdf" } });
    expect(r.status).toBe(201);
    expect(r.json.slug).toBe("teste-integracao-checklist");
    expect(r.json.benefits).toEqual(["a", "b"]);
    expect(r.json.published).toBe(true);
    expect(r.json.file_url).toBe("https://example.com/x.pdf");
  });

  it("título repetido sem slug gera sufixo -2; slug explícito repetido dá 409", async () => {
    const auto = await call("POST", "tools", { body: { title: "Teste Integração Checklist" } });
    expect(auto.status).toBe(201);
    expect(auto.json.slug).toBe("teste-integracao-checklist-2");
    const dup = await call("POST", "tools", { body: { title: "Outro", slug: "teste-integracao-checklist" } });
    expect(dup.status).toBe(409);
  });

  it("campo desconhecido e título ausente dão 400 no formato do manual", async () => {
    const r = await call("POST", "tools", { body: { title: "x", cor_favorita: "azul" } });
    expect(r.status).toBe(400);
    expect(r.json.error).toBe("Dados inválidos");
    expect(r.json.details).toHaveProperty("formErrors");
    const r2 = await call("POST", "tools", { body: { description: "sem título" } });
    expect(r2.status).toBe(400);
    expect(r2.json.details.fieldErrors.title).toBeTruthy();
  });

  it("GET por slug, filtro de busca, status e paginação", async () => {
    const one = await call("GET", "ferramentas/teste-integracao-checklist");
    expect(one.status).toBe(200);
    const q = await call("GET", "tools?q=Integração&status=published");
    expect(q.json.data.map((t: any) => t.slug)).toEqual(["teste-integracao-checklist"]);
    const draft = await call("GET", "tools?status=draft&q=Integração");
    expect(draft.json.data.map((t: any) => t.slug)).toEqual(["teste-integracao-checklist-2"]);
    expect((await call("GET", "tools?limit=999")).status).toBe(400);
    expect((await call("GET", "tools?status=inexistente")).status).toBe(400);
    expect((await call("GET", "tools/00000000-0000-0000-0000-000000000000")).status).toBe(404);
  });

  it("PATCH arquiva e desarquiva; DELETE apaga", async () => {
    const arch = await call("PATCH", "tools/teste-integracao-checklist".replace("teste-integracao-checklist", (await call("GET", "tools/teste-integracao-checklist")).json.id), { body: { archived: true } });
    expect(arch.status).toBe(200);
    expect(arch.json.archived).toBe(true);
    expect(arch.json.archived_at).not.toBeNull();
    const archived = await call("GET", "tools?status=archived&q=Integração");
    expect(archived.json.data).toHaveLength(1);
    const back = await call("PATCH", `tools/${arch.json.id}`, { body: { archived: false } });
    expect(back.json.archived).toBe(false);
    expect(back.json.archived_at).toBeNull();
    const del = await call("DELETE", `tools/${arch.json.id}`);
    expect(del.json).toEqual({ deleted: arch.json.id });
    expect((await call("GET", `tools/${arch.json.id}`)).status).toBe(404);
  });

  it("newsletter e tool_downloads: listar, abrir, alterar, apagar; criar não existe", async () => {
    const ins = await sql`insert into newsletter (email, pagina) values ('teste-integracao@example.com', '/blog') returning id`;
    const id = ins.rows[0].id;
    const list = await call("GET", "newsletter?limit=5");
    expect(list.status).toBe(200);
    expect(list.json.count).toBeGreaterThanOrEqual(1);
    expect((await call("GET", `newsletter/${id}`)).json.email).toBe("teste-integracao@example.com");
    const p = await call("PATCH", `newsletter/${id}`, { body: { pagina: "/home" } });
    expect(p.json.pagina).toBe("/home");
    expect((await call("PATCH", `newsletter/${id}`, { body: { email: "invalido" } })).status).toBe(400);
    expect((await call("POST", "newsletter", { body: { email: "a@b.com" } })).status).toBe(405);
    expect((await call("DELETE", `newsletter/${id}`)).json).toEqual({ deleted: id });

    const td = await sql`insert into tool_downloads (tool_slug, tool_title, nome, email) values ('teste-integracao-x', 'X', 'Maria', 'maria@example.com') returning id`;
    const tid = td.rows[0].id;
    expect((await call("GET", `tool_downloads/${tid}`)).json.nome).toBe("Maria");
    expect((await call("PATCH", `tool_downloads/${tid}`, { body: { cargo: "CMO" } })).json.cargo).toBe("CMO");
    expect((await call("DELETE", `tool_downloads/${tid}`)).status).toBe(200);
  });

  it("rota desconhecida 404 e método errado 405", async () => {
    expect((await call("GET", "banana")).status).toBe(404);
    expect((await call("DELETE", "tools")).status).toBe(405);
  });
});

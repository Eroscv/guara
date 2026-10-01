// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createServer, type Server, type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";

// A chave do cliente é conferida no Postgres; aqui ela é simulada pra o teste rodar sem banco.
vi.mock("../auth", () => ({ requireApiKey: async () => ({ id: "teste", name: "teste" }) }));

import { mapRoute, validateListQuery, normalizeError, normalizeItem, normalizeSummary, upstreamConfig } from "../upstream.js";
import handler from "../../public/v1/[...route].js";

const ok = (fn: () => unknown) => fn();
const err = (fn: () => unknown) => {
  try {
    fn();
  } catch (e: any) {
    return e;
  }
  throw new Error("esperava um erro");
};

describe("mapRoute (manual → caminhos da API de origem)", () => {
  it("ferramentas e vagas usam os nomes certos em cada método", () => {
    expect(mapRoute("GET", ["tools"]).path).toBe("/ferramentas");
    expect(mapRoute("GET", ["ferramentas", "abc"]).path).toBe("/ferramentas/abc");
    expect(mapRoute("POST", ["tools"]).path).toBe("/tools");
    expect(mapRoute("PATCH", ["tools", "abc"]).path).toBe("/tools/abc");
    expect(mapRoute("GET", ["jobs", "abc"]).path).toBe("/vagas/abc");
    expect(mapRoute("GET", ["vagas"]).path).toBe("/vagas");
    expect(mapRoute("DELETE", ["jobs", "abc"]).path).toBe("/jobs/abc");
    expect(mapRoute("GET", ["blog", "meu-post"]).path).toBe("/posts/meu-post");
  });
  it("cadastros não aceitam POST (405) e rota desconhecida é 404", () => {
    expect(err(() => mapRoute("POST", ["leads"])).status).toBe(405);
    expect(err(() => mapRoute("GET", ["banana"])).status).toBe(404);
    expect(err(() => mapRoute("GET", ["leads", "a", "b"])).status).toBe(404);
    expect(err(() => mapRoute("POST", ["summary"])).status).toBe(405);
  });
  it("recusa segmentos que tentam sair do caminho", () => {
    expect(err(() => mapRoute("GET", ["posts", ".."])).status).toBe(404);
    expect(err(() => mapRoute("GET", ["posts", "a/b"])).status).toBe(404);
    expect(err(() => mapRoute("GET", ["posts", "a?x=1"])).status).toBe(404);
  });
});

describe("validateListQuery (400 no formato do manual)", () => {
  const q = (s: string) => new URLSearchParams(s);
  it("aplica o padrão limit=50 e repassa só o que é conhecido", () => {
    const r = validateListQuery("posts", q("q=ia&category=Estratégia"));
    expect(r.limit).toBe(50);
    expect(r.forward.get("limit")).toBe("50");
    expect(r.forward.get("q")).toBe("ia");
  });
  it("limit fora de 1..200, offset negativo, since inválido, status e filtro inexistentes", () => {
    for (const s of ["limit=0", "limit=999", "limit=abc", "offset=-1", "since=ontem", "status=xx", "banana=1"]) {
      const e = err(() => validateListQuery("applications", q(s)));
      expect(e.status).toBe(400);
      expect(e.details.fieldErrors).toBeTruthy();
    }
    ok(() => validateListQuery("applications", q("status=novo&limit=200&since=2026-09-01T00:00:00Z")));
  });
  it("status e filtros são por recurso", () => {
    expect(err(() => validateListQuery("leads", q("status=novo"))).status).toBe(400);
    expect(err(() => validateListQuery("jobs", q("tag=x"))).status).toBe(400);
    ok(() => validateListQuery("jobs", q("status=open&department=Conteúdo")));
  });
});

describe("normalizeError", () => {
  it("422 do FastAPI vira 400 com fieldErrors", () => {
    const e = normalizeError(422, { detail: [{ loc: ["body", "title"], msg: "Field required", type: "missing" }] });
    expect(e.status).toBe(400);
    expect(e.message).toBe("Dados inválidos");
    expect((e.details as any).fieldErrors).toEqual({ title: ["Field required"] });
  });
  it("404, 409, 5xx e chave da origem recusada não vazam detalhe interno", () => {
    expect(normalizeError(404, { detail: "Not Found" }).message).toBe("Endereço ou item não encontrado.");
    expect(normalizeError(409, { detail: "Slug já existe." }).status).toBe(409);
    expect(normalizeError(502, {}).status).toBe(500);
    const k = normalizeError(401, { detail: "chave inválida" });
    expect(k.status).toBe(500);
    expect(k.message).toBe("Falha interna. Tente de novo.");
  });
  it("422 que não é validação (ex.: imagem) continua 422", () => {
    expect(normalizeError(422, { detail: { error: "1 imagem(ns) com problema.", details: { images: [] } } }).status).toBe(422);
  });
});

describe("normalizeItem / normalizeSummary", () => {
  it("post: read_time → reading_time", () => {
    expect(normalizeItem("posts", { id: "1", read_time: 4 })).toEqual({ id: "1", reading_time: 4 });
    expect(normalizeItem("jobs", { id: "1", read_time: 4 })).toEqual({ id: "1", read_time: 4 });
  });
  it("resumo no formato do manual", () => {
    const s = normalizeSummary({
      totais: { leads: 42, newsletter: 130, tool_downloads: 88, applications: 17, posts: 9 },
      ultimos_7_dias: { leads: 5, newsletter: 12, tool_downloads: 9, applications: 3 },
      candidaturas_por_status: { novo: 4, analise: 1, entrevista: 0, aprovado: 0, recusado: 0 },
      agendados: { posts: 1, vagas: 0 },
    });
    expect(s).toEqual({
      leads: { total: 42, last_7_days: 5 },
      newsletter: { total: 130, last_7_days: 12 },
      tool_downloads: { total: 88, last_7_days: 9 },
      applications: { total: 17, last_7_days: 3 },
      applications_pending: 4,
      scheduled_posts: 1,
      scheduled_jobs: 0,
    });
  });
});

// ------------------------------------------------------------------
// De ponta a ponta: o handler de verdade falando com um servidor de origem
// falso que imita a API FastAPI (lista pura, X-API-Key, erros em {detail}).
// ------------------------------------------------------------------
describe("proxy de ponta a ponta contra uma origem simulada", () => {
  let server: Server;
  const seen: { method: string; url: string; headers: IncomingMessage["headers"]; body: string }[] = [];
  const posts = Array.from({ length: 5 }, (_, i) => ({ id: `p${i + 1}`, title: `Post ${i + 1}`, slug: `post-${i + 1}`, read_time: 3 }));

  beforeAll(async () => {
    server = createServer((req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        seen.push({ method: req.method || "", url: req.url || "", headers: req.headers, body });
        const u = new URL(req.url || "/", "http://x");
        const send = (status: number, json: unknown) => {
          res.writeHead(status, { "Content-Type": "application/json" });
          res.end(JSON.stringify(json));
        };
        if (req.headers["x-api-key"] !== "chave-da-origem") return send(401, { detail: "Chave inválida" });
        if (u.pathname === "/summary") {
          return send(200, { totais: { leads: 7, newsletter: 1, tool_downloads: 2, applications: 3 }, ultimos_7_dias: { leads: 1, newsletter: 0, tool_downloads: 0, applications: 1 }, candidaturas_por_status: { novo: 2 }, agendados: { posts: 1, vagas: 0 } });
        }
        if (u.pathname === "/posts" && req.method === "GET") {
          const limit = Number(u.searchParams.get("limit") || 50);
          const offset = Number(u.searchParams.get("offset") || 0);
          return send(200, posts.slice(offset, offset + limit));
        }
        if (u.pathname === "/posts" && req.method === "POST") {
          const b = JSON.parse(body || "{}");
          if (!b.title) return send(422, { detail: [{ loc: ["body", "title"], msg: "Field required", type: "missing" }] });
          if (b.slug === "repetido") return send(409, { detail: "Slug já existe." });
          return send(200, { id: "novo", ...b, read_time: 1 });
        }
        if (u.pathname === "/vagas/v1") return send(200, { id: "v1", title: "Vaga" });
        if (u.pathname === "/jobs/v1" && req.method === "DELETE") return send(200, { ok: true });
        if (u.pathname === "/ferramentas") return send(200, []);
        return send(404, { detail: "Not Found" });
      });
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    process.env.GUARA_API_UPSTREAM = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
    process.env.GUARA_API_UPSTREAM_KEY = "chave-da-origem";
  });
  afterAll(async () => {
    delete process.env.GUARA_API_UPSTREAM;
    delete process.env.GUARA_API_UPSTREAM_KEY;
    await new Promise((r) => server.close(r));
  });

  async function call(method: string, path: string, body?: unknown) {
    const [pathname, query = ""] = path.split("?");
    const req: any = {
      method,
      url: `/api/public/v1/${pathname}${query ? "?" + query : ""}`,
      headers: { host: "guara-wheat.vercel.app", authorization: "Bearer gm_chave-do-cliente-que-nao-pode-vazar" },
      query: { route: pathname.split("/") },
      body,
    };
    let status = 0;
    let json: any;
    const res: any = { setHeader() {}, end() {}, status(c: number) { status = c; return res; }, json(b: unknown) { json = b; return res; } };
    await handler(req, res);
    return { status, json };
  }

  it("config: barra final da URL é removida e a chave é obrigatória", () => {
    expect(upstreamConfig()?.base).not.toMatch(/\/$/);
    const saved = process.env.GUARA_API_UPSTREAM_KEY;
    delete process.env.GUARA_API_UPSTREAM_KEY;
    expect(err(() => upstreamConfig()).status).toBe(500);
    process.env.GUARA_API_UPSTREAM_KEY = saved;
  });

  it("lista vira envelope do manual com count exato (paginando o resto) e nunca vaza a chave do cliente", async () => {
    seen.length = 0;
    const r = await call("GET", "blog?limit=2");
    expect(r.status).toBe(200);
    expect(r.json.data.map((p: any) => p.slug)).toEqual(["post-1", "post-2"]);
    expect(r.json).toMatchObject({ count: 5, limit: 2, offset: 0 });
    expect(r.json.has_more).toBeUndefined();
    expect(r.json.data[0].reading_time).toBe(3);
    expect(r.json.data[0].read_time).toBeUndefined();
    for (const s of seen) {
      expect(s.headers["x-api-key"]).toBe("chave-da-origem");
      expect(s.headers["authorization"]).toBeUndefined();
    }
  });

  it("última página: count = offset + itens", async () => {
    const r = await call("GET", "posts?limit=10&offset=3");
    expect(r.json).toMatchObject({ count: 5, limit: 10, offset: 3 });
    expect(r.json.data).toHaveLength(2);
  });

  it("limit inválido dá 400 sem nem chamar a origem", async () => {
    seen.length = 0;
    const r = await call("GET", "posts?limit=999");
    expect(r.status).toBe(400);
    expect(r.json.details.fieldErrors.limit).toBeTruthy();
    expect(seen).toHaveLength(0);
  });

  it("POST: 422 de validação vira 400; 409 e sucesso viram 409/201 com reading_time", async () => {
    const bad = await call("POST", "posts", { content: "x" });
    expect(bad.status).toBe(400);
    expect(bad.json.details.fieldErrors.title).toEqual(["Field required"]);
    expect((await call("POST", "posts", { title: "x", slug: "repetido" })).status).toBe(409);
    const good = await call("POST", "posts", { title: "Novo" });
    expect(good.status).toBe(201);
    expect(good.json.reading_time).toBe(1);
  });

  it("vaga: GET usa /vagas/{id}; DELETE usa /jobs/{id} e responde {deleted}", async () => {
    expect((await call("GET", "jobs/v1")).json.title).toBe("Vaga");
    expect((await call("DELETE", "jobs/v1")).json).toEqual({ deleted: "v1" });
  });

  it("summary traduzido, 404 no formato do manual, rota desconhecida e método errado", async () => {
    const s = await call("GET", "summary");
    expect(s.json.leads).toEqual({ total: 7, last_7_days: 1 });
    expect(s.json.applications_pending).toBe(2);
    expect((await call("GET", "posts/nao-existe")).json).toEqual({ error: "Endereço ou item não encontrado." });
    expect((await call("GET", "banana")).status).toBe(404);
    expect((await call("POST", "leads", {})).status).toBe(405);
  });

  it("origem com a chave errada não vira 401 pro cliente (é erro nosso: 500 genérico)", async () => {
    const saved = process.env.GUARA_API_UPSTREAM_KEY;
    process.env.GUARA_API_UPSTREAM_KEY = "errada";
    const r = await call("GET", "ferramentas");
    process.env.GUARA_API_UPSTREAM_KEY = saved;
    expect(r.status).toBe(500);
    expect(r.json.error).toBe("Falha interna. Tente de novo.");
  });
});

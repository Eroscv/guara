// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Quem chama é validado pela sessão do Supabase; aqui só interessa se o token veio.
vi.mock("../requireAdmin", async () => {
  const { ApiError } = await import("../errors");
  return {
    requireAdmin: vi.fn(async (req: any) => {
      if (!req.headers.authorization) throw new ApiError(401, "Não autenticado.");
      if (req.headers.authorization === "Bearer comum") throw new ApiError(403, "Apenas administradores podem acessar isto.");
      return { id: "u1", email: "eros@guaramedia.com.br" };
    }),
  };
});

vi.mock("../db", () => ({
  assertPostgresConfigured: () => {},
  sql: vi.fn(async () => ({ rows: [{ total: 12, week: 5, prev: 2 }] })),
}));

vi.mock("../resources/newsletter", () => ({
  listNewsletter: vi.fn(async (o: any) => ({ data: [{ id: "n1", email: "a@b.com" }], count: 1, ...o })),
  deleteNewsletter: vi.fn(async (id: string) => ({ deleted: id })),
}));
vi.mock("../resources/toolDownloads", () => ({
  listToolDownloads: vi.fn(async (o: any) => ({ data: [], count: 0, ...o })),
  deleteToolDownload: vi.fn(async (id: string) => ({ deleted: id })),
}));
vi.mock("../resources/tools", () => ({
  listTools: vi.fn(async (o: any) => ({ data: [], count: 0, ...o })),
  getTool: vi.fn(async (id: string) => ({ id })),
  createTool: vi.fn(async (b: any, host: string | null) => ({ id: "t1", ...b, host })),
  patchTool: vi.fn(async (id: string, b: any) => ({ id, ...b })),
  deleteTool: vi.fn(async (id: string) => ({ deleted: id })),
}));

import handler from "../../admin/v1/[...route].js";
import { sql } from "../db.js";
import { listTools } from "../resources/tools.js";

type Call = { method?: string; route?: string[]; url?: string; auth?: string | null; body?: unknown };

async function call({ method = "GET", route = [], url, auth = "Bearer admin", body }: Call) {
  const req: any = {
    method,
    query: { route },
    url: url ?? `/api/admin/v1/${route.join("/")}`,
    headers: { host: "guara.test", ...(auth ? { authorization: auth } : {}) },
    body,
  };
  let status = 0;
  let json: any;
  const res: any = {
    status(n: number) { status = n; return res; },
    json(j: unknown) { json = j; return res; },
    setHeader() {},
    end() {},
  };
  await handler(req, res);
  return { status, json };
}

beforeEach(() => vi.clearAllMocks());

describe("/api/admin/v1 — autorização", () => {
  it("sem token é 401 e com conta que não é admin é 403", async () => {
    expect((await call({ route: ["newsletter"], auth: null })).status).toBe(401);
    expect((await call({ route: ["tools"], auth: "Bearer comum" })).status).toBe(403);
  });
});

describe("/api/admin/v1 — newsletter e downloads", () => {
  it("lista com paginação e apaga por id", async () => {
    const list = await call({ route: ["newsletter"], url: "/api/admin/v1/newsletter?limit=200&offset=200" });
    expect(list.status).toBe(200);
    expect(list.json).toMatchObject({ limit: 200, offset: 200, count: 1 });

    const del = await call({ method: "DELETE", route: ["newsletter", "abc"] });
    expect(del.json).toEqual({ deleted: "abc" });
    expect((await call({ method: "DELETE", route: ["tool_downloads", "xyz"] })).json).toEqual({ deleted: "xyz" });
  });
  it("não deixa criar nem editar cadastro por aqui (405)", async () => {
    expect((await call({ method: "POST", route: ["newsletter"], body: {} })).status).toBe(405);
    expect((await call({ method: "PATCH", route: ["tool_downloads", "1"], body: {} })).status).toBe(405);
  });
  it("limit fora de 1..200 é 400 no formato do manual", async () => {
    const r = await call({ route: ["newsletter"], url: "/api/admin/v1/newsletter?limit=500" });
    expect(r.status).toBe(400);
    expect(r.json.details.fieldErrors.limit).toBeTruthy();
  });
});

describe("/api/admin/v1 — ferramentas", () => {
  it("a listagem do painel inclui arquivadas (status=all por padrão)", async () => {
    await call({ route: ["tools"] });
    expect(listTools).toHaveBeenCalledWith(expect.objectContaining({ status: "all", limit: 50, offset: 0 }));
  });
  it("cria, edita e apaga", async () => {
    const created = await call({ method: "POST", route: ["tools"], body: { title: "Checklist", file_url: "https://x/y.pdf" } });
    expect(created.status).toBe(201);
    expect(created.json).toMatchObject({ title: "Checklist", host: "guara.test" });

    const patched = await call({ method: "PATCH", route: ["tools", "t1"], body: { archived: true } });
    expect(patched.json).toEqual({ id: "t1", archived: true });

    expect((await call({ method: "DELETE", route: ["tools", "t1"] })).json).toEqual({ deleted: "t1" });
  });
  it("aceita corpo vindo como texto JSON e recusa JSON quebrado", async () => {
    const ok = await call({ method: "POST", route: ["tools"], body: JSON.stringify({ title: "X" }) });
    expect(ok.json.title).toBe("X");
    const bad = await call({ method: "POST", route: ["tools"], body: "{nao-e-json" });
    expect(bad.status).toBe(400);
  });
});

describe("/api/admin/v1 — resumo e rotas desconhecidas", () => {
  it("counts devolve total, semana e semana anterior das duas tabelas", async () => {
    const r = await call({ route: ["counts"] });
    expect(r.status).toBe(200);
    expect(r.json).toEqual({
      newsletter: { total: 12, week: 5, prev: 2 },
      tool_downloads: { total: 12, week: 5, prev: 2 },
    });
  });
  it("downloads-by-tool vira um mapa slug → quantidade", async () => {
    vi.mocked(sql).mockResolvedValueOnce({ rows: [{ tool_slug: "checklist", n: 7 }, { tool_slug: "planilha", n: 2 }] } as any);
    const r = await call({ route: ["downloads-by-tool"] });
    expect(r.json).toEqual({ checklist: 7, planilha: 2 });
  });
  it("404 pra o que não existe", async () => {
    expect((await call({ route: ["leads"] })).status).toBe(404);
    expect((await call({ route: [] })).status).toBe(404);
  });
});

// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { createServer, type Server, type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";

// Banco só é tocado por /api/admin/api-keys, que não entra aqui.
vi.mock("../db.js", () => ({ sql: vi.fn(), assertPostgresConfigured: () => {} }));

import authHandler from "../../admin/auth/[...route].js";
import dataHandler from "../../admin/v1/[...route].js";
import { whoami } from "../adminAuth.js";

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (sub: string, expInS = 3600) => `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub, exp: Math.floor(Date.now() / 1000) + expInS })}.sig`;

const T = { admin: jwt("admin"), user: jwt("user"), off: jwt("off"), root: jwt("root") };
const USERS: Record<string, any> = {
  [T.admin]: { id: "1", email: "admin@guara.test", nome: "Admin", role: "admin", ativo: true },
  [T.user]: { id: "2", email: "user@guara.test", nome: "Visitante", role: "user", ativo: true },
  [T.off]: { id: "3", email: "off@guara.test", nome: "Desligado", role: "admin", ativo: false },
  [T.root]: { id: "4", email: "root@guara.test", role: "ADMIN", ativo: true }, // papel em maiúsculas
};
const PASSWORDS: Record<string, string> = { "admin@guara.test": T.admin, "user@guara.test": T.user, "off@guara.test": T.off };

let origin: Server;
let calls: { method: string; url: string; headers: IncomingMessage["headers"]; body: any }[] = [];

function readJson(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let s = "";
    req.on("data", (c) => (s += c));
    req.on("end", () => { try { resolve(s ? JSON.parse(s) : null); } catch { resolve(null); } });
  });
}

beforeAll(async () => {
  origin = createServer(async (req, res) => {
    const body = await readJson(req);
    calls.push({ method: req.method!, url: req.url!, headers: req.headers, body });
    const send = (status: number, json: unknown) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(json)); };
    const bearer = String(req.headers.authorization || "").replace(/^Bearer /, "");
    const url = new URL(req.url!, "http://x");

    if (url.pathname === "/auth/login" && req.method === "POST") {
      if (!body?.email || !body?.senha) return send(400, { detail: "email e senha obrigatórios" });
      const tok = body.senha === "certa" ? PASSWORDS[body.email] : undefined;
      return tok ? send(200, { access_token: tok, token_type: "bearer" }) : send(401, { detail: "Email ou senha incorretos" });
    }
    if (url.pathname.startsWith("/auth/")) {
      const me = USERS[bearer];
      if (!req.headers.authorization) return send(422, { detail: [{ type: "missing", loc: ["header", "authorization"], msg: "Field required" }] });
      if (!me) return send(401, { detail: "Token inválido" });
      if (url.pathname === "/auth/me") return req.method === "PATCH" ? send(200, { ...me, ...body }) : send(200, me);
      if (url.pathname === "/auth/users" && req.method === "GET") return send(200, Object.values(USERS).map((u) => ({ ...u, senha_hash: "segredo" })));
      if (url.pathname === "/auth/register") return send(201, { id: "9", ...body, senha: undefined, ativo: true });
      if (url.pathname.startsWith("/auth/users/")) return req.method === "DELETE" ? send(200, { ok: true }) : send(200, { id: url.pathname.split("/").pop(), email: "x@y.z", ...body });
    }
    if (url.pathname === "/leads") {
      if (req.headers["x-api-key"] !== "chave-do-servidor") return send(401, { detail: "chave inválida" });
      return send(200, [{ id: "l1", nome: "Maria", whatsapp: "(19) 99999-0000", created_at: "2026-09-01T10:00:00Z" }]);
    }
    if (url.pathname === "/jobs" && req.method === "POST") return send(201, { id: "j1", ...body });
    send(404, { detail: "Not Found" });
  });
  await new Promise<void>((r) => origin.listen(0, "127.0.0.1", r));
  process.env.GUARA_API_UPSTREAM = `http://127.0.0.1:${(origin.address() as AddressInfo).port}`;
  process.env.GUARA_API_UPSTREAM_KEY = "chave-do-servidor";
});
afterAll(() => new Promise<void>((r) => origin.close(() => r())));
beforeEach(() => { calls = []; });

type Call = { method?: string; route?: string[]; url?: string; token?: string | null; cookie?: string; csrf?: boolean; body?: unknown };
async function call(handler: any, { method = "GET", route = [], url, token = null, cookie, csrf = true, body }: Call) {
  const req: any = {
    method,
    query: { route },
    url: url ?? `/api/admin/x/${route.join("/")}`,
    headers: { host: "guara.test", ...(csrf ? { "x-requested-with": "guara-admin" } : {}), ...(token ? { cookie: `gm_admin=${token}` } : {}), ...(cookie ? { cookie } : {}) },
    body,
  };
  let status = 0, json: any;
  const headers: Record<string, string> = {};
  const res: any = { status(n: number) { status = n; return res; }, json(j: unknown) { json = j; return res; }, setHeader(k: string, v: string) { headers[k.toLowerCase()] = v; }, end() {} };
  await handler(req, res);
  return { status, json, headers };
}
const auth = (o: Call) => call(authHandler, o);
const data = (o: Call) => call(dataHandler, o);

describe("login", () => {
  it("admin entra: cookie HttpOnly/Secure/Strict restrito a /api/admin, duração do token, sem token no corpo", async () => {
    const r = await auth({ method: "POST", route: ["login"], body: { email: "admin@guara.test", senha: "certa" } });
    expect(r.status).toBe(200);
    expect(r.json).toEqual({ user: { id: "1", email: "admin@guara.test", nome: "Admin", role: "admin", ativo: true } });
    expect(JSON.stringify(r.json)).not.toContain(T.admin);
    const c = r.headers["set-cookie"]!;
    expect(c).toContain(`gm_admin=${T.admin}`);
    for (const f of ["HttpOnly", "Secure", "SameSite=Strict", "Path=/api/admin"]) expect(c).toContain(f);
    const maxAge = Number(/Max-Age=(\d+)/.exec(c)![1]);
    expect(maxAge).toBeGreaterThan(3500);
    expect(maxAge).toBeLessThanOrEqual(3600);
  });
  it("senha errada: 401 com a mensagem da API e sem cookie", async () => {
    const r = await auth({ method: "POST", route: ["login"], body: { email: "admin@guara.test", senha: "errada" } });
    expect(r.status).toBe(401);
    expect(r.json.error).toBe("Email ou senha incorretos");
    expect(r.headers["set-cookie"]).toBeUndefined();
  });
  it("conta que não é admin (ou está desativada) existe na API mas não ganha cookie", async () => {
    const u = await auth({ method: "POST", route: ["login"], body: { email: "user@guara.test", senha: "certa" } });
    expect(u.status).toBe(403);
    expect(u.json.error).toMatch(/\(user\).*não tem acesso ao painel/);
    expect(u.headers["set-cookie"]).toBeUndefined();
    const off = await auth({ method: "POST", route: ["login"], body: { email: "off@guara.test", senha: "certa" } });
    expect(off.status).toBe(403);
    expect(off.json.error).toMatch(/desativada/);
  });
  it("exige o cabeçalho anti-CSRF, e-mail e senha, e só aceita POST", async () => {
    expect((await auth({ method: "POST", route: ["login"], csrf: false, body: { email: "a@b.c", senha: "x" } })).status).toBe(403);
    expect((await auth({ method: "POST", route: ["login"], body: { email: "", senha: "x" } })).status).toBe(400);
    expect((await auth({ method: "POST", route: ["login"], body: { email: "a@b.c" } })).status).toBe(400);
    expect((await auth({ method: "GET", route: ["login"] })).status).toBe(405);
    expect(calls.length).toBe(0); // nada disso chega na API
  });
  it("sem GUARA_API_UPSTREAM o erro diz o que configurar", async () => {
    const keep = process.env.GUARA_API_UPSTREAM;
    delete process.env.GUARA_API_UPSTREAM;
    const r = await auth({ method: "POST", route: ["login"], body: { email: "a@b.c", senha: "x" } });
    process.env.GUARA_API_UPSTREAM = keep;
    expect(r.status).toBe(500);
    expect(r.json.error).toMatch(/GUARA_API_UPSTREAM/);
  });
  it("API fora do ar vira 503 com mensagem clara", async () => {
    const keep = process.env.GUARA_API_UPSTREAM;
    process.env.GUARA_API_UPSTREAM = "http://127.0.0.1:1"; // porta fechada
    const r = await auth({ method: "POST", route: ["login"], body: { email: "a@b.c", senha: "x" } });
    process.env.GUARA_API_UPSTREAM = keep;
    expect(r.status).toBe(503);
    expect(r.json.error).toMatch(/não respondeu/);
  });
});

describe("sessão (/me e /logout)", () => {
  it("me com cookie válido; sem cookie 401; token inválido 401; conta comum 403", async () => {
    expect((await auth({ route: ["me"], token: T.admin })).json.user.email).toBe("admin@guara.test");
    expect((await auth({ route: ["me"] })).status).toBe(401);
    expect((await auth({ route: ["me"], token: jwt("ninguem") })).status).toBe(401);
    expect((await auth({ route: ["me"], token: T.user })).status).toBe(403);
  });
  it("papel em maiúsculas conta como admin", async () => {
    expect((await auth({ route: ["me"], token: T.root })).status).toBe(200);
  });
  it("cookie que não parece JWT é ignorado (nem chega na API)", async () => {
    const r = await auth({ route: ["me"], cookie: "gm_admin=abc; outro=1" });
    expect(r.status).toBe(401);
    const inj = await auth({ route: ["me"], cookie: "gm_admin=a.b.c\r\nX-Evil: 1" });
    expect(inj.status).toBe(401);
    expect(calls.length).toBe(0);
  });
  it("a verificação com a API fica em cache por alguns segundos", async () => {
    const t = jwt("cache");
    USERS[t] = { id: "7", email: "c@guara.test", role: "admin", ativo: true };
    await auth({ route: ["me"], token: t });
    await auth({ route: ["me"], token: t });
    await auth({ route: ["me"], token: t });
    expect(calls.filter((c) => c.url === "/auth/me").length).toBe(1);
  });
  it("logout apaga o cookie e funciona mesmo sem sessão", async () => {
    const r = await auth({ method: "POST", route: ["logout"] });
    expect(r.status).toBe(200);
    expect(r.headers["set-cookie"]).toMatch(/gm_admin=;.*Max-Age=0/);
    expect((await auth({ method: "POST", route: ["logout"], csrf: false })).status).toBe(403);
  });
  it("trocar a própria senha/nome só repassa campos permitidos", async () => {
    const r = await auth({ method: "PATCH", route: ["me"], token: T.admin, body: { senha: "nova-senha-123", role: "admin", ativo: false } });
    expect(r.status).toBe(200);
    const patch = calls.find((c) => c.method === "PATCH" && c.url === "/auth/me")!;
    expect(patch.body).toEqual({ senha: "nova-senha-123" });
  });
});

describe("usuários (/users)", () => {
  it("lista sem vazar campos internos", async () => {
    const r = await auth({ route: ["users"], token: T.admin });
    expect(r.status).toBe(200);
    expect(r.json.data[0]).toEqual({ id: "1", email: "admin@guara.test", nome: "Admin", role: "admin", ativo: true });
    expect(JSON.stringify(r.json)).not.toContain("segredo");
  });
  it("cria, altera (só role/ativo/nome) e apaga", async () => {
    const created = await auth({ method: "POST", route: ["users"], token: T.admin, body: { email: "novo@guara.test", senha: "abc12345", nome: "Novo", role: "admin", lixo: 1 } });
    expect(created.status).toBe(201);
    expect(calls.find((c) => c.url === "/auth/register")!.body).toEqual({ email: "novo@guara.test", senha: "abc12345", nome: "Novo", role: "admin" });
    const patched = await auth({ method: "PATCH", route: ["users", "9"], token: T.admin, body: { ativo: false, senha_hash: "x", role: "user" } });
    expect(patched.json.ativo).toBe(false);
    expect(calls.find((c) => c.method === "PATCH" && c.url === "/auth/users/9")!.body).toEqual({ ativo: false, role: "user" });
    expect((await auth({ method: "DELETE", route: ["users", "9"], token: T.admin })).json).toEqual({ deleted: "9" });
  });
  it("recusa id com caminho, conta comum e pedido sem CSRF", async () => {
    expect((await auth({ method: "DELETE", route: ["users", ".."], token: T.admin })).status).toBe(404);
    expect((await auth({ route: ["users"], token: T.user })).status).toBe(403);
    expect((await auth({ method: "DELETE", route: ["users", "9"], token: T.admin, csrf: false })).status).toBe(403);
  });
});

describe("dados do painel (/api/admin/v1) — repassa à API com a chave do servidor", () => {
  it("lista no formato do manual; a API recebe X-API-Key e NÃO recebe o cookie nem o JWT", async () => {
    const r = await data({ route: ["leads"], url: "/api/admin/v1/leads?limit=200", token: T.admin });
    expect(r.status).toBe(200);
    expect(r.json).toMatchObject({ count: 1, limit: 200, offset: 0, data: [{ id: "l1", nome: "Maria" }] });
    const lead = calls.find((c) => c.url!.startsWith("/leads"))!;
    expect(lead.headers["x-api-key"]).toBe("chave-do-servidor");
    expect(lead.headers.cookie).toBeUndefined();
    expect(lead.headers.authorization).toBeUndefined();
  });
  it("sem sessão 401, conta comum 403 — e a API de dados nem é chamada", async () => {
    expect((await data({ route: ["leads"] })).status).toBe(401);
    expect((await data({ route: ["leads"], token: T.user })).status).toBe(403);
    expect(calls.some((c) => c.url!.startsWith("/leads"))).toBe(false);
  });
  it("escrita exige o cabeçalho anti-CSRF; com ele, cria vaga", async () => {
    expect((await data({ method: "POST", route: ["jobs"], token: T.admin, csrf: false, body: { title: "X" } })).status).toBe(403);
    const ok = await data({ method: "POST", route: ["jobs"], token: T.admin, body: { title: "Social Media", is_open: false } });
    expect(ok.status).toBe(201);
    expect(ok.json).toMatchObject({ id: "j1", title: "Social Media" });
  });
  it("rotas fora do manual dão 404 (o painel não alcança /auth nem /health por aqui)", async () => {
    expect((await data({ route: ["auth", "users"], token: T.admin })).status).toBe(404);
    expect((await data({ route: ["health"], token: T.admin })).status).toBe(404);
  });
  it("sem GUARA_API_UPSTREAM_KEY a falha é explícita (500), não 'login inválido'", async () => {
    const keep = process.env.GUARA_API_UPSTREAM_KEY;
    delete process.env.GUARA_API_UPSTREAM_KEY;
    const r = await data({ route: ["leads"], token: T.admin });
    process.env.GUARA_API_UPSTREAM_KEY = keep;
    expect(r.status).toBe(500);
    expect(r.json.error).toMatch(/GUARA_API_UPSTREAM_KEY/);
  });
});

describe("whoami", () => {
  it("token desconhecido dá 401 (422 da API por falta de cabeçalho também)", async () => {
    await expect(whoami(jwt("fantasma"))).rejects.toMatchObject({ status: 401 });
  });
});

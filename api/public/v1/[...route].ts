import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "../../_lib/supabaseAdmin";
import { requireApiKey } from "../../_lib/auth";
import { ApiError, handleCaught, sendError } from "../../_lib/errors";
import { parsePagination, parseQuery } from "../../_lib/pagination";
import { CADASTRO_RESOURCES, deleteCadastro, getCadastro, listCadastro, patchCadastro } from "../../_lib/resources/cadastros";
import type { CadastroResource } from "../../_lib/schemas";
import { createPost, deletePost, getPost, listPosts, patchPost } from "../../_lib/resources/posts";
import { createJob, deleteJob, getJob, listJobs, patchJob } from "../../_lib/resources/jobs";
import { createTool, deleteTool, getTool, listTools, patchTool } from "../../_lib/resources/tools";
import { getSummary } from "../../_lib/resources/summary";

// Manual completo: public/versoes/design-v13-adesivo.md é outro assunto —
// este é o manual da API (Guara-API-manual.pdf) que define estas rotas.

const ALIAS: Record<string, "posts" | "jobs" | "tools"> = {
  blog: "posts",
  posts: "posts",
  vagas: "jobs",
  jobs: "jobs",
  ferramentas: "tools",
  tools: "tools",
};

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "authorization, x-api-key, content-type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
}

function getBody(req: VercelRequest): unknown {
  if (req.body == null || req.body === "") return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      throw new ApiError(400, "Dados inválidos", { formErrors: ["JSON inválido."], fieldErrors: {} });
    }
  }
  return req.body;
}

function siteHostFrom(req: VercelRequest): string | null {
  const h = req.headers["x-forwarded-host"] || req.headers.host;
  const v = Array.isArray(h) ? h[0] : h;
  return v ? v.split(":")[0] : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    await requireApiKey(req);
    const db = getSupabaseAdmin();
    const segments = ([] as string[]).concat((req.query.route as string | string[]) || []);
    const [first, second] = segments;
    const method = req.method || "GET";
    const qs = parseQuery(req);
    const siteHost = siteHostFrom(req);

    if (!first) throw new ApiError(404, "Endereço ou item não encontrado.");

    // ---- /summary ----
    if (first === "summary" && method === "GET") {
      res.status(200).json(await getSummary(db));
      return;
    }

    // ---- cadastros: /leads /newsletter /tool_downloads /applications ----
    if ((CADASTRO_RESOURCES as string[]).includes(first)) {
      const resource = first as CadastroResource;
      if (!second) {
        if (method !== "GET") throw new ApiError(405, "Método não permitido nesse endereço.");
        const { limit, offset, since } = parsePagination(qs);
        res.status(200).json(await listCadastro(db, resource, { limit, offset, since, status: qs.get("status") }));
        return;
      }
      if (method === "GET") {
        res.status(200).json(await getCadastro(db, resource, second));
        return;
      }
      if (method === "PATCH") {
        res.status(200).json(await patchCadastro(db, resource, second, getBody(req)));
        return;
      }
      if (method === "DELETE") {
        res.status(200).json(await deleteCadastro(db, resource, second));
        return;
      }
      throw new ApiError(405, "Método não permitido nesse endereço.");
    }

    // ---- posts / jobs / tools (com apelidos blog/vagas/ferramentas) ----
    const resource = ALIAS[first];
    if (resource) {
      const { limit, offset, since } = !second && method === "GET" ? parsePagination(qs) : { limit: 50, offset: 0, since: null };

      if (resource === "posts") {
        if (!second) {
          if (method === "GET") {
            res.status(200).json(await listPosts(db, { limit, offset, since, status: qs.get("status"), q: qs.get("q"), category: qs.get("category"), tag: qs.get("tag") }));
            return;
          }
          if (method === "POST") {
            res.status(201).json(await createPost(db, getBody(req), siteHost));
            return;
          }
          throw new ApiError(405, "Método não permitido nesse endereço.");
        }
        if (method === "GET") { res.status(200).json(await getPost(db, second)); return; }
        if (method === "PATCH") { res.status(200).json(await patchPost(db, second, getBody(req), siteHost)); return; }
        if (method === "DELETE") { res.status(200).json(await deletePost(db, second)); return; }
        throw new ApiError(405, "Método não permitido nesse endereço.");
      }

      if (resource === "jobs") {
        if (!second) {
          if (method === "GET") {
            res.status(200).json(await listJobs(db, { limit, offset, since, status: qs.get("status"), q: qs.get("q"), department: qs.get("department") }));
            return;
          }
          if (method === "POST") {
            res.status(201).json(await createJob(db, getBody(req)));
            return;
          }
          throw new ApiError(405, "Método não permitido nesse endereço.");
        }
        if (method === "GET") { res.status(200).json(await getJob(db, second)); return; }
        if (method === "PATCH") { res.status(200).json(await patchJob(db, second, getBody(req))); return; }
        if (method === "DELETE") { res.status(200).json(await deleteJob(db, second)); return; }
        throw new ApiError(405, "Método não permitido nesse endereço.");
      }

      if (resource === "tools") {
        if (!second) {
          if (method === "GET") {
            res.status(200).json(await listTools(db, { limit, offset, since, status: qs.get("status"), q: qs.get("q"), category: qs.get("category") }));
            return;
          }
          if (method === "POST") {
            res.status(201).json(await createTool(db, getBody(req), siteHost));
            return;
          }
          throw new ApiError(405, "Método não permitido nesse endereço.");
        }
        if (method === "GET") { res.status(200).json(await getTool(db, second)); return; }
        if (method === "PATCH") { res.status(200).json(await patchTool(db, second, getBody(req), siteHost)); return; }
        if (method === "DELETE") { res.status(200).json(await deleteTool(db, second)); return; }
        throw new ApiError(405, "Método não permitido nesse endereço.");
      }
    }

    throw new ApiError(404, "Endereço ou item não encontrado.");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      sendError(res, 401, err.message);
      return;
    }
    handleCaught(res, err);
  }
}

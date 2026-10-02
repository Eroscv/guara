import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { ApiError, handleCaught } from "../_lib/errors.js";
import { getBody } from "../_lib/http.js";
import { requireAdmin } from "../_lib/adminAuth.js";

export const config = { maxDuration: 30 };

const MAX_BYTES = 50 * 1024 * 1024; // mesmo teto que a API da Guará aceita pra arquivo de ferramenta
const FOLDERS = ["posts", "jobs", "tools", "editor"];

// Envio de imagens (capa, texto do post) e arquivos (ferramentas) pro Vercel Blob.
// O navegador manda o arquivo DIRETO pro Blob (sem passar por aqui, então vale
// o limite do Blob e não o de 4,5 MB das funções); esta rota só emite o token
// de envio — e só pra admin logado. O que volta é um link público, que o painel
// grava no post/vaga/ferramenta pela API da Guará.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method !== "POST") throw new ApiError(405, "Método não permitido nesse endereço.");
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new ApiError(500, "Armazenamento de arquivos não configurado. Crie um Blob Store em Vercel → Storage e conecte ao projeto.");
    }
    const json = await handleUpload({
      body: getBody(req) as HandleUploadBody,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Só a geração do token exige sessão; o aviso "upload concluído" vem da própria Vercel.
        await requireAdmin(req);
        if (!FOLDERS.includes(pathname.split("/")[0] ?? "")) throw new ApiError(400, "Pasta de destino inválida.");
        return { maximumSizeInBytes: MAX_BYTES, addRandomSuffix: true };
      },
      onUploadCompleted: async () => {},
    });
    res.status(200).json(json);
  } catch (err) {
    handleCaught(res, err);
  }
}

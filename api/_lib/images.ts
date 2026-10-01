import { ApiError } from "./errors";

const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "gif", "avif"];
const MAX_BYTES = 15 * 1024 * 1024;
const TIMEOUT_MS = 8000;

const PRIVATE_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);
function isPrivateHost(hostname: string, siteHost: string | null): boolean {
  const h = hostname.toLowerCase();
  if (PRIVATE_HOSTS.has(h)) return true;
  if (siteHost && h === siteHost.toLowerCase()) return true; // recusa endereço do próprio site
  if (/^10\./.test(h) || /^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  return false;
}

export interface ImageCheck {
  field: string;
  url: string;
  problem: string;
}

async function checkOne(field: string, url: string, siteHost: string | null): Promise<ImageCheck | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { field, url, problem: "Link inválido." };
  }
  if (parsed.protocol !== "https:") {
    return { field, url, problem: "Use um link https://." };
  }
  if (isPrivateHost(parsed.hostname, siteHost)) {
    return { field, url, problem: "Endereços internos não são aceitos." };
  }
  const ext = (parsed.pathname.split(".").pop() || "").toLowerCase();
  if (ext === "svg") {
    return { field, url, problem: "Formato SVG não é aceito. Use JPG, PNG, WEBP, GIF ou AVIF" };
  }
  if (ext && !ALLOWED_EXT.includes(ext)) {
    return { field, url, problem: "Formato não reconhecido. Use JPG, PNG, WEBP, GIF ou AVIF" };
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: "HEAD", signal: controller.signal });
    if (!res.ok) return { field, url, problem: `O link respondeu ${res.status}.` };
    const type = res.headers.get("content-type") || "";
    if (type && !type.startsWith("image/")) {
      return { field, url, problem: "O link não aponta para uma imagem." };
    }
    if (type.includes("svg")) {
      return { field, url, problem: "Formato SVG não é aceito. Use JPG, PNG, WEBP, GIF ou AVIF" };
    }
    const len = Number(res.headers.get("content-length") || "0");
    if (len && len > MAX_BYTES) {
      return { field, url, problem: "Arquivo maior que 15MB." };
    }
    return null;
  } catch {
    return { field, url, problem: "O link não abriu em até 8 segundos." };
  } finally {
    clearTimeout(t);
  }
}

// Valida cover_image, images[] e os <img src="..."> dentro do content.
// Se alguma falhar, nada é salvo: o chamador deve checar o array antes de
// gravar qualquer coisa no banco, exatamente como o manual descreve.
export async function validateImages(
  urls: { field: string; url: string }[],
  siteHost: string | null
): Promise<void> {
  const unique = urls.filter((u) => !!u.url);
  const results = await Promise.all(unique.map((u) => checkOne(u.field, u.url, siteHost)));
  const problems = results.filter((r): r is ImageCheck => !!r);
  if (problems.length) {
    throw new ApiError(
      422,
      `${problems.length} imagem(ns) com problema. Formatos aceitos: JPG, PNG, WEBP, GIF ou AVIF, até 15MB, em link público.`,
      { images: problems }
    );
  }
}

export function extractContentImages(html: string): string[] {
  const out: string[] = [];
  const re = /<img[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

// Cliente HTTP do painel (/admin). Fica fora de components/admin pra não puxar o
// CSS/fontes do painel junto (este arquivo é usado pelo RequireAdmin, que carrega
// com o site público).
//
// A sessão é um cookie HttpOnly posto pelo servidor: o JavaScript nunca vê o token.
// Toda chamada vai pro mesmo domínio (/api/admin/*), com o cabeçalho que o servidor
// exige nas escritas (anti-CSRF).

export const UNAUTHORIZED_EVENT = "gm-admin-unauthorized";
const CSRF = { "X-Requested-With": "guara-admin" };

export class AdminApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type Init = { method?: string; body?: unknown };

async function request<T>(url: string, init: Init, notify401: boolean): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: init.method ?? "GET",
      credentials: "same-origin",
      headers: { ...CSRF, ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}) },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new AdminApiError(0, "Sem conexão com o servidor. Confira a internet e tente de novo.");
  }
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* corpo que não é JSON: página de erro da Vercel, por exemplo */
  }
  if (!res.ok) {
    if (res.status === 401 && notify401) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    const message = json?.error || (json ? "Não foi possível completar a ação." : `O servidor do painel não respondeu direito (HTTP ${res.status}).`);
    throw new AdminApiError(res.status, message, json?.details);
  }
  return json as T;
}

/** Chamada autenticada. Se a sessão caiu (401), avisa o AuthProvider pra mandar pro login. */
export const adminFetch = <T = unknown>(url: string, init: Init = {}) => request<T>(url, init, true);

/** Mesma chamada, sem avisar sobre 401 — pro próprio login, onde 401 é "senha errada". */
export const adminFetchQuiet = <T = unknown>(url: string, init: Init = {}) => request<T>(url, init, false);

/** Dados do site (leads, posts, vagas…) — o servidor repassa à API da Guará. */
export const adminApi = <T = unknown>(path: string, init: Init = {}) => adminFetch<T>(`/api/admin/v1${path}`, init);

/** Entrar, sair, usuários. */
export const authApi = <T = unknown>(path: string, init: Init = {}) => adminFetch<T>(`/api/admin/auth${path}`, init);

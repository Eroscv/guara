import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { AdminApiError, UNAUTHORIZED_EVENT, adminFetchQuiet, authApi } from "@/lib/admin-api";

// Sessão do painel: login pela API da Guará (/auth/login), via /api/admin/auth.
// O token fica num cookie HttpOnly; aqui só guardamos quem está logado.
// Só contas admin e ativas chegam a ter sessão (o servidor recusa as outras no login).

export interface AdminUser {
  id: string;
  email: string;
  nome: string | null;
  role: string;
  ativo: boolean;
}

interface AuthCtx {
  user: AdminUser | null;
  loading: boolean;
  /** Problema que impede de saber se há sessão (API fora do ar, não configurada…). */
  error: string | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: AdminUser | null) => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  setUser: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    authApi<{ user: AdminUser }>("/me")
      .then((r) => alive && setUser(r.user))
      .catch((e: unknown) => {
        if (!alive) return;
        setUser(null);
        // 401 = simplesmente não há sessão; o resto é problema que a pessoa precisa ver
        if (!(e instanceof AdminApiError && e.status === 401)) setError(e instanceof Error ? e.message : "Não foi possível verificar o acesso.");
      })
      .finally(() => alive && setLoading(false));

    // Qualquer chamada do painel que levar 401 derruba a sessão na tela.
    const drop = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, drop);
    return () => {
      alive = false;
      window.removeEventListener(UNAUTHORIZED_EVENT, drop);
    };
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const r = await adminFetchQuiet<{ user: AdminUser }>("/api/admin/auth/login", { method: "POST", body: { email, senha } });
    setError(null);
    setUser(r.user);
  }, []);

  const logout = useCallback(async () => {
    await adminFetchQuiet("/api/admin/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, error, login, logout, setUser }), [user, loading, error, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

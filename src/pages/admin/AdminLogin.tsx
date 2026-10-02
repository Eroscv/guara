import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthBadge, AuthFrame } from "@/components/admin/AuthFrame";
import { toast } from "sonner";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const { user, login, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  useEffect(() => {
    if (user) navigate(from && from.startsWith("/admin") && from !== "/admin/login" ? from : "/admin", { replace: true });
  }, [user, from, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProblem(null);
    try {
      await login(email.trim(), senha);
      toast.success("Bem-vindo!");
    } catch (err) {
      setProblem(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  };

  const shown = problem ?? authError;

  return (
    <AuthFrame>
      <AuthBadge />
      <div>
        <h1 className="text-3xl font-extrabold">Entrar no painel</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acesso restrito a administradores.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" autoComplete="email" className="h-11" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" type="password" autoComplete="current-password" className="h-11" required value={senha} onChange={(e) => setSenha(e.target.value)} />
        </div>
        {shown && <p role="alert" className="rounded-md border-2 border-foreground bg-muted p-3 text-sm font-semibold">{shown}</p>}
        <Button type="submit" className="h-11 w-full text-base font-bold shadow-brut-orange" disabled={loading}>
          {loading ? "Aguarde…" : "Entrar"}
        </Button>
      </form>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Esqueceu a senha? Peça a um administrador.</span>
        <Link to="/" className="text-muted-foreground underline">Voltar ao site</Link>
      </div>
    </AuthFrame>
  );
};

export default AdminLogin;

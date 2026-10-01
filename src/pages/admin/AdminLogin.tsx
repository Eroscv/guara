import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthBadge, AuthFrame } from "@/components/admin/AuthFrame";
import { toast } from "sonner";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/admin", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Bem-vindo!");
      navigate("/admin");
    } catch (e: any) {
      toast.error(e.message || "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

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
          <Input id="password" type="password" autoComplete="current-password" className="h-11" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="h-11 w-full text-base font-bold shadow-brut-orange" disabled={loading}>
          {loading ? "Aguarde…" : "Entrar"}
        </Button>
      </form>
      <div className="flex items-center justify-between text-sm">
        <Link to="/admin/forgot-password" className="underline">Esqueci minha senha</Link>
        <Link to="/" className="text-muted-foreground underline">Voltar ao site</Link>
      </div>
    </AuthFrame>
  );
};

export default AdminLogin;

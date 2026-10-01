import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthBadge, AuthFrame } from "@/components/admin/AuthFrame";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Email enviado!");
    } catch (e: any) {
      toast.error(e.message || "Erro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame>
      <AuthBadge />
      <h1 className="text-3xl font-extrabold">Recuperar senha</h1>
      {sent ? (
        <p className="rounded-md bg-muted p-3 text-sm">
          Se o e-mail existir, você receberá um link para redefinir sua senha em instantes. Cheque também a caixa de spam.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">Enviaremos um link para você redefinir sua senha.</p>
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" className="h-11" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" className="h-11 w-full text-base font-bold shadow-brut-orange" disabled={loading}>
              {loading ? "Enviando…" : "Enviar link"}
            </Button>
          </form>
        </>
      )}
      <Link to="/admin/login" className="inline-block text-sm underline">← Voltar para o login</Link>
    </AuthFrame>
  );
};

export default ForgotPassword;

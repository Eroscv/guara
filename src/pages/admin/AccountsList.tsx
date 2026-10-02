import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, Plus, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth, type AdminUser } from "@/hooks/use-auth";
import { authApi } from "@/components/admin/helpers";
import { errorMessage } from "@/components/admin/contentConfig";

// Contas do painel = usuários da API da Guará (/auth/users). Só contas admin e ativas entram aqui.
const SELECT_CLS = "h-10 rounded-md border-2 border-foreground bg-card px-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-brand-orange";

const AccountsList = () => {
  const { user: me, setUser } = useAuth();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => (await authApi<{ data: AdminUser[] }>("/users")).data,
    retry: false,
  });
  const roles = Array.from(new Set(["admin", "user", ...data.map((u) => u.role).filter(Boolean)]));
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "users"] });

  const patch = async (u: AdminUser, body: Partial<Pick<AdminUser, "role" | "ativo">>) => {
    try {
      await authApi(`/users/${encodeURIComponent(u.id)}`, { method: "PATCH", body });
      refresh();
    } catch (e) {
      toast.error(errorMessage(e, "Não foi possível alterar a conta."));
    }
  };
  const remove = async (u: AdminUser) => {
    if (!confirm(`Apagar a conta de ${u.nome || u.email}? Isso não dá para desfazer.`)) return;
    try {
      await authApi(`/users/${encodeURIComponent(u.id)}`, { method: "DELETE" });
      toast.success("Conta apagada");
      refresh();
    } catch (e) {
      toast.error(errorMessage(e, "Não foi possível apagar a conta."));
    }
  };

  // ---- minha conta
  const [nome, setNome] = useState(me?.nome ?? "");
  const [senha, setSenha] = useState("");
  const [saving, setSaving] = useState(false);
  const saveMe = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, string> = {};
    if (nome.trim() && nome.trim() !== (me?.nome ?? "")) body.nome = nome.trim();
    if (senha) {
      if (senha.length < 8) { toast.error("A senha precisa ter pelo menos 8 caracteres."); return; }
      body.senha = senha;
    }
    if (!Object.keys(body).length) { toast.info("Nada para alterar."); return; }
    setSaving(true);
    try {
      const r = await authApi<{ user: AdminUser }>("/me", { method: "PATCH", body });
      setUser(r.user);
      setSenha("");
      toast.success(body.senha ? "Senha alterada" : "Dados salvos");
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Não foi possível salvar."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-center gap-4 border-b-2 border-dashed border-foreground/20 pb-6">
        <span className="hidden size-12 place-items-center rounded-2xl border-2 border-foreground bg-accent shadow-brut sm:grid"><UserCog className="size-5" aria-hidden /></span>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-orange">Sistema</p>
          <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">Contas</h1>
          <p className="text-sm text-muted-foreground">Quem acessa o painel. As contas são as da API da Guará.</p>
        </div>
      </div>

      <form onSubmit={saveMe} className="space-y-4 rounded-2xl border-2 border-foreground bg-card p-5 shadow-brut">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl border-2 border-foreground bg-accent"><KeyRound className="size-4" aria-hidden /></span>
          <div>
            <h2 className="text-lg font-extrabold leading-none">Minha conta</h2>
            <p className="text-xs text-muted-foreground">{me?.email} · {me?.role}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="me-nome" className="font-bold">Nome</Label>
            <Input id="me-nome" className="h-11 bg-background" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="me-senha" className="font-bold">Nova senha</Label>
            <Input id="me-senha" type="password" className="h-11 bg-background" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" placeholder="Deixe vazio para manter" />
          </div>
        </div>
        <Button type="submit" disabled={saving} className="font-bold shadow-brut-orange">
          {saving && <Loader2 className="animate-spin" />} Salvar
        </Button>
      </form>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-extrabold">Usuários {!isLoading && <span className="text-base text-muted-foreground">({data.length})</span>}</h2>
          <Button onClick={() => setCreating(true)}><Plus className="size-4" /> Novo usuário</Button>
        </div>

        {isLoading && <p>Carregando…</p>}
        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-foreground bg-card p-4 shadow-brut">
            <p className="text-sm font-semibold">{errorMessage(error, "Não foi possível carregar os usuários.")}</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>Tentar de novo</Button>
          </div>
        )}

        <div className="space-y-3">
          {data.map((u) => {
            const self = u.id === me?.id || u.email === me?.email;
            return (
              <div key={u.id} className={`flex flex-wrap items-center gap-4 rounded-2xl border-2 border-foreground bg-card p-4 shadow-brut ${u.ativo ? "" : "opacity-60"}`}>
                <div className="min-w-48 flex-1">
                  <p className="font-bold">
                    {u.nome || u.email}
                    {self && <span className="ml-2 rounded-full border-2 border-foreground bg-accent px-2 py-0.5 text-xs">Você</span>}
                  </p>
                  <p className="break-all text-sm text-muted-foreground">{u.email}</p>
                </div>
                <select aria-label={`Papel de ${u.nome || u.email}`} className={SELECT_CLS} value={u.role} disabled={self} title={self ? "Você não pode mudar o seu próprio papel" : undefined} onChange={(e) => patch(u, { role: e.target.value })}>
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <Switch checked={u.ativo} disabled={self} onCheckedChange={(c) => patch(u, { ativo: c })} aria-label={`Ativa: ${u.nome || u.email}`} /> {u.ativo ? "Ativa" : "Desativada"}
                </label>
                <Button variant="ghost" size="icon" disabled={self} onClick={() => remove(u)} aria-label={`Apagar conta de ${u.nome || u.email}`}><Trash2 className="size-4" /></Button>
              </div>
            );
          })}
        </div>
      </div>

      {creating && <NewUser roles={roles} onClose={() => setCreating(false)} onCreated={refresh} />}
    </section>
  );
};

function NewUser({ roles, onClose, onCreated }: { roles: string[]; onClose: () => void; onCreated: () => void }) {
  const [v, setV] = useState({ nome: "", email: "", senha: "", role: "admin" });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v, val: string) => setV((p) => ({ ...p, [k]: val }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (v.senha.length < 8) { toast.error("A senha precisa ter pelo menos 8 caracteres."); return; }
    setBusy(true);
    try {
      await authApi("/users", { method: "POST", body: { nome: v.nome.trim() || undefined, email: v.email.trim(), senha: v.senha, role: v.role } });
      toast.success("Usuário criado");
      onCreated();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Não foi possível criar o usuário."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="gap-0 overflow-hidden rounded-3xl border-2 border-foreground p-0 shadow-brut-lg sm:max-w-md [&>button]:text-foreground [&>button]:opacity-100">
        <DialogHeader className="bg-code px-6 py-5 text-left text-code-foreground">
          <DialogTitle className="font-display text-2xl font-extrabold text-code-foreground">Novo usuário</DialogTitle>
          <DialogDescription className="text-code-foreground/70">A pessoa entra no painel com este e-mail e senha.</DialogDescription>
        </DialogHeader>
        <form onSubmit={save}>
          <div className="space-y-4 bg-background p-6">
            <div className="space-y-1.5">
              <Label htmlFor="nu-nome" className="font-bold">Nome</Label>
              <Input id="nu-nome" className="h-11" value={v.nome} onChange={(e) => set("nome", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nu-email" className="font-bold">E-mail</Label>
              <Input id="nu-email" type="email" required className="h-11" value={v.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nu-senha" className="font-bold">Senha</Label>
              <Input id="nu-senha" type="password" required minLength={8} autoComplete="new-password" className="h-11" value={v.senha} onChange={(e) => set("senha", e.target.value)} />
              <p className="text-xs text-muted-foreground">Pelo menos 8 caracteres.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nu-role" className="font-bold">Papel</Label>
              <select id="nu-role" className={`${SELECT_CLS} w-full`} value={v.role} onChange={(e) => set("role", e.target.value)}>
                {roles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <p className="text-xs text-muted-foreground">Só quem tem o papel admin consegue entrar no painel.</p>
            </div>
          </div>
          <DialogFooter className="flex-row justify-end gap-2 border-t-2 border-foreground bg-card px-6 py-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={busy} className="font-bold shadow-brut-orange">{busy && <Loader2 className="animate-spin" />} Criar usuário</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AccountsList;

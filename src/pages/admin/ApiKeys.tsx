import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Key, Copy, Ban, Plus } from "lucide-react";

type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

// gm_ + 40 caracteres hex, exatamente como o manual descreve. O navegador
// gera a chave e calcula o hash (SHA-256) com a Web Crypto API; só o hash vai
// pro banco — a chave em si nunca é salva em lugar nenhum, só mostrada uma vez.
async function generateKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const key = `gm_${hex}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  const hash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return { key, hash, prefix: key.slice(0, 12) };
}

const ApiKeys = () => {
  const { isSysadmin, user } = useAuth();
  const [rows, setRows] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [revealKey, setRevealKey] = useState<string | null>(null);

  const load = async () => {
    if (!hasLoaded) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("api_keys" as any)
        .select("id,name,key_prefix,created_at,last_used_at,revoked_at")
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      setRows((data as unknown as ApiKey[]) ?? []);
    } finally {
      setHasLoaded(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createKey = async () => {
    if (!newName.trim()) {
      toast.error("Dá um nome pra chave, pra identificar depois.");
      return;
    }
    setCreating(true);
    try {
      const { key, hash, prefix } = await generateKey();
      const { error } = await supabase.from("api_keys" as any).insert({
        name: newName.trim(),
        key_prefix: prefix,
        key_hash: hash,
        created_by: user?.id ?? null,
      } as any);
      if (error) {
        toast.error(error.message);
        return;
      }
      setCreateOpen(false);
      setNewName("");
      setRevealKey(key);
      await load();
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (row: ApiKey) => {
    if (!confirm(`Desativar a chave "${row.name}"? Quem a usa perde o acesso na hora.`)) return;
    setBusyId(row.id);
    const { error } = await supabase
      .from("api_keys" as any)
      .update({ revoked_at: new Date().toISOString() } as any)
      .eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Chave desativada");
      await load();
    }
    setBusyId(null);
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copiado");
  };

  if (!isSysadmin) {
    return (
      <div className="text-center py-20">
        <h1 className="font-heading font-bold text-2xl">Acesso restrito</h1>
        <p className="text-muted-foreground mt-2">Apenas o sysadmin pode gerenciar chaves de API.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading font-bold text-3xl">API</h1>
          <p className="text-muted-foreground mt-1">
            Chaves de acesso à API pública (<code className="text-xs">/api/public/v1</code>), usadas por agentes de
            IA e sistemas externos para consultar e publicar conteúdo.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} className="mr-2" /> Nova chave
        </Button>
      </div>

      {loading && !hasLoaded ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="animate-spin" size={16} /> Carregando...
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-card rounded-xl border p-10 text-center text-muted-foreground">
          <Key className="mx-auto mb-3 opacity-50" size={28} />
          Nenhuma chave criada ainda.
        </div>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Nome</th>
                <th className="p-3">Chave</th>
                <th className="p-3">Criada em</th>
                <th className="p-3">Último uso</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{r.key_prefix}…</td>
                  <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                  <td className="p-3 text-muted-foreground">
                    {r.last_used_at ? new Date(r.last_used_at).toLocaleString("pt-BR") : "Nunca usada"}
                  </td>
                  <td className="p-3">
                    {r.revoked_at ? (
                      <span className="text-destructive">Desativada</span>
                    ) : (
                      <span className="text-primary">Ativa</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {!r.revoked_at && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => revoke(r)}
                      >
                        <Ban size={14} className="mr-1.5" /> Desativar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova chave de API</DialogTitle>
            <DialogDescription>
              Dá um nome pra identificar quem vai usar essa chave (ex.: "Agente de conteúdo", "Integração X").
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="key-name">Nome</Label>
            <Input id="key-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Agente de conteúdo" autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={createKey} disabled={creating}>
              {creating ? <Loader2 className="animate-spin" size={16} /> : "Criar chave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!revealKey} onOpenChange={() => setRevealKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chave criada</DialogTitle>
            <DialogDescription>
              Copia agora — por segurança, ela só aparece esta vez. Se perder, cria uma nova.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
            <code className="text-sm break-all flex-1">{revealKey}</code>
            <Button variant="outline" size="icon" onClick={() => revealKey && copy(revealKey)}>
              <Copy size={16} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Use no cabeçalho: <code>Authorization: Bearer {revealKey ? `${revealKey.slice(0, 10)}…` : "gm_…"}</code>
          </p>
          <DialogFooter>
            <Button onClick={() => setRevealKey(null)}>Já copiei</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApiKeys;

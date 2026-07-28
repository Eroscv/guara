import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Check, X, ShieldCheck, Download } from "lucide-react";
import { downloadCSV } from "@/lib/export";

type Profile = {
  user_id: string;
  email: string;
  full_name: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  approved_at: string | null;
};

const statusVariant: Record<Profile["status"], "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

const AccountsList = () => {
  const { isSysadmin, user } = useAuth();
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    if (!hasLoaded) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id,email,full_name,status,created_at,approved_at")
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      setRows((data as Profile[]) ?? []);
    } finally {
      setHasLoaded(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (p: Profile, status: Profile["status"]) => {
    setBusyId(p.user_id);
    const patch: any = { status };
    if (status === "approved") {
      patch.approved_at = new Date().toISOString();
      patch.approved_by = user?.id ?? null;
      patch.rejected_at = null;
    } else if (status === "rejected") {
      patch.rejected_at = new Date().toISOString();
    }
    const { error } = await supabase.from("profiles").update(patch).eq("user_id", p.user_id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(status === "approved" ? "Conta aprovada" : "Conta recusada");
      await load();
    }
    setBusyId(null);
  };

  const grantAdmin = async (p: Profile) => {
    setBusyId(p.user_id);
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: p.user_id, role: "admin" } as any);
    if (error && !error.message.includes("duplicate")) toast.error(error.message);
    else toast.success("Permissão de admin concedida");
    setBusyId(null);
  };

  if (!isSysadmin) {
    return (
      <div className="text-center py-20">
        <h1 className="font-heading font-bold text-2xl">Acesso restrito</h1>
        <p className="text-muted-foreground mt-2">Apenas o sysadmin pode acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading font-bold text-3xl">Contas</h1>
          <p className="text-muted-foreground mt-1">
            Aprove ou recuse novas contas. Sysadmin: eros@guaramedia.com.br
          </p>
        </div>
        <Button
          variant="outline"
          disabled={!rows.length}
          onClick={() =>
            downloadCSV(
              `contas-${Date.now()}.csv`,
              rows.map((r) => ({
                email: r.email,
                full_name: r.full_name ?? "",
                status: r.status,
                created_at: new Date(r.created_at).toLocaleString("pt-BR"),
                approved_at: r.approved_at ? new Date(r.approved_at).toLocaleString("pt-BR") : "",
              })),
              [
                { key: "email", label: "Email" },
                { key: "full_name", label: "Nome" },
                { key: "status", label: "Status" },
                { key: "created_at", label: "Criado em" },
                { key: "approved_at", label: "Aprovado em" },
              ]
            )
          }
        >
          <Download size={16} className="mr-2" /> CSV
        </Button>
      </div>

      {loading && !hasLoaded ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="animate-spin" size={16} /> Carregando...
        </div>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Email</th>
                <th className="p-3">Status</th>
                <th className="p-3">Criado em</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground">
                    Nenhuma conta encontrada.
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.user_id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">{p.email}</div>
                      {p.full_name && (
                        <div className="text-xs text-muted-foreground">{p.full_name}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(p.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        {p.status !== "approved" && (
                          <Button
                            size="sm"
                            onClick={() => setStatus(p, "approved")}
                            disabled={busyId === p.user_id}
                          >
                            <Check size={14} /> Aprovar
                          </Button>
                        )}
                        {p.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setStatus(p, "rejected")}
                            disabled={busyId === p.user_id}
                          >
                            <X size={14} /> Recusar
                          </Button>
                        )}
                        {p.status === "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => grantAdmin(p)}
                            disabled={busyId === p.user_id}
                            title="Conceder permissão de admin"
                          >
                            <ShieldCheck size={14} /> Tornar admin
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AccountsList;

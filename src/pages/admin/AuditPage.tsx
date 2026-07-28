import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const actionColor: Record<string, string> = {
  create: "default",
  update: "secondary",
  delete: "destructive",
};

const entityLabel: Record<string, string> = {
  posts: "Post",
  jobs: "Vaga",
  articles: "Artigo",
};

const actionLabel: Record<string, string> = {
  create: "Criou",
  update: "Editou",
  delete: "Excluiu",
};

const AuditPage = () => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as any[];
    },
  });

  return (
    <div>
      <h1 className="font-heading font-bold text-3xl">Auditoria</h1>
      <p className="text-muted-foreground mt-1">Últimas 200 ações dos administradores</p>

      <div className="mt-8 bg-card rounded-2xl shadow-card divide-y">
        {isLoading ? (
          <p className="p-6 text-muted-foreground">Carregando...</p>
        ) : logs.length === 0 ? (
          <p className="p-6 text-muted-foreground">Nenhuma ação registrada ainda.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-center gap-4 p-4">
              <Badge variant={(actionColor[log.action] || "secondary") as any}>
                {actionLabel[log.action] || log.action}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {entityLabel[log.entity] || log.entity}: {log.entity_title || log.entity_id || "—"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {log.user_email || "sistema"} · {new Date(log.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AuditPage;

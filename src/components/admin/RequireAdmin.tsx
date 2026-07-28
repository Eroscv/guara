import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, isSysadmin, profileStatus, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Sysadmin bypasses approval and role checks
  if (isSysadmin) return <>{children}</>;

  if (profileStatus === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <h1 className="font-heading font-bold text-2xl">Conta aguardando aprovação</h1>
          <p className="text-muted-foreground mt-2">
            Sua conta foi criada e está aguardando a aprovação do administrador. Você receberá
            acesso assim que for liberada.
          </p>
          <Button className="mt-6" onClick={signOut}>Sair</Button>
        </div>
      </div>
    );
  }

  if (profileStatus === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <h1 className="font-heading font-bold text-2xl">Acesso recusado</h1>
          <p className="text-muted-foreground mt-2">
            Sua solicitação de acesso foi recusada pelo administrador.
          </p>
          <Button className="mt-6" onClick={signOut}>Sair</Button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="font-heading font-bold text-2xl">Acesso negado</h1>
          <p className="text-muted-foreground mt-2">
            Sua conta não tem permissão de admin. Peça para um administrador te promover.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireAdmin;

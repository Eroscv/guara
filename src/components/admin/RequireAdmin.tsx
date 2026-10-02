import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

// O servidor só dá sessão a contas admin e ativas, e confere de novo a cada
// chamada; aqui basta saber se há alguém logado.
const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground" role="status">
        Carregando...
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  return <>{children}</>;
};

export default RequireAdmin;

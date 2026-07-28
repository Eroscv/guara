import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileText, Briefcase, BookOpen, LogOut, ShieldAlert, ExternalLink, Inbox, Users, UserCog } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/leads", icon: Inbox, label: "Leads" },
  { to: "/admin/applications", icon: Users, label: "Candidaturas" },
  { to: "/admin/posts", icon: FileText, label: "Posts do Blog" },
  { to: "/admin/jobs", icon: Briefcase, label: "Vagas" },
  { to: "/admin/articles", icon: BookOpen, label: "Artigos" },
  { to: "/admin/audit", icon: ShieldAlert, label: "Auditoria" },
  { to: "/admin/accounts", icon: UserCog, label: "Contas", sysadminOnly: true },
];

const AdminLayout = () => {
  const { user, signOut, isSysadmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="p-6 border-b">
          <h2 className="font-heading font-bold text-lg">Painel Admin</h2>
          <p className="text-xs text-muted-foreground mt-1 truncate">{user?.email}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.filter((i) => !i.sysadminOnly || isSysadmin).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t space-y-1">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <a href="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink size={18} /> Ver site
            </a>
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut size={18} /> Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

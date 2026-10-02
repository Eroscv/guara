import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, MessageSquare, Mail, Download, Users, Newspaper, Wrench, Briefcase,
  Bot, UserCog, ExternalLink, LogOut, type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useAdminTheme } from "./helpers";

type Item = {
  to: string;
  label: string;
  icon: LucideIcon;
  group: string;
  desc: string;
  end?: boolean;
  /** Telas que já têm o próprio título (Contas). */
  ownHeader?: boolean;
};

const NAV: Item[] = [
  { to: "/admin", end: true, label: "Resumo", icon: LayoutDashboard, group: "Visão geral", desc: "Como foi a semana em números." },
  { to: "/admin/leads", label: "Contatos", icon: MessageSquare, group: "Cadastros", desc: "Pessoas que pediram contato pelo site." },
  { to: "/admin/newsletter", label: "Newsletter", icon: Mail, group: "Cadastros", desc: "Inscritos para receber novidades." },
  { to: "/admin/downloads", label: "Downloads", icon: Download, group: "Cadastros", desc: "Quem baixou as ferramentas." },
  { to: "/admin/applications", label: "Candidaturas", icon: Users, group: "Cadastros", desc: "Candidatos às vagas e seus currículos." },
  { to: "/admin/posts", label: "Blog", icon: Newspaper, group: "Conteúdo", desc: "Escreva, agende e arquive posts." },
  { to: "/admin/tools", label: "Ferramentas", icon: Wrench, group: "Conteúdo", desc: "Materiais para download no site." },
  { to: "/admin/jobs", label: "Vagas", icon: Briefcase, group: "Conteúdo", desc: "Publique e feche vagas de talentos." },
  { to: "/admin/api-keys", label: "API", icon: Bot, group: "Integração", desc: "Chaves e manual para agentes de IA." },
  { to: "/admin/accounts", label: "Contas", icon: UserCog, group: "Sistema", desc: "", ownHeader: true },
];

const SITE_URL = "/versoes/v16-mascote/";

const FOCUS = "outline-none focus-visible:ring-[3px] focus-visible:ring-brand-orange";

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="rounded-full border-2 border-foreground bg-accent px-3 py-1 font-display text-sm font-extrabold shadow-brut-sm">GUARÁ</span>
      <span className="font-display text-lg font-extrabold">Painel</span>
    </div>
  );
}

const AdminShell = () => {
  useAdminTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { pathname } = useLocation();

  const items = NAV;
  const groups = Array.from(new Set(items.map((i) => i.group)));
  // Seção atual = a rota mais específica que bate com o endereço
  const current =
    [...items].sort((a, b) => b.to.length - a.to.length).find((i) => (i.end ? pathname === i.to : pathname === i.to || pathname.startsWith(`${i.to}/`))) ??
    items[0]!;

  const handleSignOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await logout();
    navigate("/admin/login");
  };

  const navLink = (i: Item, compact = false) => (
    <NavLink
      key={i.to}
      to={i.to}
      end={i.end}
      className={({ isActive }) =>
        `group flex items-center gap-2.5 whitespace-nowrap rounded-xl border-2 text-sm font-bold transition ${FOCUS} ${
          compact ? "shrink-0 px-3 py-1.5" : "w-full px-3 py-1.5"
        } ${isActive ? "border-foreground bg-accent shadow-brut-sm" : "border-transparent text-foreground/75 hover:border-foreground/20 hover:bg-card hover:text-foreground"}`
      }
    >
      {({ isActive }) => (
        <>
          <i.icon className={`size-4 ${isActive ? "" : "opacity-70 group-hover:opacity-100"}`} aria-hidden />
          {i.label}
        </>
      )}
    </NavLink>
  );

  return (
    <div className="admin-bg min-h-screen text-foreground">
      <div className="mx-auto flex max-w-7xl gap-8 px-4 lg:px-6">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col py-6 lg:flex">
          <Brand />
          <nav className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1" aria-label="Seções do painel">
            {groups.map((g) => (
              <div key={g} className="space-y-1">
                <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{g}</p>
                {items.filter((i) => i.group === g).map((i) => navLink(i))}
              </div>
            ))}
          </nav>
          <div className="space-y-2 rounded-2xl border-2 border-foreground bg-card p-3 shadow-brut">
            <p className="truncate text-xs text-muted-foreground" title={user?.email ?? ""}>{user?.nome || user?.email}</p>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <a href={SITE_URL} target="_blank" rel="noreferrer"><ExternalLink /> Site</a>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut} aria-label="Sair"><LogOut /></Button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 -mx-4 border-b-2 border-foreground bg-background/95 px-4 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-3 py-3">
              <Brand />
              <div className="flex items-center gap-1">
                <Button asChild variant="ghost" size="icon" aria-label="Ver site">
                  <a href={SITE_URL} target="_blank" rel="noreferrer"><ExternalLink /></a>
                </Button>
                <Button variant="outline" size="icon" onClick={handleSignOut} aria-label="Sair"><LogOut /></Button>
              </div>
            </div>
            <nav className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-3" aria-label="Seções do painel">
              {items.map((i) => navLink(i, true))}
            </nav>
          </header>

          <main className="py-6 lg:py-10">
            {!current.ownHeader && (
              <div className="mb-6 flex items-center gap-4 border-b-2 border-dashed border-foreground/20 pb-6">
                <span className="hidden size-12 place-items-center rounded-2xl border-2 border-foreground bg-accent shadow-brut sm:grid">
                  <current.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-orange">{current.group}</p>
                  <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">{current.label}</h1>
                  <p className="text-sm text-muted-foreground">{current.desc}</p>
                </div>
              </div>
            )}
            <div key={current.to} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminShell;

import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Briefcase, Download, Mail, MessageSquare, Newspaper, Users, type LucideIcon } from "lucide-react";
import { adminApi } from "@/components/admin/helpers";
import { errorMessage } from "@/components/admin/contentConfig";
import { Button } from "@/components/ui/button";

// GET /summary da API da Guará (formato do manual).
type Summary = {
  leads: { total: number; last_7_days: number };
  newsletter: { total: number; last_7_days: number };
  tool_downloads: { total: number; last_7_days: number };
  applications: { total: number; last_7_days: number };
  applications_pending: number;
  scheduled_posts: number;
  scheduled_jobs: number;
};

const CARDS: { key: "leads" | "newsletter" | "tool_downloads" | "applications"; label: string; icon: LucideIcon; to: string }[] = [
  { key: "leads", label: "Contatos", icon: MessageSquare, to: "/admin/leads" },
  { key: "newsletter", label: "Newsletter", icon: Mail, to: "/admin/newsletter" },
  { key: "tool_downloads", label: "Downloads", icon: Download, to: "/admin/downloads" },
  { key: "applications", label: "Candidaturas", icon: Users, to: "/admin/applications" },
];

const CARD = "group flex flex-col rounded-2xl border-2 border-foreground bg-card p-5 text-left shadow-brut outline-none transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-md focus-visible:ring-[3px] focus-visible:ring-brand-orange";

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

const AdminDashboard = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "summary"],
    queryFn: () => adminApi<Summary>("/summary"),
    retry: false,
  });

  if (error) {
    return (
      <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-foreground bg-card p-4 shadow-brut">
        <p className="text-sm font-semibold">{errorMessage(error, "Não foi possível carregar o resumo.")}</p>
        <Button size="sm" variant="outline" onClick={() => refetch()}>Tentar de novo</Button>
      </div>
    );
  }

  const pending = data?.applications_pending ?? 0;
  const scheduled: { n: number; one: string; many: string; icon: LucideIcon; to: string }[] = [
    { n: data?.scheduled_posts ?? 0, one: "post agendado", many: "posts agendados", icon: Newspaper, to: "/admin/posts" },
    { n: data?.scheduled_jobs ?? 0, one: "vaga agendada", many: "vagas agendadas", icon: Briefcase, to: "/admin/jobs" },
  ];

  return (
    <section className="space-y-6">
      {pending > 0 && (
        <Link to="/admin/applications" className="flex w-full items-center justify-between gap-4 rounded-2xl border-2 border-foreground bg-brand-orange p-4 text-left font-bold text-primary-foreground shadow-brut outline-none transition hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-foreground">
          <span><span className="font-display text-2xl">{pending}</span> {plural(pending, "candidatura nova aguardando análise", "candidaturas novas aguardando análise")}</span>
          <ArrowRight className="size-5 shrink-0" aria-hidden />
        </Link>
      )}

      <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Últimos 7 dias</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((c) => {
          if (isLoading || !data) return <div key={c.key} className="h-40 animate-pulse rounded-2xl border-2 border-foreground/20 bg-card" />;
          const Icon = c.icon;
          const d = data[c.key];
          return (
            <Link key={c.key} to={c.to} className={CARD}>
              <span className="grid size-10 place-items-center rounded-xl border-2 border-foreground bg-accent"><Icon className="size-4" aria-hidden /></span>
              <p className="mt-4 font-display text-5xl font-extrabold leading-none">{d.last_7_days}</p>
              <p className="mt-1 font-bold">{c.label}</p>
              <p className="mt-3 flex items-center justify-between border-t-2 border-dashed border-foreground/15 pt-3 text-xs text-muted-foreground">
                <span>Total: <b className="text-foreground">{d.total}</b></span>
                <ArrowRight className="size-3.5 opacity-0 transition group-hover:opacity-100" aria-hidden />
              </p>
            </Link>
          );
        })}
      </div>

      <p className="pt-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">Agendados</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {scheduled.map(({ n, one, many, icon: Icon, to }) => (
          <Link key={to} to={to} className="group flex items-center gap-3 rounded-2xl border-2 border-foreground bg-card p-4 outline-none transition hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-brand-orange">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-foreground bg-background"><Icon className="size-4" aria-hidden /></span>
            <span><span className="font-display text-3xl font-extrabold leading-none">{data ? n : "—"}</span> <span className="text-sm font-semibold">{plural(n, one, many)}</span></span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default AdminDashboard;

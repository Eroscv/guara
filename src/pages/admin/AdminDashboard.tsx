import { Link } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, Briefcase, Download, Mail, MessageSquare, Minus, Newspaper, Users,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminApi } from "@/components/admin/helpers";

type Totals = { total: number; week: number; prev: number };

const DAY = 864e5;

// Contagem no Supabase (a sessão do admin passa pelo RLS).
async function supabaseTotals(table: "leads" | "applications"): Promise<Totals> {
  const count = async (from?: string, to?: string) => {
    let q = (supabase as any).from(table).select("id", { count: "exact", head: true });
    if (from) q = q.gte("created_at", from);
    if (to) q = q.lt("created_at", to);
    const { count: n, error } = await q;
    if (error) throw error;
    return (n ?? 0) as number;
  };
  const week = new Date(Date.now() - 7 * DAY).toISOString();
  const prev = new Date(Date.now() - 14 * DAY).toISOString();
  const [w, p, t] = await Promise.all([count(week), count(prev, week), count()]);
  return { week: w, prev: p, total: t };
}

async function liveCount(table: "posts" | "jobs" | "articles"): Promise<number> {
  const live = table === "jobs" ? "open" : "published";
  const { count, error } = await (supabase as any).from(table).select("id", { count: "exact", head: true }).eq("status", live);
  if (error) throw error;
  return count ?? 0;
}

const CARDS: { id: string; label: string; icon: LucideIcon; to: string; source: "supabase" | "postgres"; table: string }[] = [
  { id: "leads", label: "Contatos", icon: MessageSquare, to: "/admin/leads", source: "supabase", table: "leads" },
  { id: "newsletter", label: "Newsletter", icon: Mail, to: "/admin/newsletter", source: "postgres", table: "newsletter" },
  { id: "tool_downloads", label: "Downloads", icon: Download, to: "/admin/downloads", source: "postgres", table: "tool_downloads" },
  { id: "applications", label: "Candidaturas", icon: Users, to: "/admin/applications", source: "supabase", table: "applications" },
];

const LIVE: { table: "posts" | "jobs" | "articles"; one: string; many: string; icon: LucideIcon; to: string }[] = [
  { table: "posts", one: "post no ar", many: "posts no ar", icon: Newspaper, to: "/admin/posts" },
  { table: "jobs", one: "vaga aberta", many: "vagas abertas", icon: Briefcase, to: "/admin/jobs" },
  { table: "articles", one: "artigo no ar", many: "artigos no ar", icon: BookOpen, to: "/admin/articles" },
];

const CARD = "group flex flex-col rounded-2xl border-2 border-foreground bg-card p-5 text-left shadow-brut outline-none transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-md focus-visible:ring-[3px] focus-visible:ring-brand-orange";

const AdminDashboard = () => {
  // Newsletter e downloads vêm do Vercel Postgres numa chamada só.
  const pg = useQuery({ queryKey: ["admin", "pg-counts"], queryFn: () => adminApi<Record<string, Totals>>("/counts"), retry: false });
  const leads = useQuery({ queryKey: ["admin", "stat", "leads"], queryFn: () => supabaseTotals("leads") });
  const apps = useQuery({ queryKey: ["admin", "stat", "applications"], queryFn: () => supabaseTotals("applications") });
  const liveQs = useQueries({ queries: LIVE.map((l) => ({ queryKey: ["admin", "live", l.table], queryFn: () => liveCount(l.table) })) });
  const live = LIVE.map((l, i) => ({ ...l, q: liveQs[i]! }));

  const stat = (c: (typeof CARDS)[number]) => {
    if (c.id === "leads") return { q: leads, d: leads.data };
    if (c.id === "applications") return { q: apps, d: apps.data };
    return { q: pg, d: pg.data?.[c.table] };
  };

  const pending = apps.data?.week ?? 0;

  return (
    <section className="space-y-6">
      {pending > 0 && (
        <Link to="/admin/applications" className="flex w-full items-center justify-between gap-4 rounded-2xl border-2 border-foreground bg-brand-orange p-4 text-left font-bold text-primary-foreground shadow-brut outline-none transition hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-foreground">
          <span><span className="font-display text-2xl">{pending}</span> candidatura(s) nova(s) nos últimos 7 dias</span>
          <ArrowRight className="size-5 shrink-0" aria-hidden />
        </Link>
      )}

      <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Últimos 7 dias</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((c) => {
          const { q, d } = stat(c);
          if (q.isLoading) return <div key={c.id} className="h-40 animate-pulse rounded-2xl border-2 border-foreground/20 bg-card" />;
          const Icon = c.icon;
          const diff = d ? d.week - d.prev : 0;
          const Trend = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus;
          return (
            <Link key={c.id} to={c.to} className={CARD}>
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl border-2 border-foreground bg-accent"><Icon className="size-4" aria-hidden /></span>
                {d && (
                  <span className={`inline-flex items-center gap-1 rounded-full border-2 border-foreground px-2 py-0.5 text-xs font-bold ${diff > 0 ? "bg-accent" : diff < 0 ? "bg-muted" : "bg-card"}`}>
                    <Trend className="size-3" aria-hidden />{diff === 0 ? "igual" : `${diff > 0 ? "+" : ""}${diff}`}
                  </span>
                )}
              </div>
              <p className="mt-4 font-display text-5xl font-extrabold leading-none">{d ? d.week : "—"}</p>
              <p className="mt-1 font-bold">{c.label}</p>
              <p className="mt-3 flex items-center justify-between border-t-2 border-dashed border-foreground/15 pt-3 text-xs text-muted-foreground">
                {d ? <span>Total: <b className="text-foreground">{d.total}</b> · vs. semana anterior</span> : <span>Não foi possível carregar.</span>}
                <ArrowRight className="size-3.5 opacity-0 transition group-hover:opacity-100" aria-hidden />
              </p>
            </Link>
          );
        })}
      </div>

      <p className="pt-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">No site agora</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {live.map(({ table, one, many, icon: Icon, to, q }) => (
          <Link key={table} to={to} className="group flex items-center gap-3 rounded-2xl border-2 border-foreground bg-card p-4 outline-none transition hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-brand-orange">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-foreground bg-background"><Icon className="size-4" aria-hidden /></span>
            <span><span className="font-display text-3xl font-extrabold leading-none">{q.data ?? "—"}</span> <span className="text-sm font-semibold">{q.data === 1 ? one : many}</span></span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default AdminDashboard;

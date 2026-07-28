import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText, Briefcase, BookOpen, Users, Inbox, UserCog, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const daysAgo = (n: number) => {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - n);
  return d;
};

const useCount = (
  table: "posts" | "jobs" | "articles" | "leads" | "applications" | "profiles",
  filter?: (q: any) => any
) =>
  useQuery({
    queryKey: ["count", table, filter?.toString() ?? ""],
    queryFn: async () => {
      let q: any = supabase.from(table).select("*", { count: "exact", head: true });
      if (filter) q = filter(q);
      const { count } = await q;
      return count ?? 0;
    },
  });

const useLeadsTimeseries = () =>
  useQuery({
    queryKey: ["leads-timeseries-30d"],
    queryFn: async () => {
      const since = daysAgo(29).toISOString();
      const { data } = await supabase
        .from("leads")
        .select("created_at, source")
        .gte("created_at", since)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

const useApplicationsByJob = () =>
  useQuery({
    queryKey: ["applications-by-job"],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("job:jobs(title)")
        .limit(1000);
      const counts = new Map<string, number>();
      (data ?? []).forEach((r: any) => {
        const t = r.job?.title ?? "—";
        counts.set(t, (counts.get(t) ?? 0) + 1);
      });
      return Array.from(counts.entries())
        .map(([title, count]) => ({ title, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    },
  });

const KpiCard = ({
  to,
  icon: Icon,
  label,
  value,
  hint,
  color,
}: {
  to?: string;
  icon: any;
  label: string;
  value: number | string;
  hint?: string;
  color: string;
}) => {
  const inner = (
    <div className="bg-card rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all h-full">
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white`}
        >
          <Icon size={18} />
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-4">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
  return to ? (
    <Link to={to} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
};

const AdminDashboard = () => {
  const { isSysadmin } = useAuth();

  const todayIso = startOfDay(new Date()).toISOString();
  const weekIso = daysAgo(6).toISOString();
  const monthIso = daysAgo(29).toISOString();

  const leadsTotal = useCount("leads");
  const leadsToday = useCount("leads", (q) => q.gte("created_at", todayIso));
  const leadsWeek = useCount("leads", (q) => q.gte("created_at", weekIso));
  const leadsMonth = useCount("leads", (q) => q.gte("created_at", monthIso));

  const appsTotal = useCount("applications");
  const appsWeek = useCount("applications", (q) => q.gte("created_at", weekIso));

  const jobsOpen = useCount("jobs", (q) => q.eq("status", "open"));
  const articlesPub = useCount("articles", (q) => q.eq("status", "published"));
  const postsPub = useCount("posts", (q) => q.eq("status", "published"));
  const pendingAccounts = useCount("profiles", (q) => q.eq("status", "pending"));

  const { data: leadsTs } = useLeadsTimeseries();
  const { data: appsByJob } = useApplicationsByJob();

  const chartData = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = daysAgo(i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = 0;
    }
    (leadsTs ?? []).forEach((l: any) => {
      const key = new Date(l.created_at).toISOString().slice(0, 10);
      if (key in buckets) buckets[key] += 1;
    });
    return Object.entries(buckets).map(([date, count]) => ({
      date: date.slice(5),
      count,
    }));
  }, [leadsTs]);

  const sourceData = useMemo(() => {
    const counts = new Map<string, number>();
    (leadsTs ?? []).forEach((l: any) => {
      const s = l.source || "direto";
      counts.set(s, (counts.get(s) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [leadsTs]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading font-bold text-3xl">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral de leads, candidaturas e conteúdo</p>
      </div>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          to="/admin/leads"
          icon={Users}
          label="Leads (total)"
          value={leadsTotal.data ?? "—"}
          hint={`${leadsToday.data ?? 0} hoje · ${leadsWeek.data ?? 0} 7d · ${leadsMonth.data ?? 0} 30d`}
          color="from-blue-500 to-blue-600"
        />
        <KpiCard
          to="/admin/applications"
          icon={Inbox}
          label="Candidaturas"
          value={appsTotal.data ?? "—"}
          hint={`${appsWeek.data ?? 0} nos últimos 7 dias`}
          color="from-amber-500 to-amber-600"
        />
        <KpiCard
          to="/admin/jobs"
          icon={Briefcase}
          label="Vagas abertas"
          value={jobsOpen.data ?? "—"}
          color="from-emerald-500 to-emerald-600"
        />
        {isSysadmin && (
          <KpiCard
            to="/admin/accounts"
            icon={UserCog}
            label="Contas pendentes"
            value={pendingAccounts.data ?? "—"}
            hint="Aguardando aprovação"
            color="from-rose-500 to-rose-600"
          />
        )}
        <KpiCard
          to="/admin/posts"
          icon={FileText}
          label="Posts publicados"
          value={postsPub.data ?? "—"}
          color="from-sky-500 to-sky-600"
        />
        <KpiCard
          to="/admin/articles"
          icon={BookOpen}
          label="Artigos publicados"
          value={articlesPub.data ?? "—"}
          color="from-purple-500 to-purple-600"
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-primary" />
            <h2 className="font-heading font-semibold">Leads — últimos 30 dias</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-card">
          <h2 className="font-heading font-semibold mb-4">Leads por origem (30d)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData} layout="vertical" margin={{ left: 8, right: 12 }}>
                <XAxis type="number" allowDecimals={false} fontSize={11} />
                <YAxis dataKey="source" type="category" width={90} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-card">
        <h2 className="font-heading font-semibold mb-4">Top 5 vagas por candidaturas</h2>
        {!appsByJob || appsByJob.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma candidatura ainda.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appsByJob} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="title" fontSize={11} interval={0} angle={-12} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

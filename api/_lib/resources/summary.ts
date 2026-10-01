import type { SupabaseClient } from "@supabase/supabase-js";

async function countSince(db: SupabaseClient, table: string, sinceIso: string, extra?: (q: any) => any) {
  let q = db.from(table).select("id", { count: "exact", head: true });
  if (extra) q = extra(q);
  const { count } = await q;
  let qSince = db.from(table).select("id", { count: "exact", head: true }).gte("created_at", sinceIso);
  if (extra) qSince = extra(qSince);
  const { count: count7 } = await qSince;
  return { total: count ?? 0, last_7_days: count7 ?? 0 };
}

export async function getSummary(db: SupabaseClient) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const nowIso = new Date().toISOString();

  const [leads, newsletter, toolDownloads, applications, pending, scheduledPosts, scheduledJobs] = await Promise.all([
    countSince(db, "leads", sevenDaysAgo),
    countSince(db, "newsletter", sevenDaysAgo),
    countSince(db, "tool_downloads", sevenDaysAgo),
    countSince(db, "applications", sevenDaysAgo),
    db.from("applications").select("id", { count: "exact", head: true }).eq("status", "novo"),
    db.from("posts").select("id", { count: "exact", head: true }).eq("status", "published").eq("archived", false).gt("scheduled_at", nowIso),
    db.from("jobs").select("id", { count: "exact", head: true }).eq("status", "open").eq("archived", false).gt("scheduled_at", nowIso),
  ]);

  return {
    leads,
    newsletter,
    tool_downloads: toolDownloads,
    applications,
    applications_pending: pending.count ?? 0,
    scheduled_posts: scheduledPosts.count ?? 0,
    scheduled_jobs: scheduledJobs.count ?? 0,
  };
}

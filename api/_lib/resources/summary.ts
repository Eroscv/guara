import type { SupabaseClient } from "@supabase/supabase-js";
import { sql } from "../db";

async function countSinceSupabase(db: SupabaseClient, table: string, sinceIso: string) {
  const { count } = await db.from(table).select("id", { count: "exact", head: true });
  const { count: count7 } = await db.from(table).select("id", { count: "exact", head: true }).gte("created_at", sinceIso);
  return { total: count ?? 0, last_7_days: count7 ?? 0 };
}

async function countSincePostgres(table: "newsletter" | "tool_downloads", sinceIso: string) {
  const totalQ = table === "newsletter" ? sql`select count(*)::int as n from newsletter` : sql`select count(*)::int as n from tool_downloads`;
  const sinceQ =
    table === "newsletter"
      ? sql`select count(*)::int as n from newsletter where created_at >= ${sinceIso}`
      : sql`select count(*)::int as n from tool_downloads where created_at >= ${sinceIso}`;
  const [{ rows: totalRows }, { rows: sinceRows }] = await Promise.all([totalQ, sinceQ]);
  return { total: totalRows[0]?.n ?? 0, last_7_days: sinceRows[0]?.n ?? 0 };
}

export async function getSummary(db: SupabaseClient) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const nowIso = new Date().toISOString();

  const [leads, newsletter, toolDownloads, applications, pending, scheduledPosts, scheduledJobs] = await Promise.all([
    countSinceSupabase(db, "leads", sevenDaysAgo),
    countSincePostgres("newsletter", sevenDaysAgo).catch(() => ({ total: 0, last_7_days: 0 })),
    countSincePostgres("tool_downloads", sevenDaysAgo).catch(() => ({ total: 0, last_7_days: 0 })),
    countSinceSupabase(db, "applications", sevenDaysAgo),
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

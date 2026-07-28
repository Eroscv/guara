// Runs before vite dev and vite build (predev/prebuild hooks); writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { tools } from "../src/data/mockData";

const BASE_URL = "https://prospectpath-studio.lovable.app";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://cmbxrmtncrfhdcpbjxtx.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtYnhybXRuY3JmaGRjcGJqeHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0ODA1MjksImV4cCI6MjA5NTA1NjUyOX0.uzPevwziHY2ilNdP-ZnN6C9K7hq1Xs7u88_FTG3Awi8";

interface Entry {
  path: string;
  lastmod?: string;
  changefreq?: "daily" | "weekly" | "monthly";
  priority?: string;
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const entries: Entry[] = [
    { path: "/", changefreq: "weekly", priority: "1.0" },
    { path: "/blog", changefreq: "daily", priority: "0.9" },
    { path: "/talentos", changefreq: "daily", priority: "0.9" },
    { path: "/artigos", changefreq: "weekly", priority: "0.8" },
    { path: "/ferramentas", changefreq: "weekly", priority: "0.7" },
    { path: "/contato", changefreq: "monthly", priority: "0.6" },
  ];

  tools.forEach((t) =>
    entries.push({ path: `/ferramentas/${t.slug}`, changefreq: "monthly", priority: "0.6" }),
  );


  try {
    const [{ data: posts }, { data: jobs }, { data: articles }] = await Promise.all([
      supabase.from("posts").select("slug,updated_at"),
      supabase.from("jobs").select("id,updated_at"),
      supabase.from("articles").select("slug,updated_at"),
    ]);

    posts?.forEach((p: { slug: string; updated_at: string }) =>
      entries.push({ path: `/blog/${p.slug}`, lastmod: p.updated_at?.slice(0, 10), changefreq: "monthly", priority: "0.7" }),
    );
    jobs?.forEach((j: { id: string; updated_at: string }) =>
      entries.push({ path: `/talentos/${j.id}`, lastmod: j.updated_at?.slice(0, 10), changefreq: "weekly", priority: "0.7" }),
    );
    articles?.forEach((a: { slug: string; updated_at: string }) =>
      entries.push({ path: `/artigos/${a.slug}`, lastmod: a.updated_at?.slice(0, 10), changefreq: "monthly", priority: "0.7" }),
    );
  } catch (e) {
    console.warn("Could not fetch dynamic entries:", e);
  }

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...entries.map((e) =>
      [
        `  <url>`,
        `    <loc>${BASE_URL}${e.path}</loc>`,
        e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
        e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
        e.priority ? `    <priority>${e.priority}</priority>` : null,
        `  </url>`,
      ].filter(Boolean).join("\n"),
    ),
    `</urlset>`,
  ].join("\n");

  writeFileSync(resolve("public/sitemap.xml"), xml);
  console.log(`sitemap.xml written (${entries.length} entries)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(0); // não bloqueia build
});

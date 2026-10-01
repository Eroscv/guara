-- ===================================================================
-- Schema do Vercel Postgres pra /api/public/v1 — só os 4 recursos que
-- não existiam em lugar nenhum do site antes desta API (api_keys, tools,
-- newsletter, tool_downloads). leads/applications/posts/jobs continuam
-- no Supabase, de onde o site e o admin já leem.
--
-- Como rodar, depois de criar o banco em Vercel → guara → Storage →
-- Create Database → Postgres:
--   1) Vercel → guara → Storage → o banco criado → aba "Query" → cole
--      este arquivo inteiro e rode; OU
--   2) localmente: psql "$POSTGRES_URL" -f db/vercel-postgres-schema.sql
--      (POSTGRES_URL aparece em Storage → o banco → .env.local tab)
-- ===================================================================

create extension if not exists pgcrypto;

-- Chaves de API (gm_ + 40 hex). Só o hash (sha256) fica salvo; a chave em
-- si só é mostrada uma vez, na hora de criar, pelo admin.
create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  created_at timestamptz not null default now(),
  created_by text,
  last_used_at timestamptz,
  revoked_at timestamptz
);

-- newsletter (inscritos)
create table if not exists newsletter (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  pagina text,
  created_at timestamptz not null default now()
);

-- tool_downloads (quem baixou cada ferramenta)
create table if not exists tool_downloads (
  id uuid primary key default gen_random_uuid(),
  tool_slug text not null,
  tool_title text,
  nome text not null,
  email text not null,
  empresa text,
  cargo text,
  created_at timestamptz not null default now()
);

-- tools (ferramentas) — arquivo fica no Vercel Blob; aqui só o link.
create table if not exists tools (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  category text not null default '',
  image text,
  benefits text[] not null default '{}',
  published boolean not null default false,
  file_name text,
  file_url text,
  file_content_type text,
  archived boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tool_downloads_tool_slug_idx on tool_downloads (tool_slug);
create index if not exists newsletter_email_idx on newsletter (email);

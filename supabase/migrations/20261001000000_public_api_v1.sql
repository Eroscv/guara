-- ===================================================================
-- API pública v1 (/api/public/v1) — tabelas, colunas extras e buckets
-- que o endpoint (em api/public/v1/[...route].ts) precisa.
-- O servidor dessa API usa a service role key (bypassa RLS); as
-- políticas abaixo cobrem o acesso via navegador (site e admin).
-- ===================================================================

-- 1) Chaves de API (gm_ + 40 hex). Só o hash (sha256) fica salvo;
--    a chave em si só é mostrada uma vez, na hora de criar, pelo admin.
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key_prefix text not null,        -- ex.: "gm_3f9a2b1c" — só pra identificar na lista
  key_hash text not null unique,   -- sha256 hex da chave completa
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  last_used_at timestamptz,
  revoked_at timestamptz
);
alter table public.api_keys enable row level security;
create policy "Admins manage api keys" on public.api_keys
  for all to authenticated
  using (has_role(auth.uid(), 'admin'))
  with check (has_role(auth.uid(), 'admin'));
-- sem política pra anon: só admin (via browser) e o servidor (service role) tocam nessa tabela.

-- 2) leads: a tabela existente tem o formato do formulário de contato
--    (email, telefone, empresa, segmento, mensagem). O manual da API
--    usa o formato do formulário de landing page (whatsapp, site,
--    faturamento, solucao, extra). Em vez de renomear e quebrar o
--    formulário de contato atual, adiciono as colunas que faltam.
alter table public.leads
  add column if not exists whatsapp text,
  add column if not exists site text,
  add column if not exists faturamento text,
  add column if not exists solucao text,
  add column if not exists extra text;

-- 3) applications: a API permite mover o candidato de etapa (status),
--    anotar (notes) e, pra gerar o link de download assinado por 1h,
--    precisa do caminho do arquivo no bucket (resume_path) — hoje só
--    existe resume_url (string antiga, que pode já estar quebrada
--    porque o bucket "resumes" é privado).
create type public.application_status as enum ('novo','analise','entrevista','aprovado','recusado');
alter table public.applications
  add column if not exists status public.application_status not null default 'novo',
  add column if not exists notes text,
  add column if not exists resume_path text;

-- 4) newsletter (inscritos — ainda sem formulário próprio no site; a
--    tabela existe pra API já poder listar/alterar/apagar assim que
--    um formulário passar a gravar aqui).
create table public.newsletter (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  pagina text,
  created_at timestamptz not null default now()
);
alter table public.newsletter enable row level security;
create policy "Anyone can subscribe to the newsletter" on public.newsletter
  for insert to anon, authenticated
  with check (email is not null and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254);
create policy "Admins read newsletter" on public.newsletter for select to authenticated using (has_role(auth.uid(), 'admin'));
create policy "Admins update newsletter" on public.newsletter for update to authenticated using (has_role(auth.uid(), 'admin'));
create policy "Admins delete newsletter" on public.newsletter for delete to authenticated using (has_role(auth.uid(), 'admin'));

-- 5) tool_downloads (quem baixou cada ferramenta — mesmo papel que
--    "applications" tem pras vagas).
create table public.tool_downloads (
  id uuid primary key default gen_random_uuid(),
  tool_slug text not null,
  tool_title text,
  nome text not null,
  email text not null,
  empresa text,
  cargo text,
  created_at timestamptz not null default now()
);
alter table public.tool_downloads enable row level security;
create policy "Anyone can register a tool download" on public.tool_downloads
  for insert to anon, authenticated
  with check (nome is not null and length(btrim(nome)) >= 2 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
create policy "Admins read tool downloads" on public.tool_downloads for select to authenticated using (has_role(auth.uid(), 'admin'));
create policy "Admins update tool downloads" on public.tool_downloads for update to authenticated using (has_role(auth.uid(), 'admin'));
create policy "Admins delete tool downloads" on public.tool_downloads for delete to authenticated using (has_role(auth.uid(), 'admin'));

-- 6) tools (ferramentas) — hoje é uma lista estática no código
--    (scripts/gen-versoes.mjs e as páginas V16); vira conteúdo de
--    verdade, criável pela API (e, no futuro, por um editor no admin,
--    por isso já inclui política de admin).
create table public.tools (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  category text not null default '',
  image text,
  benefits text[] not null default '{}',
  published boolean not null default false,
  file_name text,
  file_path text,          -- caminho no bucket tool-files, quando enviado via file_base64
  file_url text,           -- link externo, quando enviado via file_url
  file_content_type text,
  archived boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tools enable row level security;
create trigger tools_updated_at before update on public.tools for each row execute function public.set_updated_at();
create policy "Public can read published tools" on public.tools
  for select to anon, authenticated
  using (published = true and archived = false);
create policy "Admins can read all tools" on public.tools for select to authenticated using (has_role(auth.uid(), 'admin'));
create policy "Admins can insert tools" on public.tools for insert to authenticated with check (has_role(auth.uid(), 'admin'));
create policy "Admins can update tools" on public.tools for update to authenticated using (has_role(auth.uid(), 'admin'));
create policy "Admins can delete tools" on public.tools for delete to authenticated using (has_role(auth.uid(), 'admin'));

insert into storage.buckets (id, name, public)
values ('tool-files', 'tool-files', true)
on conflict (id) do nothing;
create policy "Public can view tool files" on storage.objects for select using (bucket_id = 'tool-files');
create policy "Admins can manage tool files" on storage.objects for all
  using (bucket_id = 'tool-files' and has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'tool-files' and has_role(auth.uid(), 'admin'));

-- 7) posts: galeria de imagens do corpo do texto + arquivar sem apagar
alter table public.posts
  add column if not exists images text[] not null default '{}',
  add column if not exists archived boolean not null default false,
  add column if not exists archived_at timestamptz;

-- 8) jobs: arquivar sem apagar (fechar já existia via status/is_open)
alter table public.jobs
  add column if not exists archived boolean not null default false,
  add column if not exists archived_at timestamptz;

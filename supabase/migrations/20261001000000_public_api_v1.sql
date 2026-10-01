-- ===================================================================
-- API pública v1 (/api/public/v1) — só a parte que continua no Supabase:
-- colunas extras nos recursos que JÁ existem aqui (leads, applications,
-- posts, jobs) e que o site/admin continuam lendo/escrevendo como hoje.
--
-- api_keys, tools, newsletter e tool_downloads são recursos novos, sem
-- nenhum leitor existente — por isso moraram pro Vercel Postgres (ver
-- db/vercel-postgres-schema.sql), não aqui. Autenticação continua sendo
-- do Supabase (o admin do site usa login+RLS daqui).
-- ===================================================================

-- 1) leads: a tabela existente tem o formato do formulário de contato
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

-- 2) applications: a API permite mover o candidato de etapa (status),
--    anotar (notes) e, pra gerar o link de download assinado por 1h,
--    precisa do caminho do arquivo no bucket (resume_path) — hoje só
--    existe resume_url (string antiga, que pode já estar quebrada
--    porque o bucket "resumes" é privado).
create type public.application_status as enum ('novo','analise','entrevista','aprovado','recusado');
alter table public.applications
  add column if not exists status public.application_status not null default 'novo',
  add column if not exists notes text,
  add column if not exists resume_path text;

-- 3) posts: galeria de imagens do corpo do texto + arquivar sem apagar
alter table public.posts
  add column if not exists images text[] not null default '{}',
  add column if not exists archived boolean not null default false,
  add column if not exists archived_at timestamptz;

-- 4) jobs: arquivar sem apagar (fechar já existia via status/is_open)
alter table public.jobs
  add column if not exists archived boolean not null default false,
  add column if not exists archived_at timestamptz;

-- ===================================================================
-- API pública v1 (/api/public/v1) — só a parte que continua no Supabase:
-- colunas extras nos recursos que JÁ existem aqui (leads, applications,
-- posts, jobs) e que o site/admin continuam lendo/escrevendo como hoje.
--
-- api_keys, tools, newsletter e tool_downloads são recursos novos, sem
-- nenhum leitor existente — por isso moraram pro Vercel Postgres (ver
-- db/vercel-postgres-schema.sql), não aqui. Autenticação continua sendo
-- do Supabase (o admin do site usa login+RLS daqui).
--
-- Seguro rodar mais de uma vez (idempotente).
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

-- Mesmo rigor de tamanho que as colunas antigas já tinham na política de
-- INSERT anônimo (as novas colunas ficam graváveis pelo formulário público).
drop policy if exists "Anyone can submit leads" on public.leads;
create policy "Anyone can submit leads"
  on public.leads for insert
  to anon, authenticated
  with check (
    nome is not null and length(btrim(nome)) between 2 and 120
    and email is not null and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254
    and (telefone is null or length(telefone) <= 40)
    and (empresa is null or length(empresa) <= 200)
    and (segmento is null or length(segmento) <= 120)
    and (mensagem is null or length(mensagem) <= 4000)
    and (source is null or length(source) <= 60)
    and (whatsapp is null or length(whatsapp) <= 40)
    and (site is null or length(site) <= 300)
    and (faturamento is null or length(faturamento) <= 120)
    and (solucao is null or length(solucao) <= 300)
    and (extra is null or length(extra) <= 2000)
  );

-- 2) applications: a API permite mover o candidato de etapa (status),
--    anotar (notes) e, pra gerar o link de download assinado por 1h,
--    precisa do caminho do arquivo no bucket (resume_path) — hoje só
--    existe resume_url (string antiga, que pode já estar quebrada
--    porque o bucket "resumes" é privado).
do $$
begin
  create type public.application_status as enum ('novo','analise','entrevista','aprovado','recusado');
exception
  when duplicate_object then null;
end
$$;

alter table public.applications
  add column if not exists status public.application_status not null default 'novo',
  add column if not exists notes text,
  add column if not exists resume_path text;

-- status e notes são campos internos do RH: quem se candidata pelo site
-- (anon) não pode escolher a própria etapa nem escrever anotações.
drop policy if exists "Anyone can apply" on public.applications;
create policy "Anyone can apply"
  on public.applications for insert
  to anon, authenticated
  with check (
    job_id is not null
    and name is not null and length(btrim(name)) between 2 and 120
    and email is not null and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254
    and (phone is null or length(phone) <= 40)
    and (linkedin is null or length(linkedin) <= 300)
    and (message is null or length(message) <= 4000)
    and (resume_url is null or length(resume_url) <= 1000)
    and (resume_path is null or length(resume_path) <= 500)
    and status = 'novo'
    and notes is null
    and exists (
      select 1 from public.jobs j
      where j.id = job_id and j.status = 'open'::job_status
    )
  );

-- 3) posts: galeria de imagens do corpo do texto + arquivar sem apagar
alter table public.posts
  add column if not exists images text[] not null default '{}',
  add column if not exists archived boolean not null default false,
  add column if not exists archived_at timestamptz;

-- 4) jobs: arquivar sem apagar (fechar já existia via status/is_open)
alter table public.jobs
  add column if not exists archived boolean not null default false,
  add column if not exists archived_at timestamptz;

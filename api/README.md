# API pública v1 (`/api/public/v1`)

Contrato: `Guara-API-manual.pdf` (chave `gm_…`, rotas, formato de JSON e de erro).
Um único handler (`public/v1/[...route].ts`) com **dois modos**, escolhidos por variável de ambiente.

## Modo upstream (API oficial = servidor externo da Guará)

Ativa quando `GUARA_API_UPSTREAM` está definida. Esta função só:

1. valida a chave `gm_…` do cliente (tabela `api_keys` no Vercel Postgres, criada/revogada em `/admin/api-keys`);
2. repassa a chamada ao servidor de origem com a chave **dele** (a do cliente nunca é encaminhada);
3. traduz as diferenças em relação ao manual (`_lib/upstream.ts`).

| Variável | O que é |
|---|---|
| `GUARA_API_UPSTREAM` | URL base do servidor de origem, ex. `https://api.guaramedia.com.br` |
| `GUARA_API_UPSTREAM_KEY` | chave `X-API-Key` do servidor de origem |
| `POSTGRES_URL` | injetada pela Vercel ao conectar o Neon (guarda só as chaves `gm_…`) |

O que a tradução faz: tira o prefixo `/api/public/v1`; aceita `Authorization: Bearer` e `x-api-key`;
mapeia nomes de rota (`/tools` → `/ferramentas` no GET, `/jobs/{id}` → `/vagas/{id}` no GET);
valida `limit` (1–200), `offset`, `since`, `status` e filtros por recurso (400 no formato do manual);
embrulha listas em `{ data, count, limit, offset }`; `read_time` → `reading_time` nos posts;
reescreve `/summary`; converte erros `{ detail }` do FastAPI para `{ error, details }`
(422 de validação → 400; 401/5xx da origem → 500 genérico, sem vazar detalhe).

Limites conhecidos (a origem é quem decide o resto):
- `count` vem de paginar a origem (a origem devolve lista pura, sem total); passando de 20 páginas
  devolve o que contou + `has_more: true`.
- Validação de imagem (422) e tamanho de arquivo dependem da origem.
- **Corpo de requisição na Vercel é limitado a ~4,5 MB** — `file_base64` grande não passa por aqui
  (nem no modo nativo). Pra arquivos maiores use `file_url`.
- `archived_at` só aparece se a origem enviar.

## Modo nativo (sem `GUARA_API_UPSTREAM`)

Responde sozinha: `leads`, `applications`, `posts`, `jobs` no **Supabase** (precisa de
`SUPABASE_SERVICE_ROLE_KEY` e da migration `supabase/migrations/20261001000000_public_api_v1.sql`);
`tools`, `newsletter`, `tool_downloads`, `api_keys` no **Vercel Postgres** (`db/vercel-postgres-schema.sql`);
arquivos de ferramenta no **Vercel Blob** (`BLOB_READ_WRITE_TOKEN`).

## Painel (`/api/admin/v1`)

Back-end do `/admin` para o que mora no Vercel Postgres: `newsletter` e `tool_downloads` (listar e apagar),
`tools` (CRUD completo, incluindo arquivar), `counts` (totais e última semana) e `downloads-by-tool`.
Não usa chave `gm_…`: exige a sessão de admin do Supabase (`Authorization: Bearer <access_token>`,
conferido em `_lib/requireAdmin.ts`) e só responde no mesmo domínio. Funciona igual nos dois modos da API
pública — ignora `GUARA_API_UPSTREAM`, porque o painel gerencia os dados do próprio site.
Leads, candidaturas, posts e vagas o painel lê direto do Supabase, com a sessão do admin (RLS).

## Testes

`npm test` roda os puros e os do proxy (com origem simulada). `integration.test.ts` fala com o
banco de verdade e só roda com `POSTGRES_URL` definida (cria uma chave de teste e limpa tudo no fim).

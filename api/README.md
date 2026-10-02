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

## Painel (`/admin`) — usa a API da Guará (FastAPI)

O painel é cliente da API da Guará, inclusive no login. O navegador só fala com `/api/admin/*` (mesmo
domínio); o endereço da API e a chave `X-API-Key` ficam só em variáveis do servidor.

| Rota | O que faz |
|---|---|
| `POST /api/admin/auth/login` | repassa a `/auth/login` `{email, senha}`; só quem é **admin e ativo** ganha sessão |
| `POST /api/admin/auth/logout` · `GET /api/admin/auth/me` | sair · quem está logado |
| `GET/POST/PATCH/DELETE /api/admin/auth/users…` · `PATCH …/me` | contas (`/auth/users`, `/auth/register`) e troca da própria senha/nome |
| `/api/admin/v1/*` | dados do painel (leads, applications, posts, jobs, tools, newsletter, tool_downloads, summary): confere a sessão e repassa à API com o **token do próprio admin** (`Authorization: Bearer`), no contrato do manual (mesma tradução da API pública, `_lib/upstream.ts`) |
| `POST /api/admin/upload` | emite o token pro navegador enviar imagens e arquivos direto ao Vercel Blob (só admin) |
| `/api/admin/api-keys` | chaves `gm_…` da API pública (Postgres), só admin |

**Sessão:** o JWT do `/auth/login` vai para um cookie `gm_admin` (`HttpOnly; Secure; SameSite=Strict; Path=/api/admin`),
que o JavaScript não lê. A cada chamada o token é conferido no `/auth/me` da API (cache de 30 s em memória) e o
papel precisa ser admin. Toda escrita exige o cabeçalho `X-Requested-With: guara-admin` (anti-CSRF).

**Nenhuma variável é obrigatória pro painel.** O endereço da API vai no código (`DEFAULT_UPSTREAM` em
`_lib/adminAuth.ts`; não é segredo) e os dados usam o token do login. Para os endpoints de dados da API
aceitarem esse token, o servidor precisa aceitar `Authorization: Bearer <JWT do /auth/login>` (admin ativo)
como alternativa ao `X-API-Key`; enquanto não aceitar, o painel mostra "A API da Guará ainda não aceita o login
nos dados".

| Variável (todas opcionais) | Pra quê |
|---|---|
| `GUARA_API_UPSTREAM` | troca o endereço da API (vence o padrão) — útil quando o túnel mudar |
| `GUARA_API_UPSTREAM_KEY` | `X-API-Key`; se existir, vai junto com o token (serve a servidor antigo). Também é o que a **API pública** (`/api/public/v1`, chaves `gm_…`) usa pra falar com a API |
| `BLOB_READ_WRITE_TOKEN` | envio de imagens/arquivos (injetada ao conectar o Blob Store) |
| `POSTGRES_URL` | só pra chaves `gm_…` (injetada ao conectar o Neon) |

O painel não usa mais o Supabase. Artigos e Auditoria não existem na API da Guará e saíram.

## Testes

`npm test` roda os puros e os do proxy (com origem simulada). `integration.test.ts` fala com o
banco de verdade e só roda com `POSTGRES_URL` definida (cria uma chave de teste e limpa tudo no fim).

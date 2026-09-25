# Versões da Home — como funciona

Esta pasta (`public/versoes/`) guarda **15 direções de design diferentes** para a Home
da Guará Media, todas com o mesmo conteúdo real do site (textos, cases, vídeos,
formulário, vagas, posts do blog), mas com identidades visuais distintas — do
editorial em serifa ao "Adesivo" cheio de fitas coladas, passando pelo "Proposta",
inspirado na apresentação comercial da empresa.

Cada versão é um **site estático completo**: Home + Blog + Ferramentas + Talentos +
Artigos, responsivo (desktop e mobile), sem depender de build do Vite — são arquivos
`.html` prontos, publicados como estão em `public/`.

Ideal pra: comparar direções de design com o time/cliente antes de decidir qual vira
a Home de verdade, sem precisar reescrever nada em React a cada tentativa.

## Onde fica cada coisa

```
scripts/gen-versoes.mjs      ← única fonte de verdade. Gera TODOS os arquivos abaixo.
public/versoes/
  index.html                 ← página de índice, lista as versões (gerada)
  v1-editorial.html          ← Home da versão 1 (gerada)
  v1-editorial-blog.html     ← listagem de posts (gerada)
  v1-editorial-ferramentas.html
  v1-editorial-talentos.html
  v1-editorial-artigos.html
  ... (o mesmo padrão para v2 até v15)
  v13-adesivo-vaga.html      ← só a V13 tem páginas de detalhe (vaga/post/ferramenta)
  v13-adesivo-post.html
  v13-adesivo-ferramenta.html
  img/                       ← logos das marcas usadas nas versões
```

**Regra de ouro: nunca edite os arquivos `.html` dentro de `public/versoes/`
diretamente.** Eles são gerados automaticamente. Qualquer edição manual se perde na
próxima vez que alguém rodar o gerador. Toda mudança visual ou de conteúdo começa em
`scripts/gen-versoes.mjs`.

## Por que um gerador em vez de 15 pastas de HTML soltas

As 15 versões compartilham 100% do conteúdo (mesmos textos, imagens, vídeos, vagas,
posts) e ~90% da estrutura (mesmas seções, na mesma ordem, com o mesmo HTML
semântico). O que muda entre elas é praticamente só **tema**: cores, tipografia,
espaçamento, decorações. Manter isso como 15 arquivos HTML copiados e colados seria
um pesadelo pra manutenção — qualquer correção de conteúdo teria que ser replicada
15 vezes. Por isso existe um único script Node que monta tudo programaticamente.

## Como o gerador é organizado

Abra `scripts/gen-versoes.mjs` — ele tem, nessa ordem:

1. **Conteúdo** (topo do arquivo): espelha `src/data/landingContent.ts` — vídeos,
   estáticos, logos de clientes, cases, depoimentos, FAQ, ofertas etc. Se o conteúdo
   real do site mudar, atualize aqui também.
2. **`S` — seções compartilhadas da Home**: `S.header`, `S.acelerar`, `S.tarja`,
   `S.posicionamento`, `S.verticais`, `S.galeria`, `S.origem`, `S.ofertas`,
   `S.contato`, `S.footer`. Cada uma é uma função que devolve uma string de HTML.
   **Essas funções são as mesmas para as 15 versões** — o visual muda só via CSS
   (variáveis + regras extras por tema), não duplicando markup.
3. **`SUB` / `SUB_JS`**: as páginas internas (Blog, Ferramentas, Talentos, Artigos) —
   os posts e vagas vêm do Supabase em tempo real (mesmo projeto do site real); as
   ferramentas são estáticas.
4. **`HERO` — um hero por versão**: `HERO.editorial`, `HERO.cinema`, ...,
   `HERO.deck`. Diferente das seções acima, o hero É específico de cada versão
   (é o que mais muda visualmente entre elas), por isso cada uma tem sua própria
   função.
5. **`BASE_CSS`**: o CSS compartilhado por todas as versões — grid, tipografia
   base, componentes (cards, botões, formulário, tabs...). Usa **variáveis CSS**
   (`--accent`, `--display`, `--rL` etc.) em vez de cores/fontes fixas, exatamente
   pra permitir que cada tema reescreva essas variáveis sem duplicar regra nenhuma.
6. **`THEMES`**: um objeto com uma entrada por versão (`v1-editorial`, `v2-cinema`,
   ..., `v15-proposta`). Cada entrada tem:
   - `name` / `desc`: nome e descrição (aparecem no índice)
   - `vars`: string com as variáveis CSS do tema (`--light`, `--dark`, `--accent`,
     `--display` (fonte de título), `--body`, `--ui`, `--rL` (raio de borda), etc.)
   - `css`: regras extra só daquele tema (ex.: o "rasgado" de papel entre seções e
     o marca-texto em script da V15, ou as fitas coladas da V13)
   - `hero`: a função `HERO.xxx` daquela versão
   - opcionalmente `blocks`, `split`, `ftrAcc` — flags que ligam comportamentos
     especiais herdados de versões antigas (blocos de cor cheios, layout dividido)
7. **`page()` / `docHead()` / `subpage()`**: montam o HTML final juntando
   `BASE_CSS` + `t.css` do tema + as seções `S.*` na ordem certa + o hero certo.
8. **Loop final**: `for (const [key, t] of Object.entries(THEMES))` — pra cada tema,
   escreve `vNN-slug.html` + as 4 páginas internas. No final, gera `index.html`.

## O fluxo, do zero até estar no ar

### 1. Defina a direção visual
Antes de mexer em código: qual é a referência? Uma paleta, uma fonte, um layout de
revista, uma apresentação de slides, um print de outro site. Quanto mais concreta a
referência, mais fácil é traduzir em `vars`/`css` depois.

### 2. Edite `scripts/gen-versoes.mjs`
Pra melhorar uma versão que já existe: ache a entrada dela em `THEMES` e ajuste
`vars`/`css`, ou ajuste o `HERO.xxx` correspondente. Seções compartilhadas (`S.*`)
afetam **todas** as versões — só mexa nelas se a mudança for pra todo mundo (ex.:
corrigir um bug de conteúdo ou de JS).

Pra criar uma versão nova do zero, veja a seção **"Como adicionar uma versão nova"**
mais abaixo.

### 3. Regenere os HTML
Nunca edite os arquivos gerados. Rode o gerador — ele reescreve tudo:

```bash
npm run versoes:gen
# equivalente a: node scripts/gen-versoes.mjs
```

Isso regrava **as 15 versões inteiras** (Home + 4 páginas internas + índice), não só
a que você mudou — é rápido (script síncrono, sem rede) e garante que nada fica
dessincronizado.

### 4. Rode localmente e confira
```bash
npm run dev
```
Abra `http://localhost:8080/versoes/` pra ver o índice com as 15 versões, ou direto
`http://localhost:8080/versoes/vNN-slug.html`.

Checklist mínimo antes de subir:
- **Sem erro no console.** Abra numa aba **nova** (abas antigas acumulam erro de
  navegações anteriores e dão falso positivo) e role a página inteira.
- **Desktop e mobile.** Redimensione pra ~390px de largura e confira que não tem
  estouro horizontal nem texto cortado.
- **Links internos funcionam**: da Home pros itens de Blog/Talentos, e (só na V13)
  dos itens pra página de detalhe.
- **Formulário**: preencha e confira o contador de campos e a máscara de WhatsApp.

### 5. Commit
```bash
git add public/versoes/ scripts/gen-versoes.mjs
git commit -m "mensagem descrevendo a mudança"
```
Commite os arquivos **gerados** junto com o gerador — o repositório serve os
`.html` estáticos direto, então eles precisam estar atualizados no git (o gerador
em si não roda em produção).

### 6. Push e deploy
```bash
git push
```
A Vercel (produção em `guara-wheat.vercel.app`) e o GitHub Pages
(`eroscv.github.io/guara/`) fazem deploy automático a partir do push na `main` —
não tem passo manual de deploy. Depois do push, o ar demora ~30–90s pra atualizar.
Pra confirmar que subiu, sem ficar recarregando na mão:

```bash
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "https://guara-wheat.vercel.app/versoes/vNN-slug.html?cb=$i")
  [ "$code" = "200" ] && { echo "no ar depois de $((i*15))s"; break; }
  sleep 15
done
```

**Atenção ao link**: a URL sempre precisa do prefixo `/versoes/`
(`guara-wheat.vercel.app/versoes/vNN-slug.html`) — sem ele dá 404, mesmo com o
site inteiro funcionando normalmente. Esse já foi motivo de confusão antes (parecia
"tudo caiu", mas era só o link sem o `/versoes/`).

## Como adicionar uma versão nova

1. **Tema** — no fim do objeto `THEMES`, copie a entrada mais parecida com o que
   você quer e ajuste `name`, `desc`, `vars` (pelo menos `--light`, `--dark`,
   `--accent`, `--display`, `--body`, `--rL`, `--rBtn`) e `css` (as particularidades
   visuais daquela direção).
2. **Hero** — adicione `HERO.suachave = () => \`...\`` com a mesma copy usada nos
   outros heros ("Se a pressa é inimiga da perfeição..."), só que com o markup/CSS
   da nova direção. Aponte `hero: HERO.suachave` na entrada do tema.
3. **Fontes do Google** — se a direção usa uma fonte que nenhuma versão anterior usa
   ainda, adicione a família no `<link>` do Google Fonts (existem duas ocorrências
   idênticas no arquivo — em `docHead()`, usada pelas páginas internas, e em
   `page()`, usada pela Home — **mantenha as duas iguais**).
4. **Regenere, teste e commite** — passos 3 a 6 do fluxo acima.

Por convenção, a chave do tema é `vNN-nome-curto` (ex.: `v15-proposta`), NN é o
número sequencial e o nome descreve a ideia central em uma palavra.

## Detalhe: por que só a V13 tem páginas de "vaga", "post" e "ferramenta"

Todas as versões têm as 4 páginas de listagem (Blog, Ferramentas, Talentos,
Artigos). Só a **V13 "Adesivo"** tem páginas de detalhe dedicadas
(`v13-adesivo-vaga.html`, `-post.html`, `-ferramenta.html`) — foi a única vez que
esse aprofundamento foi pedido. As outras versões, ao clicar num item de vaga ou
post, levam pra página de detalhe do **site real** (fora de `/versoes/`). Isso está
resolvido no próprio gerador: `SUB_JS.blog`/`SUB_JS.talentos` decidem o `href` do
card conforme a chave da versão, e o loop final só chama
`vagaDetailPage`/`postDetailPage`/`ferramentaDetailPage` quando
`key === "v13-adesivo"`. Pra estender esse mesmo aprofundamento pra outra versão,
troque essa condição (ou generalize-a) e adicione a nova chave à lista.

## Pegadinhas já vividas (pra não repetir)

- **Barra de progresso vs. contador do formulário**: o JS compartilhado já teve um
  bug em que a barra de progresso do cabeçalho (`#prog`) e o contador "X de 5 campos
  preenchidos" do formulário usavam a mesma variável `var prog`, e um sobrescrevia o
  outro (corrigido — o do formulário agora se chama `fprog`). Ao mexer no JS
  compartilhado (`COMMON_JS`/`JS`), evite reusar nomes de variável entre blocos que
  rodam na mesma função.
- **Regex dentro de `<script>` gerado por template literal**: texto que vira um
  regex JavaScript dentro do HTML gerado passa por duas rodadas de interpretação de
  escape (a sua, ao editar o `.mjs`, e a do Node, ao rodar o `.mjs`). Pra sobrar UMA
  barra invertida no navegador, escreva DUAS no código-fonte do gerador
  (`\\s`, `\\/script`). Editar isso via heredoc/script (Python, bash) costuma
  adicionar uma rodada extra de escape sem querer — prefira editar o arquivo
  diretamente.
- **`<script src="...">` colado como HTML cru**: só escreva `<\/script>` quando o
  texto está *dentro* de outra string JS. Se você está montando uma tag `<script>`
  pra injetar como HTML puro (ex. via `extraHead`), use `</script>` normal — a
  versão com barra invertida quebra o parser de HTML e o `<body>` inteiro some.
- **`[hidden]` não é a mesma coisa que a classe `.hidden`**: alguns elementos são
  escondidos via `elemento.hidden = true` (atributo `hidden`), não via
  `classList.toggle('hidden')`. O CSS precisa cobrir os dois:
  `.hidden,[hidden]{display:none!important}`.
- **Sempre teste em aba nova**: abas antigas do navegador acumulam erro de
  navegações anteriores no console, e isso já causou diagnóstico errado ("achando"
  que uma mudança quebrou algo que na verdade era ruído de antes).

## Stack usada nas páginas geradas

HTML + CSS + JS puro (sem framework, sem build) — Google Fonts, ícones SVG inline,
scroll-reveal e parallax leves feitos à mão, dados de vaga/post buscados direto da
API REST do Supabase com a chave pública (a mesma usada pelo site real via
variável de ambiente — segura por design, é a chave `anon`).

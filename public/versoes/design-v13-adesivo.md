# V13 — Adesivo
Design system extraído de `scripts/gen-versoes.mjs` (tema `"v13-adesivo"`). Não existia antes; este arquivo é gerado a partir do código, não de um documento anterior.

**Conceito:** bege com contornos pretos grossos, marca-texto laranja e etiquetas inclinadas — tom mais solto, colagem de adesivos. É a única versão do gerador com páginas de detalhe completas (post, vaga, ferramenta) e por isso serviu de base estrutural pra V16 Mascote.

## Paleta

| Token | Valor | Uso |
|---|---|---|
| `--light` | `#FFF6E4` | fundo claro (bege) |
| `--lightInk` | `#0a0a0a` | texto sobre claro |
| `--dark` | `#0a0a0a` | fundo escuro |
| `--darkInk` | `#FFF6E4` | texto sobre escuro |
| `--accent` | `#F26522` | laranja — marca-texto, CTAs secundários, etiquetas |
| `--accentInk` | `#0a0a0a` | texto sobre laranja |
| `--green` | `#C8E64A` | lima — selos numerados, tarjas, highlight de frases |
| `--btnBg` / `--btnInk` | `#F26522` / `#0a0a0a` | botão primário |
| `--tcardBg` / `--tcardInk` / `--tcardLine` | `#fff` / `#0a0a0a` / `#0a0a0a` | cards de depoimento |
| `--fboxBg` / `--fboxInk` / `--fboxLine` | `#fff` / `#0a0a0a` / `#0a0a0a` | caixa de formulário |
| `--fieldBg` | `#FFF6E4` | fundo dos campos |

No fundo escuro (`.s-dark`), sombras e bordas trocam para `#FFF6E4` (creme) em vez de preto — regra 6 do changelog: "uma sombra só: preto por padrão, verde só no statement, bege sobre preto".

## Tipografia

- `--display`: `Inter, sans-serif`, peso `900`, sem uppercase forçado (`--displayTf:none`), `letter-spacing:-0.035em`. Usada em `h1,h2,h3` e `.statement`.
- `--body` / `--ui`: `Inter, sans-serif`.
- Escala herdada do gerador (`BASE_CSS`): `.h1-p{clamp(36px,5vw,56px)}`, `.h2{clamp(28px,4vw,44px)}`, `.statement{clamp(26px,3.4vw,44px)}`.
- `line-height:1.02` em títulos, com `text-wrap:balance`.

## Forma e traço

- `--lineW:3px` — borda padrão de cards, botões, inputs, tags.
- `--r:12px`, `--rL:16px`, `--rBtn:12px` — raios pequeno / grande / botão.
- **Sombra dura offset** é o traço central do tema: `box-shadow:Npx Npx 0 #0a0a0a` (ou `#FFF6E4` no escuro), sem blur, em quase todo componente interativo — botões (4px), cards (6px), painel de formulário (8–10px), ofertas em destaque (10px).
- **Hover/active de botão**: translada na diagonal e reduz a sombra (`translate(2px,2px)` + `box-shadow:2px 2px 0`); ao clicar, `translate(3px,3px)` + `1px 1px 0` — simula o botão "afundando".
- **Rotação leve** em quase tudo que lembra papel colado: cards de post alternam `-1deg / 1deg / -0.5deg`, vagas e depoimentos alternam `-1deg / 1deg`, o card lateral de detalhe (`.dcard`) tem uma "fita" decorativa (`::before`) com padrão diagonal listrado simulando fita adesiva. Em telas ≤640px a rotação é removida (`transform:none!important`) para não brigar com a largura reduzida.

## Componentes-assinatura

- **`.stk` (etiqueta/sticker)**: pílula com borda 3px, fundo lima, sombra dura, rotação fixa por variante (`.stk-a:-6deg`, `.stk-b:4deg`, `.stk-c:6deg`), com uma animação de entrada `pop` (scale + rotate, `cubic-bezier(.34,1.56,.64,1)`) escalonada por delay — desativada em `prefers-reduced-motion`.
- **Fita adesiva decorativa**: elemento `::before`/`::after` de ~100×26px, rotacionado, com `repeating-linear-gradient` diagonal simulando textura de fita, usado no card lateral de detalhe, no cabeçalho da seção de vídeos e no card de citação.
- **`.hl` (marca-texto)**: `background:#F26522` com `box-decoration-break:clone`, para grifar trechos de frase como caneta laranja.
- **`.statement .w:nth-last-child(-n+4)`**: as últimas 4 palavras de uma frase de impacto ganham sublinhado em bloco lima (`linear-gradient` como marca-texto por trás do texto).
- **Números como selos redondos** (`.vnum`, `.onum`, `.dav`): círculo 34–44px, fundo lima, borda 3px, sombra dura.
- **Fundo pontilhado**: `radial-gradient(rgba(0,0,0,.18) 2px, transparent 2px)` em grade 22×22px, usado atrás da tarja e do topo das páginas internas — textura de papel/cartolina.

## Página de listagem (Blog / Ferramentas / Talentos / Artigos)

- Cabeçalho com sublinhado inclinado: `.h1-p::after` — barra lima 110×9px, `rotate(-2deg)`.
- Cards (`.pcard`, `.job`, `.vcard`, `.art`) alternam rotação por posição e "endireitam" no hover com sombra maior (`translate(-2px,-4px)` + sombra 9px).
- Chips de filtro (`.cat`, `.tagb`) com a mesma sombra dura em miniatura (3px).

## Página de detalhe (post / vaga / ferramenta)

- `.dcard` (cartão lateral de CTA): fundo branco, borda 3px, sombra 8px, com a fita decorativa no topo.
- `.d-cover` (capa): rotacionada -1deg, com um selo laranja fita no canto (`::after`).
- `.stk-open` reaproveita o padrão de etiqueta para o rótulo "Vaga aberta" / "Gratuito".
- `.prose h2::before`: quadradinho lima 14px rotacionado antes de cada subtítulo do corpo do texto.

## O que a V16 Mascote herdou / trocou

A V16 Mascote reusa a mesma **estrutura de página** da V13 (listagem → filtro → detalhe → cartão lateral com CTA), mas troca:
- sombra dura preta → sombra dura na cor do tema (`--ink`/`--orange`) com paleta cream/laranja/lima/preto da home;
- rotação de cards → contorno reto (sem rotação), hover translada na diagonal sem inclinar;
- fita adesiva/etiquetas → poses do guará como elemento decorativo recorrente;
- tipografia Inter 900 → Bricolage Grotesque variável.

## Referência rápida de arquivos

- Definição do tema: `scripts/gen-versoes.mjs`, chave `"v13-adesivo"` (linhas ~1500–1660).
- Tokens e escala compartilhados por todas as versões: `BASE_CSS` no mesmo arquivo (linhas ~1063+).
- Saída publicada: `public/versoes/v13-adesivo.html` + `v13-adesivo-{blog,ferramenta,ferramentas,post,talentos,vaga,artigos}.html`.

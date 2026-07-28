## Objetivo
Permitir embedar posts do LinkedIn dentro dos artigos (editor rich text + renderização pública).

## Como funciona o embed do LinkedIn
O LinkedIn fornece um iframe oficial via "Embed this post" (`https://www.linkedin.com/embed/feed/update/urn:li:share:...` ou `urn:li:ugcPost:...`). Basta colar a URL do post ou o `<iframe>` que o LinkedIn gera — extraímos a URL de embed e renderizamos um `<iframe>` responsivo.

## Mudanças

### 1. Editor (`src/components/admin/RichTextEditor.tsx`)
- Adicionar botão **"LinkedIn"** na toolbar (ícone Linkedin do lucide).
- Ao clicar: `prompt()` pedindo "URL do post do LinkedIn ou código `<iframe>` do Embed".
- Função `parseLinkedInEmbed(input)` que aceita:
  - URL de post: `linkedin.com/posts/...activity-<id>-...` → converte para `https://www.linkedin.com/embed/feed/update/urn:li:activity:<id>`
  - URL de embed direto: usa como está
  - Bloco `<iframe ... src="...linkedin.com/embed/...">` → extrai `src`
- Insere via uma nova **extensão Tiptap `LinkedInEmbed`** (Node atomic, `atom: true`, `group: 'block'`) que renderiza:
  ```html
  <div class="linkedin-embed" data-src="..."><iframe src="..." height="600" width="100%" frameborder="0" allowfullscreen title="LinkedIn post"></iframe></div>
  ```
- `parseHTML` reconhece `div.linkedin-embed[data-src]` para reabrir conteúdo salvo.

### 2. Renderização pública (`ArtigoDetalhe.tsx` e `BlogPost.tsx`)
- Atualizar `DOMPurify.sanitize` para permitir `<iframe>` apenas com `src` em allowlist (`www.linkedin.com/embed/`):
  ```ts
  DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allowfullscreen','frameborder','src','width','height','title','allow'],
  })
  // + hook uponSanitizeElement para bloquear iframes fora do allowlist LinkedIn
  ```
- CSS leve em `index.css` para deixar o iframe responsivo dentro de `.prose .linkedin-embed`.

### 3. UX
- Toolbar mostra ícone Linkedin com tooltip "Inserir post do LinkedIn".
- Mensagem de erro via `toast` se a URL não for reconhecida.
- Funciona tanto em **artigos** quanto em **posts do blog** (mesmo editor).

## Detalhes técnicos
- Sem nova dependência (Tiptap já instalado; ícone `Linkedin` já vem do lucide-react).
- Nenhuma mudança de schema/DB — embeds ficam salvos como HTML no campo `content`.
- Segurança: allowlist estrita de domínio no DOMPurify evita XSS via iframe arbitrário.

## Fora do escopo
- Embeds de Twitter/X, YouTube, Instagram (podemos adicionar depois no mesmo padrão).
- Preview server-side / Open Graph do post.

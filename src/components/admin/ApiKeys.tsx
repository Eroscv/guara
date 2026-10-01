import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Check, Copy, Download, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { adminFetch, fmtDate } from "./helpers";

type ApiKey = { id: string; name: string; key_prefix: string; created_at: string; last_used_at: string | null; revoked_at: string | null };

// As chaves moram no Vercel Postgres. O servidor gera a chave (gm_ + 40 caracteres),
// guarda só o hash e devolve a chave inteira uma única vez, na resposta do POST.
const KEYS_URL = "/api/admin/api-keys";

type Method = "GET" | "POST" | "PATCH" | "DELETE";
type Ep = { m: Method; path: string; desc: string; body?: string };
type Group = { id: string; title: string; intro: string; eps: Ep[]; notes?: string[] };

const GROUPS: Group[] = [
  {
    id: "consultas", title: "Consultas", intro: "Leia, altere e apague contatos, newsletter, downloads e candidaturas.",
    eps: [
      { m: "GET", path: "/summary", desc: "Resumo: totais, últimos 7 dias, pendentes e agendados" },
      { m: "GET", path: "/leads", desc: "Contatos do formulário" },
      { m: "GET", path: "/newsletter", desc: "Inscritos na newsletter" },
      { m: "GET", path: "/tool_downloads", desc: "Quem baixou ferramentas" },
      { m: "GET", path: "/applications?status=novo", desc: "Candidaturas (resume_url válido por 1h)" },
      { m: "GET", path: "/{recurso}/{id}", desc: "Um item específico" },
      {
        m: "PATCH", path: "/applications/{id}", desc: "Muda situação e anotações do candidato",
        body: `{
  "status": "entrevista",
  "notes": "Entrevista marcada para 30/09 às 14h"
}`,
      },
      {
        m: "PATCH", path: "/leads/{id}", desc: "Corrige dados de um contato",
        body: `{
  "whatsapp": "(19) 99999-0000",
  "extra": "Retornar na segunda"
}`,
      },
      { m: "DELETE", path: "/{recurso}/{id}", desc: "Apaga um cadastro (candidatura apaga o currículo junto)" },
    ],
    notes: [
      "Filtros: ?limit=50 · ?offset=0 · ?since=2026-09-01T00:00:00Z",
      "Situações: novo, analise, entrevista, aprovado, recusado",
      "PATCH aceita só os campos que mudam. leads: nome, whatsapp, site, faturamento, solucao, extra · newsletter: email, pagina · tool_downloads: nome, email, empresa, cargo · applications: status, notes, nome, email, telefone, linkedin",
    ],
  },
  {
    id: "blog", title: "Blog", intro: "Crie, agende, edite e arquive posts. Tempo de leitura é calculado sozinho.",
    eps: [
      { m: "GET", path: "/blog", desc: "Lista posts (alias de /posts)" },
      { m: "GET", path: "/blog/{id ou slug}", desc: "Um post" },
      {
        m: "POST", path: "/posts", desc: "Cria um post",
        body: `{
  "title": "5 tendências de marketing para 2027",
  "excerpt": "Resumo curto",
  "content": "<h2>Título</h2><p>Texto…</p>",
  "cover_image": "https://…/capa.jpg",
  "images": ["https://…/foto1.jpg"],
  "category": "Estratégia",
  "tags": ["ia", "2027"],
  "author": "Equipe Guará",
  "published": true,
  "published_at": "2026-10-01T12:00:00-03:00"
}`,
      },
      { m: "PATCH", path: "/posts/{id}", desc: "Edita — envie só o que muda" },
      { m: "DELETE", path: "/posts/{id}", desc: "Apaga de vez" },
    ],
    notes: [
      "Imagens: JPG, PNG, WEBP, GIF ou AVIF · link público · até 15MB · erro 422 com a lista se algo falhar",
      "cover_image (ou image_url) = capa · images = fotos no fim do texto · <img> no content também vale",
      "published_at no futuro = agendado",
    ],
  },
  {
    id: "vagas", title: "Vagas", intro: "Publique, agende e feche vagas de talentos.",
    eps: [
      { m: "GET", path: "/vagas", desc: "Lista vagas (alias de /jobs)" },
      { m: "GET", path: "/vagas/{id}", desc: "Uma vaga" },
      {
        m: "POST", path: "/jobs", desc: "Cria uma vaga",
        body: `{
  "title": "Social Media Pleno",
  "department": "Conteúdo",
  "location": "São Paulo, SP",
  "work_model": "Híbrido",
  "description": "Buscamos alguém para…",
  "responsibilities": ["Planejar calendário"],
  "requirements": ["2+ anos de experiência"],
  "is_open": true,
  "publish_at": "2026-10-05T08:00:00-03:00"
}`,
      },
      { m: "PATCH", path: "/jobs/{id}", desc: '{"is_open": false} fecha a vaga' },
      { m: "DELETE", path: "/jobs/{id}", desc: "Apaga de vez" },
    ],
  },
  {
    id: "ferramentas", title: "Ferramentas", intro: "Materiais para download, com arquivo enviado junto ou por link.",
    eps: [
      { m: "GET", path: "/ferramentas", desc: "Lista ferramentas (alias de /tools)" },
      { m: "GET", path: "/ferramentas/{id ou slug}", desc: "Uma ferramenta" },
      {
        m: "POST", path: "/tools", desc: "Cria uma ferramenta",
        body: `{
  "title": "Checklist de Lançamento",
  "description": "Tudo o que revisar antes de lançar.",
  "category": "Planejamento",
  "image": "https://…/capa.jpg",
  "benefits": ["40 itens de verificação"],
  "published": true,
  "file_name": "checklist.pdf",
  "file_base64": "JVBERi0xLjQK…",
  "file_content_type": "application/pdf"
}`,
      },
      { m: "PATCH", path: "/tools/{id}", desc: "Edita — envie só o que muda" },
      { m: "DELETE", path: "/tools/{id}", desc: "Apaga de vez" },
    ],
    notes: ['Ou use "file_url" com um link pronto · máximo 50MB'],
  },
  {
    id: "arquivo", title: "Arquivar e filtrar", intro: "Arquivar tira do site sem apagar nada. Vale para posts, vagas e ferramentas.",
    eps: [
      { m: "PATCH", path: "/posts/{id}", desc: "Arquiva", body: `{ "archived": true }` },
      { m: "PATCH", path: "/posts/{id}", desc: "Desarquiva", body: `{ "archived": false }` },
      { m: "GET", path: "/blog?status=published&category=Estratégia&q=ia", desc: "Busca combinando filtros" },
    ],
    notes: [
      "?status= all · active · archived — posts/ferramentas: published · draft (posts: scheduled) — vagas: open · closed · scheduled",
      "?q= palavra no título · ?category= (posts/ferramentas) · ?tag= (posts) · ?department= (vagas)",
    ],
  },
];

const ERRORS: [string, string][] = [
  ["400", "Dados inválidos — vem a lista do que corrigir"],
  ["401", "Chave ausente, inválida ou desativada"],
  ["404", "Não encontrado"],
  ["409", "Slug já existe"],
  ["422", "Imagem com problema (formato, link ou tamanho)"],
];

const METHOD_CLS: Record<Method, string> = {
  GET: "bg-accent text-accent-foreground",
  POST: "bg-brand-orange text-primary-foreground",
  PATCH: "bg-method-patch text-foreground",
  DELETE: "bg-destructive text-destructive-foreground",
};

function useCopy() {
  const [done, setDone] = useState<string | null>(null);
  return {
    done,
    copy: (text: string, id = text) => {
      navigator.clipboard?.writeText(text).catch(() => toast.error("Não foi possível copiar"));
      setDone(id);
      toast.success("Copiado");
      setTimeout(() => setDone((d) => (d === id ? null : d)), 2000);
    },
  };
}

const FOCUS = "outline-none focus-visible:ring-[3px] focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function CopyBtn({ text, id, label, c }: { text: string; id?: string; label: string; c: ReturnType<typeof useCopy> }) {
  const k = id ?? text;
  const done = c.done === k;
  return (
    <button type="button" onClick={() => c.copy(text, k)} aria-label={done ? `${label} copiado` : `Copiar ${label}`}
      data-copied={done ? "true" : "false"} title={done ? "Copiado!" : `Copiar ${label}`}
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-md transition hover:bg-foreground/10 ${done ? "bg-accent text-accent-foreground opacity-100" : "opacity-70 hover:opacity-100"} ${FOCUS}`}>
      {done ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
    </button>
  );
}

export function ApiKeys() {
  const qc = useQueryClient();
  const c = useCopy();
  const [name, setName] = useState("");
  const [shown, setShown] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState(GROUPS[0]!.id);
  const base = `${window.location.origin}/api/public/v1`;
  const { data = [], error: loadError } = useQuery({
    queryKey: ["admin", "api_keys"],
    queryFn: async () => (await adminFetch<{ data: ApiKey[] }>(KEYS_URL)).data ?? [],
    retry: false,
  });

  const create = async () => {
    setCreating(true);
    try {
      const r = await adminFetch<{ key: string }>(KEYS_URL, { method: "POST", body: { name: name.trim() || "Agente de IA" } });
      setShown(r.key);
      setName("");
      qc.invalidateQueries({ queryKey: ["admin", "api_keys"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível criar a chave");
    } finally {
      setCreating(false);
    }
  };
  const revoke = async (id: string) => {
    if (!confirm("Desativar esta chave? O agente que usa ela para de funcionar.")) return;
    try {
      await adminFetch(`${KEYS_URL}?id=${encodeURIComponent(id)}`, { method: "PATCH" });
      qc.invalidateQueries({ queryKey: ["admin", "api_keys"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível desativar a chave");
    }
  };

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const onTabKey = (e: React.KeyboardEvent) => {
    const i = GROUPS.findIndex((g) => g.id === tab);
    const map: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: GROUPS.length - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    const n = (map[e.key]! + GROUPS.length) % GROUPS.length;
    setTab(GROUPS[n]!.id);
    tabRefs.current[n]?.focus();
  };
  const group = GROUPS.find((g) => g.id === tab)!;
  const active = data.filter((k) => !k.revoked_at).length;

  return (
    <section className="space-y-6 sm:space-y-8">
      <p className="sr-only" role="status" aria-live="polite">{c.done ? "Copiado para a área de transferência" : ""}</p>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-foreground bg-code p-5 sm:p-6 text-code-foreground shadow-brut-md md:p-8">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-accent opacity-90" aria-hidden />
        <div className="absolute -right-4 top-20 size-16 rounded-full bg-brand-orange" aria-hidden />
        <div className="relative space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-accent-foreground">
            <Bot className="size-3.5" /> API v1
          </span>
          <h2 className="max-w-xl pr-16 text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl">API para agentes de IA</h2>
          <p className="max-w-xl text-sm opacity-80">
            Conecte um agente para consultar cadastros e publicar posts, vagas e ferramentas sem abrir o painel.
          </p>
          <a href="/docs/guara-api-manual.pdf" download="Guara-API-manual.pdf"
            className={`inline-flex w-fit items-center gap-2 rounded-lg border-2 border-accent bg-accent px-4 py-2 text-sm font-extrabold text-accent-foreground transition hover:brightness-95 ${FOCUS}`}>
            <Download className="size-4" aria-hidden /> Baixar manual completo (PDF)
          </a>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="flex min-w-0 items-center gap-2 rounded-lg border border-code-foreground/20 bg-code-foreground/5 py-1 pl-3 pr-1 font-mono text-xs">
              <span className="font-sans font-bold opacity-60">Base</span>
              <span className="min-w-0 flex-1 break-all sm:truncate">{base}</span>
              <CopyBtn text={base} id="base" label="endereço base" c={c} />
            </div>
            <div className="flex min-w-0 items-center gap-2 rounded-lg border border-code-foreground/20 bg-code-foreground/5 py-1 pl-3 pr-1 font-mono text-xs">
              <span className="font-sans font-bold opacity-60">Header</span>
              <span className="min-w-0 flex-1 break-all sm:truncate">Authorization: Bearer SUA_CHAVE</span>
              <CopyBtn text="Authorization: Bearer SUA_CHAVE" id="header" label="cabeçalho" c={c} />
            </div>
          </div>
        </div>
      </div>

      {/* Keys */}
      <div className="rounded-2xl border-2 border-foreground bg-card p-4 sm:p-5 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl border-2 border-foreground bg-accent"><KeyRound className="size-5" /></div>
            <div>
              <h3 className="text-lg font-extrabold leading-none">Chaves de acesso</h3>
              <p className="text-xs text-muted-foreground">{active} ativa(s) · cada agente deve ter a sua</p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Input aria-label="Nome da nova chave" className="sm:w-64" placeholder="Nome (ex.: Agente de conteúdo)" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            <Button onClick={create} disabled={creating}><Sparkles className="size-4" /> Criar chave</Button>
          </div>
        </div>

        {shown && (
          <div role="alert" className="space-y-3 rounded-xl border-2 border-foreground bg-accent p-4">
            <p className="flex items-center gap-2 text-sm font-extrabold"><ShieldCheck className="size-4" /> Copie agora — esta chave não será mostrada de novo</p>
            <div className="flex items-center gap-2 rounded-lg bg-code px-3 py-2 font-mono text-sm text-code-foreground">
              <span className="flex-1 break-all">{shown}</span>
              <CopyBtn text={shown} id="new-key" label="chave" c={c} />
            </div>
            <Button size="sm" variant="outline" onClick={() => setShown(null)}>Já copiei</Button>
          </div>
        )}

        {loadError && <p role="alert" className="text-sm font-semibold">{loadError instanceof Error ? loadError.message : "Não foi possível carregar as chaves."}</p>}
        {!data.length && !loadError && <p className="text-sm text-muted-foreground">Nenhuma chave criada ainda.</p>}
        <div className={data.length ? "divide-y divide-border overflow-hidden rounded-xl border-2 border-foreground" : "hidden"}>
          {data.map((k) => (
            <div key={k.id} className={`flex flex-wrap items-center gap-3 bg-card px-4 py-3 text-sm ${k.revoked_at ? "opacity-50" : ""}`}>
              <span className={`size-2.5 rounded-full ${k.revoked_at ? "bg-muted-foreground" : "bg-accent ring-2 ring-foreground"}`} />
              <b className="min-w-0 break-words sm:min-w-32">{k.name}</b>
              <code className="rounded bg-secondary px-2 py-0.5 text-xs">{k.key_prefix}…</code>
              <span className="basis-full text-xs text-muted-foreground sm:basis-auto sm:flex-1">criada {fmtDate(k.created_at)} · último uso {k.last_used_at ? fmtDate(k.last_used_at) : "nunca"}</span>
              {k.revoked_at
                ? <span className="rounded-full border border-foreground/30 px-2 py-0.5 text-xs">Desativada</span>
                : <Button size="sm" variant="outline" onClick={() => revoke(k.id)}>Desativar</Button>}
            </div>
          ))}
        </div>
      </div>

      {/* Docs */}
      <div className="space-y-4">
        <div role="tablist" aria-label="Seções do manual da API" onKeyDown={onTabKey}
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 pt-1 sm:flex-wrap sm:overflow-visible">
          {GROUPS.map((g, i) => (
            <button key={g.id} type="button" role="tab" id={`tab-${g.id}`} aria-selected={tab === g.id}
              aria-controls={`panel-${g.id}`} tabIndex={tab === g.id ? 0 : -1}
              ref={(el) => { tabRefs.current[i] = el; }} onClick={() => setTab(g.id)}
              className={`shrink-0 whitespace-nowrap rounded-full border-2 border-foreground px-4 py-2 text-sm font-bold transition ${tab === g.id ? "bg-foreground text-background shadow-brut-accent" : "bg-card hover:bg-accent"} ${FOCUS}`}>
              {g.title}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${group.id}`} aria-labelledby={`tab-${group.id}`} tabIndex={0}
          className={`rounded-2xl border-2 border-foreground bg-card p-4 sm:p-5 md:p-6 space-y-4 ${FOCUS}`}>
          <div>
            <h3 className="text-xl font-extrabold">{group.title}</h3>
            <p className="text-sm text-muted-foreground">{group.intro}</p>
          </div>
          <div className="space-y-2">
            {group.eps.map((e, i) => (
              <div key={i} className="overflow-hidden rounded-xl border-2 border-foreground">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-background py-2 pl-3 pr-1.5">
                  <span className={`w-16 shrink-0 rounded-md py-0.5 text-center font-mono text-xs font-extrabold ${METHOD_CLS[e.m]}`}>{e.m}</span>
                  <code className="min-w-0 flex-1 break-all font-mono text-sm font-semibold sm:flex-none">{e.path}</code>
                  <span className="order-last basis-full text-xs text-muted-foreground sm:order-none sm:basis-auto sm:flex-1">{e.desc}</span>
                  <CopyBtn text={`${base}${e.path}`} id={`${group.id}-${i}`} label={`endereço ${e.m} ${e.path} (${e.desc})`} c={c} />
                </div>
                {e.body && (
                  <div className="relative bg-code text-code-foreground">
                    <div className="absolute right-2 top-2"><CopyBtn text={e.body} id={`${group.id}-${i}-b`} label={`exemplo ${e.m} ${e.path} (${e.desc})`} c={c} /></div>
                    <pre tabIndex={0} aria-label={`Exemplo de envio ${e.m} ${e.path}`} className={`overflow-x-auto p-4 pr-12 font-mono text-xs leading-relaxed ${FOCUS}`}>{e.body}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
          {group.notes && (
            <ul className="space-y-1.5 rounded-xl bg-secondary p-4 text-xs">
              {group.notes.map((n) => <li key={n} className="flex gap-2"><span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand-orange" />{n}</li>)}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border-2 border-foreground bg-card p-5">
          <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wide">Códigos de erro</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ERRORS.map(([code, msg]) => (
              <div key={code} className="flex items-start gap-2 text-xs">
                <span className="rounded-md bg-code px-2 py-0.5 font-mono font-bold text-code-foreground">{code}</span>
                <span className="pt-0.5">{msg}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Formato: {'{"error": "mensagem", "details": …}'}</p>
        </div>
      </div>
    </section>
  );
}

export { GROUPS };

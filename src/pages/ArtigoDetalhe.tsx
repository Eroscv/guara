import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Lock, Mail, ArrowRight } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize";
import Layout from "@/components/Layout";
import NewsletterInline from "@/components/NewsletterInline";
import SEO from "@/components/SEO";
import SharePost from "@/components/SharePost";
import { supabase } from "@/integrations/supabase/client";

const ArtigoDetalhe = () => {
  const { slug } = useParams();
  const [unlocked, setUnlocked] = useState(false);
  const [email, setEmail] = useState("");

  const { data: article, isLoading } = useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("articles").select("*").eq("slug", slug!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (!slug || !article) return;
    const key = `viewed:article:${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    supabase.rpc("increment_article_views" as any, { _slug: slug });
  }, [slug, article]);

  if (isLoading) return <Layout><div className="pt-28 pb-20 text-center text-muted-foreground">Carregando...</div></Layout>;

  if (!article) {
    return (
      <Layout>
        <SEO title="Artigo não encontrado — Guará Media" path={`/artigos/${slug}`} noindex />
        <div className="pt-28 pb-20 container mx-auto px-4 text-center">
          <h1 className="font-heading font-bold text-2xl">Artigo não encontrado</h1>
          <Link to="/artigos" className="text-primary mt-4 inline-block">← Voltar</Link>
        </div>
      </Layout>
    );
  }

  const isGated = article.gated && !unlocked;
  const fullUrl = `https://prospectpath-studio.lovable.app/artigos/${article.slug}`;

  return (
    <Layout>
      <SEO
        title={`${article.title} — Guará Media`}
        description={article.excerpt}
        path={`/artigos/${article.slug}`}
        image={article.cover_image || undefined}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.excerpt,
          image: article.cover_image,
          datePublished: article.published_at,
          publisher: { "@type": "Organization", name: "Guará Media" },
        }}
      />
      <article className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link to="/artigos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft size={14} /> Voltar aos artigos
          </Link>

          <h1 className="font-heading font-bold text-3xl md:text-4xl leading-tight">{article.title}</h1>
          <span className="flex items-center gap-1 text-sm text-muted-foreground mt-4">
            <Calendar size={14} /> {new Date(article.published_at).toLocaleDateString("pt-BR")}
          </span>

          {article.cover_image && (
            <img src={article.cover_image} alt={article.title} className="w-full rounded-2xl mt-8 aspect-video object-cover" />
          )}

          {isGated ? (
            <div className="mt-10 bg-card rounded-2xl p-10 shadow-card text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/95 to-transparent" />
              <div className="relative">
                <Lock size={40} className="mx-auto text-primary mb-4" />
                <h3 className="font-heading font-bold text-xl">Conteúdo exclusivo</h3>
                <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-md mx-auto">
                  Cadastre seu email para desbloquear este artigo e receber conteúdos premium.
                </p>
                <form
                  onSubmit={(e) => { e.preventDefault(); if (email) setUnlocked(true); }}
                  className="flex gap-2 max-w-md mx-auto"
                >
                  <div className="relative flex-1">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Seu email"
                      className="w-full pl-9 pr-3 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <button className="bg-gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity whitespace-nowrap">
                    Desbloquear <ArrowRight size={14} />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <>
              <div
                className="prose prose-lg max-w-none mt-10 text-foreground prose-headings:font-heading prose-headings:text-foreground prose-a:text-primary"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content || "") }}
              />
              <div className="mt-10 pt-6 border-t">
                <SharePost url={fullUrl} title={article.title} />
              </div>
              <div className="mt-14">
                <NewsletterInline />
              </div>
            </>
          )}
        </div>
      </article>
    </Layout>
  );
};

export default ArtigoDetalhe;

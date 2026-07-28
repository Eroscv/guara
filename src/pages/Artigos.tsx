import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import NewsletterInline from "@/components/NewsletterInline";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { extractEmbedSrcFromHtml, embedSrcToPostUrl } from "@/lib/linkedin-embed";

const Artigos = () => {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id,title,slug,content,published_at")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const items = (articles as any[])
    .map((a) => {
      const src = extractEmbedSrcFromHtml(a.content);
      return src ? { ...a, embedSrc: src, postUrl: embedSrcToPostUrl(src) } : null;
    })
    .filter(Boolean) as Array<any>;

  return (
    <Layout>
      <SEO
        title="Artigos — Guará Media"
        description="Posts curados do LinkedIn sobre marketing digital, performance e crescimento."
        path="/artigos"
      />
      <section className="pt-28 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-12">
            <h1 className="font-heading font-bold text-4xl md:text-5xl">Artigos</h1>
            <p className="text-muted-foreground mt-3 text-lg">Publicações do LinkedIn selecionadas pela nossa equipe.</p>
          </div>

          {isLoading ? (
            <p className="text-center text-muted-foreground py-20">Carregando...</p>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground py-20">Nenhum post publicado ainda.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 justify-items-center">
              {items.map((article, i) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="w-full max-w-[504px]"
                >
                  <div className="relative group">
                    <iframe
                      src={article.embedSrc}
                      width={504}
                      height={542}
                      frameBorder={0}
                      allowFullScreen
                      title={article.title || "Publicação incorporada"}
                      loading="lazy"
                      className="w-full rounded-2xl border bg-card shadow-card"
                    />
                    <a
                      href={article.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-3 right-3 inline-flex items-center gap-1 bg-foreground/80 hover:bg-foreground text-background text-xs font-semibold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Abrir no LinkedIn"
                    >
                      Abrir no LinkedIn <ExternalLink size={12} />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <NewsletterInline />
        </div>
      </section>
    </Layout>
  );
};

export default Artigos;

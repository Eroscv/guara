import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";
import NewsletterInline from "@/components/NewsletterInline";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 9;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }),
};

const Blog = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id,title,slug,excerpt,cover_image,category,tags,published_at,reading_time")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const categories = useMemo(
    () => Array.from(new Set(posts.map((p: any) => p.category).filter(Boolean))),
    [posts],
  );
  const tags = useMemo(
    () => Array.from(new Set(posts.flatMap((p: any) => p.tags || []))).slice(0, 12),
    [posts],
  );

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return posts.filter((p: any) => {
      if (s && !p.title.toLowerCase().includes(s) && !(p.excerpt || "").toLowerCase().includes(s)) return false;
      if (activeCategory && p.category !== activeCategory) return false;
      if (activeTag && !(p.tags || []).includes(activeTag)) return false;
      return true;
    });
  }, [posts, search, activeCategory, activeTag]);

  const shown = filtered.slice(0, visible);

  return (
    <Layout>
      <SEO
        title="Blog — Guará Media"
        description="Conteúdos sobre marketing digital, SEO, branding, performance e tecnologia para quem quer crescer."
        path="/blog"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Blog Guará Media",
          url: "https://prospectpath-studio.lovable.app/blog",
        }}
      />
      <section className="pt-28 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-12">
            <h1 className="font-heading font-bold text-4xl md:text-5xl">Blog</h1>
            <p className="text-muted-foreground mt-3 text-lg">Conteúdos sobre marketing digital, SEO, branding e muito mais.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Buscar artigos..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setVisible(PAGE_SIZE); }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setActiveCategory(null); setVisible(PAGE_SIZE); }}
                className={`px-4 py-2 rounded-md text-sm font-semibold uppercase tracking-wide transition-all ${
                  !activeCategory ? "border-2 border-dashed border-primary text-primary bg-primary/5" : "border-2 border-transparent text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                Todos
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => { setActiveCategory(activeCategory === c ? null : c); setVisible(PAGE_SIZE); }}
                  className={`px-4 py-2 rounded-md text-sm font-semibold uppercase tracking-wide transition-all ${
                    activeCategory === c ? "border-2 border-dashed border-primary text-primary bg-primary/5" : "border-2 border-transparent text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10">
              {tags.map((t) => (
                <button
                  key={t}
                  onClick={() => { setActiveTag(activeTag === t ? null : t); setVisible(PAGE_SIZE); }}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    activeTag === t ? "bg-foreground text-background border-foreground" : "bg-transparent text-muted-foreground border-input hover:border-foreground"
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <p className="text-center text-muted-foreground py-20">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-20">Nenhum post encontrado.</p>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {shown.slice(0, 3).map((post: any, i: number) => (
                  <motion.div key={post.id} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp}>
                    <PostCard post={post} />
                  </motion.div>
                ))}
              </div>
              {shown.length > 3 && (
                <>
                  <div className="my-10"><NewsletterInline /></div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {shown.slice(3).map((post: any, i: number) => (
                      <motion.div key={post.id} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp}>
                        <PostCard post={post} />
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
              {filtered.length > visible && (
                <div className="text-center mt-10">
                  <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                    Carregar mais ({filtered.length - visible} restantes)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Blog;

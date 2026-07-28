import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize";
import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";
import NewsletterInline from "@/components/NewsletterInline";
import SEO from "@/components/SEO";
import SharePost from "@/components/SharePost";
import { supabase } from "@/integrations/supabase/client";

const BlogPost = () => {
  const { slug } = useParams();

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("posts").select("*").eq("slug", slug!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Increment view (once per session)
  useEffect(() => {
    if (!slug || !post) return;
    const key = `viewed:post:${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    supabase.rpc("increment_post_views" as any, { _slug: slug });
  }, [slug, post]);

  const { data: related = [] } = useQuery({
    queryKey: ["related-posts", post?.category, post?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("id,title,slug,excerpt,cover_image,category,published_at,reading_time")
        .eq("category", post!.category)
        .neq("id", post!.id)
        .limit(3);
      return data ?? [];
    },
    enabled: !!post,
  });

  if (isLoading) return <Layout><div className="pt-28 pb-20 text-center text-muted-foreground">Carregando...</div></Layout>;

  if (!post) {
    return (
      <Layout>
        <SEO title="Post não encontrado — Guará Media" path={`/blog/${slug}`} noindex />
        <div className="pt-28 pb-20 container mx-auto px-4 text-center">
          <h1 className="font-heading font-bold text-2xl">Post não encontrado</h1>
          <Link to="/blog" className="text-primary mt-4 inline-block">← Voltar ao blog</Link>
        </div>
      </Layout>
    );
  }

  const fullUrl = `https://prospectpath-studio.lovable.app/blog/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.cover_image,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { "@type": "Person", name: post.author || "Guará Media" },
    publisher: { "@type": "Organization", name: "Guará Media" },
    mainEntityOfPage: fullUrl,
  };

  return (
    <Layout>
      <SEO
        title={`${post.title} — Guará Media`}
        description={post.excerpt}
        path={`/blog/${post.slug}`}
        image={post.cover_image || undefined}
        type="article"
        jsonLd={jsonLd}
      />
      <article className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft size={14} /> Voltar ao blog
          </Link>

          <span className="text-xs font-semibold text-primary bg-accent px-2.5 py-1 rounded-full">{post.category}</span>
          <h1 className="font-heading font-bold text-3xl md:text-4xl mt-4 leading-tight">{post.title}</h1>

          <div className="flex items-center gap-5 mt-5 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><User size={14} /> {post.author}</span>
            <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(post.published_at).toLocaleDateString("pt-BR")}</span>
            <span className="flex items-center gap-1"><Clock size={14} /> {post.reading_time} min</span>
          </div>

          {post.cover_image && (
            <img src={post.cover_image} alt={post.title} className="w-full rounded-2xl mt-8 aspect-video object-cover" />
          )}

          <div
            className="prose prose-lg max-w-none mt-10 text-foreground prose-headings:font-heading prose-headings:text-foreground prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content || "") }}
          />

          <div className="mt-10 pt-6 border-t">
            <SharePost url={fullUrl} title={post.title} />
          </div>

          <div className="mt-14">
            <NewsletterInline />
          </div>
        </div>

        {related.length > 0 && (
          <div className="container mx-auto px-4 mt-16">
            <h2 className="font-heading font-bold text-2xl mb-6">Posts relacionados</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          </div>
        )}
      </article>
    </Layout>
  );
};

export default BlogPost;

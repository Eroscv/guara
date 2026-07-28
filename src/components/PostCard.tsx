import { Link } from "react-router-dom";
import { Clock, Calendar } from "lucide-react";

export interface PostCardData {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string | null;
  category: string;
  published_at: string;
  reading_time: number;
}

const PostCard = ({ post }: { post: PostCardData }) => (
  <Link to={`/blog/${post.slug}`} className="group block">
    <article className="bg-card rounded-2xl overflow-hidden shadow-card card-lift">
      <div className="aspect-[16/10] overflow-hidden bg-muted">
        {post.cover_image && (
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        )}
      </div>
      <div className="p-5">
        <span className="text-xs font-semibold text-primary bg-accent px-2.5 py-1 rounded-full">
          {post.category}
        </span>
        <h3 className="font-heading font-bold text-foreground mt-3 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(post.published_at).toLocaleDateString("pt-BR")}</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {post.reading_time} min</span>
        </div>
      </div>
    </article>
  </Link>
);

export default PostCard;

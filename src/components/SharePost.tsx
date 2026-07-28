import { Linkedin, Link2, MessageCircle, Twitter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Props {
  url: string;
  title: string;
}

const SharePost = ({ url, title }: Props) => {
  const enc = encodeURIComponent;
  const links = [
    { label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${enc(`${title} — ${url}`)}` },
    { label: "LinkedIn", icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { label: "X / Twitter", icon: Twitter, href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}` },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground mr-1">Compartilhar:</span>
      {links.map((l) => (
        <Button key={l.label} variant="outline" size="sm" asChild>
          <a href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.label}>
            <l.icon size={14} />
          </a>
        </Button>
      ))}
      <Button variant="outline" size="sm" onClick={copy} aria-label="Copiar link">
        <Link2 size={14} />
      </Button>
    </div>
  );
};

export default SharePost;

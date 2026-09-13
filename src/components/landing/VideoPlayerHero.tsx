import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Play } from "lucide-react";

interface Props {
  src?: string;
  cover?: string;
  eyebrow?: string;
  title: string;
}

/** Player centralizado usado nas seções "Vídeo de apresentação" e "Como é trabalhar com a gente". */
const VideoPlayerHero = ({ src, cover, eyebrow, title }: Props) => {
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1, 0.94]);

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-3xl mx-auto text-center mb-10">
        {eyebrow && <p className="text-sm md:text-base font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>}
        <h2 className="mt-3 font-heading font-extrabold text-2xl md:text-4xl leading-tight tracking-tight">{title}</h2>
      </div>

      <motion.div ref={ref} style={{ scale }} className="max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => src && setPlaying(true)}
          disabled={!src}
          aria-label={src ? "Reproduzir vídeo" : "Vídeo em produção"}
          className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/10 group disabled:cursor-not-allowed"
        >
          {playing && src ? (
            <video src={src} controls autoPlay className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <>
              {cover ? (
                <img src={cover} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-70" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white/30 text-sm">{src ? "Capa em produção" : "Vídeo em produção"}</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/30" />
              {src ? (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg animate-pulse group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
                  </span>
                </span>
              ) : (
                <span className="absolute top-4 left-4 text-[10px] uppercase tracking-wide text-primary bg-black/60 border border-primary/40 rounded-full px-2.5 py-1">
                  Vídeo em produção
                </span>
              )}
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
};

export default VideoPlayerHero;

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";

interface Props {
  src: string;
  type?: "video" | "image";
  aspect?: "9/16" | "1/1" | "16/9" | "4/5";
  overlay?: ReactNode;
  autoPlayOnView?: boolean;
  handle?: string;
  index?: number;
  className?: string;
  isPlaceholder?: boolean;
  /** Imagem temática de fundo pro card placeholder, pra não ficar um bloco vazio. */
  placeholderImage?: string;
}

const ASPECT_CLASS: Record<NonNullable<Props["aspect"]>, string> = {
  "9/16": "aspect-[9/16]",
  "1/1": "aspect-square",
  "16/9": "aspect-video",
  "4/5": "aspect-[4/5]",
};

/**
 * Primitiva única de vídeo lazy do projeto: lazy-load via IntersectionObserver,
 * preview no hover, som ao clicar. Se `src` estiver vazio, renderiza um estado
 * de placeholder (conteúdo real ainda não disponível).
 */
const VideoCard = ({
  src,
  type = "video",
  aspect = "9/16",
  overlay,
  autoPlayOnView = false,
  handle,
  index = 0,
  className = "",
  isPlaceholder = false,
  placeholderImage,
}: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!src || type !== "video") return;
    const el = videoRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !el.src) {
            el.src = src;
            el.preload = "metadata";
            if (autoPlayOnView && !prefersReducedMotion) {
              el.play().then(() => setPlaying(true)).catch(() => {});
            }
            io.disconnect();
          }
        });
      },
      { rootMargin: "200px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [src, type, autoPlayOnView, prefersReducedMotion]);

  const handleMouseEnter = useCallback(() => {
    if (!src || type !== "video") return;
    const el = videoRef.current;
    if (!el) return;
    if (!el.src) el.src = src;
    el.play().catch(() => {});
  }, [src, type]);

  const handleMouseLeave = useCallback(() => {
    if (autoPlayOnView || type !== "video") return;
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  }, [autoPlayOnView, type]);

  const handleClick = useCallback(() => {
    if (!src || type !== "video") return;
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.muted = false;
      el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }, [src, type]);

  const handleTogglePlay = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const el = videoRef.current;
      if (!el) return;
      if (el.paused) {
        el.play();
        setPlaying(true);
      } else {
        el.pause();
        setPlaying(false);
      }
    },
    [],
  );

  if (!src || isPlaceholder || videoError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay: (index % 5) * 0.05 }}
        className={`shrink-0 ${ASPECT_CLASS[aspect]} rounded-lg relative overflow-hidden border border-dashed border-white/20 bg-white/[0.03] ${className}`}
      >
        {placeholderImage ? (
          <>
            <img src={placeholderImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" loading="lazy" />
            <div className="absolute inset-0 bg-black/40" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[11px] text-white/40 text-center px-3">
              {videoError ? "Vídeo indisponível" : "Criativo em produção"}
            </p>
          </div>
        )}
        <span className="absolute top-2 left-2 z-10 text-[9px] uppercase tracking-wide text-primary bg-black/60 border border-primary/40 rounded-full px-2 py-0.5">
          {videoError ? "Indisponível" : "Em produção"}
        </span>
        {overlay && <div className="absolute inset-0 flex items-end p-3 opacity-0 hover:opacity-100 transition-opacity z-10">{overlay}</div>}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: (index % 5) * 0.05 }}
      className={`shrink-0 ${ASPECT_CLASS[aspect]} rounded-lg overflow-hidden relative group ${type === "video" ? "cursor-pointer" : ""} ring-1 ring-white/10 hover:ring-primary/50 transition-all bg-black ${className}`}
      onClick={type === "video" ? handleClick : undefined}
      role={type === "video" ? "button" : undefined}
      tabIndex={type === "video" ? 0 : undefined}
      aria-label={type === "video" ? `Reproduzir vídeo ${index + 1}` : undefined}
      onKeyDown={type === "video" ? (e) => e.key === "Enter" && handleClick() : undefined}
    >
      {type === "image" ? (
        <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      ) : (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          loop
          playsInline
          preload="none"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onError={() => setVideoError(true)}
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-80 group-hover:opacity-40 transition-opacity" />

      {handle && (
        <div className="absolute top-3 left-3 flex items-center gap-2 z-10 pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 ring-2 ring-white/30" />
          <p className="text-[11px] font-semibold text-white drop-shadow">{handle}</p>
        </div>
      )}

      {overlay && (
        <div className="absolute inset-0 flex flex-col items-start justify-end p-3 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          {overlay}
        </div>
      )}

      {type === "video" && !autoPlayOnView && (
        <div className="absolute inset-0 flex items-center justify-center opacity-90 group-hover:opacity-0 transition-opacity pointer-events-none">
          <svg viewBox="0 0 24 24" className="w-16 h-16 text-white drop-shadow-lg" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      )}

      {type === "video" && autoPlayOnView && (
        <button
          type="button"
          onClick={handleTogglePlay}
          aria-label={playing ? "Pausar vídeo" : "Reproduzir vídeo"}
          className="absolute bottom-2 right-2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
      )}
    </motion.div>
  );
};

export default VideoCard;

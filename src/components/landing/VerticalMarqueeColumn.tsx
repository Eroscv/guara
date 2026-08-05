interface Props {
  images: string[];
  direction?: "up" | "down";
  duration?: number;
  className?: string;
}

/**
 * Coluna com imagens em loop vertical infinito — usada no mosaico da Hero
 * para dar sensação de "abundância" de criativos, mesmo com poucos itens.
 */
const VerticalMarqueeColumn = ({ images, direction = "up", duration = 22, className = "" }: Props) => (
  <div className={`relative overflow-hidden rounded-2xl h-full ${className}`}>
    <div
      className="flex flex-col gap-3 animate-vertical-marquee"
      style={{
        animationDuration: `${duration}s`,
        animationDirection: direction === "down" ? "reverse" : "normal",
      }}
    >
      {[...images, ...images].map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          loading="lazy"
          className="w-full aspect-[4/5] object-cover rounded-2xl shrink-0 ring-1 ring-white/10"
        />
      ))}
    </div>
  </div>
);

export default VerticalMarqueeColumn;

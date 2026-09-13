import type { ReactNode } from "react";

interface Props {
  items: ReactNode[];
  speed?: "slow" | "normal" | "fast";
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  gapClassName?: string;
  className?: string;
}

const SPEED_DURATION: Record<NonNullable<Props["speed"]>, string> = {
  slow: "60s",
  normal: "40s",
  fast: "22s",
};

/**
 * Marquee infinito genérico — generaliza o keyframe `animate-logo-marquee`
 * (src/index.css). Usado no logo wall (07) e no carrossel de valores (16).
 */
const InfiniteMarquee = ({
  items,
  speed = "normal",
  direction = "left",
  pauseOnHover = true,
  gapClassName = "gap-16 md:gap-24",
  className = "",
}: Props) => (
  <div
    tabIndex={0}
    role="group"
    aria-label="Carrossel automático — foco pausa a animação"
    className={`relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] ${pauseOnHover ? "logo-marquee-wrapper" : ""} focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${className}`}
  >
    <div
      className={`flex w-max ${gapClassName} animate-logo-marquee`}
      style={{
        animationDuration: SPEED_DURATION[speed],
        animationDirection: direction === "right" ? "reverse" : "normal",
      }}
    >
      {[...items, ...items, ...items].map((item, i) => (
        <div key={i} className="shrink-0">
          {item}
        </div>
      ))}
    </div>
  </div>
);

export default InfiniteMarquee;

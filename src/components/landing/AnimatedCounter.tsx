import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface Props {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
  /** If true, restarts the count-up every time it re-enters view (for sections that should "never sit still"). */
  loop?: boolean;
}

const AnimatedCounter = ({ value, prefix = "", suffix = "", duration = 1.6, decimals = 0, className = "", loop = false }: Props) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: !loop, margin: "-10%" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf: number;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
};

export default AnimatedCounter;

import { useEffect } from "react";

interface Props {
  label: string;
  className?: string;
}

/** Dev-only badge marking sections/cards that still need real content. */
const PlaceholderBanner = ({ label, className = "" }: Props) => {
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.warn(`[placeholder] ${label} ainda usa conteúdo placeholder — ver src/data/landingContent.ts`);
    }
  }, [label]);

  if (!import.meta.env.DEV) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-dashed border-primary/50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary/80 ${className}`}
    >
      placeholder · {label}
    </span>
  );
};

export default PlaceholderBanner;

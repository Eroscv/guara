import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CreativeItem } from "@/data/landingContent";
import VideoCard from "./VideoCard";

interface Props {
  items: CreativeItem[];
}

const TABS: { id: CreativeItem["category"]; label: string }[] = [
  { id: "estatico", label: "Estático" },
  { id: "ugc", label: "UGC" },
  { id: "alta-producao", label: "Alta Produção" },
];

// Alterna aspect ratio / row-span por posição para quebrar a grade uniforme.
const SPAN_PATTERN = ["row-span-2", "", "", "row-span-2", "", "", "", "row-span-2", ""];

const CreativeGalleryTabs = ({ items }: Props) => {
  const [active, setActive] = useState<CreativeItem["category"]>("estatico");

  const filtered = useMemo(() => items.filter((i) => i.category === active), [items, active]);

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-wrap gap-3 mb-10 justify-center">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold uppercase tracking-wide transition-colors border ${
              active === tab.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-white/15 text-white/60 hover:text-white hover:border-white/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={{
            visible: { transition: { staggerChildren: 0.03 } },
            hidden: {},
          }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 auto-rows-[140px] sm:auto-rows-[170px] gap-3"
        >
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0 },
              }}
              className={SPAN_PATTERN[i % SPAN_PATTERN.length]}
            >
              <VideoCard
                src={item.src}
                type={item.type}
                aspect={item.aspect}
                index={i}
                isPlaceholder={item.isPlaceholder}
                placeholderImage={item.placeholderImage}
                handle={item.type === "image" ? "" : undefined}
                className="w-full h-full"
                overlay={
                  <div className="text-white text-[10px] leading-tight space-y-0.5">
                    {item.persona && <p className="font-bold uppercase">{item.persona}</p>}
                    {item.angulo && <p className="uppercase opacity-90">{item.angulo}</p>}
                    {item.modelo && <p className="uppercase opacity-70">{item.modelo}</p>}
                  </div>
                }
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CreativeGalleryTabs;

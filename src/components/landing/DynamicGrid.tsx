import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { CreativeItem } from "@/data/landingContent";

interface Cell {
  persona: string;
  angulo: string;
  modelo: string;
}

interface Props {
  items: CreativeItem[];
}

const GRID_SIZE = 9;

/**
 * Matriz Persona × Ângulo × Modelo — assinatura visual da metodologia.
 * Preenche célula por célula em loop contínuo (nunca fica parada).
 */
const DynamicGrid = ({ items }: Props) => {
  const [filled, setFilled] = useState(0);
  const cells: Cell[] = items.slice(0, GRID_SIZE).map((i) => ({
    persona: i.persona ?? "PERSONA",
    angulo: i.angulo ?? "ÂNGULO",
    modelo: i.modelo ?? "MODELO",
  }));

  useEffect(() => {
    const id = setInterval(() => {
      setFilled((f) => (f + 1) % (cells.length + 3));
    }, 450);
    return () => clearInterval(id);
  }, [cells.length]);

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-3">
      {cells.map((cell, i) => {
        const active = i < filled;
        return (
          <motion.div
            key={i}
            animate={{ opacity: active ? 1 : 0.15, scale: active ? 1 : 0.92 }}
            transition={{ duration: 0.35 }}
            className="aspect-square rounded-xl border border-primary/30 bg-primary/5 flex flex-col items-center justify-center text-center p-2"
          >
            <p className="text-[9px] md:text-[10px] font-bold uppercase text-primary leading-tight">{cell.persona}</p>
            <p className="text-[8px] md:text-[9px] uppercase text-white/70 leading-tight mt-1">{cell.angulo}</p>
            <p className="text-[8px] md:text-[9px] uppercase text-[#C8E64A] leading-tight mt-1">{cell.modelo}</p>
          </motion.div>
        );
      })}
    </div>
  );
};

export default DynamicGrid;

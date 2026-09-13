import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { MethodologyStepData } from "@/data/landingContent";

interface Props {
  data: MethodologyStepData;
  media: ReactNode;
}

const MethodologyStep = ({ data, media }: Props) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.6 }}
    className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center"
  >
    <div>
      <span className="font-heading font-black text-5xl md:text-6xl text-primary/30">
        {String(data.step).padStart(2, "0")}
      </span>
      <h3 className="mt-2 font-heading font-extrabold text-2xl md:text-3xl leading-tight">{data.title}</h3>
      <p className="mt-4 text-white/70 leading-relaxed">{data.description}</p>
      <ul className="mt-5 space-y-2">
        {data.bullets.map((b) => (
          <li key={b} className="flex gap-2 text-sm md:text-base text-white/80">
            <span className="text-primary" aria-hidden>
              •
            </span>
            {b}
          </li>
        ))}
      </ul>
    </div>

    <div className="min-h-[280px]">{media}</div>
  </motion.div>
);

export default MethodologyStep;

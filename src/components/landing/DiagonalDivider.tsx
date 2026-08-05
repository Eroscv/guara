import { motion } from "framer-motion";

interface Props {
  from: string;
  to: string;
}

/** Horizontal wipe transition between sections */
const DiagonalDivider = ({ from, to }: Props) => (
  <div className="relative h-[70px] md:h-[110px] overflow-hidden" style={{ background: from }} aria-hidden>
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.9, ease: [0.83, 0, 0.17, 1] }}
      style={{ background: to, transformOrigin: "left center" }}
      className="absolute inset-0"
    />
  </div>
);

export default DiagonalDivider;

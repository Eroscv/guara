import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

/** Floating CTA that appears after the hero and hides once the lead form is on screen. */
const StickyCta = () => {
  const [visible, setVisible] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const heroHeight = window.innerHeight * 0.8;
    const form = document.getElementById("diagnostico");
    const formTop = form ? form.getBoundingClientRect().top + window.scrollY : Infinity;
    setVisible(y > heroHeight && y < formTop - 200);
  });

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href="#diagnostico"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3.5 rounded-full font-semibold text-sm shadow-soft hover:opacity-90 transition-opacity"
        >
          Agendar Diagnóstico
          <ArrowRight size={16} />
        </motion.a>
      )}
    </AnimatePresence>
  );
};

export default StickyCta;

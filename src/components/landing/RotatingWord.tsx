import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  words: string[];
  interval?: number;
}

const RotatingWord = ({ words, interval = 2500 }: Props) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % words.length);
    }, interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  return (
    <span className="relative inline-block align-top">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
          className="block"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

export default RotatingWord;

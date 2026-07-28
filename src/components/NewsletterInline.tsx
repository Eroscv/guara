import { useState } from "react";
import { Mail, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const NewsletterInline = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-accent rounded-2xl p-8 text-center"
      >
        <p className="text-accent-foreground font-heading font-semibold text-lg">🎉 Inscrição confirmada!</p>
        <p className="text-muted-foreground text-sm mt-1">Você receberá nossos conteúdos em breve.</p>
      </motion.div>
    );
  }

  return (
    <div className="bg-gradient-primary rounded-2xl p-8 md:p-10 text-primary-foreground">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1">
          <h3 className="font-heading font-bold text-xl md:text-2xl">Receba conteúdos exclusivos</h3>
          <p className="text-sm opacity-80 mt-1">Assine nossa newsletter e fique por dentro das melhores estratégias de marketing.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu melhor email"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-primary-foreground/20 border border-primary-foreground/30 text-sm placeholder:text-primary-foreground/50 focus:outline-none focus:border-primary-foreground/60"
            />
          </div>
          <button className="bg-primary-foreground text-primary px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity whitespace-nowrap">
            Assinar <ArrowRight size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewsletterInline;

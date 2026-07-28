import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { tools } from "@/data/mockData";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Ferramentas = () => (
  <Layout>
    <SEO title="Ferramentas — Guará Media" description="Materiais gratuitos, templates e recursos para impulsionar sua estratégia de marketing." path="/ferramentas" />
    <section className="pt-28 pb-20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mb-12">
          <h1 className="font-heading font-bold text-4xl md:text-5xl">Ferramentas e Recursos</h1>
          <p className="text-muted-foreground mt-3 text-lg">Materiais gratuitos para impulsionar sua estratégia de marketing.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.id}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <Link to={`/ferramentas/${tool.slug}`} className="group block">
                <div className="bg-card rounded-2xl overflow-hidden shadow-card card-lift">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img src={tool.cover_image} alt={tool.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  </div>
                  <div className="p-5">
                    <span className="text-xs font-semibold text-primary bg-accent px-2.5 py-1 rounded-full">{tool.category}</span>
                    <h3 className="font-heading font-bold text-lg mt-3 mb-2 group-hover:text-primary transition-colors">{tool.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{tool.description}</p>
                    <span className="inline-flex items-center gap-1 text-primary text-sm font-semibold mt-4">
                      Acessar <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  </Layout>
);

export default Ferramentas;

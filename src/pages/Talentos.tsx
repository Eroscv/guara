import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Briefcase, Monitor, Search } from "lucide-react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const values = [
  { emoji: "🎯", title: "Foco em resultados", desc: "Orientados por dados e impacto real." },
  { emoji: "🤝", title: "Colaboração", desc: "Trabalhamos juntos para ir mais longe." },
  { emoji: "🚀", title: "Inovação", desc: "Experimentamos e evoluímos constantemente." },
  { emoji: "💡", title: "Aprendizado", desc: "Crescemos como pessoas e profissionais." },
];

const workModelColors: Record<string, string> = {
  remoto: "bg-green-100 text-green-700",
  "híbrido": "bg-blue-100 text-blue-700",
  presencial: "bg-amber-100 text-amber-700",
};

const PAGE_SIZE = 6;

const Talentos = () => {
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id,title,department,location,work_model")
        .eq("is_open", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return jobs.filter((j: any) =>
      !s ||
      j.title.toLowerCase().includes(s) ||
      j.department?.toLowerCase().includes(s) ||
      j.location?.toLowerCase().includes(s),
    );
  }, [jobs, search]);

  const shown = filtered.slice(0, visible);

  return (
    <Layout>
      <SEO
        title="Vagas — Trabalhe na Guará Media"
        description="Faça parte do nosso time. Confira as vagas abertas em marketing, performance, design, dados e tecnologia."
        path="/talentos"
        jsonLd={jobs.slice(0, 10).map((j: any) => ({
          "@context": "https://schema.org",
          "@type": "JobPosting",
          title: j.title,
          hiringOrganization: { "@type": "Organization", name: "Guará Media" },
          jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: j.location } },
          employmentType: "FULL_TIME",
          jobLocationType: j.work_model === "remoto" ? "TELECOMMUTE" : undefined,
          datePosted: new Date().toISOString().slice(0, 10),
          url: `https://prospectpath-studio.lovable.app/talentos/${j.id}`,
        }))}
      />
      <section className="pt-28 pb-16">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="font-heading font-bold text-4xl md:text-5xl">Faça parte do nosso time</h1>
          <p className="text-muted-foreground mt-4 text-lg">Estamos sempre em busca de pessoas talentosas e apaixonadas por marketing digital.</p>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-4">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-center mb-10">Nossos valores</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-6 shadow-card text-center"
              >
                <span className="text-4xl">{v.emoji}</span>
                <h3 className="font-heading font-semibold mt-3">{v.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-4">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-center mb-8">Vagas abertas</h2>

          <div className="max-w-md mx-auto mb-8 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar vaga..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setVisible(PAGE_SIZE); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {isLoading ? (
              <p className="text-center text-muted-foreground">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground">Nenhuma vaga encontrada.</p>
            ) : shown.map((job: any) => (
              <Link key={job.id} to={`/talentos/${job.id}`} className="block group">
                <div className="bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-heading font-bold text-lg group-hover:text-primary transition-colors">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Briefcase size={14} /> {job.department}</span>
                        <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                        <span className="flex items-center gap-1"><Monitor size={14} /> {job.work_model}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${workModelColors[job.work_model] || ""}`}>
                      {job.work_model}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {filtered.length > visible && (
              <div className="text-center pt-4">
                <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                  Carregar mais ({filtered.length - visible} restantes)
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Talentos;

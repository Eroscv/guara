import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Briefcase, Monitor, Check } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import JobApplicationForm from "@/components/JobApplicationForm";
import SharePost from "@/components/SharePost";
import { supabase } from "@/integrations/supabase/client";

const VagaDetalhe = () => {
  const { id } = useParams();

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <Layout><div className="pt-28 pb-20 text-center text-muted-foreground">Carregando...</div></Layout>;

  if (!job) {
    return (
      <Layout>
        <SEO title="Vaga não encontrada — Guará Media" path={`/talentos/${id}`} noindex />
        <div className="pt-28 pb-20 container mx-auto px-4 text-center">
          <h1 className="font-heading font-bold text-2xl">Vaga não encontrada</h1>
          <Link to="/talentos" className="text-primary mt-4 inline-block">← Voltar</Link>
        </div>
      </Layout>
    );
  }

  const fullUrl = `https://prospectpath-studio.lovable.app/talentos/${job.id}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    hiringOrganization: { "@type": "Organization", name: "Guará Media", sameAs: "https://prospectpath-studio.lovable.app" },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location } },
    employmentType: "FULL_TIME",
    jobLocationType: job.work_model === "remoto" ? "TELECOMMUTE" : undefined,
    datePosted: new Date(job.created_at).toISOString().slice(0, 10),
    validThrough: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
    url: fullUrl,
    directApply: true,
  };

  return (
    <Layout>
      <SEO
        title={`${job.title} — Vagas Guará Media`}
        description={job.description?.slice(0, 160) || `Vaga: ${job.title}`}
        path={`/talentos/${job.id}`}
        type="article"
        jsonLd={jsonLd}
      />
      <section className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link to="/talentos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft size={14} /> Voltar às vagas
          </Link>

          <h1 className="font-heading font-bold text-3xl md:text-4xl">{job.title}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Briefcase size={14} /> {job.department}</span>
            <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
            <span className="flex items-center gap-1"><Monitor size={14} /> {job.work_model}</span>
          </div>

          <div className="mt-8 space-y-8">
            <div>
              <h2 className="font-heading font-semibold text-xl mb-3">Descrição</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>
            {job.responsibilities?.length > 0 && (
              <div>
                <h2 className="font-heading font-semibold text-xl mb-3">Responsabilidades</h2>
                <ul className="space-y-2">
                  {job.responsibilities.map((r: string) => (
                    <li key={r} className="flex items-start gap-2 text-muted-foreground"><Check size={16} className="text-primary mt-0.5 shrink-0" /> {r}</li>
                  ))}
                </ul>
              </div>
            )}
            {job.requirements?.length > 0 && (
              <div>
                <h2 className="font-heading font-semibold text-xl mb-3">Requisitos</h2>
                <ul className="space-y-2">
                  {job.requirements.map((r: string) => (
                    <li key={r} className="flex items-start gap-2 text-muted-foreground"><Check size={16} className="text-primary mt-0.5 shrink-0" /> {r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t">
            <SharePost url={fullUrl} title={`${job.title} — Vagas Guará Media`} />
          </div>

          <div className="mt-12 bg-card rounded-2xl p-8 shadow-card">
            <JobApplicationForm jobId={job.id} jobTitle={job.title} />
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default VagaDetalhe;

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Check, Download } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { tools } from "@/data/mockData";

const FerramentaLP = () => {
  const { slug } = useParams();
  const tool = tools.find((t) => t.slug === slug);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", empresa: "", cargo: "" });

  if (!tool) {
    return (
      <Layout>
        <div className="pt-28 pb-20 container mx-auto px-4 text-center">
          <h1 className="font-heading font-bold text-2xl">Ferramenta não encontrada</h1>
          <Link to="/ferramentas" className="text-primary mt-4 inline-block">← Voltar</Link>
        </div>
      </Layout>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.nome && form.email) setSubmitted(true);
  };

  return (
    <Layout>
      <SEO title={`${tool.title} — Guará Media`} description={tool.description?.slice(0, 160)} path={`/ferramentas/${tool.slug}`} />
      <section className="pt-28 pb-20">
        <div className="container mx-auto px-4">
          <Link to="/ferramentas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft size={14} /> Voltar
          </Link>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <span className="text-xs font-semibold text-primary bg-accent px-2.5 py-1 rounded-full">{tool.category}</span>
              <h1 className="font-heading font-bold text-3xl md:text-4xl mt-4 leading-tight">{tool.title}</h1>
              <p className="text-muted-foreground mt-4 text-lg leading-relaxed">{tool.description}</p>

              <div className="mt-8">
                <h3 className="font-heading font-semibold text-lg mb-4">Benefícios</h3>
                <ul className="space-y-3">
                  {tool.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <Check size={18} className="text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <img src={tool.cover_image} alt={tool.title} className="w-full rounded-2xl mt-8 aspect-video object-cover" />
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-card sticky top-24">
              {!submitted ? (
                <>
                  <h3 className="font-heading font-bold text-xl mb-2">Baixe gratuitamente</h3>
                  <p className="text-sm text-muted-foreground mb-6">Preencha o formulário para acessar o material.</p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome *" className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email *" className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    <input value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} placeholder="Empresa" className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    <input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="Cargo (opcional)" className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    <button type="submit" className="w-full bg-gradient-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity">
                      Acessar material
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-primary" />
                  </div>
                  <h3 className="font-heading font-bold text-xl">Material liberado!</h3>
                  <p className="text-sm text-muted-foreground mt-2 mb-6">Clique no botão abaixo para fazer o download.</p>
                  <button className="bg-gradient-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
                    <Download size={18} /> Baixar agora
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FerramentaLP;

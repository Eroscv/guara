import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Mail, MapPin, Phone, Megaphone, BarChart3, Palette, Target, Users, TrendingUp } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import guaraIcon from "@/assets/guara-icon.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const segmentos = [
  { id: "financeiro", label: "Financeiro" },
  { id: "wellness", label: "Wellness" },
  { id: "beleza", label: "Beleza" },
  { id: "bebidas", label: "Bebidas" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 1.0, duration: 0.5 },
  }),
};

const Contato = () => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    empresa: "",
    email: "",
    segmento: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nome.trim() || !form.telefone.trim() || !form.empresa.trim() || !form.email.trim() || !form.segmento) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error("Digite um email corporativo válido.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("leads").insert({
      nome: form.nome,
      email: form.email,
      telefone: form.telefone,
      empresa: form.empresa,
      segmento: form.segmento,
      source: "contato",
    });

    if (error) {
      toast.error("Erro ao enviar. Tente novamente.");
      setLoading(false);
      return;
    }

    toast.success("Mensagem enviada! Nosso time entrará em contato em breve.");
    setForm({ nome: "", telefone: "", empresa: "", email: "", segmento: "" });
    setLoading(false);
  };

  return (
    <Layout>
      <SEO title="Contato — Guará Media" description="Fale com a Guará Media. Vamos destravar o crescimento da sua empresa." path="/contato" />
      {/* Hero pequeno */}
      <section className="pt-28 md:pt-32 bg-[#FFF6E4] dark:bg-[#1a1715] relative overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center min-h-[480px] py-12 md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-heading font-extrabold text-[2rem] sm:text-4xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-[#1a1715] dark:text-[#f5f0e6] break-words">
                Transformamos marcas em{" "}
                <span className="text-primary">referências digitais</span>
              </h1>
              <p className="text-[#1a1715]/70 dark:text-[#f5f0e6]/70 text-lg mt-6 max-w-lg">
                Preencha o formulário abaixo e nosso time de especialistas retornará em até 24h úteis.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="flex justify-center md:justify-end md:-mr-6 lg:-mr-16 xl:-mr-24"
            >
              <img
                src={guaraIcon}
                alt="Guará Media"
                className="w-48 sm:w-64 md:w-96 lg:w-[28rem] h-auto object-contain"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section className="py-16 md:py-24 bg-[#FFF6E4] dark:bg-[#1a1715]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-black dark:text-[#f5f0e6]">Nossos serviços</h2>
            <p className="text-black/60 dark:text-[#f5f0e6]/60 mt-3 max-w-lg mx-auto">
              Soluções completas para impulsionar sua presença digital.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Megaphone, title: "Marketing de Conteúdo", desc: "Conteúdos estratégicos que atraem e convertem seu público-alvo." },
              { icon: BarChart3, title: "SEO & Analytics", desc: "Posicione sua marca no topo dos resultados de busca." },
              { icon: Palette, title: "Branding", desc: "Identidade visual e posicionamento que geram conexão." },
              { icon: Target, title: "Mídia Paga", desc: "Campanhas otimizadas para maximizar seu retorno." },
              { icon: Users, title: "Social Media", desc: "Gestão de redes sociais com foco em engajamento." },
              { icon: TrendingUp, title: "Growth Marketing", desc: "Estratégias de crescimento orientadas por dados." },
            ].map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="bg-white dark:bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <s.icon size={24} />
                </div>
                <h3 className="font-heading font-semibold text-lg text-[#1a1715] dark:text-[#f5f0e6]">{s.title}</h3>
                <p className="text-sm text-black/70 dark:text-foreground/70 mt-2 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Conteúdo */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-x-12 lg:gap-x-16 gap-y-5 items-stretch">
            {/* Títulos (linha 1) */}
            <h3 className="lg:col-span-2 font-heading font-bold text-2xl md:text-3xl text-black dark:text-foreground uppercase tracking-wide text-center">
              O que você vai receber:
            </h3>
            <h2 className="lg:col-span-3 font-heading font-semibold text-xl text-center self-end">
              Preencha seus dados
            </h2>

            {/* O que você vai receber (cards) */}
            <motion.div
              custom={0}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="lg:col-span-2"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 h-full">
                {[
                  { title: "Estratégia: Plano para 2026", desc: "Sessão 1 a 1 de definição: desenhe o seu roadmap de performance." },
                  { title: "Ajuste a mira dos seus anúncios", desc: "Descubra onde seu dinheiro está sendo perdido e como melhorar seu ROAS." },
                  { title: "Hot Seats Pós Auditoria", desc: "Encontros para alinhamento e networking com outras marcas." },
                  { title: "Diagnóstico 360°", desc: "Roteiro de otimização do site e melhorias de conversão." },
                  { title: "Conteúdo e Autoridade", desc: "Temas e formatos para crescer sua audiência qualificada." },
                  { title: "Funil de Vendas", desc: "Descubra onde clientes desistem e como melhorar seu funil." },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="sm:aspect-square bg-white dark:bg-card rounded-2xl p-5 sm:p-6 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-center"
                  >
                    <h4 className="font-heading font-bold text-lg md:text-xl text-primary leading-tight">
                      {card.title}
                    </h4>
                    <p className="text-base text-black/70 dark:text-foreground/70 mt-2 leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Formulário */}
            <motion.form
              onSubmit={handleSubmit}
              custom={1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="lg:col-span-3 bg-card border border-border rounded-2xl p-6 md:p-8 shadow-card flex flex-col"
            >
              <div className="flex flex-col gap-5 h-full">
                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    name="nome"
                    placeholder="Seu nome"
                    value={form.nome}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Telefone */}
                <div className="space-y-2">
                  <Label htmlFor="telefone">Whatsapp *</Label>
                  <Input
                    id="telefone"
                    name="telefone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={form.telefone}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Empresa */}
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa *</Label>
                  <Input
                    id="empresa"
                    name="empresa"
                    placeholder="Nome da sua empresa"
                    value={form.empresa}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Email corporativo */}
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="voce@empresa.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Segmento */}
                <div className="space-y-3">
                  <Label>Segmento de Atuação *</Label>
                  <RadioGroup
                    value={form.segmento}
                    onValueChange={(val) => setForm((prev) => ({ ...prev, segmento: val }))}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                  >
                    {segmentos.map((s) => (
                      <div key={s.id}>
                        <RadioGroupItem value={s.id} id={s.id} className="peer sr-only" />
                        <Label
                          htmlFor={s.id}
                          className="flex items-center justify-center rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium cursor-pointer transition-all hover:bg-accent hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary"
                        >
                          {s.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-auto w-full bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity h-12 rounded-xl font-semibold"
                >
                  {loading ? (
                    "Enviando..."
                  ) : (
                    <>
                      Enviar <Send size={16} />
                    </>
                  )}
                </Button>
              </div>
            </motion.form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contato;

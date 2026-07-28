import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { z } from "zod";
import {
  ShoppingBag,
  Rocket,
  Cpu,
  LineChart,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { toast } from "sonner";
import handOrange from "@/assets/hand-orange.png";
import tornPaperDivider from "@/assets/torn-paper-divider.png.asset.json";
const tornPaperTop = tornPaperDivider.url;
const tornPaperBottom = tornPaperDivider.url;
import growthDiagram from "@/assets/growth-diagram.png";
import logoBazarConsorcio from "@/assets/logos/bazar-consorcio.png";
import logoBazarPrecatorio from "@/assets/logos/bazar-precatorio.png";
import logoConsorcioSorteado from "@/assets/logos/consorcio-sorteado.png";
import logoEvi from "@/assets/logos/evi.png";
import logoLivup from "@/assets/logos/livup.png";
import logoMushin from "@/assets/logos/mushin.png";
import logoPod from "@/assets/logos/pod.png";
import logoSourceof from "@/assets/logos/sourceof.png";
import logoSoul8 from "@/assets/logos/soul8.png";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CLIENT_LOGOS = [
  { src: logoBazarConsorcio, alt: "Bazar do Consórcio" },
  { src: logoBazarPrecatorio, alt: "Bazar do Precatório" },
  { src: logoConsorcioSorteado, alt: "Consórcio Sorteado" },
  { src: logoEvi, alt: "Evi" },
  { src: logoLivup, alt: "LivUp" },
  { src: logoMushin, alt: "Mushin" },
  { src: logoPod, alt: "Pod Kombucha" },
  { src: logoSourceof, alt: "Source of" },
  { src: logoSoul8, alt: "Soul 8" },
];

const SERVICES = [
  {
    title: "Compra de Mídia Especializada",
    icon: ShoppingBag,
    img: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=900&h=700&fit=crop",
    desc: "Nossa equipe é especializada em elaborar estratégias que impulsionam o crescimento exponencial e, ao mesmo tempo, reduzem os custos de aquisição de clientes. Seja em mídias sociais pagas, pesquisa, display ou CTV, personalizamos cada campanha para maximizar o ROAS e escalar sua receita com eficiência.",
  },
  {
    title: "Performance & Anúncios",
    icon: Rocket,
    img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&h=700&fit=crop",
    desc: "Criativos de alta conversão e gestão diária de campanhas em Meta, Google e TikTok. Testes contínuos, otimização de funil e foco obsessivo em CAC, ROAS e LTV para acelerar a receita.",
  },
  {
    title: "Tecnologia & Dados",
    icon: Cpu,
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&h=700&fit=crop",
    desc: "Implementação de tracking server-side, dashboards de BI, integrações via API e modelos de atribuição. Decisões baseadas em dados de verdade, do primeiro clique à receita.",
  },
  {
    title: "Estratégia de Crescimento",
    icon: LineChart,
    img: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&h=700&fit=crop",
    desc: "Planejamento de growth ponta a ponta: posicionamento, oferta, funil, métricas e roadmap trimestral. Operamos como um time de C-Level dedicado ao seu negócio.",
  },
];

const FAQ_ITEMS = [
  {
    q: "Quanto tempo dura o contrato?",
    a: "Trabalhamos com ciclos mínimos de 3 meses para garantir tempo hábil de aprendizado das campanhas e resultados consistentes.",
  },
  {
    q: "Vocês atendem qualquer segmento?",
    a: "Atendemos e-commerce, SaaS, infoprodutos, serviços e marcas DNVB. Após o diagnóstico, validamos juntos o fit estratégico.",
  },
  {
    q: "Como funciona o onboarding?",
    a: "Em até 7 dias estruturamos acessos, tracking, briefing criativo e o plano de mídia inicial. Tudo documentado e com calls semanais.",
  },
  {
    q: "Qual o investimento mínimo em mídia?",
    a: "Recomendamos a partir de R$ 10 mil/mês em mídia paga para gerar volume suficiente de dados e otimização.",
  },
  {
    q: "Vocês produzem os criativos?",
    a: "Sim. Temos squad de copy, design e edição de vídeo focado em criativos de performance.",
  },
  {
    q: "Como vocês reportam os resultados?",
    a: "Dashboards em tempo real + reunião semanal de performance + report executivo mensal com leituras estratégicas.",
  },
];

const TESTIMONIALS = [
  {
    name: "Manuela Fumagall",
    role: "Founder Source OF",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    quote:
      "A Guara Média se destaca não só pela criatividade e estratégia, mas também pela performance. Com um trabalho afiado de tráfego pago, a agência entrega resultados reais, otimizando cada investimento e transformando cliques em conversões. Um time que entende de marca, performance e crescimento!",
  },
  {
    name: "Rafael Souza",
    role: "CEO Evvi Cosméticos",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    quote:
      "Resultados consistentes mês a mês. A operação digital da Guará destravou o nosso crescimento e nos deu previsibilidade de receita.",
  },
  {
    name: "Carolina Lima",
    role: "Diretora de Marketing",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    quote:
      "Time afiado em dados, criativos e mídia. Conseguimos escalar campanhas mantendo eficiência e CPA dentro da meta.",
  },
];

const VIDEO_SRCS = [
  "/videos/ad-1.mp4",
  "/videos/manu-rita.mp4",
  "/videos/catperform-academia.mp4",
  "/videos/video-02.mp4",
  "/videos/estagio.mp4",
  "/videos/iranni-ecommerce.mp4",
  "/videos/mushin.mp4",
];

const CONTACT_INFO = [
  { icon: Mail, label: "E-mail", value: "contato@guaramedia.com.br" },
  { icon: Phone, label: "WhatsApp", value: "+55 (11) 9 9999-9999" },
  { icon: MapPin, label: "Localização", value: "São Paulo, SP — Brasil" },
];

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const contactSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(100),
  company: z.string().trim().min(2, "Informe sua empresa").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  interest: z.enum(["performance", "midia", "completo"], {
    message: "Selecione uma opção",
  }),
});

type ContactForm = z.infer<typeof contactSchema>;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const HighlightTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`font-heading font-extrabold uppercase text-2xl md:text-3xl leading-tight text-primary ${className}`}>
    {children}
  </h3>
);

const ROTATING_WORDS = ["Publicidade", "Marketing", "Performance", "Tech"];

const RotatingWord = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="relative inline-block align-top">
      <AnimatePresence mode="wait">
        <motion.span
          key={ROTATING_WORDS[index]}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
          className="block"
        >
          {ROTATING_WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

/** Horizontal wipe transition between sections */
const DiagonalDivider = ({ from, to }: { from: string; to: string }) => (
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

/** Lazy-loading video card for the work carousel */
const VideoCard = ({ src, index }: { src: string; index: number }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !el.src) {
            el.src = src;
            el.preload = "metadata";
            io.disconnect();
          }
        });
      },
      { rootMargin: "200px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [src]);

  const handleMouseEnter = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (!el.src) el.src = src;
    el.play().catch(() => {});
  }, [src]);

  const handleMouseLeave = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  }, []);

  const handleClick = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.muted = false;
      el.play();
    } else {
      el.pause();
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: (index % 5) * 0.05 }}
      className="snap-start shrink-0 w-[240px] md:w-[280px] aspect-[9/16] rounded-2xl overflow-hidden relative group cursor-pointer ring-1 ring-white/10 hover:ring-primary/50 transition-all bg-black"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Reproduzir vídeo ${index + 1}`}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        loop
        playsInline
        preload="none"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-80 group-hover:opacity-40 transition-opacity" />

      <div className="absolute top-3 left-3 flex items-center gap-2 z-10 pointer-events-none">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 ring-2 ring-white/30" />
        <p className="text-[11px] font-semibold text-white drop-shadow">@guara.mkt</p>
      </div>

      <div className="absolute inset-0 flex items-center justify-center opacity-90 group-hover:opacity-0 transition-opacity pointer-events-none">
        <svg viewBox="0 0 24 24" className="w-16 h-16 text-white drop-shadow-lg" fill="currentColor" aria-hidden>
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const Index = () => {
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [form, setForm] = useState<Partial<ContactForm>>({
    name: "",
    company: "",
    email: "",
    interest: undefined,
  });
  const [submitting, setSubmitting] = useState(false);
  const videosTrackRef = useRef<HTMLDivElement>(null);

  const prevTestimonial = useCallback(
    () => setTestimonialIndex((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length),
    [],
  );
  const nextTestimonial = useCallback(() => setTestimonialIndex((i) => (i + 1) % TESTIMONIALS.length), []);

  const scrollVideos = useCallback((dir: "left" | "right") => {
    videosTrackRef.current?.scrollBy({
      left: dir === "left" ? -340 : 340,
      behavior: "smooth",
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Verifique os campos do formulário");
      return;
    }

    setSubmitting(true);
    try {
      // TODO: replace with real API call, e.g.:
      // await fetch("/api/contact", { method: "POST", body: JSON.stringify(parsed.data) });
      await new Promise((r) => setTimeout(r, 600)); // remove when wired up
      toast.success("Formulário enviado! Entraremos em contato em breve.");
      setForm({ name: "", company: "", email: "", interest: undefined });
    } catch {
      toast.error("Erro ao enviar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentTestimonial = TESTIMONIALS[testimonialIndex];

  return (
    <Layout>
      <SEO
        title="Guará Media — Marketing, publicidade e tecnologia para PMEs"
        description="Destravamos o crescimento de empresas com estratégia, mídia paga, dados e tecnologia. A única equipe que você precisa para crescer."
        path="/"
      />

      {/* ------------------------------------------------------------------ */}
      {/* Hero */}
      {/* ------------------------------------------------------------------ */}
      <section className="pt-24 pb-16 sm:pt-32 sm:pb-24 md:pt-40 md:pb-32 relative overflow-hidden bg-[#FFF6E4] dark:bg-[#1a1715]">
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl"
          >
            <h1 className="font-body leading-[1.2] tracking-tight">
              <span className="text-[#1a1715] dark:text-[#f5f0e6] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium">
                Destravamos o{" "}
              </span>
              <span className="text-[#F26522] italic text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold">
                crescimento
              </span>
              <br />
              <span className="text-[#F26522] italic text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold">
                de empresas{" "}
              </span>
              <span className="text-[#1a1715] dark:text-[#f5f0e6] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium">
                com
              </span>
            </h1>
            <h2 className="font-heading font-black text-[#1a1715] dark:text-[#f5f0e6] text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.9] mt-6 md:mt-8 relative inline-block">
              <span className="relative inline-block">
                <RotatingWord />
                <span className="hero-underline absolute left-0 bottom-0 w-full h-4 sm:h-5 md:h-6" aria-hidden />
              </span>
            </h2>
          </motion.div>

          {/* Decorative elements — right side of hero */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="hidden lg:block absolute top-16 right-8 xl:right-16 pointer-events-none"
          >
            <div className="hero-dots w-40 h-40 xl:w-56 xl:h-56" />
          </motion.div>
          <motion.div
            aria-hidden
            initial={{ opacity: 0, rotate: -20 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ duration: 1.2, delay: 0.7 }}
            className="hidden lg:block absolute bottom-24 right-24 xl:right-40 pointer-events-none"
          >
            <div className="w-24 h-24 xl:w-32 xl:h-32 rounded-full bg-gradient-to-br from-[#F26522] to-[#C8E64A] opacity-30 blur-2xl" />
          </motion.div>

          <motion.img
            src={handOrange}
            alt=""
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="absolute bottom-0 left-0 w-40 sm:w-56 md:w-72 lg:w-80 pointer-events-none"
            loading="eager"
            width={320}
            height={320}
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Clientes + Proposta */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-14 sm:py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          {/* Logo marquee */}
          <div className="logo-marquee-wrapper relative overflow-hidden mb-12 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div className="flex w-max gap-16 md:gap-24 animate-logo-marquee" aria-label="Nossos clientes">
              {[...CLIENT_LOGOS, ...CLIENT_LOGOS, ...CLIENT_LOGOS].map((logo, i) => (
                <img
                  key={i}
                  src={logo.src}
                  alt={logo.alt}
                  className="h-14 md:h-20 w-auto object-contain shrink-0"
                />
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="w-full max-w-[560px] mx-auto lg:mx-0">
              <img
                src={growthDiagram}
                alt="Ecossistema Guará: Tráfego Pago, High Performance Ads e Technology & Data"
                className="w-full h-auto"
              />
            </div>

            <div>
              <h2 className="font-heading font-extrabold uppercase text-3xl md:text-4xl lg:text-5xl leading-tight tracking-tight">
                A única <span className="lime-marker">equipe</span> que você precisa para crescer
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mt-5">Guará — A Revolução das PMEs Brasileiras</p>
              <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Somos a resposta a uma injustiça que se repete há décadas: enquanto as grandes empresas concentram os
                  melhores talentos e tecnologias, as pequenas e médias ficam com as sobras.
                </p>
                <p>
                  Nascemos da união entre um fundador de marca digital e um consultor de tecnologia e dados de alto
                  nível, com um propósito claro: democratizar o acesso ao crescimento exponencial para quem constrói o
                  Brasil de verdade.
                </p>
                <p>Tudo dentro de um único ecossistema.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Depoimentos + Case destaque */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative pt-20 sm:pt-28 md:pt-36 bg-[#0a0a0a] text-white">
        <img
          src={tornPaperDivider.url}
          alt=""
          aria-hidden="true"
          className="absolute top-0 left-1/2 min-w-[120%] h-auto pointer-events-none select-none z-10 torn-paper-mirror"
        />
        <div className="container mx-auto px-4">
          <h2 className="font-heading font-extrabold uppercase text-3xl md:text-4xl lg:text-5xl text-center leading-tight tracking-tight">
            Quem conhece a Guará,
            <br />
            não troca mais:
          </h2>

          {/* Testimonial carousel */}
          <div
            className="mt-16 max-w-5xl mx-auto relative"
            role="region"
            aria-label="Depoimentos de clientes"
            aria-live="polite"
          >
            <div className="flex items-center gap-4 md:gap-8">
              <button
                aria-label="Depoimento anterior"
                onClick={prevTestimonial}
                className="shrink-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden />
              </button>

              <div className="flex-1 grid md:grid-cols-[auto,1fr] items-center gap-8 md:gap-12">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTestimonial.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                    className="flex flex-col items-center text-center md:w-44"
                  >
                    <img
                      src={currentTestimonial.avatar}
                      alt={currentTestimonial.name}
                      className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover ring-2 ring-white/20"
                      loading="lazy"
                    />
                    <p className="mt-4 font-semibold">{currentTestimonial.name}</p>
                    <p className="text-xs text-white/60 mt-1">{currentTestimonial.role}</p>
                  </motion.div>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.blockquote
                    key={currentTestimonial.quote}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="italic text-white/85 leading-relaxed text-base md:text-lg"
                  >
                    {currentTestimonial.quote}
                  </motion.blockquote>
                </AnimatePresence>
              </div>

              <button
                aria-label="Próximo depoimento"
                onClick={nextTestimonial}
                className="shrink-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" aria-hidden />
              </button>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-8" role="tablist" aria-label="Selecionar depoimento">
              {TESTIMONIALS.map((t, i) => (
                <button
                  key={t.name}
                  role="tab"
                  aria-selected={i === testimonialIndex}
                  aria-label={`Depoimento de ${t.name}`}
                  onClick={() => setTestimonialIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === testimonialIndex ? "bg-primary scale-125" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Featured case card */}
          <div className="mt-16 max-w-6xl mx-auto bg-[#f3f1ec] text-[#1a1715] rounded-2xl overflow-hidden shadow-2xl">
            <div className="grid md:grid-cols-2">
              <div className="aspect-[4/3] md:aspect-auto md:min-h-[420px] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=900&h=900&fit=crop"
                  alt="Marca DNVB pro-age"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6 sm:p-8 md:p-12 flex flex-col">
                <h3 className="font-heading font-extrabold uppercase text-2xl md:text-3xl leading-tight">
                  Marca DNVB pro-age contra o movimento anti-idade
                </h3>
                <div className="flex flex-wrap gap-2 mt-5">
                  <span className="px-3 py-1 rounded-full border border-primary/50 text-primary text-xs font-medium">
                    Mídia Paga
                  </span>
                  <span className="px-3 py-1 rounded-full border border-emerald-500/50 text-emerald-700 text-xs font-medium">
                    Anúncios
                  </span>
                </div>
                <ul className="mt-6 space-y-2 text-sm md:text-base">
                  <li className="flex gap-2">
                    <span className="text-primary" aria-hidden>
                      •
                    </span>
                    Operação de toda máquina digital de aquisição;
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary" aria-hidden>
                      •
                    </span>
                    Construção e escrita de todas linhas de comunicação da marca;
                  </li>
                </ul>
                <div className="mt-auto pt-8 grid grid-cols-2 gap-6">
                  <div>
                    <span className="text-2xl" aria-hidden>📈</span>
                    <p className="font-heading font-extrabold text-3xl md:text-4xl mt-1">+843%</p>
                    <p className="text-sm text-[#1a1715]/70 mt-1 leading-tight">
                      De Aumento
                      <br />
                      De Receita
                    </p>
                  </div>
                  <div>
                    <span className="text-2xl" aria-hidden>🚀</span>
                    <p className="font-heading font-extrabold text-3xl md:text-4xl mt-1">+10x</p>
                    <p className="text-sm text-[#1a1715]/70 mt-1 leading-tight">
                      De Aumento
                      <br />
                      De Novos Clientes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Vídeos de trabalhos */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-14 sm:py-20 md:py-28 bg-[#0a0a0a] text-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl">
            <p className="text-sm md:text-base text-white/60">Excelência Não Se Restringe Apenas Aos Dados.</p>
            <h2 className="mt-3 font-heading font-extrabold uppercase text-3xl md:text-4xl lg:text-5xl leading-[1.05] tracking-tight">
              Somos criadores disruptivos, produzindo o maior nível de anúncios digitais
            </h2>
          </div>

          <div className="mt-16 flex items-end justify-between gap-4">
            <h3 className="font-heading text-lg md:text-xl text-white/90">Confira Alguns Dos Nossos Trabalhos</h3>
            <div className="flex gap-3" role="group" aria-label="Navegar vídeos">
              <button
                aria-label="Vídeos anteriores"
                onClick={() => scrollVideos("left")}
                className="w-11 h-11 rounded-full border border-white/20 hover:border-primary text-white/80 hover:text-primary transition-colors flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden />
              </button>
              <button
                aria-label="Próximos vídeos"
                onClick={() => scrollVideos("right")}
                className="w-11 h-11 rounded-full border border-primary text-primary hover:bg-primary hover:text-[#0a0a0a] transition-colors flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" aria-hidden />
              </button>
            </div>
          </div>

          <div
            ref={videosTrackRef}
            className="mt-8 flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="list"
            aria-label="Vídeos de trabalhos"
          >
            {VIDEO_SRCS.map((src, i) => (
              <VideoCard key={src} src={src} index={i} />
            ))}
          </div>
        </div>
      </section>

      <DiagonalDivider from="#0a0a0a" to="#FFF6E4" />

      {/* ------------------------------------------------------------------ */}
      {/* Comparativo */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-14 sm:py-20 md:py-28 bg-[#FFF6E4] dark:bg-[#1a1715] text-[#1a1715] dark:text-[#f5f0e6]">
        <div className="container mx-auto px-4">
          <h2 className="font-heading font-extrabold uppercase text-center text-3xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight max-w-5xl mx-auto">
            Se você comparar, iremos ser sua última contratação da vida
          </h2>

          <div className="mt-16 grid lg:grid-cols-12 gap-6 items-stretch">
            {/* Agência tradicional */}
            <div className="lg:col-span-3 rounded-2xl border border-[#1a1715]/15 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] p-7 lg:p-8">
              <h3 className="font-heading font-extrabold uppercase text-xl md:text-2xl leading-tight">
                Agência de Performance Tradicional
              </h3>
              <div className="mt-6 space-y-5 text-sm md:text-[15px]">
                <div>
                  <p className="font-semibold">Um Modelo Genérico</p>
                  <ul className="mt-2 space-y-2 text-[#1a1715]/75 dark:text-white/70">
                    <li className="flex gap-2">
                      <span aria-hidden>•</span> Soluções "Big Mac": mesmas campanhas, mesmas estratégias, pouca
                      personalização.
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold">Mentalidade Engessada</p>
                  <ul className="mt-2 space-y-2 text-[#1a1715]/75 dark:text-white/70">
                    <li className="flex gap-2">
                      <span aria-hidden>•</span> Foco em "cumprir tarefas" e não em gerar crescimento real.
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold">Pouca Integração</p>
                  <ul className="mt-2 space-y-2 text-[#1a1715]/75 dark:text-white/70">
                    <li className="flex gap-2">
                      <span aria-hidden>•</span> Times separados em silos, sem visão unificada do funil.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Guará — destaque */}
            <div className="lg:col-span-6 lg:-my-6 relative rounded-2xl border-2 border-[#d8f161] bg-[#0a0a0a] text-white p-8 lg:p-10 shadow-[0_30px_80px_-20px_rgba(216,241,97,0.25)]">
              <h3 className="font-heading font-extrabold uppercase text-2xl md:text-3xl leading-tight text-primary">
                Guará Marketing
              </h3>
              <div className="mt-7 space-y-6 text-[15px] md:text-base">
                {[
                  {
                    title: "Time Estratégico e Sob Medida",
                    desc: "Formamos um squad que entende os desafios específicos do seu negócio.",
                  },
                  {
                    title: "Foco em Resultados Reais",
                    desc: "Cada ação tem um objetivo claro: gerar crescimento e receita.",
                  },
                  {
                    title: "Mentalidade de Parceria",
                    desc: "Atuamos como uma extensão do seu time, com transparência e comprometimento total.",
                  },
                  {
                    title: "Ecossistema Integrado",
                    desc: "Mídia, criativo, tecnologia e dados em um único lugar, trabalhando juntos.",
                  },
                ].map(({ title, desc }) => (
                  <div key={title}>
                    <p className="font-semibold">{title}</p>
                    <ul className="mt-2 space-y-2 text-white/80">
                      <li className="flex gap-2">
                        <span className="text-[#d8f161]" aria-hidden>
                          •
                        </span>{" "}
                        {desc}
                      </li>
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Time In-House */}
            <div className="lg:col-span-3 rounded-2xl border border-[#1a1715]/15 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] p-7 lg:p-8">
              <h3 className="font-heading font-extrabold uppercase text-xl md:text-2xl leading-tight">Time In-House</h3>
              <div className="mt-6 space-y-5 text-sm md:text-[15px]">
                <div>
                  <p className="font-semibold">Montar Uma Equipe De 10 Pessoas</p>
                  <ul className="mt-2 space-y-2 text-[#1a1715]/75 dark:text-white/70">
                    <li className="flex gap-2">
                      <span aria-hidden>•</span> Se forem seniores → Custo superior a R$ 80 mil/mês + encargos (13º,
                      férias, benefícios).
                    </li>
                    <li className="flex gap-2">
                      <span aria-hidden>•</span> Se forem juniores → Alto risco de entregas mal executadas e retrabalho
                      constante.
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold">Você Será O Gestor</p>
                  <ul className="mt-2 space-y-2 text-[#1a1715]/75 dark:text-white/70">
                    <li className="flex gap-2">
                      <span aria-hidden>•</span> Responsável por treinar, integrar e acompanhar cada profissional dia a
                      dia.
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold">Risco Operacional Alto</p>
                  <ul className="mt-2 space-y-2 text-[#1a1715]/75 dark:text-white/70">
                    <li className="flex gap-2">
                      <span aria-hidden>•</span> Turnover, custo fixo elevado e dependência de poucas pessoas.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Serviços */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-14 sm:py-20 md:py-28 bg-[#FFF6E4] dark:bg-[#1a1715] text-[#1a1715] dark:text-[#f5f0e6]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16">
            <div>
              <p className="text-base md:text-lg text-[#1a1715]/70 dark:text-white/60">Nossos Serviços</p>
              <h2 className="font-heading font-extrabold uppercase text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight mt-2 max-w-2xl">
                O que podemos fazer por você
              </h2>
            </div>
            <Link
              to="/contato"
              className="self-start md:self-auto bg-gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-soft"
            >
              Marcar Uma Call
            </Link>
          </div>

          <div className="space-y-14 md:space-y-28">
            {SERVICES.map((s, i) => {
              const Icon = s.icon;
              const reverse = i % 2 === 1;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6 }}
                  className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
                    reverse ? "lg:[&>div:first-child]:order-2" : ""
                  }`}
                >
                  <div className="rounded-2xl overflow-hidden bg-[#0a0a0a] aspect-[4/3] shadow-2xl">
                    <img src={s.img} alt={s.title} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div>
                    <span className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-5">
                      <Icon className="w-7 h-7" aria-hidden />
                    </span>
                    <HighlightTitle>{s.title}</HighlightTitle>
                    <p className="mt-5 text-[#1a1715]/75 dark:text-white/70 leading-relaxed text-base md:text-lg max-w-xl">
                      {s.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Formulário de contato */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative bg-[#0a0a0a] text-white overflow-hidden">
        <img
          src={tornPaperDivider.url}
          alt=""
          aria-hidden="true"
          className="absolute top-0 left-1/2 min-w-[120%] h-auto pointer-events-none select-none z-10 torn-paper-tilt"
        />

        <div className="relative z-10 py-8 sm:py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto relative">
              <div className="tape-corner tape-top-left" aria-hidden />
              <div className="tape-corner tape-top-right" aria-hidden />
              <div className="tape-corner tape-bottom-left" aria-hidden />
              <div className="tape-corner tape-bottom-right" aria-hidden />

              <div className="bg-[#FFF6E4] text-[#1a1715] p-6 sm:p-8 md:p-12 lg:p-14">
                <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
                  {/* Left column */}
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <h2 className="font-body font-normal uppercase text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
                        Vamos fazer
                        <br />
                        anúncios para
                        <br />
                        sua marca?
                      </h2>
                      <p className="mt-5 text-[#F26522] text-lg sm:text-xl leading-snug">
                        Preencha o formulário que
                        <br />
                        entraremos em contato.
                      </p>
                    </div>

                    <address className="mt-10 lg:mt-16 not-italic space-y-3">
                      {CONTACT_INFO.map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-center gap-3 text-[#1a1715]">
                          <Icon className="w-5 h-5 text-[#F26522] shrink-0" aria-hidden />
                          <span className="text-base md:text-lg">{value}</span>
                        </div>
                      ))}
                    </address>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div>
                      <label htmlFor="name" className="sr-only">
                        Nome
                      </label>
                      <input
                        id="name"
                        type="text"
                        placeholder="Nome"
                        maxLength={100}
                        value={form.name ?? ""}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full bg-[#C8E64A] text-[#1a1715] placeholder-[#1a1715]/70 border-0 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#1a1715]/20 transition text-base md:text-lg"
                        required
                        autoComplete="name"
                      />
                    </div>
                    <div>
                      <label htmlFor="company" className="sr-only">
                        Empresa
                      </label>
                      <input
                        id="company"
                        type="text"
                        placeholder="Empresa"
                        maxLength={120}
                        value={form.company ?? ""}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        className="w-full bg-[#C8E64A] text-[#1a1715] placeholder-[#1a1715]/70 border-0 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#1a1715]/20 transition text-base md:text-lg"
                        required
                        autoComplete="organization"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="sr-only">
                        E-mail
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="E-mail"
                        maxLength={255}
                        value={form.email ?? ""}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full bg-[#C8E64A] text-[#1a1715] placeholder-[#1a1715]/70 border-0 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#1a1715]/20 transition text-base md:text-lg"
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div>
                      <label htmlFor="interest" className="sr-only">
                        O que você tem interesse
                      </label>
                      <select
                        id="interest"
                        value={form.interest ?? ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            interest: e.target.value as ContactForm["interest"],
                          })
                        }
                        className="w-full bg-[#C8E64A] text-[#1a1715] placeholder-[#1a1715]/70 border-0 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#1a1715]/20 transition appearance-none text-base md:text-lg"
                        required
                      >
                        <option value="" disabled>
                          O que você tem interesse
                        </option>
                        <option value="performance">Anúncios para Performance</option>
                        <option value="midia">Operação de Mídia Paga</option>
                        <option value="completo">Pacote Completo</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-gradient-primary text-primary-foreground px-7 py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity text-lg uppercase tracking-wide shadow-soft disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitting ? "ENVIANDO…" : "ENVIAR"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FAQ */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative py-14 sm:py-20 md:py-28 bg-[#FFF6E4] dark:bg-[#1a1715]">
        <img
          src={tornPaperDivider.url}
          alt=""
          aria-hidden="true"
          className="absolute top-0 left-1/2 min-w-[120%] h-auto pointer-events-none select-none z-10 torn-paper-flip"
        />
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-center relative inline-block left-1/2 -translate-x-1/2">
            <span className="font-body text-[#1a1715] dark:text-[#f5f0e6] text-4xl sm:text-5xl md:text-6xl lg:text-7xl uppercase tracking-tight">
              Perguntas frequentes
            </span>
            <span className="faq-underline absolute left-0 bottom-0 w-full h-3 sm:h-4 md:h-5" aria-hidden />
          </h2>

          <dl className="mt-12 md:mt-16 space-y-3 md:space-y-4">
            {FAQ_ITEMS.map((item, i) => {
              const open = openFaq === i;
              const isBlue = i % 2 === 0;
              const tilt = i % 2 === 0 ? "-rotate-1" : "rotate-1";
              return (
                <div key={item.q} className={`overflow-hidden ${isBlue ? "bg-[#1E5DB4]" : "bg-[#F26522]"} ${tilt}`}>
                  <dt>
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      aria-expanded={open}
                      className="w-full flex items-center justify-between gap-4 text-left px-5 md:px-8 py-5 md:py-6 font-semibold text-white"
                    >
                      <span className="font-heading text-base md:text-lg">{item.q}</span>
                      <motion.span
                        animate={{ rotate: open ? 180 : 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="shrink-0 inline-flex"
                      >
                        {open ? (
                          <Minus className="w-5 h-5 text-white" aria-hidden />
                        ) : (
                          <Plus className="w-5 h-5 text-white" aria-hidden />
                        )}
                      </motion.span>
                    </button>
                  </dt>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.dd
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 md:px-8 pb-5 md:pb-6 text-white/90 leading-relaxed text-sm md:text-base">
                          {item.a}
                        </p>
                      </motion.dd>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA final */}
      {/* ------------------------------------------------------------------ */}
      <section className="pb-24 bg-[#FFF6E4] dark:bg-[#1a1715]">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white dark:bg-white/[0.04] rounded-2xl border border-[#1a1715]/10 dark:border-white/10 p-6 sm:p-10 md:p-14 text-center">
            <div className="flex justify-center -space-x-3 mb-6" aria-hidden>
              <img
                src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&crop=face"
                alt=""
                className="w-12 h-12 rounded-full ring-2 ring-white object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face"
                alt=""
                className="w-12 h-12 rounded-full ring-2 ring-white object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=face"
                alt=""
                className="w-12 h-12 rounded-full ring-2 ring-white object-cover"
              />
            </div>
            <h3 className="font-heading font-extrabold uppercase text-2xl md:text-3xl tracking-wider text-[#1a1715] dark:text-white">
              Ainda tem perguntas?
            </h3>
            <p className="mt-3 text-[#1a1715]/70 dark:text-white/70 max-w-lg mx-auto">
              Não encontrou a resposta que procurava? Converse com a nossa simpática equipe.
            </p>
            <Link
              to="/contato"
              className="inline-flex items-center gap-2 mt-7 bg-gradient-primary text-primary-foreground px-7 py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-soft"
            >
              Marcar Uma Call
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;

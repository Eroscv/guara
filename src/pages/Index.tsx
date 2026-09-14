import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { CheckCircle2, MessageCircle } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import RotatingWord from "@/components/landing/RotatingWord";
import DiagonalDivider from "@/components/landing/DiagonalDivider";
import VideoCard from "@/components/landing/VideoCard";
import AnimatedCounter from "@/components/landing/AnimatedCounter";
import InfiniteMarquee from "@/components/landing/InfiniteMarquee";
import CreativeGalleryTabs from "@/components/landing/CreativeGalleryTabs";
import CaseStudyCard from "@/components/landing/CaseStudyCard";
import VideoPlayerHero from "@/components/landing/VideoPlayerHero";
import MethodologyStep from "@/components/landing/MethodologyStep";
import DynamicGrid from "@/components/landing/DynamicGrid";
import DraggableTestimonialCarousel from "@/components/landing/DraggableTestimonialCarousel";
import LeadForm from "@/components/landing/LeadForm";
import PlaceholderBanner from "@/components/landing/PlaceholderBanner";
import VerticalMarqueeColumn from "@/components/landing/VerticalMarqueeColumn";
import StickyCta from "@/components/landing/StickyCta";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import heroDashboard from "@/assets/hero-dashboard.png";
import {
  CLIENT_LOGOS,
  GALLERY_ITEMS,
  REAL_STATICS,
  CASE_STUDIES,
  RESULTS_CAROUSEL,
  TESTIMONIALS,
  METHODOLOGY_STEPS,
  BIG_NUMBER,
  NUMEROS_FINAIS,
  VALUES_CAROUSEL_ITEMS,
  FAQ_ITEMS,
} from "@/data/landingContent";

const ROTATING_WORDS = ["Publicidade", "Criativos", "Performance", "Escala"];

const heroVideos = GALLERY_ITEMS.filter((i) => !i.isPlaceholder && i.type === "video").slice(0, 3);
const numerosFinaisReais = NUMEROS_FINAIS.filter((n) => !n.isPlaceholder);
const heroStaticImages = REAL_STATICS.map((s) => s.src);
const heroColumn = (offset: number, count: number) =>
  heroStaticImages.slice(offset, offset + count).length
    ? heroStaticImages.slice(offset, offset + count)
    : heroStaticImages.slice(0, count);

const Index = () => {
  const numeroGiganteRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress: numeroScrollProgress } = useScroll({
    target: numeroGiganteRef,
    offset: ["start end", "end start"],
  });
  const bgParallaxY = useTransform(numeroScrollProgress, [0, 1], prefersReducedMotion ? ["0%", "0%"] : ["-6%", "6%"]);

  return (
    <Layout>
      <SEO
        title="Guará Media: Marketing Visual de Performance"
        description="A Guará produz criativos em grande volume e opera mídia e criatividade como um único sistema. Criatividade não é inspiração, é processo."
        path="/"
      />

      <StickyCta />

      {/* ================================================================ */}
      {/* 02 — Hero */}
      {/* ================================================================ */}
      <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 bg-[#0a0a0a] text-white overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-[0.9fr,1.3fr] gap-10 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <h1 className="font-heading font-black uppercase leading-[0.95] text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight text-balance max-w-xl">
                Marketing Visual de <RotatingWord words={ROTATING_WORDS} />
              </h1>
              <p className="mt-6 text-white/70 text-lg max-w-md">
                Produzimos criativos em volume, operamos mídia e criatividade como um único sistema. Performance vem de
                experimentação estruturada, não de sorte.
              </p>
              <a
                href="#diagnostico"
                className="inline-flex items-center gap-2 mt-8 bg-gradient-primary text-primary-foreground px-7 py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-soft text-sm"
              >
                Agendar Diagnóstico
              </a>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 h-[420px] sm:h-[500px] md:h-[680px] lg:h-[760px]">
              <VerticalMarqueeColumn images={heroColumn(0, 5)} direction="up" duration={26} />
              <div className="flex flex-col gap-3 md:gap-4 h-full">
                {heroVideos.map((v, i) => (
                  <VideoCard
                    key={v.id}
                    src={v.src}
                    type={v.type}
                    aspect="9/16"
                    index={i}
                    autoPlayOnView
                    className="flex-1 min-h-0 !aspect-auto"
                  />
                ))}
              </div>
              <VerticalMarqueeColumn images={heroColumn(5, 5)} direction="down" duration={30} className="hidden md:block" />
              <VerticalMarqueeColumn images={heroColumn(10, 5)} direction="up" duration={22} className="hidden md:block" />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 03 — O que é a Guará (pausa em bege, sem criativos) */}
      {/* ================================================================ */}
      <section className="py-16 md:py-24 bg-[#FFF6E4] dark:bg-[#1a1715] text-[#1a1715] dark:text-[#f5f0e6]">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="font-heading font-extrabold text-2xl md:text-4xl leading-tight tracking-tight">
            Criatividade não é inspiração. É processo.
          </h2>
          <p className="mt-6 text-lg leading-relaxed opacity-80">
            Somos a resposta a uma injustiça que se repete há décadas: enquanto as grandes empresas concentram os
            melhores talentos e tecnologias, as pequenas e médias ficam com as sobras. A Guará nasceu para
            democratizar o acesso ao crescimento exponencial, produzindo criativos em escala, guiados por método, não
            por achismo.
          </p>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 04 — Carrossel de Resultados */}
      {/* ================================================================ */}
      <section className="py-16 md:py-24 bg-[#0a0a0a] text-white overflow-hidden">
        <div className="container mx-auto px-4 mb-10">
          <h2 className="font-heading font-extrabold text-2xl md:text-4xl text-center leading-tight tracking-tight">
            Resultados que falam por nós
          </h2>
        </div>
        <InfiniteMarquee
          gapClassName="gap-4 md:gap-5"
          items={RESULTS_CAROUSEL.map((r) => (
            <div
              key={r.id}
              className="w-[260px] md:w-[300px] rounded-lg overflow-hidden bg-white/[0.04] border border-white/10 transition-colors duration-300 hover:border-primary/40"
            >
              <div className="relative aspect-[4/3] bg-white overflow-hidden">
                <img
                  src={r.logo}
                  alt={r.clientName}
                  className="absolute inset-0 w-full h-full object-contain p-8"
                  loading="lazy"
                />
                {r.isPlaceholder && <PlaceholderBanner label="métrica" className="absolute top-2 right-2 z-10" />}
              </div>
              <div className="p-4">
                <p className="font-heading font-extrabold text-lg text-[#C8E64A] leading-tight">{r.metric}</p>
                <p className="text-xs text-white/50 mt-1">{r.clientName}</p>
              </div>
            </div>
          ))}
        />
      </section>

      {/* ================================================================ */}
      {/* 05 — Vídeo de apresentação */}
      {/* ================================================================ */}
      <section className="py-16 md:py-24 bg-[#FFF6E4] dark:bg-[#1a1715] text-[#1a1715] dark:text-[#f5f0e6]">
        <VideoPlayerHero title="Por que criativo virou o gargalo da sua mídia" />
      </section>

      {/* ================================================================ */}
      {/* 06 — Galeria de Criativos */}
      {/* ================================================================ */}
      <section className="py-16 md:py-24 bg-[#0a0a0a] text-white">
        <div className="container mx-auto px-4 text-center mb-4">
          <h2 className="font-heading font-extrabold text-2xl md:text-4xl leading-tight tracking-tight">
            Volume é a nossa assinatura
          </h2>
          <p className="mt-3 text-white/60 max-w-xl mx-auto">
            Estático, UGC e alta produção. Tudo produzido internamente, em escala.
          </p>
        </div>
        <div className="mt-10">
          <CreativeGalleryTabs items={GALLERY_ITEMS} />
        </div>
      </section>

      <DiagonalDivider from="#0a0a0a" to="#FFF6E4" />

      {/* ================================================================ */}
      {/* 07 — Marcas que Confiam */}
      {/* ================================================================ */}
      <section className="py-16 md:py-20 bg-[#FFF6E4] dark:bg-[#1a1715]">
        <div className="container mx-auto px-4 text-center mb-10">
          <h2 className="font-heading font-extrabold text-2xl md:text-3xl tracking-tight">
            Marcas que escalam com a gente
          </h2>
        </div>
        <InfiniteMarquee
          items={CLIENT_LOGOS.map((logo) => (
            <img key={logo.alt} src={logo.src} alt={logo.alt} className="h-14 md:h-16 w-auto object-contain" loading="lazy" />
          ))}
          className="logo-dim-wrapper"
        />
        <div className="text-center mt-10">
          <a
            href="#diagnostico"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-soft text-sm"
          >
            Agendar Diagnóstico
          </a>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 08 — Cases */}
      {/* ================================================================ */}
      <section className="py-16 md:py-24 bg-[#0a0a0a] text-white">
        <div className="container mx-auto px-4 space-y-20 md:space-y-28">
          <div>
            <h2 className="font-heading font-extrabold text-2xl md:text-4xl text-center leading-tight tracking-tight">
              Cases
            </h2>
            <p className="mt-3 text-white/60 text-center max-w-xl mx-auto">Prova real. Sem enrolação.</p>
          </div>
          {/* Só cases com conteúdo real vão ao ar — evita headline/métrica "a definir" em produção */}
          {CASE_STUDIES.filter((c) => !c.isPlaceholder).map((c, i) => (
            <CaseStudyCard key={c.id} caseStudy={c} reverse={i % 2 === 1} />
          ))}
        </div>
      </section>

      {/* ================================================================ */}
      {/* 09 — Faixa de Oferta (bloco cheio laranja) */}
      {/* ================================================================ */}
      <section className="relative py-16 md:py-20 bg-primary text-primary-foreground text-center overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.12) 1.5px, transparent 1.5px)",
            backgroundSize: "18px 18px",
          }}
        />
        <div className="relative container mx-auto px-4 max-w-2xl">
          <h2 className="font-heading font-extrabold text-3xl md:text-5xl leading-tight tracking-tight">
            Diagnóstico de Criativo Gratuito
          </h2>
          <p className="mt-4 text-primary-foreground/80 text-base md:text-lg">
            Conta pra gente como está seu anúncio hoje. A gente dá uma olhada de verdade no site, na oferta e na
            mídia, e te devolve um caminho prático pra destravar o crescimento, sem enrolação.
          </p>
          <a
            href="#diagnostico"
            className="inline-flex items-center gap-2 mt-8 bg-[#0a0a0a] text-white px-8 py-4 rounded-xl font-semibold shadow-soft transition-opacity hover:opacity-90"
          >
            Agendar meu diagnóstico
          </a>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-primary-foreground/70">
            <MessageCircle size={14} aria-hidden />
            Sem compromisso, a gente te chama em até 24h úteis
          </p>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 10 — Depoimentos */}
      {/* ================================================================ */}
      <section className="py-16 md:py-24 bg-[#FFF6E4] dark:bg-[#1a1715] text-[#1a1715] dark:text-[#f5f0e6]">
        <div className="container mx-auto px-4">
          <h2 className="font-heading font-extrabold text-2xl md:text-4xl text-center leading-tight tracking-tight mb-12">
            Comprovado. Preferido. Performance em escala.
          </h2>
          <DraggableTestimonialCarousel testimonials={TESTIMONIALS} />
        </div>
      </section>

      {/* ================================================================ */}
      {/* 11 — Número Gigante (só entra no ar com valor real, não faz sentido animar até 0) */}
      {/* ================================================================ */}
      {!BIG_NUMBER.isPlaceholder && (
        <section ref={numeroGiganteRef} className="relative py-24 md:py-36 bg-[#0a0a0a] text-white overflow-hidden text-center">
          <motion.img
            src={heroDashboard}
            alt=""
            aria-hidden
            loading="lazy"
            style={{ y: bgParallaxY }}
            className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none select-none scale-110"
          />
          <div className="container mx-auto px-4 relative">
            <p className="font-heading font-black text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-none">
              <AnimatedCounter value={BIG_NUMBER.value} prefix={BIG_NUMBER.prefix} suffix={BIG_NUMBER.suffix} />
            </p>
            <p className="mt-6 text-white/70 uppercase tracking-widest text-sm md:text-base">{BIG_NUMBER.label}</p>
          </div>
        </section>
      )}

      {/* ================================================================ */}
      {/* 12 — Motor Guará */}
      {/* ================================================================ */}
      <section className="py-16 md:py-24 bg-[#0a0a0a] text-white">
        <div className="container mx-auto px-4">
          <h2 className="font-heading font-extrabold text-2xl md:text-4xl text-center leading-tight tracking-tight mb-16 md:mb-20">
            O Motor Guará
          </h2>
          <div className="space-y-20 md:space-y-28">
            {METHODOLOGY_STEPS.map((step) => (
              <MethodologyStep
                key={step.step}
                data={step}
                media={
                  step.step === 2 ? (
                    <DynamicGrid items={GALLERY_ITEMS} />
                  ) : (
                    <div className="grid grid-cols-2 gap-3 h-full">
                      {GALLERY_ITEMS.filter((g) => !g.isPlaceholder)
                        .slice((step.step - 1) * 2, (step.step - 1) * 2 + 2)
                        .map((v, i) => (
                          <VideoCard key={v.id} src={v.src} type={v.type} aspect="9/16" index={i} autoPlayOnView />
                        ))}
                    </div>
                  )
                }
              />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 13 — Colagem de Criativos (sem texto) */}
      {/* ================================================================ */}
      <section className="py-10 md:py-16 bg-[#0a0a0a] overflow-hidden">
        <div className="container mx-auto px-4 grid grid-cols-3 md:grid-cols-5 gap-3">
          {GALLERY_ITEMS.filter((g) => !g.isPlaceholder)
            .concat(GALLERY_ITEMS.filter((g) => !g.isPlaceholder))
            .slice(0, 10)
            .map((v, i) => (
              <VideoCard
                key={`${v.id}-${i}`}
                src={v.src}
                type={v.type}
                aspect={i % 3 === 0 ? "1/1" : "9/16"}
                index={i}
                autoPlayOnView
                className={i % 4 === 0 ? "md:col-span-2" : ""}
              />
            ))}
        </div>
      </section>

      {/* ================================================================ */}
      {/* 14 — Como é Trabalhar com a Gente */}
      {/* ================================================================ */}
      <section className="py-16 md:py-24 bg-[#FFF6E4] dark:bg-[#1a1715] text-[#1a1715] dark:text-[#f5f0e6]">
        <VideoPlayerHero title="Como é trabalhar com a gente" />
      </section>

      {/* ================================================================ */}
      {/* 15 — A Guará em Números (última inversão pra bege). Só entra no ar */}
      {/* com números reais — animar contadores até 0 parece quebrado. */}
      {/* ================================================================ */}
      {numerosFinaisReais.length > 0 && (
        <section className="py-16 md:py-24 bg-[#FFF6E4] dark:bg-[#1a1715] text-[#1a1715] dark:text-[#f5f0e6]">
          <div className="container mx-auto px-4">
            <h2 className="font-heading font-extrabold text-2xl md:text-4xl text-center leading-tight tracking-tight mb-12">
              A Guará em números
            </h2>
            <div className="grid sm:grid-cols-3 gap-8">
              {numerosFinaisReais.map((n, i) => (
                <motion.div
                  key={n.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="text-center"
                >
                  <p className="font-heading font-extrabold text-4xl md:text-5xl text-primary">
                    <AnimatedCounter value={n.value} prefix={n.prefix} suffix={n.suffix} />
                  </p>
                  <p className="mt-2 text-sm opacity-70 flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={14} className="text-[#C8E64A]" /> {n.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================================================================ */}
      {/* 16 — CTA Final */}
      {/* ================================================================ */}
      <section className="py-16 md:py-24 bg-[#0a0a0a] text-white text-center overflow-hidden">
        <div className="container mx-auto px-4">
          <h2 className="font-heading font-extrabold uppercase text-3xl sm:text-5xl md:text-6xl leading-[1.05] tracking-tight max-w-4xl mx-auto">
            Vamos produzir os próximos criativos que vão escalar sua marca
          </h2>
          <a
            href="#diagnostico"
            className="inline-flex items-center gap-2 mt-8 bg-gradient-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-soft uppercase tracking-wide"
          >
            Agendar Diagnóstico
          </a>
        </div>
        <div className="mt-14">
          <InfiniteMarquee
            speed="fast"
            gapClassName="gap-8"
            items={VALUES_CAROUSEL_ITEMS.map((v) => (
              <span key={v} className="font-heading font-extrabold uppercase text-xl md:text-2xl text-white/20 whitespace-nowrap">
                {v} <span className="text-primary">·</span>
              </span>
            ))}
          />
        </div>
      </section>

      {/* ================================================================ */}
      {/* 16b — FAQ (reduz objeção antes do CTA final) */}
      {/* ================================================================ */}
      <section className="py-16 md:py-20 bg-[#0a0a0a] text-white">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="font-heading font-extrabold text-2xl md:text-3xl text-center leading-tight tracking-tight mb-10">
            Perguntas frequentes
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id} className="border-white/10">
                <AccordionTrigger className="text-left font-heading font-semibold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-white/70 leading-relaxed">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 17 — Formulário */}
      {/* ================================================================ */}
      <section id="diagnostico" className="py-16 md:py-24 bg-[#FFF6E4] dark:bg-[#1a1715] text-[#1a1715] dark:text-[#f5f0e6]">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-10">
            <h2 className="font-heading font-extrabold text-2xl md:text-4xl leading-tight tracking-tight">
              Agende seu diagnóstico gratuito
            </h2>
            <p className="mt-3 opacity-70">Preenche aí embaixo que a gente te chama em até 24h úteis.</p>
          </div>
          <LeadForm />
        </div>
      </section>
    </Layout>
  );
};

export default Index;

/**
 * Conteúdo da nova Home ("Marketing Visual de Performance").
 *
 * Toda entrada com `isPlaceholder: true` precisa ser substituída por conteúdo
 * real antes do lançamento — busque por "isPlaceholder: true" neste arquivo
 * para ver a lista completa do que falta.
 *
 * Vídeos: hospedados no Vercel Blob Store "guara-blob" (bucket público).
 * `public/videos/` (pasta no .gitignore) continua tendo os arquivos locais
 * pra dev, mas em produção o site consome direto da URL do Blob abaixo.
 * O plano Hobby da Vercel tem 1GB de cota — `video-02.mp4` não coube e por
 * isso não faz parte de REAL_VIDEOS (ficou só a imagem placeholder no lugar).
 */

const VIDEO_BASE_URL = "https://y7tml9uonsrwk3h6.public.blob.vercel-storage.com/videos";

import logoConsorcioSorteado from "@/assets/logos/consorcio-sorteado.png";
import logoEvi from "@/assets/logos/evi.png";
import logoLivup from "@/assets/logos/livup.png";
import logoMushin from "@/assets/logos/mushin.png";
import logoPod from "@/assets/logos/pod.png";
import logoSourceof from "@/assets/logos/sourceof.png";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface CreativeItem {
  id: string;
  type: "video" | "image";
  src: string;
  aspect: "9/16" | "1/1" | "16/9" | "4/5";
  category: "estatico" | "ugc" | "alta-producao";
  persona?: string;
  angulo?: string;
  modelo?: string;
  isPlaceholder: boolean;
  /** Imagem temática de fundo pros cards placeholder (evita blocos vazios na galeria). */
  placeholderImage?: string;
}

export interface CaseStudyMetric {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

export interface CaseStudy {
  id: string;
  clientLogo: string;
  clientName: string;
  headline: string;
  context: string;
  intervention: string;
  metrics: CaseStudyMetric[];
  creatives: CreativeItem[];
  isPlaceholder: boolean;
}

export interface ResultCard {
  id: string;
  image: string;
  logo: string;
  clientName: string;
  metric: string;
  isPlaceholder: boolean;
}

export interface Testimonial {
  id: string;
  headline: string;
  quote: string;
  photo: string;
  role: string;
  company: string;
  isPlaceholder: boolean;
}

export interface MethodologyStepData {
  step: number;
  title: string;
  description: string;
  bullets: string[];
}

// ---------------------------------------------------------------------------
// Logos de clientes (reais)
// ---------------------------------------------------------------------------

export const CLIENT_LOGOS = [
  { src: "https://cms.santander.com.br/sites/WPS/imagem/cota-cancelada-modulo-sliderimagens-item-1/24-02-01_145605_P_bazar-do-consorcio.png", alt: "Bazar do Consórcio" },
  { src: "https://raichu-uploads.s3.amazonaws.com/logo_bazar-do-precatorio_aKIjGU.png", alt: "Bazar do Precatório" },
  { src: logoConsorcioSorteado, alt: "Consórcio Sorteado" },
  { src: logoEvi, alt: "Evi" },
  { src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIk3DPLLCd_k79rAkyuUggIVbeS-89EiqLkeuHvRER_A&s", alt: "LivUp" },
  { src: logoMushin, alt: "Mushin" },
  { src: logoPod, alt: "Pod Kombucha" },
  { src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRAQIMdQW1GRe8_T-2Pl76P1gVGHNjUHdm-sCvwayORRw&s", alt: "Source of" },
  { src: "https://media.licdn.com/dms/image/v2/D4D0BAQForOQdi2T0uA/company-logo_200_200/B4DZYhSadnHsAM-/0/1744315197728/soul8_logo?e=2147483647&v=beta&t=No-PGChkVWmJr8_tg_cd95c1SszOyDfT_95NqcktyNc", alt: "Soul 8" },
];

// ---------------------------------------------------------------------------
// Galeria de Criativos (seção 06) — 17 vídeos + 26 estáticos reais + placeholders até 20/categoria
// ---------------------------------------------------------------------------

const REAL_VIDEOS: CreativeItem[] = [
  { id: "v-alta-1", type: "video", src: `${VIDEO_BASE_URL}/ad-1.mp4`, aspect: "9/16", category: "alta-producao", persona: "GESTOR DE E-COMMERCE", angulo: "PROVA SOCIAL", modelo: "ANÚNCIO EDITADO", isPlaceholder: false },
  { id: "v-alta-2", type: "video", src: `${VIDEO_BASE_URL}/catperform-academia.mp4`, aspect: "9/16", category: "alta-producao", persona: "DONO DE ACADEMIA", angulo: "RESULTADO RÁPIDO", modelo: "ANÚNCIO EDITADO", isPlaceholder: false },
  { id: "v-alta-4", type: "video", src: `${VIDEO_BASE_URL}/mushin.mp4`, aspect: "9/16", category: "alta-producao", persona: "CONSUMIDOR PREMIUM", angulo: "POSICIONAMENTO DE MARCA", modelo: "BRANDED CONTENT", isPlaceholder: false },
  { id: "v-ugc-1", type: "video", src: `${VIDEO_BASE_URL}/manu-rita.mp4`, aspect: "9/16", category: "ugc", persona: "MULHER 30+", angulo: "ANTES E DEPOIS", modelo: "UGC DEPOIMENTO", isPlaceholder: false },
  { id: "v-ugc-2", type: "video", src: `${VIDEO_BASE_URL}/estagio.mp4`, aspect: "9/16", category: "ugc", persona: "JOVEM PROFISSIONAL", angulo: "OPORTUNIDADE", modelo: "UGC DEPOIMENTO", isPlaceholder: false },
  { id: "v-ugc-3", type: "video", src: `${VIDEO_BASE_URL}/iranni-ecommerce.mp4`, aspect: "9/16", category: "ugc", persona: "COMPRADOR ONLINE", angulo: "DOR DE CONFIANÇA", modelo: "UGC REVIEW", isPlaceholder: false },
  { id: "v-ugc-4", type: "video", src: `${VIDEO_BASE_URL}/sociedade-canina.mp4`, aspect: "9/16", category: "ugc", persona: "TUTOR DE PET", angulo: "CUIDADO", modelo: "UGC DEPOIMENTO", isPlaceholder: false },
  // Lote novo enviado pelo cliente — tags de persona/ângulo/modelo são um chute
  // razoável (não assisti o conteúdo); ajustar em landingContent.ts quando
  // alguém revisar os vídeos de fato.
  { id: "v-real-1", type: "video", src: `${VIDEO_BASE_URL}/criativo-1.mp4`, aspect: "9/16", category: "alta-producao", persona: "PERSONA A REVISAR", angulo: "ÂNGULO A REVISAR", modelo: "ANÚNCIO EDITADO", isPlaceholder: false },
  { id: "v-real-2", type: "video", src: `${VIDEO_BASE_URL}/criativo-2.mp4`, aspect: "9/16", category: "alta-producao", persona: "PERSONA A REVISAR", angulo: "ÂNGULO A REVISAR", modelo: "ANÚNCIO EDITADO", isPlaceholder: false },
  { id: "v-real-3", type: "video", src: `${VIDEO_BASE_URL}/criativo-3.mp4`, aspect: "9/16", category: "alta-producao", persona: "PERSONA A REVISAR", angulo: "ÂNGULO A REVISAR", modelo: "ANÚNCIO EDITADO", isPlaceholder: false },
  { id: "v-real-4", type: "video", src: `${VIDEO_BASE_URL}/criativo-4.mp4`, aspect: "9/16", category: "ugc", persona: "PERSONA A REVISAR", angulo: "ÂNGULO A REVISAR", modelo: "UGC DEPOIMENTO", isPlaceholder: false },
  { id: "v-real-5", type: "video", src: `${VIDEO_BASE_URL}/criativo-5.mp4`, aspect: "9/16", category: "ugc", persona: "PERSONA A REVISAR", angulo: "ÂNGULO A REVISAR", modelo: "UGC DEPOIMENTO", isPlaceholder: false },
  { id: "v-real-6", type: "video", src: `${VIDEO_BASE_URL}/criativo-6.mp4`, aspect: "9/16", category: "ugc", persona: "PERSONA A REVISAR", angulo: "ÂNGULO A REVISAR", modelo: "UGC DEPOIMENTO", isPlaceholder: false },
  { id: "v-real-7", type: "video", src: `${VIDEO_BASE_URL}/criativo-7.mp4`, aspect: "9/16", category: "estatico", persona: "PERSONA A REVISAR", angulo: "ÂNGULO A REVISAR", modelo: "CRIATIVO ESTÁTICO", isPlaceholder: false },
  { id: "v-real-8", type: "video", src: `${VIDEO_BASE_URL}/criativo-8.mp4`, aspect: "9/16", category: "estatico", persona: "PERSONA A REVISAR", angulo: "ÂNGULO A REVISAR", modelo: "CRIATIVO ESTÁTICO", isPlaceholder: false },
  { id: "v-real-9", type: "video", src: `${VIDEO_BASE_URL}/criativo-9.mp4`, aspect: "9/16", category: "estatico", persona: "PERSONA A REVISAR", angulo: "ÂNGULO A REVISAR", modelo: "CRIATIVO ESTÁTICO", isPlaceholder: false },
];

// Estáticos reais enviados pelo cliente (imagens 1080x1350). "outro-cliente"
// ainda não foi identificado — confirmar a marca e trocar pelo nome real
// (e adicionar o logo em CLIENT_LOGOS, se fizer sentido).
export const REAL_STATICS: CreativeItem[] = [
  { id: "s-livup-1", type: "image", src: "/creativos/livup/livup-estatico-01.png", aspect: "4/5", category: "estatico", persona: "CLIENTE LIVUP", angulo: "BENEFÍCIO", modelo: "CRIATIVO ESTÁTICO", isPlaceholder: false },
  { id: "s-livup-2", type: "image", src: "/creativos/livup/livup-estatico-02.png", aspect: "4/5", category: "estatico", persona: "CLIENTE LIVUP", angulo: "BENEFÍCIO", modelo: "CRIATIVO ESTÁTICO", isPlaceholder: false },
  { id: "s-livup-3", type: "image", src: "/creativos/livup/livup-estatico-03.png", aspect: "4/5", category: "estatico", persona: "CLIENTE LIVUP", angulo: "BENEFÍCIO", modelo: "CRIATIVO ESTÁTICO", isPlaceholder: false },
  { id: "s-livup-4", type: "image", src: "/creativos/livup/livup-estatico-04.png", aspect: "4/5", category: "estatico", persona: "CLIENTE LIVUP", angulo: "BENEFÍCIO", modelo: "CRIATIVO ESTÁTICO", isPlaceholder: false },
  { id: "s-livup-5", type: "image", src: "/creativos/livup/livup-estatico-05.png", aspect: "4/5", category: "estatico", persona: "CLIENTE LIVUP", angulo: "BENEFÍCIO", modelo: "CRIATIVO ESTÁTICO", isPlaceholder: false },
  { id: "s-livup-6", type: "image", src: "/creativos/livup/livup-estatico-06.png", aspect: "4/5", category: "estatico", persona: "CLIENTE LIVUP", angulo: "BENEFÍCIO", modelo: "CRIATIVO ESTÁTICO", isPlaceholder: false },
  { id: "s-livup-7", type: "image", src: "/creativos/livup/livup-estatico-07.png", aspect: "4/5", category: "estatico", persona: "CLIENTE LIVUP", angulo: "BENEFÍCIO", modelo: "CRIATIVO ESTÁTICO", isPlaceholder: false },
  { id: "s-pod-1", type: "image", src: "/creativos/pod/pod-beneficio-01.png", aspect: "4/5", category: "estatico", persona: "CLIENTE POD KOMBUCHA", angulo: "BENEFÍCIO", modelo: "CRIATIVO ESTÁTICO", isPlaceholder: false },
  { id: "s-pod-2", type: "image", src: "/creativos/pod/pod-beneficio-02.png", aspect: "4/5", category: "estatico", persona: "CLIENTE POD KOMBUCHA", angulo: "BENEFÍCIO", modelo: "CRIATIVO ESTÁTICO", isPlaceholder: false },
  { id: "s-pod-3", type: "image", src: "/creativos/pod/pod-beneficio-03.png", aspect: "4/5", category: "estatico", persona: "CLIENTE POD KOMBUCHA", angulo: "BENEFÍCIO", modelo: "CRIATIVO ESTÁTICO", isPlaceholder: false },
  { id: "s-pod-4", type: "image", src: "/creativos/pod/pod-beneficio-04.png", aspect: "4/5", category: "estatico", persona: "CLIENTE POD KOMBUCHA", angulo: "BENEFÍCIO", modelo: "CRIATIVO ESTÁTICO", isPlaceholder: false },
  { id: "s-pod-5", type: "image", src: "/creativos/pod/pod-prova-social-01.png", aspect: "4/5", category: "estatico", persona: "CLIENTE POD KOMBUCHA", angulo: "PROVA SOCIAL", modelo: "CRIATIVO ESTÁTICO", isPlaceholder: false },
  { id: "s-pod-6", type: "image", src: "/creativos/pod/pod-prova-social-02.png", aspect: "4/5", category: "estatico", persona: "CLIENTE POD KOMBUCHA", angulo: "PROVA SOCIAL", modelo: "CRIATIVO ESTÁTICO", isPlaceholder: false },
  { id: "s-pod-7", type: "image", src: "/creativos/pod/pod-infografico-beneficio-01.png", aspect: "4/5", category: "estatico", persona: "CLIENTE POD KOMBUCHA", angulo: "BENEFÍCIO", modelo: "INFOGRÁFICO", isPlaceholder: false },
  { id: "s-oc-1", type: "image", src: "/creativos/outro-cliente/outro-cliente-beneficios-01.png", aspect: "4/5", category: "estatico", persona: "CLIENTE A IDENTIFICAR", angulo: "BENEFÍCIO", modelo: "CRIATIVO ESTÁTICO", isPlaceholder: false },
  { id: "s-oc-2", type: "image", src: "/creativos/outro-cliente/outro-cliente-marmita-01.png", aspect: "4/5", category: "estatico", persona: "CLIENTE A IDENTIFICAR", angulo: "PRODUTO", modelo: "CRIATIVO ESTÁTICO", isPlaceholder: false },
  { id: "s-oc-3", type: "image", src: "/creativos/outro-cliente/outro-cliente-pratos-01.png", aspect: "4/5", category: "estatico", persona: "CLIENTE A IDENTIFICAR", angulo: "PRODUTO", modelo: "CRIATIVO ESTÁTICO", isPlaceholder: false },
  { id: "s-oc-4", type: "image", src: "/creativos/outro-cliente/outro-cliente-marmita-02.png", aspect: "4/5", category: "estatico", persona: "CLIENTE A IDENTIFICAR", angulo: "PRODUTO", modelo: "CRIATIVO ESTÁTICO", isPlaceholder: false },
  { id: "s-oc-5", type: "image", src: "/creativos/outro-cliente/outro-cliente-carrossel-macros-01.png", aspect: "4/5", category: "estatico", persona: "CLIENTE A IDENTIFICAR", angulo: "MACROS", modelo: "CARROSSEL", isPlaceholder: false },
  { id: "s-oc-6", type: "image", src: "/creativos/outro-cliente/outro-cliente-carrossel-macros-02.png", aspect: "4/5", category: "estatico", persona: "CLIENTE A IDENTIFICAR", angulo: "MACROS", modelo: "CARROSSEL", isPlaceholder: false },
  { id: "s-oc-7", type: "image", src: "/creativos/outro-cliente/outro-cliente-carrossel-macros-03.png", aspect: "4/5", category: "estatico", persona: "CLIENTE A IDENTIFICAR", angulo: "MACROS", modelo: "CARROSSEL", isPlaceholder: false },
  { id: "s-oc-8", type: "image", src: "/creativos/outro-cliente/outro-cliente-carrossel-macros-04.png", aspect: "4/5", category: "estatico", persona: "CLIENTE A IDENTIFICAR", angulo: "MACROS", modelo: "CARROSSEL", isPlaceholder: false },
  { id: "s-oc-9", type: "image", src: "/creativos/outro-cliente/outro-cliente-carrossel-pratos-01.png", aspect: "4/5", category: "estatico", persona: "CLIENTE A IDENTIFICAR", angulo: "PRATOS", modelo: "CARROSSEL", isPlaceholder: false },
  { id: "s-oc-10", type: "image", src: "/creativos/outro-cliente/outro-cliente-carrossel-pratos-02.png", aspect: "4/5", category: "estatico", persona: "CLIENTE A IDENTIFICAR", angulo: "PRATOS", modelo: "CARROSSEL", isPlaceholder: false },
  { id: "s-oc-11", type: "image", src: "/creativos/outro-cliente/outro-cliente-carrossel-pratos-03.png", aspect: "4/5", category: "estatico", persona: "CLIENTE A IDENTIFICAR", angulo: "PRATOS", modelo: "CARROSSEL", isPlaceholder: false },
  { id: "s-oc-12", type: "image", src: "/creativos/outro-cliente/outro-cliente-carrossel-pratos-04.png", aspect: "4/5", category: "estatico", persona: "CLIENTE A IDENTIFICAR", angulo: "PRATOS", modelo: "CARROSSEL", isPlaceholder: false },
];

// Imagens temáticas (Unsplash) usadas de fundo nos cards placeholder da galeria,
// só pra não deixar blocos totalmente vazios enquanto os criativos reais não chegam.
const PLACEHOLDER_THEME_IMAGES: Record<CreativeItem["category"], string[]> = {
  estatico: [
    "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=800&fit=crop",
  ],
  ugc: [
    "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1556155092-490a1ba16284?w=600&h=800&fit=crop",
  ],
  "alta-producao": [
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1579165466949-3180a3d056d5?w=600&h=800&fit=crop",
  ],
};

function buildPlaceholders(category: CreativeItem["category"], label: string, countNeeded: number): CreativeItem[] {
  const aspects: CreativeItem["aspect"][] = ["9/16", "1/1", "16/9"];
  const images = PLACEHOLDER_THEME_IMAGES[category];
  return Array.from({ length: Math.max(countNeeded, 0) }, (_, i) => ({
    id: `${category}-placeholder-${i + 1}`,
    type: i % 3 === 0 ? "image" : "video",
    src: "",
    aspect: aspects[i % aspects.length],
    category,
    persona: "PERSONA A DEFINIR",
    angulo: `${label} #${String(i + 1).padStart(2, "0")}`,
    modelo: "MODELO A DEFINIR",
    isPlaceholder: true,
    placeholderImage: images[i % images.length],
  }));
}

const GALLERY_MIN_PER_CATEGORY = 20;

const ALL_REAL_CREATIVES = [...REAL_VIDEOS, ...REAL_STATICS];
const realCountByCategory = (category: CreativeItem["category"]) =>
  ALL_REAL_CREATIVES.filter((v) => v.category === category).length;

export const GALLERY_ITEMS: CreativeItem[] = [
  ...ALL_REAL_CREATIVES,
  ...buildPlaceholders("estatico", "Criativo Estático", GALLERY_MIN_PER_CATEGORY - realCountByCategory("estatico")),
  ...buildPlaceholders("ugc", "Criativo UGC", GALLERY_MIN_PER_CATEGORY - realCountByCategory("ugc")),
  ...buildPlaceholders("alta-producao", "Criativo Alta Produção", GALLERY_MIN_PER_CATEGORY - realCountByCategory("alta-producao")),
];

// ---------------------------------------------------------------------------
// Cases (seção 08) — 1 case real, resto placeholder
// ---------------------------------------------------------------------------

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: "case-dnvb",
    clientLogo: logoEvi,
    clientName: "Evi",
    headline: "Marca DNVB pro-age contra o movimento anti-idade",
    context:
      "Marca DNVB de skincare pro-age buscando escalar aquisição pagando pouco por cada cliente novo, num mercado saturado de promessas anti-idade genéricas.",
    intervention:
      "Operação completa da máquina digital de aquisição: criativos, mídia paga e construção de todas as linhas de comunicação da marca.",
    metrics: [
      { value: 843, suffix: "%", label: "De Aumento De Receita" },
      { value: 10, suffix: "x", label: "De Aumento De Novos Clientes" },
    ],
    creatives: REAL_VIDEOS.slice(0, 3),
    isPlaceholder: false,
  },
  {
    id: "case-placeholder-1",
    clientLogo: logoSourceof,
    clientName: "Cliente #02 (a definir)",
    headline: "Headline do case a definir",
    context: "Contexto do desafio do cliente a definir.",
    intervention: "Intervenção da Guará a definir.",
    metrics: [
      { value: 0, suffix: "%", label: "Métrica a definir" },
      { value: 0, suffix: "x", label: "Métrica a definir" },
    ],
    creatives: REAL_VIDEOS.slice(3, 5),
    isPlaceholder: true,
  },
  {
    id: "case-placeholder-2",
    clientLogo: logoLivup,
    clientName: "Cliente #03 (a definir)",
    headline: "Headline do case a definir",
    context: "Contexto do desafio do cliente a definir.",
    intervention: "Intervenção da Guará a definir.",
    metrics: [
      { value: 0, suffix: "%", label: "Métrica a definir" },
      { value: 0, suffix: "x", label: "Métrica a definir" },
    ],
    creatives: REAL_VIDEOS.slice(5, 8),
    isPlaceholder: true,
  },
];

// ---------------------------------------------------------------------------
// Carrossel de Resultados (seção 04) — 16 cards, padrão Soar (imagem+logo+métrica)
// ---------------------------------------------------------------------------

const PLACEHOLDER_METRICS = [
  "AUMENTO DE 120% EM VENDAS",
  "REDUÇÃO DE 38% NO CAC",
  "ESCALOU MÍDIA EM 4X",
  "ROAS DE 6.2",
  "3X MAIS LEADS QUALIFICADOS",
  "CRESCIMENTO DE 200% EM 90 DIAS",
];

export const RESULTS_CAROUSEL: ResultCard[] = Array.from({ length: 16 }, (_, i) => {
  const logo = CLIENT_LOGOS[i % CLIENT_LOGOS.length];
  return {
    id: `result-${i + 1}`,
    image: "",
    logo: logo.src,
    clientName: logo.alt,
    metric: PLACEHOLDER_METRICS[i % PLACEHOLDER_METRICS.length],
    isPlaceholder: true,
  };
});

// ---------------------------------------------------------------------------
// Depoimentos (seção 10)
// ---------------------------------------------------------------------------

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t-1",
    headline: "Um time que entende de marca, performance e crescimento",
    quote:
      "A Guará Media se destaca não só pela criatividade e estratégia, mas também pela performance. Com um trabalho afiado de tráfego pago, a agência entrega resultados reais, otimizando cada investimento e transformando cliques em conversões.",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    role: "Founder",
    company: "Source OF",
    isPlaceholder: true,
  },
  {
    id: "t-2",
    headline: "Previsibilidade de receita mês a mês",
    quote:
      "Resultados consistentes mês a mês. A operação digital da Guará destravou o nosso crescimento e nos deu previsibilidade de receita.",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    role: "CEO",
    company: "Evvi Cosméticos",
    isPlaceholder: true,
  },
  {
    id: "t-3",
    headline: "Escala mantendo eficiência",
    quote:
      "Time afiado em dados, criativos e mídia. Conseguimos escalar campanhas mantendo eficiência e CPA dentro da meta.",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    role: "Diretora de Marketing",
    company: "Cliente Guará",
    isPlaceholder: true,
  },
];

// ---------------------------------------------------------------------------
// Motor Guará (seção 12) — 5 etapas
// ---------------------------------------------------------------------------

export const METHODOLOGY_STEPS: MethodologyStepData[] = [
  {
    step: 1,
    title: "Diagnóstico 360°",
    description: "Auditamos toda a operação digital antes de propor qualquer coisa.",
    bullets: ["Análise de mídia, site e funil", "Benchmark de concorrência", "Mapa de oportunidades priorizado"],
  },
  {
    step: 2,
    title: "Matriz de Criativos",
    description: "Cruzamos Persona, Ângulo e Modelo de edição para nunca faltar criativo novo pra testar.",
    bullets: ["Personas mapeadas por dor real", "Ângulos de comunicação testáveis", "Modelos de edição por formato"],
  },
  {
    step: 3,
    title: "Produção em Escala",
    description: "Time interno de copy, design e edição produzindo em volume constante.",
    bullets: ["Estático, UGC e alta produção", "Ciclo de produção semanal", "Banco de criativos sempre ativo"],
  },
  {
    step: 4,
    title: "Veiculação e Testes",
    description: "Testamos tudo, mantemos o que performa, matamos o resto rápido.",
    bullets: ["Testes A/B contínuos", "Alocação de verba por performance", "Decisão orientada a dado, não a opinião"],
  },
  {
    step: 5,
    title: "Otimização Contínua",
    description: "O ciclo nunca para — cada resultado vira insumo pro próximo criativo.",
    bullets: ["Dashboards em tempo real", "Reporte semanal de performance", "Reinvestimento no que funciona"],
  },
];

// ---------------------------------------------------------------------------
// Número Gigante (seção 11) e A Guará em Números (seção 15)
// ---------------------------------------------------------------------------

export const BIG_NUMBER = {
  value: 0,
  prefix: "R$ ",
  suffix: " MI",
  label: "EM RECEITA GERADA PARA NOSSOS CLIENTES",
  isPlaceholder: true,
};

export const NUMEROS_FINAIS = [
  { value: 0, suffix: "+", label: "Criativos produzidos por mês", isPlaceholder: true },
  { value: 0, prefix: "R$ ", suffix: " MI", label: "Em receita gerada", isPlaceholder: true },
  { value: 0, prefix: "R$ ", suffix: " MI", label: "Em mídia gerida", isPlaceholder: true },
];

// ---------------------------------------------------------------------------
// CTA Final (seção 16) — valores reais do briefing
// ---------------------------------------------------------------------------

export const VALUES_CAROUSEL_ITEMS = [
  "CRUZE A LINHA PRIMEIRO",
  "OBCECADO POR GENTE",
  "EXCELÊNCIA RECORRENTE",
  "NINGUÉM CONSTRÓI NADA SOZINHO",
];

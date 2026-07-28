export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string;
  category: string;
  tags: string[];
  author: string;
  published_at: string;
  reading_time: number;
  content: string;
}

export interface Tool {
  id: string;
  title: string;
  slug: string;
  description: string;
  cover_image: string;
  category: string;
  benefits: string[];
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  work_model: "remoto" | "híbrido" | "presencial";
  description: string;
  requirements: string[];
  responsibilities: string[];
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string;
  gated: boolean;
  published_at: string;
  content: string;
}

export const posts: Post[] = [
  {
    id: "1",
    title: "Como criar uma estratégia de conteúdo que gera resultados",
    slug: "estrategia-conteudo-resultados",
    excerpt: "Aprenda a desenvolver um plano de conteúdo alinhado aos objetivos do seu negócio e que realmente converte.",
    cover_image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
    category: "Marketing de Conteúdo",
    tags: ["conteúdo", "estratégia", "SEO"],
    author: "Ana Silva",
    published_at: "2024-03-15",
    reading_time: 8,
    content: `<p>Criar uma estratégia de conteúdo eficaz é essencial para qualquer negócio digital. Neste artigo, vamos explorar os passos fundamentais para desenvolver um plano que realmente gera resultados.</p><h2>1. Defina seus objetivos</h2><p>Antes de criar qualquer conteúdo, é crucial entender o que você quer alcançar. Seus objetivos podem incluir aumentar o tráfego orgânico, gerar leads qualificados ou fortalecer a autoridade da marca.</p><h2>2. Conheça sua audiência</h2><p>Desenvolva personas detalhadas que representem seu público-alvo. Entenda suas dores, necessidades e o tipo de conteúdo que consomem.</p><h2>3. Planeje o calendário editorial</h2><p>Organize seus conteúdos em um calendário que considere sazonalidade, lançamentos e datas importantes para seu mercado.</p>`,
  },
  {
    id: "2",
    title: "SEO em 2024: tendências e melhores práticas",
    slug: "seo-2024-tendencias",
    excerpt: "Descubra as principais tendências de SEO para este ano e como aplicá-las na sua estratégia digital.",
    cover_image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=600&h=400&fit=crop",
    category: "SEO",
    tags: ["SEO", "Google", "tendências"],
    author: "Carlos Mendes",
    published_at: "2024-03-10",
    reading_time: 12,
    content: `<p>O SEO continua evoluindo e 2024 traz novas oportunidades para quem quer se destacar nos resultados de busca.</p>`,
  },
  {
    id: "3",
    title: "O poder do branding para startups",
    slug: "branding-startups",
    excerpt: "Entenda por que investir em branding desde o início pode ser o diferencial competitivo da sua startup.",
    cover_image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&h=400&fit=crop",
    category: "Branding",
    tags: ["branding", "startup", "identidade visual"],
    author: "Marina Costa",
    published_at: "2024-03-05",
    reading_time: 6,
    content: `<p>Branding vai muito além de um logo bonito. É sobre criar uma conexão emocional com seu público.</p>`,
  },
  {
    id: "4",
    title: "Google Ads: como otimizar seu ROI",
    slug: "google-ads-roi",
    excerpt: "Técnicas avançadas para maximizar o retorno sobre investimento nas suas campanhas de Google Ads.",
    cover_image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop",
    category: "Mídia Paga",
    tags: ["Google Ads", "PPC", "ROI"],
    author: "Ricardo Lima",
    published_at: "2024-02-28",
    reading_time: 10,
    content: `<p>Otimizar campanhas de Google Ads requer uma abordagem analítica e estratégica.</p>`,
  },
  {
    id: "5",
    title: "Social Media: como criar engajamento autêntico",
    slug: "social-media-engajamento",
    excerpt: "Estratégias para construir uma comunidade engajada nas redes sociais sem depender apenas de alcance pago.",
    cover_image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=400&fit=crop",
    category: "Redes Sociais",
    tags: ["social media", "engajamento", "comunidade"],
    author: "Ana Silva",
    published_at: "2024-02-20",
    reading_time: 7,
    content: `<p>Engajamento autêntico é a base de qualquer estratégia de redes sociais bem-sucedida.</p>`,
  },
  {
    id: "6",
    title: "Email marketing: automações que convertem",
    slug: "email-marketing-automacoes",
    excerpt: "Descubra como criar fluxos de email automatizados que nutrem leads e aumentam suas vendas.",
    cover_image: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=600&h=400&fit=crop",
    category: "Email Marketing",
    tags: ["email", "automação", "leads"],
    author: "Carlos Mendes",
    published_at: "2024-02-15",
    reading_time: 9,
    content: `<p>Automações de email marketing são uma das formas mais eficazes de converter leads em clientes.</p>`,
  },
];

export const tools: Tool[] = [
  {
    id: "1",
    title: "Checklist de SEO On-Page",
    slug: "checklist-seo-on-page",
    description: "Um checklist completo para garantir que suas páginas estejam otimizadas para os mecanismos de busca.",
    cover_image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&h=400&fit=crop",
    category: "SEO",
    benefits: ["Otimize cada página do seu site", "Melhore seu ranking no Google", "Checklist prático e acionável"],
  },
  {
    id: "2",
    title: "Template de Calendário Editorial",
    slug: "template-calendario-editorial",
    description: "Organize sua produção de conteúdo com nosso template profissional de calendário editorial.",
    cover_image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600&h=400&fit=crop",
    category: "Conteúdo",
    benefits: ["Planeje conteúdos para 3 meses", "Organize por canal e formato", "Acompanhe métricas de performance"],
  },
  {
    id: "3",
    title: "E-book: Guia de Branding",
    slug: "ebook-guia-branding",
    description: "Tudo que você precisa saber para construir uma marca forte e memorável do zero.",
    cover_image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&h=400&fit=crop",
    category: "Branding",
    benefits: ["60+ páginas de conteúdo", "Exemplos práticos e cases", "Templates editáveis inclusos"],
  },
];

export const jobs: Job[] = [
  {
    id: "1",
    title: "Analista de Marketing Digital",
    department: "Marketing",
    location: "São Paulo, SP",
    work_model: "híbrido",
    description: "Buscamos um(a) analista para planejar e executar campanhas de marketing digital.",
    requirements: ["2+ anos de experiência em marketing digital", "Conhecimento em Google Ads e Meta Ads", "Certificação Google Analytics"],
    responsibilities: ["Gerenciar campanhas de mídia paga", "Analisar métricas e gerar relatórios", "Propor otimizações baseadas em dados"],
  },
  {
    id: "2",
    title: "Designer Gráfico Sr.",
    department: "Design",
    location: "São Paulo, SP",
    work_model: "remoto",
    description: "Procuramos um(a) designer criativo(a) para liderar projetos de identidade visual.",
    requirements: ["4+ anos de experiência em design", "Domínio do pacote Adobe e Figma", "Portfólio com projetos de branding"],
    responsibilities: ["Criar identidades visuais", "Desenvolver materiais de comunicação", "Mentorear designers júniores"],
  },
  {
    id: "3",
    title: "Redator(a) de Conteúdo",
    department: "Conteúdo",
    location: "Remoto",
    work_model: "remoto",
    description: "Buscamos redator(a) para produzir conteúdos de alta qualidade para blogs e redes sociais.",
    requirements: ["Experiência em redação publicitária", "Conhecimento de SEO", "Excelente português"],
    responsibilities: ["Produzir artigos para blog", "Criar copies para redes sociais", "Desenvolver e-books e materiais ricos"],
  },
];

export const articles: Article[] = [
  {
    id: "1",
    title: "O futuro do marketing B2B em 2024",
    slug: "futuro-marketing-b2b-2024",
    excerpt: "Uma análise profunda das tendências que estão moldando o marketing B2B neste ano.",
    cover_image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop",
    gated: false,
    published_at: "2024-03-12",
    content: `<p>O marketing B2B está passando por uma transformação significativa. Empresas que se adaptarem às novas tendências terão vantagem competitiva.</p>`,
  },
  {
    id: "2",
    title: "Como mensurar o ROI do marketing de conteúdo",
    slug: "mensurar-roi-marketing-conteudo",
    excerpt: "Aprenda a calcular e demonstrar o retorno sobre investimento da sua estratégia de conteúdo.",
    cover_image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
    gated: true,
    published_at: "2024-03-08",
    content: `<p>Mensurar o ROI do marketing de conteúdo é um dos maiores desafios dos profissionais de marketing.</p>`,
  },
  {
    id: "3",
    title: "Inteligência Artificial no Marketing Digital",
    slug: "ia-marketing-digital",
    excerpt: "Como a IA está revolucionando as estratégias de marketing e o que esperar nos próximos anos.",
    cover_image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop",
    gated: true,
    published_at: "2024-03-01",
    content: `<p>A inteligência artificial está transformando a forma como fazemos marketing digital.</p>`,
  },
];

export const categories = ["Marketing de Conteúdo", "SEO", "Branding", "Mídia Paga", "Redes Sociais", "Email Marketing"];

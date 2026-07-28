import { Link } from "react-router-dom";
import { Send, Instagram, Linkedin } from "lucide-react";
import logo from "@/assets/logo-guara-footer.png";
import tornPaperDivider from "@/assets/torn-paper-divider.png.asset.json";

const Footer = () => (
  <footer className="relative bg-[#0d0d0d] text-white overflow-hidden">
    <img
      src={tornPaperDivider.url}
      alt=""
      aria-hidden
      className="absolute top-0 left-1/2 min-w-[120%] h-auto pointer-events-none select-none z-10 torn-paper-mirror invert"
    />
    <div className="container mx-auto px-4 pt-24 pb-16 relative z-0">
      <div className="grid md:grid-cols-4 gap-10">
        <div className="md:col-span-1">
          <img src={logo} alt="Guará Media" className="h-10 mb-4" />
          <p className="text-sm opacity-70 leading-relaxed">
            Agência de marketing digital focada em resultados e crescimento sustentável.
          </p>
          <div className="flex gap-3 mt-5">
            <a
              href="https://www.instagram.com/guara_media/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-[#f97316] hover:bg-white/20 transition-colors"
            >
              <Instagram size={16} />
            </a>
            <a
              href="https://www.linkedin.com/company/guara-media/posts/?feedView=all"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-[#f97316] hover:bg-white/20 transition-colors"
            >
              <Linkedin size={16} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-heading font-semibold text-sm mb-5 text-white/90 orange-underline-title uppercase tracking-wider">
            Navegação
          </h4>
          <div className="flex flex-col gap-2.5">
            {[
              { href: "/blog", label: "Blog" },
              { href: "/ferramentas", label: "Ferramentas" },
              { href: "/talentos", label: "Talentos" },
              { href: "/artigos", label: "Artigos" },
              { href: "/contato", label: "Contato" },
            ].map((l) => (
              <Link key={l.href} to={l.href} className="text-sm text-white/60 hover:text-[#f97316] transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-heading font-semibold text-sm mb-5 text-white/90 orange-underline-title uppercase tracking-wider">
            Contato
          </h4>
          <div className="flex flex-col gap-2.5 text-sm opacity-60">
            <span>contato@guaramedia.com.br</span>
            <span>São Paulo, SP</span>
          </div>
        </div>

        <div>
          <h4 className="font-heading font-semibold text-sm mb-5 text-white/90 orange-underline-title uppercase tracking-wider">
            Newsletter
          </h4>
          <p className="text-sm opacity-60 mb-3">Receba conteúdos exclusivos.</p>
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Seu email"
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#f97316]"
            />
            <button
              aria-label="Assinar newsletter"
              className="bg-gradient-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-soft inline-flex items-center gap-2"
            >
              <Send size={14} />
              Assinar
            </button>
          </form>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-white/10 text-center text-xs opacity-40">
        © {new Date().getFullYear()} Guará Media. Todos os direitos reservados.
      </div>
    </div>
  </footer>
);

export default Footer;

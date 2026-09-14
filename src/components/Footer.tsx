import { Instagram, Linkedin } from "lucide-react";
import logo from "@/assets/logo-guara-footer.png";
import tornPaperDivider from "@/assets/torn-paper-divider.png.asset.json";

// TODO: CNPJ e endereço completo (Parque Científico e Tecnológico da Unicamp)
// ainda não foram informados — atualizar com os dados reais da empresa.
const CNPJ: string | null = null;
const ADDRESS = "Parque Científico e Tecnológico da Unicamp, Campinas, SP";

const Footer = () => (
  <footer className="relative bg-[#0a0a0a] text-white overflow-hidden">
    <img
      src={tornPaperDivider.url}
      alt=""
      aria-hidden
      className="absolute top-0 left-1/2 min-w-[120%] h-auto pointer-events-none select-none z-10 torn-paper-mirror invert"
    />
    <div className="container mx-auto px-4 pt-24 pb-12 relative z-0">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
        <div>
          <img src={logo} alt="Guará Media" className="h-10 mb-4" />
          <address className="not-italic text-sm opacity-60 leading-relaxed max-w-xs">
            {ADDRESS}
            <br />
            CNPJ: {CNPJ ?? <span className="italic opacity-70">a definir</span>}
            <br />
            <a href="mailto:contato@guaramedia.com.br" className="hover:text-[#f97316] transition-colors">
              contato@guaramedia.com.br
            </a>
          </address>
        </div>

        <div className="flex flex-col items-start md:items-end gap-4">
          <div className="flex gap-3">
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
          <div className="flex gap-4 text-xs opacity-50">
            <a href="#" className="hover:text-[#f97316] hover:opacity-100 transition-colors">
              Termos de Uso
            </a>
            <a href="#" className="hover:text-[#f97316] hover:opacity-100 transition-colors">
              Política de Privacidade
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-white/10 text-center text-xs opacity-40">
        © {new Date().getFullYear()} Guará Media. Todos os direitos reservados.
      </div>
    </div>
  </footer>
);

export default Footer;

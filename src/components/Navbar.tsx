import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Moon, Sun } from "lucide-react";
import logo from "@/assets/logo-guara.png";
import { useTheme } from "@/hooks/use-theme";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/ferramentas", label: "Ferramentas" },
  { href: "/talentos", label: "Talentos" },
  { href: "/artigos", label: "Artigos" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0d] border-b border-[#1a1a1a]">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Guará Media" className="h-9" />
        </Link>

        {/* Desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className={`text-sm font-medium transition-colors hover:text-[#f97316] ${
                pathname === l.href ? "text-[#f97316]" : "text-white/70"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className="p-2 rounded-lg text-white/70 hover:text-[#f97316] hover:bg-white/10 transition-colors"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link
            to="/contato"
            className="bg-gradient-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Fale conosco
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-white"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden border-t border-[#1a1a1a] bg-[#0d0d0d] px-4 pb-4">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              onClick={() => setOpen(false)}
              className={`block py-3 text-sm font-medium border-b border-[#1a1a1a] last:border-0 ${
                pathname === l.href ? "text-[#f97316]" : "text-white/70"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/contato"
            onClick={() => setOpen(false)}
            className="block mt-3 text-center bg-gradient-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold"
          >
            Fale conosco
          </Link>
          <button
            onClick={toggleTheme}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border border-[#1a1a1a] text-white"
          >
            {theme === "dark" ? <><Sun size={16} /> Modo claro</> : <><Moon size={16} /> Modo escuro</>}
          </button>
        </nav>
      )}
    </header>
  );
};

export default Navbar;

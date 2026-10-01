import type { ReactNode } from "react";
import { useAdminTheme } from "./helpers";

// Moldura das telas de acesso do painel (entrar, recuperar senha).
export const AuthFrame = ({ children }: { children: ReactNode }) => {
  useAdminTheme();
  return (
    <div className="admin-bg grid min-h-screen place-items-center p-4 text-foreground sm:p-6">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border-2 border-foreground bg-card shadow-brut-lg md:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-code p-10 text-code-foreground md:flex md:flex-col md:justify-between">
          <div className="absolute -right-16 -top-16 size-56 rounded-full bg-accent" aria-hidden />
          <div className="absolute -bottom-10 right-10 size-24 rounded-full bg-brand-orange" aria-hidden />
          <span className="relative w-fit rounded-full border-2 border-code-foreground/80 px-3 py-1 font-display text-xs font-extrabold">GUARÁ MEDIA</span>
          <div className="relative space-y-3">
            <p className="font-display text-4xl font-extrabold leading-[1.05]">
              Tudo do site<br />em um só lugar.
            </p>
            <p className="text-sm text-code-foreground/70">Contatos, candidaturas, blog, ferramentas, vagas e API — num painel só.</p>
          </div>
        </div>
        <div className="space-y-5 p-8 text-left sm:p-10">{children}</div>
      </div>
    </div>
  );
};

export const AuthBadge = () => (
  <span className="inline-block rounded-full border-2 border-foreground bg-accent px-3 py-1 text-xs font-extrabold">GUARÁ · PAINEL</span>
);

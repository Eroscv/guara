import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { Send, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const FATURAMENTO_OPTIONS = ["Até R$ 100 mil/mês", "R$ 100 mil – R$ 500 mil/mês", "R$ 500 mil – R$ 1 mi/mês", "Acima de R$ 1 mi/mês"];
const INVESTIMENTO_OPTIONS = ["Até R$ 10 mil/mês", "R$ 10 mil – R$ 50 mil/mês", "R$ 50 mil – R$ 100 mil/mês", "Acima de R$ 100 mil/mês"];

const leadSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail corporativo inválido").max(255),
  whatsapp: z.string().trim().min(8, "Informe um WhatsApp válido").max(30),
  empresa: z.string().trim().min(2, "Informe sua empresa").max(120),
  site: z.string().trim().max(255).optional().or(z.literal("")),
  faturamento: z.string({ message: "Selecione uma opção" }).min(1, "Selecione uma opção"),
  investimentoMidia: z.string({ message: "Selecione uma opção" }).min(1, "Selecione uma opção"),
  desafio: z.string().trim().min(10, "Conte um pouco mais sobre o desafio").max(1000),
});

type LeadFormValues = z.infer<typeof leadSchema>;

const LeadForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({ resolver: zodResolver(leadSchema) });

  const onSubmit = async (data: LeadFormValues) => {
    const { error } = await supabase.functions.invoke("create-lead-card", {
      body: data,
    });

    if (error) {
      toast.error("Erro ao enviar. Tente novamente.");
      return;
    }

    setSubmitted(true);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 md:p-10 shadow-card">
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center py-10"
          >
            <CheckCircle2 className="w-14 h-14 text-[#C8E64A]" />
            <h3 className="mt-5 font-heading font-bold text-xl">Diagnóstico solicitado!</h3>
            <p className="mt-2 text-muted-foreground max-w-sm">
              Nosso time vai analisar suas respostas e entrar em contato em até 24h úteis.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit(onSubmit)}
            className="grid sm:grid-cols-2 gap-5"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" {...register("nome")} placeholder="Seu nome" />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail corporativo *</Label>
              <Input id="email" type="email" {...register("email")} placeholder="voce@empresa.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <Input id="whatsapp" type="tel" {...register("whatsapp")} placeholder="(00) 00000-0000" />
              {errors.whatsapp && <p className="text-xs text-destructive">{errors.whatsapp.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa *</Label>
              <Input id="empresa" {...register("empresa")} placeholder="Nome da sua empresa" />
              {errors.empresa && <p className="text-xs text-destructive">{errors.empresa.message}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="site">Site</Label>
              <Input id="site" {...register("site")} placeholder="https://suaempresa.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="faturamento">Faturamento *</Label>
              <select
                id="faturamento"
                {...register("faturamento")}
                defaultValue=""
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="" disabled>
                  Selecione
                </option>
                {FATURAMENTO_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              {errors.faturamento && <p className="text-xs text-destructive">{errors.faturamento.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="investimentoMidia">Investimento em mídia *</Label>
              <select
                id="investimentoMidia"
                {...register("investimentoMidia")}
                defaultValue=""
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="" disabled>
                  Selecione
                </option>
                {INVESTIMENTO_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              {errors.investimentoMidia && <p className="text-xs text-destructive">{errors.investimentoMidia.message}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="desafio">Qual seu maior desafio hoje? *</Label>
              <Textarea id="desafio" {...register("desafio")} placeholder="Conte um pouco sobre o que trava seu crescimento hoje" rows={4} />
              {errors.desafio && <p className="text-xs text-destructive">{errors.desafio.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="sm:col-span-2 h-12 rounded-xl font-semibold bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {isSubmitting ? "Enviando..." : <>Agendar Diagnóstico <Send size={16} /></>}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeadForm;

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Send, Upload, FileText, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().email("Email inválido").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  linkedin: z.string().trim().max(300).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

type Form = z.infer<typeof schema>;

const JobApplicationForm = ({ jobId, jobTitle }: { jobId: string; jobTitle: string }) => {
  const [done, setDone] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      toast.error("Formato inválido. Envie PDF ou DOC/DOCX.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }
    setFile(selected);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (data: Form) => {
    if (!file) {
      toast.error("Anexe seu currículo (PDF ou DOC).");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${jobId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("resumes").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("resumes").getPublicUrl(path);
      const resumeUrl = publicUrlData.publicUrl;

      const { error } = await supabase.from("applications" as any).insert({
        job_id: jobId,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        linkedin: data.linkedin || null,
        message: data.message || null,
        resume_url: resumeUrl,
      });
      if (error) throw error;

      setDone(true);
      toast.success("Candidatura enviada!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar candidatura");
    } finally {
      setUploading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-primary" />
        </div>
        <h3 className="font-heading font-bold text-xl">Candidatura enviada!</h3>
        <p className="text-sm text-muted-foreground mt-2">Recebemos sua candidatura para <strong>{jobTitle}</strong>. Entraremos em contato em breve.</p>
      </div>
    );
  }

  return (
    <>
      <h3 className="font-heading font-bold text-xl mb-1">Candidatar-se</h3>
      <p className="text-sm text-muted-foreground mb-6">Preencha seus dados e anexe seu currículo para se candidatar a <strong>{jobTitle}</strong>.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome completo *</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" {...register("phone")} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="linkedin">LinkedIn (URL)</Label>
          <Input id="linkedin" placeholder="https://linkedin.com/in/..." {...register("linkedin")} />
        </div>

        {/* CV Upload */}
        <div className="space-y-1.5">
          <Label>Currículo * <span className="text-muted-foreground font-normal">(PDF ou DOC, máx. 5MB)</span></Label>
          {!file ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-input rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload size={24} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground mt-2">Clique para anexar seu currículo</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div className="flex items-center gap-3 border rounded-lg p-3 bg-muted/30">
              <FileText size={20} className="text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={clearFile} className="shrink-0 h-8 w-8">
                <X size={16} />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="message">Mensagem (opcional)</Label>
          <Textarea id="message" rows={4} placeholder="Conte um pouco sobre você..." {...register("message")} />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting || uploading}>
          <Send size={16} /> {uploading ? "Enviando…" : isSubmitting ? "Enviando…" : "Enviar candidatura"}
        </Button>
      </form>
    </>
  );
};

export default JobApplicationForm;

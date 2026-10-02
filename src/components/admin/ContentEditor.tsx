import { useState } from "react";
import { Briefcase, FileUp, ImagePlus, Loader2, Newspaper, Paperclip, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { slugify } from "@/lib/slug";
import { CONFIG, STORES, errorMessage, type Field, type Kind, type Row } from "./contentConfig";
import { uploadAdminFile } from "./helpers";

const ICON = { posts: Newspaper, tools: Wrench, jobs: Briefcase } as const;
const MAX_IMAGE = 15 * 1024 * 1024; // mesmo limite que a API valida
const MAX_FILE = 50 * 1024 * 1024;

const SELECT_CLS = "h-11 w-full rounded-md border-2 border-foreground bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-brand-orange";

export function ContentEditor({ kind, row, onClose, onSaved }: { kind: Kind; row: Row; onClose: () => void; onSaved: () => void }) {
  const cfg = CONFIG[kind];
  const store = STORES[kind];
  const isNew = !row.id;
  const [v, setV] = useState<Row>(() => cfg.toForm(row));
  const [busy, setBusy] = useState(false);
  const set = (k: string, val: unknown) => setV((p) => ({ ...p, [k]: val }));

  const upload = async (f: Field, file?: File) => {
    if (!file) return;
    if (f.type === "image" && (!file.type.startsWith("image/") || file.type === "image/svg+xml")) {
      toast.error("Use uma imagem JPG, PNG, WEBP, GIF ou AVIF.");
      return;
    }
    if (file.size > (f.type === "image" ? MAX_IMAGE : MAX_FILE)) {
      toast.error(`O arquivo passa de ${f.type === "image" ? 15 : 50}MB.`);
      return;
    }
    setBusy(true);
    try {
      const url = await uploadAdminFile(file, kind);
      set(f.key, url);
      if (f.type === "file") set("file_name", file.name);
      toast.success("Arquivo enviado");
    } catch {
      toast.error("Falha no envio do arquivo.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!String(v.title ?? "").trim()) {
      toast.error("Preencha o título.");
      return;
    }
    const problem = cfg.validate?.(v);
    if (problem) {
      toast.error(problem);
      return;
    }
    setBusy(true);
    try {
      const payload = cfg.toPayload(v, isNew);
      if (isNew) await store.create(payload);
      else await store.update(row.id, payload);
      toast.success("Salvo!");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const fields = cfg.fields.filter((f) => isNew || !f.onlyNew);
  const sections = [...new Set(fields.map((f) => f.section))];
  const KindIcon = ICON[kind];
  const noun = cfg.noun;

  const field = (f: Field) => {
    const id = `f-${f.key}`;
    if (f.type === "switch")
      return (
        <label key={f.key} htmlFor={id} className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border-2 border-foreground p-4 transition sm:col-span-2 ${v[f.key] ? "bg-accent" : "bg-muted"}`}>
          <span>
            <span className="block font-bold">{f.label}</span>
            <span className="text-xs text-foreground/70">{v[f.key] ? cfg.switchOn : cfg.switchOff}</span>
          </span>
          <Switch id={id} checked={!!v[f.key]} onCheckedChange={(c) => set(f.key, c)} />
        </label>
      );
    const inputCls = "h-11 bg-background";
    return (
      <div key={f.key} className={`space-y-1.5 ${f.half ? "" : "sm:col-span-2"}`}>
        <Label htmlFor={id} className="font-bold">
          {f.label}
          {f.key === "title" && <span className="text-brand-orange"> *</span>}
        </Label>
        {f.type === "text" && (
          <Input id={id} className={`${inputCls} ${f.key === "title" ? "h-12 text-lg font-semibold" : ""}`} placeholder={f.placeholder} value={v[f.key]} onChange={(e) => set(f.key, e.target.value)} />
        )}
        {f.type === "slug" && (
          <Input id={id} className={`${inputCls} font-mono text-sm`} value={v[f.key]} placeholder="gerado pelo título" onChange={(e) => set(f.key, slugify(e.target.value))} />
        )}
        {(f.type === "textarea" || f.type === "list") && (
          <Textarea id={id} rows={f.type === "list" ? 5 : 3} className="bg-background" placeholder={f.placeholder} value={v[f.key]} onChange={(e) => set(f.key, e.target.value)} />
        )}
        {f.key === "tags" && String(v[f.key]).trim() && (
          <div className="flex flex-wrap gap-1.5">
            {String(v[f.key]).split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
              <span key={s} className="rounded-full border-2 border-foreground bg-accent px-2 py-0.5 text-xs font-bold">#{s}</span>
            ))}
          </div>
        )}
        {f.type === "select" && (
          <select id={id} className={SELECT_CLS} value={v[f.key]} onChange={(e) => set(f.key, e.target.value)}>
            {[...(f.options!.some(([val]) => val === v[f.key]) || !v[f.key] ? [] : [[v[f.key], v[f.key]] as [string, string]]), ...f.options!].map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        )}
        {f.type === "html" && <RichTextEditor value={v[f.key]} onChange={(h) => set(f.key, h)} />}
        {f.type === "datetime" && <Input id={id} className={inputCls} type="datetime-local" value={v[f.key]} onChange={(e) => set(f.key, e.target.value)} />}
        {f.type === "image" && (
          <div className="space-y-2">
            <label className="group relative grid aspect-[16/7] cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed border-foreground/40 bg-background transition focus-within:ring-[3px] focus-within:ring-brand-orange hover:border-foreground">
              {v[f.key] ? (
                <>
                  <img src={v[f.key]} alt="Prévia da imagem" className="absolute inset-0 size-full object-cover" />
                  <span className="relative rounded-full border-2 border-foreground bg-card px-3 py-1 text-xs font-bold opacity-0 shadow-brut-sm transition group-hover:opacity-100">Trocar imagem</span>
                </>
              ) : (
                <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                  <span className="grid size-11 place-items-center rounded-xl border-2 border-foreground bg-accent text-foreground"><ImagePlus className="size-5" /></span>
                  <b className="text-foreground">Clique para enviar uma imagem</b>JPG, PNG ou WEBP
                </span>
              )}
              <input id={id} type="file" accept="image/*" className="sr-only" onChange={(e) => { upload(f, e.target.files?.[0]); e.target.value = ""; }} />
            </label>
            <Input className="h-10 bg-background text-sm" placeholder="…ou cole o link de uma imagem (https://…)" value={v[f.key]} onChange={(e) => set(f.key, e.target.value)} aria-label={`Link da ${f.label.toLowerCase()}`} />
          </div>
        )}
        {f.type === "file" && (
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-foreground/40 bg-background p-4 transition focus-within:ring-[3px] focus-within:ring-brand-orange hover:border-foreground">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-foreground bg-accent">{v[f.key] ? <Paperclip className="size-5" /> : <FileUp className="size-5" />}</span>
            <span className="min-w-0 flex-1 text-sm">
              <b className="block truncate">{v[f.key] ? v.file_name || "Arquivo enviado" : "Clique para enviar o arquivo"}</b>
              <span className="text-muted-foreground">{v[f.key] ? "Clique para trocar" : "PDF, planilha, ZIP… até 50MB"}</span>
            </span>
            {v[f.key] && (
              <a href={v[f.key]} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-sm font-bold underline">Abrir</a>
            )}
            <input id={id} type="file" className="sr-only" onChange={(e) => { upload(f, e.target.files?.[0]); e.target.value = ""; }} />
          </label>
        )}
        {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
      </div>
    );
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden rounded-3xl border-2 border-foreground p-0 shadow-brut-lg sm:max-w-3xl [&>button]:right-5 [&>button]:top-5 [&>button]:text-foreground [&>button]:opacity-100 [&>button_svg]:size-5">
        <DialogHeader className="relative shrink-0 overflow-hidden bg-code px-6 py-5 text-left text-code-foreground">
          <div className="absolute -right-10 -top-12 size-32 rounded-full bg-accent" aria-hidden />
          <div className="relative flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl border-2 border-code-foreground/70 bg-brand-orange text-primary-foreground"><KindIcon className="size-5" /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-code-foreground/60">{isNew ? "Criando" : "Editando"}</p>
              <DialogTitle className="font-display text-2xl font-extrabold text-code-foreground">{isNew ? cfg.newLabel : `Editar ${noun}`}</DialogTitle>
            </div>
          </div>
          {!isNew && v.title ? (
            <DialogDescription className="relative mt-2 truncate pr-24 text-sm text-code-foreground/70">{v.title}</DialogDescription>
          ) : (
            <DialogDescription className="sr-only">Preencha os campos e salve.</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto bg-background p-4 sm:p-6">
          {sections.map((s, i) => (
            <fieldset key={s} className="rounded-2xl border-2 border-foreground bg-card p-4 sm:p-5">
              <legend className="flex items-center gap-2 px-2 font-display text-base font-extrabold">
                <span className="grid size-6 place-items-center rounded-full bg-foreground text-xs text-background">{i + 1}</span>
                {s}
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">{fields.filter((f) => f.section === s).map(field)}</div>
            </fieldset>
          ))}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t-2 border-foreground bg-card px-4 py-3 sm:px-6">
          <p className="hidden text-xs text-muted-foreground sm:block">
            {busy ? "Enviando…" : <><span className="text-brand-orange">*</span> obrigatório</>}
          </p>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1 font-bold shadow-brut-orange sm:flex-none" onClick={save} disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              {isNew ? `Criar ${noun}` : "Salvar alterações"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { z } from "zod";

const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Data ISO 8601 inválida.");

export const postCreateSchema = z
  .object({
    title: z.string().trim().min(1, "Required"),
    content: z.string().min(1, "Required"),
    slug: z.string().trim().optional(),
    excerpt: z.string().trim().optional(),
    cover_image: z.string().url().optional(),
    image_url: z.string().url().optional(), // alias de cover_image
    images: z.array(z.string().url()).optional(),
    category: z.string().trim().optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().trim().optional(),
    published: z.boolean().optional(),
    published_at: isoDate.optional(),
  })
  .strict();

export const postPatchSchema = postCreateSchema
  .partial()
  .extend({ archived: z.boolean().optional() })
  .strict();

export const jobCreateSchema = z
  .object({
    title: z.string().trim().min(1, "Required"),
    department: z.string().trim().optional(),
    location: z.string().trim().optional(),
    work_model: z.enum(["Presencial", "Híbrido", "Remoto"]).optional(),
    description: z.string().optional(),
    responsibilities: z.array(z.string()).optional(),
    requirements: z.array(z.string()).optional(),
    is_open: z.boolean().optional(),
    publish_at: isoDate.nullable().optional(),
  })
  .strict();

export const jobPatchSchema = jobCreateSchema
  .partial()
  .extend({ archived: z.boolean().optional() })
  .strict();

export const toolCreateSchema = z
  .object({
    title: z.string().trim().min(1, "Required"),
    slug: z.string().trim().optional(),
    description: z.string().trim().optional(),
    category: z.string().trim().optional(),
    image: z.string().url().optional(),
    benefits: z.array(z.string()).optional(),
    published: z.boolean().optional(),
    file_url: z.string().url().optional(),
    file_name: z.string().trim().optional(),
    file_base64: z.string().optional(),
    file_content_type: z.string().optional(),
  })
  .strict();

export const toolPatchSchema = toolCreateSchema
  .partial()
  .extend({ archived: z.boolean().optional() })
  .strict();

export const cadastroPatchSchemas = {
  leads: z
    .object({
      nome: z.string().trim().min(1).max(200).optional(),
      whatsapp: z.string().trim().max(40).optional(),
      site: z.string().trim().optional(),
      faturamento: z.string().trim().optional(),
      solucao: z.string().trim().optional(),
      extra: z.string().trim().max(2000).optional(),
    })
    .strict(),
  newsletter: z
    .object({
      email: z.string().trim().email().optional(),
      pagina: z.string().trim().optional(),
    })
    .strict(),
  tool_downloads: z
    .object({
      nome: z.string().trim().min(1).optional(),
      email: z.string().trim().email().optional(),
      empresa: z.string().trim().optional(),
      cargo: z.string().trim().optional(),
    })
    .strict(),
  applications: z
    .object({
      status: z.enum(["novo", "analise", "entrevista", "aprovado", "recusado"]).optional(),
      notes: z.string().trim().max(5000).optional(),
      nome: z.string().trim().min(1).optional(),
      email: z.string().trim().email().optional(),
      telefone: z.string().trim().optional(),
      linkedin: z.string().trim().optional(),
    })
    .strict(),
} as const;

export type CadastroResource = keyof typeof cadastroPatchSchemas;

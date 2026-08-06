import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CARDS_API_URL = "https://ecinffgoycqvktmrmvaz.supabase.co/functions/v1/api-cards-create";
const PIPELINE_ID = "0d116c15-d16c-42bf-acb8-cf2b81e469c2";
const STAGE_ID = "9140adcf-b859-4d5f-bf07-acf30f4ebad7";

interface LeadPayload {
  nome: string;
  email: string;
  whatsapp: string;
  empresa: string;
  site?: string;
  faturamento: string;
  investimentoMidia: string;
  desafio: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const lead = (await req.json()) as LeadPayload;

    if (!lead.nome || !lead.email || !lead.whatsapp || !lead.empresa) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios ausentes" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const { error: dbError } = await supabase.from("leads").insert({
      nome: lead.nome,
      email: lead.email,
      telefone: lead.whatsapp,
      empresa: lead.empresa,
      site: lead.site || null,
      faturamento: lead.faturamento,
      investimento_midia: lead.investimentoMidia,
      desafio: lead.desafio,
      source: "home_redesign",
    });

    if (dbError) {
      return new Response(JSON.stringify({ error: dbError.message }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const cardApiKey = Deno.env.get("LEAD_CARDS_API_KEY");
    if (cardApiKey) {
      const cardRes = await fetch(CARDS_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cardApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pipeline_id: PIPELINE_ID,
          stage_id: STAGE_ID,
          title: lead.nome,
          description: "Lead vindo do site GUARÁ",
          fields: {
            Nome: lead.nome,
            "E-mail": lead.email,
            Whatsapp: lead.whatsapp,
            Empresa: lead.empresa,
            Site: lead.site || "",
            Faturamento: lead.faturamento,
            "Investimento em mídia": lead.investimentoMidia,
            "Qual seu maior desafio hoje?": lead.desafio,
          },
        }),
      });

      if (!cardRes.ok) {
        const cardErrorText = await cardRes.text();
        console.error("Falha ao criar card:", cardRes.status, cardErrorText);
      }
    } else {
      console.error("LEAD_CARDS_API_KEY não configurada — card não criado.");
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});

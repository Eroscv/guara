// Tempo de leitura em minutos, a ~200 palavras por minuto, igual ao padrão
// já usado nos posts do site.
export function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

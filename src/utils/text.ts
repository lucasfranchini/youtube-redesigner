export function normalizeTitle(text: string): string {
  return text.trim().toLocaleLowerCase("pt-BR").replace(/\s+/g, " ");
}

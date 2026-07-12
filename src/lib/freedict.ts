// Gemeinsame FreeDict-Logik (genutzt von CLI-Skript UND Admin-Import-Route).
// Lädt/parst das freie Wörterbuch Spanisch->Deutsch mit Qualitätsfilter.

export const FREEDICT_URLS = [
  "https://raw.githubusercontent.com/freedict/fd-dictionaries/master/spa-deu/spa-deu.tei",
  "https://raw.githubusercontent.com/freedict/fd-dictionaries/master/spa-deu/spa-deu-be.tei",
];

export interface ParsedWord { lemma: string; pos: string; meaningDe: string }

export function qualityOk(lemma: string, meaningDe: string): boolean {
  if (!lemma || !meaningDe) return false;
  if (lemma.length < 2 || lemma.length > 40) return false;
  if (!/^[a-záéíóúüñ¡¿'.\- ]+$/i.test(lemma)) return false;
  if (/\s{2,}/.test(lemma)) return false;
  if (lemma.split(" ").length > 4) return false;
  if (meaningDe.length < 2 || meaningDe.length > 80) return false;
  if (/[<>{}\\]/.test(meaningDe)) return false;
  return true;
}

function decode(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}
export function mapPos(p: string): string {
  const x = p.toLowerCase();
  if (x.startsWith("n")) return "sustantivo";
  if (x.startsWith("v")) return "verbo";
  if (x.startsWith("adj")) return "adjetivo";
  if (x.startsWith("adv")) return "adverbio";
  return p || "?";
}

export function parseTEI(xml: string): ParsedWord[] {
  const out: ParsedWord[] = [];
  const entries = xml.split(/<entry\b/).slice(1);
  for (const raw of entries) {
    const orth = raw.match(/<orth[^>]*>([^<]+)<\/orth>/);
    if (!orth) continue;
    const lemma = decode(orth[1].trim());
    const pos = (raw.match(/<pos[^>]*>([^<]+)<\/pos>/)?.[1] || "?").trim();
    const quotes = [...raw.matchAll(/<quote[^>]*>([^<]+)<\/quote>/g)].map((m) => decode(m[1].trim()));
    const meaningDe = quotes.slice(0, 3).filter(Boolean).join(", ");
    if (!qualityOk(lemma, meaningDe)) continue;
    out.push({ lemma, pos: mapPos(pos), meaningDe });
  }
  return out;
}

export async function fetchFreeDict(): Promise<string> {
  for (const url of FREEDICT_URLS) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) return await res.text();
    } catch {}
  }
  throw new Error("FreeDict-Download nicht möglich.");
}

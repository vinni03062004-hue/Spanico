/**
 * EIN-BEFEHL-IMPORT von ~21.000 spanischen Wörtern MIT deutscher Übersetzung.
 *
 * Quelle: FreeDict "spa-deu" (frei/offen, ~21.353 Stichwörter).
 * Das Skript lädt die Wörterliste automatisch aus dem Internet und importiert
 * sie in deine Neon-Datenbank. Du musst nichts von Hand herunterladen.
 *
 * BENUTZUNG (im Projektordner, DB-Verbindung muss stehen -> .env.local):
 *     npm run import:woerter
 *
 * Falls dein Rechner die Datei nicht laden kann, lade sie einmal manuell von
 *     https://freedict.org/downloads/         (Sprachpaar Spanisch -> Deutsch)
 * und gib den Pfad an:
 *     npx tsx scripts/importFreeDict.ts pfad/zur/spa-deu.tei
 *
 * Idempotent: bereits vorhandene Lemmata werden übersprungen.
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Offizielle FreeDict-Quelle (TEI-XML, reiner Text, kein Entpacken nötig).
const URLS = [
  "https://raw.githubusercontent.com/freedict/fd-dictionaries/master/spa-deu/spa-deu.tei",
  "https://raw.githubusercontent.com/freedict/fd-dictionaries/master/spa-deu/spa-deu-be.tei",
];

interface Parsed { lemma: string; pos: string; meaningDe: string }

// Sehr toleranter TEI-Parser: holt <orth> (span. Wort) + erste dt. <quote>-Übersetzungen.
function parseTEI(xml: string): Parsed[] {
  const out: Parsed[] = [];
  const entries = xml.split(/<entry\b/).slice(1);
  for (const raw of entries) {
    const orth = raw.match(/<orth[^>]*>([^<]+)<\/orth>/);
    if (!orth) continue;
    const lemma = decode(orth[1].trim());
    const pos = (raw.match(/<pos[^>]*>([^<]+)<\/pos>/)?.[1] || "?").trim();
    // Übersetzungen: <cit type="trans"> ... <quote>Deutsch</quote>
    const quotes = [...raw.matchAll(/<quote[^>]*>([^<]+)<\/quote>/g)].map((m) => decode(m[1].trim()));
    const meaningDe = quotes.slice(0, 3).filter(Boolean).join(", ");
    if (!qualityOk(lemma, meaningDe)) continue;
    out.push({ lemma, pos: mapPos(pos), meaningDe });
  }
  return out;
}

// Qualitätsfilter: nur echte spanische Wörter mit brauchbarer deutscher Bedeutung.
function qualityOk(lemma: string, meaningDe: string): boolean {
  if (!lemma || !meaningDe) return false;
  if (lemma.length < 2 || lemma.length > 40) return false;
  // Spanische Buchstaben (inkl. Akzente/ñ), Leerzeichen und Bindestrich erlaubt.
  if (!/^[a-záéíóúüñ¡¿'.\- ]+$/i.test(lemma)) return false;
  if (/\s{2,}/.test(lemma)) return false;            // keine Mehrfach-Leerzeichen
  if (lemma.split(" ").length > 4) return false;      // keine langen Phrasen/Sätze
  if (meaningDe.length < 2 || meaningDe.length > 80) return false;
  if (/[<>{}\\]/.test(meaningDe)) return false;        // keine XML-/Code-Reste
  return true;
}

function decode(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}
function mapPos(p: string): string {
  const x = p.toLowerCase();
  if (x.startsWith("n")) return "sustantivo";
  if (x.startsWith("v")) return "verbo";
  if (x.startsWith("adj")) return "adjetivo";
  if (x.startsWith("adv")) return "adverbio";
  return p || "?";
}
// Häufigkeitsstufe unbekannt -> mittlere Stufe (wird ab "Basic communicator" freigeschaltet).
function tierFor(_lemma: string): number { return 4; }

async function loadSource(): Promise<string> {
  const localPath = process.argv[2];
  if (localPath) {
    console.log("Lese lokale Datei:", localPath);
    return readFileSync(localPath, "utf8");
  }
  for (const url of URLS) {
    try {
      console.log("Lade Wörterbuch:", url);
      const res = await fetch(url);
      if (res.ok) return await res.text();
    } catch {}
  }
  throw new Error(
    "Download fehlgeschlagen. Bitte spa-deu.tei manuell von https://freedict.org/downloads/ laden und Pfad angeben:\n  npx tsx scripts/importFreeDict.ts pfad/zur/spa-deu.tei"
  );
}

async function main() {
  const xml = await loadSource();
  const entries = parseTEI(xml);
  console.log(`Gefunden: ${entries.length} Einträge. Importiere ...`);

  let created = 0, skipped = 0;
  // In Blöcken einfügen (schneller, schont die DB).
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const exists = await prisma.vocabularyEntry.findFirst({ where: { lemma: e.lemma }, select: { id: true } });
    if (exists) { skipped++; continue; }
    const tier = tierFor(e.lemma);
    await prisma.vocabularyEntry.create({
      data: {
        lemma: e.lemma, pos: e.pos, meaningDe: e.meaningDe, explanationEs: "",
        examples: [], category: "freedict", frequencyTier: tier,
        layer: "thematisch", collocations: [], confusables: [], pronTargets: [],
      },
    });
    created++;
    if (created % 500 === 0) console.log(`... ${created} importiert`);
  }
  const total = await prisma.vocabularyEntry.count();
  console.log(`\nFertig! Neu: ${created}, übersprungen: ${skipped}. Vokabeln gesamt in DB: ${total}`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); }).finally(() => prisma.$disconnect());

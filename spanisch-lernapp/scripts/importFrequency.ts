/**
 * Massen-Import von Wortschatz aus einer Haeufigkeitsliste.
 *
 * Ziel: von 30 Kern-Vokabeln auf tausende bis muttersprachliche Breite skalieren,
 * ohne die Lernlogik zu aendern. Die frequencyTier wird aus der Rangposition
 * abgeleitet und steuert (ueber lib/vocabBands.ts) die Freischaltung je Sprachklasse.
 *
 * EINGABEFORMAT (eine Zeile pro Wort), Beispiel-Dateien frei verfuegbar
 * (z.B. hermitdave/FrequencyWords, "es_50k.txt"):
 *     de            (nur Wort)
 *   ODER  "wort<TAB>haeufigkeit"
 *
 * NUTZUNG:
 *   npx tsx scripts/importFrequency.ts pfad/zur/es_5000.txt
 *   # mit KI-Anreicherung (Beispiele/Erklaerung) falls ANTHROPIC_API_KEY gesetzt:
 *   ENRICH=1 npx tsx scripts/importFrequency.ts pfad/zur/es_5000.txt
 *
 * Der Import ist idempotent (vorhandene Lemmata werden uebersprungen).
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Rang -> frequencyTier (grobe Baender, passend zu lib/vocabBands.ts)
function rankToTier(rank: number): number {
  if (rank <= 150) return 1;
  if (rank <= 400) return 2;
  if (rank <= 800) return 3;
  if (rank <= 1500) return 4;
  if (rank <= 2500) return 5;
  if (rank <= 4000) return 6;
  if (rank <= 6000) return 8;
  if (rank <= 10000) return 12;
  if (rank <= 16000) return 20;
  return 40;
}

async function enrich(lemma: string): Promise<Partial<any> | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || process.env.ENRICH !== "1") return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
        max_tokens: 300,
        system:
          "Gib striktes JSON zu einem spanischen Wort zurueck: {pos, meaningDe, explanationEs, examples:[{es,de}], category}.",
        messages: [{ role: "user", content: lemma }],
      }),
    });
    const data = await res.json();
    const txt = data?.content?.[0]?.text ?? "{}";
    return JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1));
  } catch {
    return null;
  }
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Bitte Pfad zur Haeufigkeitsliste angeben.");
    process.exit(1);
  }
  const lines = readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
  let created = 0, skipped = 0, rank = 0;

  for (const line of lines) {
    rank++;
    const lemma = line.split(/\s|\t/)[0].trim().toLowerCase();
    if (!lemma || lemma.length < 2) continue;
    const exists = await prisma.vocabularyEntry.findFirst({ where: { lemma } });
    if (exists) { skipped++; continue; }

    const tier = rankToTier(rank);
    const e = await enrich(lemma);
    await prisma.vocabularyEntry.create({
      data: {
        lemma,
        pos: e?.pos ?? "?",
        meaningDe: e?.meaningDe ?? "(zu ergaenzen)",
        explanationEs: e?.explanationEs ?? "",
        examples: e?.examples ?? [],
        category: e?.category ?? "import",
        frequencyTier: tier,
        layer: tier <= 2 ? "kern" : tier <= 6 ? "thematisch" : "fortgeschritten",
        collocations: [], confusables: [], pronTargets: [],
      },
    });
    created++;
    if (created % 200 === 0) console.log(`... ${created} importiert`);
  }
  const total = await prisma.vocabularyEntry.count();
  console.log(`Fertig. Neu: ${created}, uebersprungen: ${skipped}, gesamt in DB: ${total}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

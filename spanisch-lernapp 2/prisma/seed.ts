import { PrismaClient } from "@prisma/client";
import { VOCABULARY } from "../src/data/vocabulary";
import { SCENARIOS } from "../src/data/scenarios";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Vokabeln ...");
  for (const v of VOCABULARY) {
    // Idempotent: pruefen ob Lemma existiert
    const existing = await prisma.vocabularyEntry.findFirst({ where: { lemma: v.lemma } });
    const data = {
      lemma: v.lemma,
      pos: v.pos,
      meaningDe: v.meaningDe,
      explanationEs: v.explanationEs,
      examples: v.examples,
      category: v.category,
      frequencyTier: v.frequencyTier,
      layer: v.layer,
      morphology: v.morphology ?? null,
      collocations: v.collocations ?? [],
      confusables: v.confusables ?? [],
      imageEmoji: v.imageEmoji ?? null,
      pronTargets: v.pronTargets ?? [],
    } as any; // JSON-Felder (examples etc.) fuer Prisma freigeben
    if (existing) await prisma.vocabularyEntry.update({ where: { id: existing.id }, data });
    else await prisma.vocabularyEntry.create({ data });
  }

  console.log("Seeding Szenarien ...");
  for (const s of SCENARIOS) {
    await prisma.scenario.upsert({
      where: { key: s.key },
      update: { title: s.title, difficulty: s.difficulty, steps: s.steps as any, targetVocab: s.targetVocab as any },
      create: { key: s.key, title: s.title, difficulty: s.difficulty, steps: s.steps as any, targetVocab: s.targetVocab as any },
    });
  }

  const count = await prisma.vocabularyEntry.count();
  console.log(`Fertig. ${count} Vokabeln, ${SCENARIOS.length} Szenarien.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

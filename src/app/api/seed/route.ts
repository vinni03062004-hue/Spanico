// Bequemes Seeding per HTTP (einmalig nach Deploy aufrufbar).
// Idempotent. In Produktion ggf. absichern oder nach Erstbefuellung entfernen.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { VOCABULARY } from "@/data/vocabulary";
import { SCENARIOS } from "@/data/scenarios";

export async function POST() {
  let created = 0;
  for (const v of VOCABULARY) {
    const existing = await prisma.vocabularyEntry.findFirst({ where: { lemma: v.lemma } });
    const data = {
      lemma: v.lemma, pos: v.pos, meaningDe: v.meaningDe, explanationEs: v.explanationEs,
      examples: v.examples, category: v.category, frequencyTier: v.frequencyTier, layer: v.layer,
      morphology: v.morphology ?? null, collocations: v.collocations ?? [], confusables: v.confusables ?? [],
      imageEmoji: v.imageEmoji ?? null, pronTargets: v.pronTargets ?? [],
    };
    if (existing) await prisma.vocabularyEntry.update({ where: { id: existing.id }, data });
    else { await prisma.vocabularyEntry.create({ data }); created++; }
  }
  for (const s of SCENARIOS) {
    await prisma.scenario.upsert({
      where: { key: s.key },
      update: { title: s.title, difficulty: s.difficulty, steps: s.steps, targetVocab: s.targetVocab },
      create: { key: s.key, title: s.title, difficulty: s.difficulty, steps: s.steps, targetVocab: s.targetVocab },
    });
  }
  const total = await prisma.vocabularyEntry.count();
  return NextResponse.json({ ok: true, neu: created, gesamt: total, szenarien: SCENARIOS.length });
}

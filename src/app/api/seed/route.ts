// Seeding in BLÖCKEN mit Fortschritt (schnell, ohne Timeout).
// Der Client ruft die Route wiederholt mit steigendem offset auf und zeigt %.
// Phase 1: Kern-Vokabeln einfügen. Phase 2: Bild-Emojis nachtragen (auch für
// bereits importierte Wörter). Szenarien werden bei offset 0 angelegt.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { VOCABULARY } from "@/data/vocabulary";
import { SCENARIOS } from "@/data/scenarios";
import { EMOJI_MAP } from "@/data/emojiMap";

const CHUNK = 100;
const EMOJI = Object.entries(EMOJI_MAP);
const TOTAL = VOCABULARY.length + EMOJI.length;

export async function POST(req: NextRequest) {
  const offset = Math.max(0, Number(new URL(req.url).searchParams.get("offset") || 0));

  // Szenarien einmalig
  if (offset === 0) {
    for (const s of SCENARIOS) {
      await prisma.scenario.upsert({
        where: { key: s.key },
        update: { title: s.title, difficulty: s.difficulty, steps: s.steps as any, targetVocab: s.targetVocab as any },
        create: { key: s.key, title: s.title, difficulty: s.difficulty, steps: s.steps as any, targetVocab: s.targetVocab as any },
      });
    }
  }

  let created = 0;
  if (offset < VOCABULARY.length) {
    // Phase 1: Kern-Vokabeln — neue anlegen UND vorhandene aktualisieren
    // (damit korrigierte Übersetzungen/Bilder auch bei bestehenden greifen).
    const slice = VOCABULARY.slice(offset, offset + CHUNK);
    for (const v of slice) {
      const data = {
        lemma: v.lemma, pos: v.pos, meaningDe: v.meaningDe, explanationEs: v.explanationEs,
        examples: v.examples as any, category: v.category, frequencyTier: v.frequencyTier, layer: v.layer,
        morphology: v.morphology ?? null, collocations: (v.collocations ?? []) as any, confusables: (v.confusables ?? []) as any,
        imageEmoji: v.imageEmoji ?? null, pronTargets: (v.pronTargets ?? []) as any,
      };
      const existing = await prisma.vocabularyEntry.findFirst({ where: { lemma: v.lemma }, select: { id: true } });
      if (existing) await prisma.vocabularyEntry.update({ where: { id: existing.id }, data });
      else { await prisma.vocabularyEntry.create({ data }); created++; }
    }
  } else {
    // Phase 2: Bilder nachtragen (auch für importierte/übersetzte Wörter)
    const start = offset - VOCABULARY.length;
    for (const [lemma, emoji] of EMOJI.slice(start, start + CHUNK)) {
      await prisma.vocabularyEntry.updateMany({ where: { lemma, imageEmoji: null }, data: { imageEmoji: emoji } });
    }
  }

  const next = offset + CHUNK;
  const done = next >= TOTAL;
  const gesamt = done ? await prisma.vocabularyEntry.count() : undefined;
  return NextResponse.json({
    ok: true, processed: Math.min(next, TOTAL), available: TOTAL,
    nextOffset: done ? null : next, done, neu: created, gesamt,
    phase: offset < VOCABULARY.length ? "Wörter" : "Bilder",
  });
}

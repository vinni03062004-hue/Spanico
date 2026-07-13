// One-Klick-Import der ~21.000 FreeDict-Wörter in die Neon-DB.
// In Blöcken, damit das Vercel-Zeitlimit pro Aufruf nicht überschritten wird:
// der Client ruft die Route wiederholt mit steigendem offset auf (Fortschritt).
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/apiUser";
import { fetchFreeDict, parseTEI, ParsedWord } from "@/lib/freedict";

export const maxDuration = 60; // Sekunden (Vercel Pro). Hobby ~10s -> kleinere BATCH.

// Warm-Instanz-Cache, damit die 4-MB-Datei nicht bei jedem Block neu geladen wird.
let CACHE: ParsedWord[] | null = null;

const BATCH = 400;

export async function POST(req: NextRequest) {
  const u = await requireUser();
  if ("error" in u) return u.error;

  const offset = Math.max(0, Number(new URL(req.url).searchParams.get("offset") || 0));

  if (!CACHE) {
    try {
      const xml = await fetchFreeDict();
      CACHE = parseTEI(xml);
    } catch (e: any) {
      return NextResponse.json({ error: "Download fehlgeschlagen: " + (e?.message || e) }, { status: 502 });
    }
  }
  const words = CACHE!;
  const slice = words.slice(offset, offset + BATCH);

  // Bereits vorhandene Lemmata in diesem Block überspringen.
  const existing = new Set(
    (await prisma.vocabularyEntry.findMany({
      where: { lemma: { in: slice.map((w) => w.lemma) } },
      select: { lemma: true },
    })).map((e) => e.lemma)
  );
  const toCreate = slice.filter((w) => !existing.has(w.lemma));

  if (toCreate.length) {
    await prisma.vocabularyEntry.createMany({
      data: toCreate.map((w) => ({
        lemma: w.lemma, pos: w.pos, meaningDe: w.meaningDe, explanationEs: "",
        examples: [], category: "freedict", frequencyTier: 4, layer: "thematisch",
        collocations: [], confusables: [], pronTargets: [],
      })),
      skipDuplicates: true,
    });
  }

  const nextOffset = offset + BATCH;
  const done = nextOffset >= words.length;
  const total = await prisma.vocabularyEntry.count();

  return NextResponse.json({
    ok: true, total, imported: toCreate.length,
    processed: Math.min(nextOffset, words.length), available: words.length,
    nextOffset: done ? null : nextOffset, done,
  });
}

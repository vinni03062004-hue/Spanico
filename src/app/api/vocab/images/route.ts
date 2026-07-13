// Liefert viele Vokabeln MIT Bildanker (imageEmoji) für den Bildmodus,
// zufällig gemischt -> hohe Variabilität, klar unterscheidbare Optionen.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/apiUser";
import { CURRICULUM } from "@/data/curriculum";

export async function GET(req: NextRequest) {
  const u = await requireUser();
  if ("error" in u) return u.error;
  const chapter = new URL(req.url).searchParams.get("chapter");
  const catFilter = chapter !== null ? CURRICULUM[Number(chapter)]?.categories : null;

  const all = await prisma.vocabularyEntry.findMany({
    where: { imageEmoji: { not: null }, ...(catFilter ? { category: { in: catFilter } } : {}) },
    select: { id: true, lemma: true, meaningDe: true, imageEmoji: true, category: true },
    take: 300,
  });
  // Nach Emoji eindeutig machen (kein doppeltes Symbol) und mischen.
  const seen = new Set<string>();
  const uniq = all.filter((c) => c.imageEmoji && !seen.has(c.imageEmoji) && seen.add(c.imageEmoji));
  for (let i = uniq.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [uniq[i], uniq[j]] = [uniq[j], uniq[i]];
  }
  return NextResponse.json({ cards: uniq.slice(0, 60) });
}

// Vokabel-Übersicht für den Admin: Kategorien mit Anzahl + Wörter je Kategorie.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/apiUser";

export async function GET(req: NextRequest) {
  const u = await requireUser();
  if ("error" in u) return u.error;
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();

  const total = await prisma.vocabularyEntry.count();
  const grouped = await prisma.vocabularyEntry.groupBy({
    by: ["category"], _count: { category: true }, orderBy: { _count: { category: "desc" } },
  });
  const categories = grouped.map((g) => ({ category: g.category, count: g._count.category }));

  // Wörter nur laden, wenn Kategorie oder Suche gewählt (sonst wäre es riesig).
  let words: any[] = [];
  if (category || q) {
    words = await prisma.vocabularyEntry.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(q ? { OR: [{ lemma: { contains: q, mode: "insensitive" } }, { meaningDe: { contains: q, mode: "insensitive" } }] } : {}),
      },
      select: { lemma: true, meaningDe: true, pos: true, category: true, frequencyTier: true, imageEmoji: true },
      orderBy: [{ frequencyTier: "asc" }, { lemma: "asc" }],
      take: 500,
    });
  }

  return NextResponse.json({ total, categories, words, limited: words.length >= 500 });
}

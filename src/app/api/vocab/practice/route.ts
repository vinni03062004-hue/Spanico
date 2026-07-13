// Übungswörter als thematische ROADMAP (Lehrplan): Kapitel nach Szenarien,
// von leicht nach schwer. Kapitel N bündelt die Kategorien aus CURRICULUM[N].
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/apiUser";
import { CURRICULUM } from "@/data/curriculum";

export async function GET(req: NextRequest) {
  const u = await requireUser();
  if ("error" in u) return u.error;
  const url = new URL(req.url);
  const chapterParam = url.searchParams.get("chapter");

  // Roadmap-Übersicht: Kapitel mit Wortanzahl.
  if (chapterParam === null) {
    const grouped = await prisma.vocabularyEntry.groupBy({ by: ["category"], _count: { category: true } });
    const counts: Record<string, number> = {};
    for (const g of grouped) counts[g.category] = g._count.category;
    const chapters = CURRICULUM.map((c) => ({
      key: c.key, title: c.title, desc: c.desc,
      count: c.categories.reduce((n, cat) => n + (counts[cat] || 0), 0),
    }));
    return NextResponse.json({ chapters });
  }

  const n = Math.max(0, Math.min(CURRICULUM.length - 1, Number(chapterParam) || 0));
  const cats = CURRICULUM[n].categories;
  const pool = await prisma.vocabularyEntry.findMany({
    where: { category: { in: cats } },
    select: { id: true, lemma: true, meaningDe: true, category: true, examples: true },
    orderBy: [{ frequencyTier: "asc" }, { lemma: "asc" }],
    take: 120,
  });
  // mischen
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const items = pool.slice(0, 30).map((v) => {
    const ex = Array.isArray(v.examples) && (v.examples as any[])[0]?.es ? (v.examples as any[])[0].es : null;
    return { id: v.id, lemma: v.lemma, meaningDe: v.meaningDe, category: v.category, example: ex };
  });
  return NextResponse.json({ chapter: n, title: CURRICULUM[n].title, items });
}

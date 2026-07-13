// Liefert die naechsten faelligen + neuen Vokabeln fuer den Nutzer (Spacing-gesteuert).
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/apiUser";
import { CURRICULUM } from "@/data/curriculum";

export async function GET(req: NextRequest) {
  const u = await requireUser();
  if ("error" in u) return u.error;
  const sp = new URL(req.url).searchParams;
  const limit = Number(sp.get("limit") || 12);
  // Optionaler Kapitel-Filter (Roadmap): nur Wörter der Kapitel-Kategorien.
  const chapter = sp.get("chapter");
  const catFilter = chapter !== null ? CURRICULUM[Number(chapter)]?.categories : null;

  // Faellige Wiederholungen
  const due = await prisma.reviewSchedule.findMany({
    where: { userId: u.userId, dueAt: { lte: new Date() } },
    include: { vocab: true },
    orderBy: { dueAt: "asc" },
    take: limit,
  });

  // Neue Vokabeln aus dem GESAMTEN Bestand (keine Niveau-Obergrenze mehr),
  // nur nach Haeufigkeit sortiert -> haeufigste zuerst, dann immer seltenere.
  const seenIds = (
    await prisma.reviewSchedule.findMany({ where: { userId: u.userId }, select: { vocabId: true } })
  ).map((r) => r.vocabId);
  const fresh = await prisma.vocabularyEntry.findMany({
    where: {
      id: { notIn: seenIds.length ? seenIds : ["_"] },
      ...(catFilter ? { category: { in: catFilter } } : {}),
    },
    orderBy: [{ frequencyTier: "asc" }, { createdAt: "asc" }],
    take: Math.max(0, limit - due.length),
  });

  const cards = [
    ...due.map((d) => ({ ...d.vocab, _review: true })),
    ...fresh.map((f) => ({ ...f, _review: false })),
  ];
  return NextResponse.json({ cards, dueCount: due.length });
}

// Liefert die naechsten faelligen + neuen Vokabeln fuer den Nutzer (Spacing-gesteuert).
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/apiUser";
import { maxTierForBand } from "@/lib/vocabBands";

export async function GET(req: NextRequest) {
  const u = await requireUser();
  if ("error" in u) return u.error;
  const limit = Number(new URL(req.url).searchParams.get("limit") || 12);

  // Freischaltung nach Sprachklasse: nur Haeufigkeitsstufen bis zum Niveau
  // werden neu eingefuehrt (skaliert bis muttersprachlich bei "Highly reliable").
  const profile = await prisma.languageProfile.findUnique({ where: { userId: u.userId } });
  const maxTier = maxTierForBand(profile?.overallBand || "Novice unstable");

  // Faellige Wiederholungen
  const due = await prisma.reviewSchedule.findMany({
    where: { userId: u.userId, dueAt: { lte: new Date() } },
    include: { vocab: true },
    orderBy: { dueAt: "asc" },
    take: limit,
  });

  // Neue Vokabeln (noch kein Review-Eintrag), nach Haeufigkeit
  const seenIds = (
    await prisma.reviewSchedule.findMany({ where: { userId: u.userId }, select: { vocabId: true } })
  ).map((r) => r.vocabId);
  const fresh = await prisma.vocabularyEntry.findMany({
    where: { id: { notIn: seenIds.length ? seenIds : ["_"] }, frequencyTier: { lte: maxTier } },
    orderBy: [{ frequencyTier: "asc" }, { createdAt: "asc" }],
    take: Math.max(0, limit - due.length),
  });

  const cards = [
    ...due.map((d) => ({ ...d.vocab, _review: true })),
    ...fresh.map((f) => ({ ...f, _review: false })),
  ];
  return NextResponse.json({ cards, dueCount: due.length });
}

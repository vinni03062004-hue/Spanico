import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/apiUser";
import { DIMENSIONS, DIMENSION_LABELS, computeBand, Dimension } from "@/lib/scoring";

export async function GET() {
  const u = await requireUser();
  if ("error" in u) return u.error;

  const scores = await prisma.skillScore.findMany({ where: { userId: u.userId } });
  const map: Record<string, { value: number; stability: number }> = {};
  for (const d of DIMENSIONS) map[d] = { value: 0, stability: 0 };
  for (const s of scores) map[s.dimension] = { value: s.value, stability: s.stability };
  const band = computeBand(map as Record<Dimension, any>);

  // Reporting: staerkste/schwaechste Felder + haeufigste Fehlerarten
  const dims = DIMENSIONS.map((d) => ({ key: d, label: DIMENSION_LABELS[d], ...map[d] }));
  const sorted = [...dims].sort((a, b) => b.value - a.value);
  const strongest = sorted.slice(0, 3);
  const weakest = [...dims].sort((a, b) => a.value - b.value).slice(0, 3);

  const errors = await prisma.errorEvent.groupBy({
    by: ["category"], where: { userId: u.userId }, _count: { category: true },
  });
  const topErrors = errors.map((e) => ({ category: e.category, count: e._count.category }))
    .sort((a, b) => b.count - a.count).slice(0, 5);

  const masteredStable = await prisma.masteryRecord.count({ where: { userId: u.userId, stableSince: { not: null } } });
  const dueNow = await prisma.reviewSchedule.count({ where: { userId: u.userId, dueAt: { lte: new Date() } } });

  // Empfehlung fuer die naechste Woche (heuristisch aus schwaechsten Feldern)
  const rec: string[] = [];
  if (weakest.find((w) => w.key === "listening" && w.value < 40)) rec.push("Mehr Hörtraining (Hören-Modus).");
  if (weakest.find((w) => w.key === "pronunciation" && w.value < 40)) rec.push("Aussprache & Shadowing üben.");
  if (weakest.find((w) => (w.key === "transfer" || w.key === "fluency") && w.value < 40)) rec.push("Mehr freies Sprechen im Jarvis-Modus.");
  if (dueNow > 0) rec.push(`${dueNow} fällige Wiederholungen abarbeiten.`);
  if (!rec.length) rec.push("Wortschatz ausbauen und Szenarien vertiefen.");

  return NextResponse.json({ band, dims, strongest, weakest, topErrors, masteredStable, dueNow, recommendations: rec });
}

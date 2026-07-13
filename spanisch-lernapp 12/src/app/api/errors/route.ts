// Fehlergedaechtnis: Liste + gezielte Mini-Drills aus haeufigsten Fehlern.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/apiUser";
import { ERROR_CATEGORIES } from "@/lib/errors";

export async function GET() {
  const u = await requireUser();
  if ("error" in u) return u.error;

  const recent = await prisma.errorEvent.findMany({
    where: { userId: u.userId, resolved: false },
    include: { vocab: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const grouped = await prisma.errorEvent.groupBy({
    by: ["category"], where: { userId: u.userId, resolved: false }, _count: { category: true },
  });
  const categories = grouped
    .map((g) => ({ key: g.category, label: (ERROR_CATEGORIES as any)[g.category] ?? g.category, count: g._count.category }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    recent: recent.map((e) => ({
      id: e.id, category: e.category, label: (ERROR_CATEGORIES as any)[e.category] ?? e.category,
      detail: e.detail, mode: e.mode, lemma: e.vocab?.lemma ?? null, meaningDe: e.vocab?.meaningDe ?? null,
      createdAt: e.createdAt,
    })),
    categories,
  });
}

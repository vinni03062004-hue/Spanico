// Admin-/Debug-Daten: Modellaufrufe, Speech-Konfidenzen, Fehlerraten je Modus.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/apiUser";

export async function GET() {
  const u = await requireUser();
  if ("error" in u) return u.error;

  const [traces, speech, attemptsByMode, vocabCount] = await Promise.all([
    prisma.modelTrace.findMany({ where: { userId: u.userId }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.speechAttempt.findMany({ where: { userId: u.userId }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.exerciseAttempt.groupBy({ by: ["mode"], where: { userId: u.userId }, _count: { _all: true }, _avg: { score: true } }),
    prisma.vocabularyEntry.count(),
  ]);

  const errRates = await prisma.exerciseAttempt.groupBy({
    by: ["mode"], where: { userId: u.userId, correct: false }, _count: { _all: true },
  });

  return NextResponse.json({
    vocabCount,
    traces: traces.map((t) => ({ kind: t.kind, provider: t.provider, latencyMs: t.latencyMs, ok: t.ok, at: t.createdAt })),
    speech: speech.map((s) => ({ mode: s.mode, band: s.band, conf: s.sttConfidence, uncertain: s.uncertain, target: s.targetText, heard: s.recognizedText })),
    modes: attemptsByMode.map((m) => ({ mode: m.mode, count: m._count._all, avgScore: Math.round(m._avg.score || 0), errors: errRates.find((e) => e.mode === m.mode)?._count._all || 0 })),
  });
}

// Zentraler Lern-Endpunkt: verarbeitet einen Uebungsversuch und aktualisiert
// Spacing, Mastery, Skill-Scores und Fehlergedaechtnis in EINER Transaktion.
// Jedes Modul zahlt hierueber in das gemeinsame Kompetenz-/Fehlergedaechtnis ein.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/apiUser";
import { nextReview } from "@/lib/srs";
import { applyEvidence, masteryLevel, isStable, emptyMastery, Evidence } from "@/lib/mastery";
import { updateScore, Dimension } from "@/lib/scoring";
import { classifyTextError } from "@/lib/errors";

const schema = z.object({
  mode: z.string(),
  exerciseType: z.string(),
  vocabId: z.string().optional(),
  prompt: z.string(),
  expected: z.string().optional(),
  answer: z.string(),
  correct: z.boolean(),
  confidence: z.number().min(0).max(1).default(0.7),
  responseMs: z.number().int().min(0).default(0),
  evidence: z.string().optional(), // Mastery-Nachweis-Typ
  dimension: z.string().optional(), // betroffene Skill-Dimension
  contextNovel: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const u = await requireUser();
  if ("error" in u) return u.error;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungueltig" }, { status: 400 });
  const d = parsed.data;

  const errorType =
    !d.correct && d.expected ? classifyTextError(d.expected, d.answer) : undefined;

  const result = await prisma.$transaction(async (tx) => {
    // 1) Versuch protokollieren
    await tx.exerciseAttempt.create({
      data: {
        userId: u.userId, mode: d.mode, exerciseType: d.exerciseType, vocabId: d.vocabId ?? null,
        prompt: d.prompt, expected: d.expected ?? null, answer: d.answer, correct: d.correct,
        confidence: d.confidence, responseMs: d.responseMs, errorType: errorType ?? null,
        score: d.correct ? Math.round(60 + 40 * d.confidence) : 0,
      },
    });

    // 2) Fehlergedaechtnis
    if (!d.correct) {
      await tx.errorEvent.create({
        data: { userId: u.userId, vocabId: d.vocabId ?? null, category: errorType ?? "unsicherheit", mode: d.mode, detail: d.answer },
      });
    }

    // 3) Spacing + Mastery (nur bei vokabelgebundenen Uebungen)
    let masteryOut: { level: number; stable: boolean } | null = null;
    if (d.vocabId) {
      const rs = await tx.reviewSchedule.findUnique({ where: { userId_vocabId: { userId: u.userId, vocabId: d.vocabId } } });
      const base = rs ?? { easeFactor: 2.5, intervalDays: 0, repetitions: 0, lapses: 0 };
      const nr = nextReview(base as any, { correct: d.correct, confidence: d.confidence, responseMs: d.responseMs });
      await tx.reviewSchedule.upsert({
        where: { userId_vocabId: { userId: u.userId, vocabId: d.vocabId } },
        update: { easeFactor: nr.easeFactor, intervalDays: nr.intervalDays, repetitions: nr.repetitions, lapses: nr.lapses, dueAt: nr.dueAt },
        create: { userId: u.userId, vocabId: d.vocabId, easeFactor: nr.easeFactor, intervalDays: nr.intervalDays, repetitions: nr.repetitions, lapses: nr.lapses, dueAt: nr.dueAt },
      });

      const mr = await tx.masteryRecord.findUnique({ where: { userId_vocabId: { userId: u.userId, vocabId: d.vocabId } } });
      let flags = mr ? {
        recognized: mr.recognized, understood: mr.understood, reproduced: mr.reproduced,
        usedInSentence: mr.usedInSentence, usedInDialog: mr.usedInDialog,
        delayedRecall: mr.delayedRecall, transferred: mr.transferred,
      } : emptyMastery();
      const ev = (d.evidence as Evidence) || "recognized";
      flags = applyEvidence(flags, ev, d.correct);
      // Verzoegerter Abruf: als delayedRecall zaehlen, wenn Wiederholung nach >=1 Tag korrekt
      if (d.correct && rs && rs.intervalDays >= 1) flags = applyEvidence(flags, "delayedRecall", true);
      const level = masteryLevel(flags);
      const stable = isStable(flags);
      await tx.masteryRecord.upsert({
        where: { userId_vocabId: { userId: u.userId, vocabId: d.vocabId } },
        update: { ...flags, masteryLevel: level, stableSince: stable ? (mr?.stableSince ?? new Date()) : null },
        create: { userId: u.userId, vocabId: d.vocabId, ...flags, masteryLevel: level, stableSince: stable ? new Date() : null },
      });
      masteryOut = { level, stable };
    }

    // 4) Skill-Score kritisch aktualisieren
    const dim = (d.dimension as Dimension) || "vocabBreadth";
    const ss = await tx.skillScore.findUnique({ where: { userId_dimension: { userId: u.userId, dimension: dim } } });
    const updated = updateScore(
      { value: ss?.value ?? 0, stability: ss?.stability ?? 0 },
      { correct: d.correct, confidence: d.confidence, contextNovel: d.contextNovel }
    );
    await tx.skillScore.upsert({
      where: { userId_dimension: { userId: u.userId, dimension: dim } },
      update: updated,
      create: { userId: u.userId, dimension: dim, ...updated },
    });

    return { errorType, mastery: masteryOut, dimension: dim, score: updated };
  });

  return NextResponse.json({ ok: true, ...result });
}

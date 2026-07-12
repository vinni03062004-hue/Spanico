// Onboarding/Einstufung: speichert mehrdimensionales Startprofil je Teilkompetenz
// und initialisiert die Skill-Scores entsprechend (transparent, nicht geschoent).
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/apiUser";
import { computeBand, Dimension } from "@/lib/scoring";

const schema = z.object({
  goal: z.string(),
  nativeLanguage: z.string().default("de"),
  weeklyMinutes: z.number().int().default(120),
  intensity: z.string().default("mittel"),
  micConsent: z.boolean().default(false),
  dataConsent: z.boolean().default(false),
  // Einstufungswerte 0-100
  vocabBreadth: z.number().min(0).max(100),
  listening: z.number().min(0).max(100),
  grammar: z.number().min(0).max(100),
  pronunciation: z.number().min(0).max(100),
  spontaneity: z.number().min(0).max(100),
  freeProduction: z.number().min(0).max(100),
});

export async function POST(req: NextRequest) {
  const u = await requireUser();
  if ("error" in u) return u.error;
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Ungueltig", detail: p.error.flatten() }, { status: 400 });
  const d = p.data;

  // Skill-Scores aus Einstufung ableiten (mit niedriger Startstabilitaet!)
  const seed: Record<string, { value: number; stability: number }> = {
    vocabBreadth: { value: d.vocabBreadth, stability: 0.1 },
    vocabDepth: { value: Math.round(d.vocabBreadth * 0.6), stability: 0.1 },
    listening: { value: d.listening, stability: 0.1 },
    grammar: { value: d.grammar, stability: 0.1 },
    pronunciation: { value: d.pronunciation, stability: 0.1 },
    reactivity: { value: d.spontaneity, stability: 0.1 },
    fluency: { value: Math.round((d.spontaneity + d.freeProduction) / 2), stability: 0.1 },
    transfer: { value: d.freeProduction, stability: 0.1 },
    dialogStability: { value: Math.round(d.spontaneity * 0.7), stability: 0.1 },
    imageSituation: { value: Math.round((d.vocabBreadth + d.listening) / 2), stability: 0.1 },
  };
  const band = computeBand(seed as Record<Dimension, any>);

  await prisma.$transaction(async (tx) => {
    await tx.languageProfile.upsert({
      where: { userId: u.userId },
      update: { goal: d.goal, vocabBreadth: d.vocabBreadth, listening: d.listening, grammar: d.grammar, pronunciation: d.pronunciation, spontaneity: d.spontaneity, freeProduction: d.freeProduction, overallBand: band, version: { increment: 1 } },
      create: { userId: u.userId, goal: d.goal, vocabBreadth: d.vocabBreadth, listening: d.listening, grammar: d.grammar, pronunciation: d.pronunciation, spontaneity: d.spontaneity, freeProduction: d.freeProduction, overallBand: band },
    });
    await tx.userSettings.upsert({
      where: { userId: u.userId },
      update: { nativeLanguage: d.nativeLanguage, weeklyMinutes: d.weeklyMinutes, intensity: d.intensity, micConsent: d.micConsent, dataConsent: d.dataConsent },
      create: { userId: u.userId, nativeLanguage: d.nativeLanguage, weeklyMinutes: d.weeklyMinutes, intensity: d.intensity, micConsent: d.micConsent, dataConsent: d.dataConsent },
    });
    for (const [dim, v] of Object.entries(seed)) {
      await tx.skillScore.upsert({
        where: { userId_dimension: { userId: u.userId, dimension: dim } },
        update: v, create: { userId: u.userId, dimension: dim, ...v },
      });
    }
    await tx.assessment.create({ data: { userId: u.userId, kind: "onboarding", result: d, band } });
  });

  return NextResponse.json({ ok: true, band });
}

// Aussprachebewertung: vergleicht Zieltext mit erkanntem Text, liefert gestuftes
// Feedback + Unsicherheitsmarkierung und speichert den SpeechAttempt.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/apiUser";
import { pronunciationSimilarity, pronunciationBand, updateScore } from "@/lib/scoring";

const schema = z.object({
  mode: z.enum(["aussprache", "shadowing", "jarvis"]).default("aussprache"),
  targetText: z.string(),
  recognizedText: z.string(),
  sttConfidence: z.number().min(0).max(1).default(0.6),
});

export async function POST(req: NextRequest) {
  const u = await requireUser();
  if ("error" in u) return u.error;
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Ungueltig" }, { status: 400 });
  const { mode, targetText, recognizedText, sttConfidence } = p.data;

  const sim = pronunciationSimilarity(targetText, recognizedText);
  const { band, uncertain } = pronunciationBand(sim, sttConfidence);

  const analysis = {
    similarity: Math.round(sim * 100),
    wortverstaendlichkeit: Math.round(sim * 100),
    lauttreue: Math.round(sim * 100),
    hinweis: uncertain
      ? "Erkennung unsicher — bitte in ruhiger Umgebung wiederholen."
      : sim >= 0.75 ? "Gut verständlich." : "Auf saubere Vokale und Betonung achten.",
  };

  await prisma.speechAttempt.create({
    data: { userId: u.userId, mode, targetText, recognizedText, sttConfidence, analysis: analysis as any, band, uncertain },
  });

  // Aussprache-Score kritisch aktualisieren (unsichere Ergebnisse gedaempft)
  const conf = uncertain ? 0.3 : sttConfidence;
  const ss = await prisma.skillScore.findUnique({ where: { userId_dimension: { userId: u.userId, dimension: "pronunciation" } } });
  const updated = updateScore({ value: ss?.value ?? 0, stability: ss?.stability ?? 0 }, { correct: sim >= 0.7, confidence: conf, contextNovel: false });
  await prisma.skillScore.upsert({
    where: { userId_dimension: { userId: u.userId, dimension: "pronunciation" } },
    update: updated, create: { userId: u.userId, dimension: "pronunciation", ...updated },
  });

  return NextResponse.json({ similarity: analysis.similarity, band, uncertain, analysis });
}

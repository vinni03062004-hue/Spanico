// Jarvis-Dialog-Endpunkt. Nutzt serverseitigen Coach (Anthropic/OpenAI/Regel),
// pflegt den Conversation Memory Layer und protokolliert Turns + ModelTrace.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/apiUser";
import { runCoach } from "@/lib/ai/coach";
import { computeBand, Dimension } from "@/lib/scoring";

const schema = z.object({
  sessionId: z.string().optional(),
  scenarioKey: z.string().optional(),
  stepIndex: z.number().int().default(0),
  userSaid: z.string().default(""),
});

export async function POST(req: NextRequest) {
  const u = await requireUser();
  if ("error" in u) return u.error;
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Ungueltig" }, { status: 400 });
  const { sessionId, scenarioKey, stepIndex, userSaid } = p.data;

  // Session laden/erzeugen
  let session = sessionId
    ? await prisma.conversationSession.findFirst({ where: { id: sessionId, userId: u.userId } })
    : null;
  if (!session) {
    session = await prisma.conversationSession.create({ data: { userId: u.userId, scenarioKey: scenarioKey ?? null, memory: {} } });
  }

  const scenario = scenarioKey ? await prisma.scenario.findUnique({ where: { key: scenarioKey } }) : null;
  const steps = (scenario?.steps as any[]) || [];
  const step = steps[stepIndex] || { prompt_de: "Freies Gespräch", targetsEs: [], coachLine: "Cuéntame, ¿de qué quieres hablar?" };

  // aktuelles Band fuer Schwierigkeitsanpassung
  const scores = await prisma.skillScore.findMany({ where: { userId: u.userId } });
  const map: Record<string, any> = {};
  for (const s of scores) map[s.dimension] = { value: s.value, stability: s.stability };
  const band = computeBand(map as Record<Dimension, any>);

  const memory = (session.memory as any) || {};

  const coach = await runCoach({
    scenarioTitle: scenario?.title || "Freies Gespräch",
    stepPromptDe: step.prompt_de,
    targetsEs: step.targetsEs || [],
    userSaid,
    memory,
    level: band,
  });

  // Memory aktualisieren (Conversation Memory Layer)
  const newMemory = {
    ...memory,
    zielwoerter: step.targetsEs || [],
    letzteFehler: coach.correction ? [...(memory.letzteFehler || []).slice(-4), coach.correction] : memory.letzteFehler || [],
    korrekturen: coach.goodExample ? [...(memory.korrekturen || []).slice(-4), coach.goodExample] : memory.korrekturen || [],
  };

  const t0 = Date.now();
  // Turns speichern
  if (userSaid) await prisma.turn.create({ data: { sessionId: session.id, role: "user", text: userSaid } });
  await prisma.turn.create({ data: { sessionId: session.id, role: "coach", text: coach.reply, feedback: coach as any } });
  await prisma.conversationSession.update({ where: { id: session.id }, data: { memory: newMemory as any } });
  await prisma.modelTrace.create({ data: { userId: u.userId, kind: "conversation", provider: coach.provider, latencyMs: Date.now() - t0, ok: true } });

  const advance = coach.matchedTargets.length > 0 || !step.targetsEs?.length;
  const nextStep = advance ? stepIndex + 1 : stepIndex;
  const done = nextStep >= steps.length && steps.length > 0;

  return NextResponse.json({
    sessionId: session.id,
    reply: coach.reply,
    correction: coach.correction ?? null,
    ruleHint: coach.ruleHint ?? null,
    goodExample: coach.goodExample ?? null,
    matched: coach.matchedTargets,
    provider: coach.provider,
    nextStepIndex: nextStep,
    stepPromptDe: (steps[nextStep]?.prompt_de) ?? (done ? "Szenario abgeschlossen." : step.prompt_de),
    hint: steps[nextStep]?.hint ?? null,
    done,
  });
}

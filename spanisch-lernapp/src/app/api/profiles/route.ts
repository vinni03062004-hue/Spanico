// Profile: auflisten und neu anlegen (ohne Login/Passwort).
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { DIMENSIONS } from "@/lib/scoring";

export async function GET() {
  const profiles = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, avatar: true, languageProfile: { select: { overallBand: true } } },
  });
  return NextResponse.json({
    profiles: profiles.map((p) => ({ id: p.id, name: p.name, avatar: p.avatar, band: p.languageProfile?.overallBand ?? null })),
  });
}

const createSchema = z.object({
  name: z.string().min(1).max(30),
  avatar: z.any().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Name fehlt" }, { status: 400 });
  const { name, avatar } = parsed.data;

  const user = await prisma.user.create({
    data: {
      name,
      avatar: (avatar ?? null) as any,
      settings: { create: {} },
      skillScores: { create: DIMENSIONS.map((d) => ({ dimension: d, value: 0, stability: 0 })) },
    },
  });
  // Direkt als aktives Profil setzen -> danach Onboarding.
  await createSession(user.id, user.role);
  return NextResponse.json({ ok: true, id: user.id, needsOnboarding: true });
}

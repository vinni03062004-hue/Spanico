// Ein Profil auswählen -> Session-Cookie auf dieses Profil setzen.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

const schema = z.object({ id: z.string() });

export async function POST(req: NextRequest) {
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Ungueltig" }, { status: 400 });
  const user = await prisma.user.findUnique({
    where: { id: p.data.id },
    select: { id: true, role: true, languageProfile: { select: { id: true } } },
  });
  if (!user) return NextResponse.json({ error: "Profil nicht gefunden" }, { status: 404 });
  await createSession(user.id, user.role);
  return NextResponse.json({ ok: true, needsOnboarding: !user.languageProfile });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword, createSession } from "@/lib/auth";
import { DIMENSIONS } from "@/lib/scoring";

const schema = z.object({
  action: z.enum(["register", "login"]),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungueltige Eingabe" }, { status: 400 });
  const { action, email, password } = parsed.data;

  if (action === "register") {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "E-Mail bereits registriert" }, { status: 409 });
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        settings: { create: {} },
        skillScores: { create: DIMENSIONS.map((d) => ({ dimension: d, value: 0, stability: 0 })) },
      },
    });
    await createSession(user.id, user.role);
    return NextResponse.json({ ok: true, needsOnboarding: true });
  }

  // login
  const user = await prisma.user.findUnique({ where: { email }, include: { languageProfile: true } });
  if (!user || !(await verifyPassword(password, user.passwordHash)))
    return NextResponse.json({ error: "Falsche Zugangsdaten" }, { status: 401 });
  await createSession(user.id, user.role);
  return NextResponse.json({ ok: true, needsOnboarding: !user.languageProfile });
}

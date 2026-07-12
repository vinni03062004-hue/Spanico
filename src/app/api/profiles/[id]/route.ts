// Profil bearbeiten (Name/Avatar) oder löschen (inkl. Speicherstand).
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim().slice(0, 30);
  if (body.avatar) data.avatar = body.avatar;
  if (!Object.keys(data).length) return NextResponse.json({ error: "Nichts zu ändern" }, { status: 400 });
  const updated = await prisma.user.update({ where: { id: params.id }, data, select: { id: true, name: true, avatar: true } });
  return NextResponse.json({ ok: true, profile: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

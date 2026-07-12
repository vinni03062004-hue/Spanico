// Helfer: aktuellen Nutzer aus der Session holen oder 401 zurueckgeben.
import { NextResponse } from "next/server";
import { getSession } from "./auth";

export async function requireUser() {
  const s = await getSession();
  if (!s) return { error: NextResponse.json({ error: "nicht angemeldet" }, { status: 401 }) } as const;
  return { userId: s.userId, role: s.role } as const;
}

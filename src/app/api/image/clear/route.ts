// Bild-Cache leeren, damit Bilder mit dem verbesserten Prompt neu erzeugt werden.
// Optional nur ein Wort: POST ?word=maíz
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/apiUser";

export async function POST(req: NextRequest) {
  const u = await requireUser();
  if ("error" in u) return u.error;
  const word = (new URL(req.url).searchParams.get("word") || "").trim().toLowerCase();
  try {
    const r = word
      ? await prisma.imageCache.deleteMany({ where: { key: word } })
      : await prisma.imageCache.deleteMany({});
    return NextResponse.json({ ok: true, geloescht: r.count });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Fehler" }, { status: 500 });
  }
}

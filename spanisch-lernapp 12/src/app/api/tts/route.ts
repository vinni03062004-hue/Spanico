// TTS-Endpunkt mit DAUERHAFTEM Cache in der Datenbank.
// Jeder Satz wird nur EINMAL bei Google synthetisiert (verbraucht einmal Zeichen)
// und danach aus der DB gestreamt -> 0 Zeichenverbrauch bei jeder Wiederholung.
// Gibt Audio (audio/mpeg) zurueck ODER 204 => Client nutzt Browser-TTS.
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { synthesize } from "@/lib/speech/tts";
import { prisma } from "@/lib/db";

// Kleiner Prozess-Cache als schnellste Ebene (spart auch DB-Zugriffe).
const mem = new Map<string, { audio: Buffer; ct: string }>();
const MEM_MAX = 300;

export async function POST(req: NextRequest) {
  const { text, voice, provider } = await req.json().catch(() => ({}));
  if (!text || typeof text !== "string") return new NextResponse(null, { status: 400 });

  const key = createHash("sha1").update(`${provider || "auto"}::${voice || "default"}::${text}`).digest("hex");

  // 1) Prozess-Cache
  const hit = mem.get(key);
  if (hit) return new NextResponse(hit.audio, { headers: { "content-type": hit.ct, "x-cache": "mem" } });

  // 2) Dauerhafter DB-Cache
  try {
    const row = await prisma.audioCache.findUnique({ where: { key } });
    if (row?.data) {
      const buf = Buffer.from(row.data as any);
      putMem(key, buf, row.contentType);
      return new NextResponse(buf, { headers: { "content-type": row.contentType, "x-cache": "db" } });
    }
  } catch { /* Tabelle evtl. noch nicht da -> weiter synthetisieren */ }

  // 3) Einmal synthetisieren + dauerhaft speichern
  const res = await synthesize({ text, voice, provider });
  if (!res.audio) {
    return new NextResponse(null, { status: 204, headers: { "x-tts": "browser" } });
  }
  putMem(key, res.audio, res.contentType);
  try {
    await prisma.audioCache.create({
      data: { key, contentType: res.contentType, data: res.audio, chars: text.length },
    });
  } catch { /* Duplikat/Tabelle fehlt -> ignorieren */ }

  return new NextResponse(res.audio, { headers: { "content-type": res.contentType, "x-cache": "miss", "x-provider": res.provider } });
}

function putMem(key: string, audio: Buffer, ct: string) {
  if (mem.size >= MEM_MAX) mem.delete(mem.keys().next().value as string);
  mem.set(key, { audio, ct });
}

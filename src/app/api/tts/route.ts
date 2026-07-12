// TTS-Endpunkt mit In-Memory-Cache pro (text+voice).
// Anti-Kontingent: wiederholte Phrasen verbrauchen KEIN neues Provider-Kontingent.
// Gibt Audio (audio/mpeg) zurueck ODER 204 => Client nutzt Browser-TTS.
import { NextRequest, NextResponse } from "next/server";
import { synthesize } from "@/lib/speech/tts";

// Einfacher Prozess-Cache. Fuer dauerhaftes Caching ueber Deploys hinweg
// koennte man hier Vercel Blob / S3 / DB nutzen (in README beschrieben).
const cache = new Map<string, { audio: Buffer; ct: string }>();
const MAX = 500;

export async function POST(req: NextRequest) {
  const { text, voice, provider } = await req.json().catch(() => ({}));
  if (!text || typeof text !== "string") return new NextResponse(null, { status: 400 });

  const key = `${provider || "auto"}::${voice || "default"}::${text}`;
  const hit = cache.get(key);
  if (hit) return new NextResponse(hit.audio, { headers: { "content-type": hit.ct, "x-cache": "hit" } });

  const res = await synthesize({ text, voice, provider });
  if (!res.audio) {
    // Kein Provider konfiguriert/verfuegbar -> Client faellt auf Browser-TTS zurueck.
    return new NextResponse(null, { status: 204, headers: { "x-tts": "browser" } });
  }
  if (cache.size >= MAX) cache.delete(cache.keys().next().value as string);
  cache.set(key, { audio: res.audio, ct: res.contentType });
  return new NextResponse(res.audio, { headers: { "content-type": res.contentType, "x-cache": "miss", "x-provider": res.provider } });
}

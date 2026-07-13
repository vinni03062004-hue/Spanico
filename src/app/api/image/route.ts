// Bedarfsgesteuerte KI-Bildgenerierung mit dauerhaftem Cache.
// GET /api/image?word=casa&meaning=Haus  -> liefert ein PNG (einmal erzeugt,
// danach aus der DB). Das Bildmodell wird automatisch aus den verfügbaren
// Modellen des Keys ermittelt (Namen ändern sich bei Google laufend).
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/apiUser";

export const maxDuration = 60;

// Einmal ermitteltes, funktionierendes Bildmodell (pro Warm-Instanz gecacht).
let RESOLVED_MODEL: string | null = null;

async function listImageModels(key: string): Promise<string[]> {
  try {
    const lm = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=200`).then((r) => r.json());
    const names = (lm?.models || [])
      .filter((m: any) => (m.name || "").toLowerCase().includes("image") && (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m: any) => (m.name || "").replace("models/", ""));
    // günstige "flash"-Modelle bevorzugen, teure "pro" ans Ende
    names.sort((a: string, b: string) => (a.includes("pro") ? 1 : 0) - (b.includes("pro") ? 1 : 0));
    return names;
  } catch { return []; }
}

async function generate(model: string, key: string, prompt: string): Promise<{ data: string; ct: string } | null> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseModalities: ["TEXT", "IMAGE"] } }),
  });
  if (!res.ok) { console.error("[image]", model, res.status, (await res.text().catch(() => "")).slice(0, 160)); return null; }
  const data = await res.json();
  const part = (data?.candidates?.[0]?.content?.parts || []).find((p: any) => p.inlineData?.data);
  return part ? { data: part.inlineData.data, ct: part.inlineData.mimeType || "image/png" } : null;
}

export async function GET(req: NextRequest) {
  const u = await requireUser();
  if ("error" in u) return u.error;
  const url = new URL(req.url);
  const word = (url.searchParams.get("word") || "").trim().toLowerCase();
  const meaning = (url.searchParams.get("meaning") || "").trim();
  if (!word) return new NextResponse(null, { status: 400 });

  // 1) Cache
  try {
    const row = await prisma.imageCache.findUnique({ where: { key: word } });
    if (row?.data) return new NextResponse(Buffer.from(row.data as any), { headers: { "content-type": row.contentType, "x-cache": "db", "cache-control": "public, max-age=31536000" } });
  } catch {}

  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) return new NextResponse(null, { status: 404 });

  const prompt = `Eine einfache, klare, farbige Illustration von: ${meaning || word} ("${word}" auf Spanisch). Kindgerechter, freundlicher Stil, ein einzelnes zentrales Motiv, schlichter heller Hintergrund, KEIN Text, keine Buchstaben.`;

  // Modell ermitteln: bereits gefundenes, sonst env, sonst automatisch entdecken.
  const candidates = [RESOLVED_MODEL, process.env.GEMINI_IMAGE_MODEL].filter(Boolean) as string[];
  if (candidates.length === 0) candidates.push(...(await listImageModels(key)));

  let out: { data: string; ct: string } | null = null;
  for (const model of candidates) {
    out = await generate(model, key, prompt);
    if (out) { RESOLVED_MODEL = model; break; }
  }
  // Falls env-Modell nicht klappte: verfügbare Modelle durchgehen.
  if (!out && !RESOLVED_MODEL) {
    for (const model of await listImageModels(key)) {
      out = await generate(model, key, prompt);
      if (out) { RESOLVED_MODEL = model; break; }
    }
  }
  if (!out) return new NextResponse(null, { status: 404 });

  const buf = Buffer.from(out.data, "base64");
  try { await prisma.imageCache.create({ data: { key: word, contentType: out.ct, data: buf } }); } catch {}
  return new NextResponse(buf, { headers: { "content-type": out.ct, "x-cache": "miss", "cache-control": "public, max-age=31536000" } });
}

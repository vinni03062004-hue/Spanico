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

// günstigste/gratis-freundlichste zuerst: lite -> flash -> Rest
function rank(n: string): number { return n.includes("lite") ? 0 : n.includes("flash") ? 1 : 2; }

async function listImageModels(key: string): Promise<string[]> {
  try {
    const lm = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=200`).then((r) => r.json());
    const names = (lm?.models || [])
      .filter((m: any) => (m.name || "").toLowerCase().includes("image") && (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m: any) => (m.name || "").replace("models/", ""))
      // "pro"-Bildmodelle NIE nutzen (kein Gratis-Kontingent, kosten Geld).
      .filter((n: string) => !n.includes("pro"));
    // günstigste zuerst: lite -> flash -> Rest
    names.sort((a: string, b: string) => rank(a) - rank(b));
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

  const promptDe = `Eine einfache, klare, farbige Illustration von: ${meaning || word} ("${word}" auf Spanisch). Kindgerechter, freundlicher Stil, ein einzelnes zentrales Motiv, schlichter heller Hintergrund, KEIN Text, keine Buchstaben.`;

  let buf: Buffer | null = null;
  let ct = "image/jpeg";

  // 1) Pollinations.ai — kostenlos, ohne Key. Standardquelle.
  if ((process.env.IMAGE_PROVIDER || "pollinations") !== "gemini") {
    try {
      const p = `simple clear colorful flat illustration of ${meaning || word}, single centered subject, plain light background, no text`;
      const seed = Math.abs([...word].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7));
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=512&height=512&nologo=true&seed=${seed}`;
      const r = await fetch(url);
      if (r.ok) { buf = Buffer.from(await r.arrayBuffer()); ct = r.headers.get("content-type") || "image/jpeg"; }
    } catch { /* Fallback unten */ }
  }

  // 2) Fallback: Gemini (nur wenn Key mit Bild-Billing vorhanden)
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!buf && key) {
    const candidates = [RESOLVED_MODEL, process.env.GEMINI_IMAGE_MODEL].filter(Boolean) as string[];
    if (candidates.length === 0) candidates.push(...(await listImageModels(key)));
    for (const model of candidates) {
      const out = await generate(model, key, promptDe);
      if (out) { RESOLVED_MODEL = model; buf = Buffer.from(out.data, "base64"); ct = out.ct; break; }
    }
  }

  if (!buf || buf.length < 100) return new NextResponse(null, { status: 404 });

  try { await prisma.imageCache.create({ data: { key: word, contentType: ct, data: buf } }); } catch {}
  return new NextResponse(buf, { headers: { "content-type": ct, "x-cache": "miss", "cache-control": "public, max-age=31536000" } });
}

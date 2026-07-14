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

  const promptEn = `A clear, high-quality, colorful illustration of "${meaning}" (Spanish: ${word}). One single, clearly recognizable ${meaning} — the correct real object — centered and isolated on a plain white background. Clean, sharp, unambiguous. No text, no letters, no watermark.`;
  const promptDe = `Eine klare, hochwertige, farbige Illustration von: ${meaning || word} ("${word}" auf Spanisch). Ein einzelnes zentrales Motiv, schlichter heller Hintergrund, KEIN Text.`;

  let buf: Buffer | null = null;
  let ct = "image/jpeg";

  // 1) Cloudflare Workers AI (FLUX.1) — hochwertig, zuverlässig, ~230/Tag gratis.
  const cfAcc = process.env.CLOUDFLARE_ACCOUNT_ID;
  const cfTok = process.env.CLOUDFLARE_API_TOKEN;
  if (cfAcc && cfTok) {
    try {
      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAcc}/ai/run/@cf/black-forest-labs/flux-1-schnell`, {
        method: "POST", headers: { authorization: `Bearer ${cfTok}`, "content-type": "application/json" },
        body: JSON.stringify({ prompt: promptEn, steps: 8 }),
      });
      if (res.ok) {
        const j = await res.json();
        const b64 = j?.result?.image;
        if (b64) { buf = Buffer.from(b64, "base64"); ct = "image/jpeg"; }
      } else { console.error("[image] cloudflare", res.status, (await res.text().catch(() => "")).slice(0, 160)); }
    } catch (e: any) { console.error("[image] cloudflare", e?.message || e); }
  }

  // 2) Pollinations.ai (flux) — kostenlos, ohne Key. Fallback.
  if (!buf && (process.env.IMAGE_PROVIDER || "pollinations") !== "gemini") {
    try {
      const seed = Math.abs([...word].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7));
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptEn)}?width=512&height=512&nologo=true&enhance=true&model=flux&seed=${seed}`;
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 20000);
      const r = await fetch(url, { signal: ctrl.signal });
      clearTimeout(to);
      if (r.ok) { const ab = await r.arrayBuffer(); if (ab.byteLength > 500) { buf = Buffer.from(ab); ct = r.headers.get("content-type") || "image/jpeg"; } }
    } catch {}
  }

  // 3) Gemini (nur mit Bild-Billing)
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

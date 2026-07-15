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

// Übersetzt das deutsche/spanische Wort in ein kurzes, konkretes ENGLISCHES
// Motiv fürs Bildmodell (Bildmodelle verstehen nur Englisch gut). Läuft nur
// beim erstmaligen Erzeugen eines Wortes (danach Bild-Cache) -> kaum Kosten.
async function toEnglishSubject(de: string, es: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `Translate to a short, concrete English noun phrase (1-4 words) naming the depictable object or concept, for use as the subject of a simple illustration. German: "${de}". Spanish: "${es}". If it is abstract or a verb, give the most typical concrete scene (e.g. swim -> "person swimming in water"). Reply with ONLY the English phrase, no punctuation, no quotes.` }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 24 },
      }),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const t: string = j?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const clean = t.replace(/["'.\n\r]/g, " ").replace(/\s+/g, " ").trim();
    return clean.length >= 2 && clean.length <= 60 ? clean : null;
  } catch { return null; }
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

  // Kurz & konkret: das Motiv zuerst, danach knapper Stil. Lange Prompts
  // verwirren die schnellen Modelle (führen zu Mosaik/schwarzen Bildern).
  // WICHTIG: erst ins Englische übersetzen (Modelle verstehen kein Deutsch).
  const englishSubject = await toEnglishSubject(meaning, word);
  const subject = englishSubject || meaning || word;
  const promptEn = `${subject}, simple colorful illustration, centered, plain white background`;
  const negativeEn = `text, letters, words, watermark, blurry, distorted, deformed, extra limbs, multiple objects, collage, mosaic, low quality`;
  const promptDe = `Einfache farbige Illustration von ${subject}, zentriert, weißer Hintergrund, kein Text.`;

  let buf: Buffer | null = null;
  let ct = "image/jpeg";

  // 1) Cloudflare Workers AI — hochwertig, zuverlässig, ~230/Tag gratis.
  // SDXL-Base: stabiler & hochwertiger als Lightning (keine schwarzen/Mosaik-
  // Bilder), liefert PNG-Bytes direkt, ohne den kaputten NSFW-Filter von FLUX.
  const cfAcc = process.env.CLOUDFLARE_ACCOUNT_ID;
  const cfTok = process.env.CLOUDFLARE_API_TOKEN;
  const CF_MODEL = process.env.CLOUDFLARE_IMAGE_MODEL || "@cf/stabilityai/stable-diffusion-xl-base-1.0";
  if (cfAcc && cfTok) {
    try {
      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAcc}/ai/run/${CF_MODEL}`, {
        method: "POST", headers: { authorization: `Bearer ${cfTok}`, "content-type": "application/json" },
        body: JSON.stringify({ prompt: promptEn, negative_prompt: negativeEn, num_steps: 20 }),
      });
      if (res.ok) {
        const rct = res.headers.get("content-type") || "";
        if (rct.includes("application/json")) {
          // manche Modelle liefern { result: { image: base64 } }
          const j = await res.json();
          const b64 = j?.result?.image;
          if (b64) { buf = Buffer.from(b64, "base64"); ct = "image/png"; }
        } else {
          // SDXL liefert die PNG-Bytes direkt
          const ab = await res.arrayBuffer();
          if (ab.byteLength > 500) { buf = Buffer.from(ab); ct = rct || "image/png"; }
        }
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

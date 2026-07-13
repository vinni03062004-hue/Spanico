// Diagnose der KI-Bildgenerierung: probiert die verfügbaren Modelle des Keys
// und meldet das erste, das wirklich ein Bild liefert.
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiUser";

async function listImageModels(key: string): Promise<string[]> {
  try {
    const lm = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=200`).then((r) => r.json());
    const names = (lm?.models || [])
      .filter((m: any) => (m.name || "").toLowerCase().includes("image") && (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m: any) => (m.name || "").replace("models/", ""))
      .filter((n: string) => !n.includes("pro")); // "pro" nie (kein Gratis-Kontingent)
    const rank = (n: string) => (n.includes("lite") ? 0 : n.includes("flash") ? 1 : 2);
    names.sort((a: string, b: string) => rank(a) - rank(b));
    return names;
  } catch { return []; }
}

export async function GET() {
  const u = await requireUser();
  if ("error" in u) return u.error;

  // Kostenlose Standardquelle Pollinations prüfen (kein Key nötig).
  if ((process.env.IMAGE_PROVIDER || "pollinations") !== "gemini") {
    try {
      const r = await fetch("https://image.pollinations.ai/prompt/red%20apple?width=256&height=256&nologo=true&seed=1");
      const ab = await r.arrayBuffer();
      if (r.ok && ab.byteLength > 500) {
        return NextResponse.json({ ok: true, model: "pollinations.ai (kostenlos, ohne Key)", message: `Funktioniert ✓ — Bild erhalten (${Math.round(ab.byteLength / 1024)} KB)` });
      }
    } catch {}
    // wenn Pollinations nicht antwortet, unten Gemini prüfen
  }

  // Welcher Key ist hinterlegt? (maskiert)
  const keyVar = process.env.GEMINI_API_KEY ? "GEMINI_API_KEY"
    : process.env.GOOGLE_GEMINI_API_KEY ? "GOOGLE_GEMINI_API_KEY" : null;
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  const keyPreview = key ? `${key.slice(0, 6)}…${key.slice(-4)} (${key.length} Zeichen)` : "—";
  const modelVar = process.env.GEMINI_IMAGE_MODEL || "(automatisch)";
  if (!key) return NextResponse.json({ ok: false, keyVar, keyPreview, message: "Kein GEMINI_API_KEY / GOOGLE_GEMINI_API_KEY gesetzt." });

  const available = await listImageModels(key);
  // Zuerst dein eingestelltes Modell, dann die verfügbaren (ohne Duplikate).
  const candidates = Array.from(new Set([process.env.GEMINI_IMAGE_MODEL, ...available].filter(Boolean) as string[]));
  const results: { model: string; status: number; kurz: string }[] = [];

  for (const model of candidates) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Illustration eines roten Apfels, weißer Hintergrund, kein Text." }] }], generationConfig: { responseModalities: ["TEXT", "IMAGE"] } }),
      });
      const body = await res.text();
      if (res.ok && (body.includes("inlineData") || body.includes("inline_data"))) {
        return NextResponse.json({ ok: true, keyVar, keyPreview, modelVar, model, message: `Funktioniert ✓ (Modell ${model})`, verfuegbareBildmodelle: available });
      }
      let m = ""; try { m = JSON.parse(body)?.error?.message || ""; } catch {}
      results.push({ model, status: res.status, kurz: res.status === 429 ? "kein Gratis-Kontingent (Limit 0)" : (m.slice(0, 60) || "Fehler") });
    } catch (e: any) { results.push({ model, status: 0, kurz: (e?.message || "").slice(0, 60) }); }
  }

  const allZero = results.length > 0 && results.every((r) => r.status === 429);
  return NextResponse.json({
    ok: false, keyVar, keyPreview, modelVar,
    message: allZero
      ? "Alle Bildmodelle: kein kostenloses Kontingent (Limit 0)."
      : "Keine Bildausgabe möglich.",
    proModelle: results.map((r) => `${r.model}: ${r.status} ${r.kurz}`),
    hinweis: allZero
      ? "KI-Bildgenerierung ist bei DIESEM Key nicht gratis (Google-Free-Tier = 0 für Bilder). Nur mit aktiviertem Abrechnungskonto möglich (~4 Cent/Bild, einmalig pro Wort). Sonst bleiben die Emojis — kostenlos."
      : "Bildmodell reagiert nicht wie erwartet.",
  });
}

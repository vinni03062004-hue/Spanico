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
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) return NextResponse.json({ ok: false, message: "Kein GEMINI_API_KEY gesetzt." });

  const available = await listImageModels(key);
  const candidates = [process.env.GEMINI_IMAGE_MODEL, ...available].filter(Boolean) as string[];
  let last = { model: "", status: 0, message: "" };

  for (const model of candidates) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Illustration eines roten Apfels, weißer Hintergrund, kein Text." }] }], generationConfig: { responseModalities: ["TEXT", "IMAGE"] } }),
      });
      const body = await res.text();
      if (res.ok && (body.includes("inlineData") || body.includes("inline_data"))) {
        return NextResponse.json({ ok: true, model, message: `Funktioniert ✓ (Modell ${model})`, verfuegbareBildmodelle: available });
      }
      let m = ""; try { m = JSON.parse(body)?.error?.message || ""; } catch {}
      last = { model, status: res.status, message: m };
    } catch (e: any) { last = { model, status: 0, message: e?.message || String(e) }; }
  }

  return NextResponse.json({
    ok: false, model: last.model, status: last.status,
    message: last.message || "Keine Bildausgabe möglich.",
    verfuegbareBildmodelle: available,
    hinweis: /billing|free|quota|exceeded/i.test(last.message)
      ? "Tageskontingent erreicht oder Abrechnung nötig — morgen erneut versuchen."
      : available.length ? "Modelle vorhanden — die App wählt automatisch. Nach Deploy sollte es klappen."
      : "Dein Key bietet kein Bildmodell an. Emojis bleiben kostenlos.",
  });
}

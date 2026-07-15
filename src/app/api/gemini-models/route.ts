// Diagnose: listet die Text-Modelle des hinterlegten Gemini-Keys und testet,
// welche wirklich antworten (200) bzw. blockieren (404/429).
// Aufruf im Browser (eingeloggt): /api/gemini-models
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiUser";

export const maxDuration = 60;

export async function GET() {
  const u = await requireUser();
  if ("error" in u) return u.error;

  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) return NextResponse.json({ ok: false, message: "Kein GEMINI_API_KEY gesetzt." });

  // Alle verfügbaren Modelle des Keys holen.
  let models: string[] = [];
  try {
    const lm = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=200`).then((r) => r.json());
    models = (lm?.models || [])
      .filter((m: any) => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m: any) => (m.name || "").replace("models/", ""))
      .filter((n: string) => n && !n.includes("image") && !n.includes("embedding") && !n.includes("vision") && !n.includes("tts") && !n.includes("audio"));
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: `Modell-Liste fehlgeschlagen: ${e?.message}` });
  }

  // flash/lite zuerst (hohe Gratis-Limits), dann Rest. Auf max. 14 begrenzen.
  const rank = (n: string) => (n.includes("lite") ? 0 : n.includes("flash") ? 1 : 2);
  models.sort((a, b) => rank(a) - rank(b));
  const testList = models.slice(0, 14);

  const results: { model: string; status: number; ok: boolean; note?: string }[] = [];
  let firstWorking: string | null = null;

  for (const model of testList) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Sag nur: hola" }] }], generationConfig: { maxOutputTokens: 8 } }),
      });
      const ok = res.ok;
      let note = "";
      if (!ok) { const b = await res.text().catch(() => ""); try { note = (JSON.parse(b)?.error?.message || "").slice(0, 80); } catch { note = b.slice(0, 80); } }
      if (ok && !firstWorking) firstWorking = model;
      results.push({ model, status: res.status, ok, note: note || undefined });
    } catch (e: any) {
      results.push({ model, status: 0, ok: false, note: (e?.message || "").slice(0, 80) });
    }
  }

  return NextResponse.json({
    ok: !!firstWorking,
    EMPFOHLENES_MODELL: firstWorking || "(keines der getesteten Modelle hat geantwortet)",
    hinweis: firstWorking
      ? `Trage in Vercel  GEMINI_MODEL = ${firstWorking}  ein und deploye neu. Dann nutzt Jarvis dieses Modell direkt.`
      : "Kein Modell mit Gratis-Kontingent gefunden. Dann hilft nur: in Google AI Studio Abrechnung aktivieren (Text ist sehr günstig) oder einen Anthropic-Key als ANTHROPIC_API_KEY hinterlegen.",
    getestet: results,
    alleVerfuegbaren: models,
  }, { headers: { "cache-control": "no-store" } });
}

// Diagnose der KI-Bildgenerierung: probiert aktuelle Bildmodelle und listet,
// welche Modelle dein Key überhaupt anbietet.
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiUser";

const CANDIDATES = ["gemini-2.5-flash-image", "gemini-2.5-flash-image-preview", "gemini-2.0-flash-preview-image-generation"];

export async function GET() {
  const u = await requireUser();
  if ("error" in u) return u.error;
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) return NextResponse.json({ ok: false, message: "Kein GEMINI_API_KEY gesetzt." });

  const models = [process.env.GEMINI_IMAGE_MODEL, ...CANDIDATES].filter(Boolean) as string[];
  let last = { status: 0, message: "" };
  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Illustration eines Apfels, weißer Hintergrund, kein Text." }] }], generationConfig: { responseModalities: ["TEXT", "IMAGE"] } }),
      });
      const body = await res.text();
      if (res.ok && (body.includes("inlineData") || body.includes("inline_data"))) {
        return NextResponse.json({ ok: true, model, message: `Funktioniert mit Modell ${model} ✓` });
      }
      let m = ""; try { m = JSON.parse(body)?.error?.message || ""; } catch {}
      last = { status: res.status, message: m };
    } catch (e: any) { last = { status: 0, message: e?.message || String(e) }; }
  }

  // Verfügbare Bild-Modelle auflisten
  let available: string[] = [];
  try {
    const lm = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=100`).then((r) => r.json());
    available = (lm?.models || [])
      .filter((m: any) => (m.name || "").toLowerCase().includes("image") && (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m: any) => (m.name || "").replace("models/", ""));
  } catch {}

  return NextResponse.json({
    ok: false, status: last.status, message: last.message || "Keine Bildausgabe möglich.",
    verfuegbareBildmodelle: available,
    hinweis: /billing|free|quota/i.test(last.message)
      ? "Bildgenerierung braucht ein aktiviertes Abrechnungskonto (nicht gratis). Emojis bleiben kostenlos."
      : available.length ? `Trage eines dieser Modelle als GEMINI_IMAGE_MODEL ein: ${available.join(", ")}`
      : "Dein Key bietet kein Bildmodell an. Emojis bleiben die kostenlose Lösung.",
  });
}

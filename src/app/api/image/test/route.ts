// Diagnose der KI-Bildgenerierung: zeigt die echte Google-Fehlermeldung.
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiUser";

export async function GET() {
  const u = await requireUser();
  if ("error" in u) return u.error;

  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) return NextResponse.json({ ok: false, message: "Kein GEMINI_API_KEY gesetzt." });

  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.0-flash-preview-image-generation";
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Eine einfache Illustration von einem Apfel, weißer Hintergrund, kein Text." }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    });
    const body = await res.text();
    let msg = "";
    try { msg = JSON.parse(body)?.error?.message || ""; } catch {}
    const hasImage = body.includes("inlineData") || body.includes("inline_data");
    return NextResponse.json({
      ok: res.ok && hasImage,
      status: res.status,
      model,
      message: msg || (hasImage ? "Bild erhalten ✓" : "Kein Bild in der Antwort."),
      hinweis: hinweis(res.status, msg),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message || String(e) });
  }
}

function hinweis(status: number, msg: string): string {
  const m = (msg || "").toLowerCase();
  if (m.includes("billing") || m.includes("free tier") || m.includes("quota")) return "Bildgenerierung braucht ein aktiviertes Abrechnungskonto (nicht im Gratis-Tier). Emojis bleiben kostenlos.";
  if (status === 404 || m.includes("not found") || m.includes("not supported")) return "Dieses Modell erzeugt bei deinem Key keine Bilder. Anderes Modell nötig (z.B. imagen) oder Bildgenerierung ist nicht freigeschaltet.";
  if (status === 400) return "Anfrageformat/Modell passt nicht — Bildausgabe evtl. nicht verfügbar.";
  if (status === 403) return "Zugriff verweigert — Bildmodell nicht freigeschaltet.";
  return "Bilderzeugung derzeit nicht möglich — die App nutzt weiter Emojis (kostenlos).";
}

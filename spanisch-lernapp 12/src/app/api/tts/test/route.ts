// Diagnose der Sprachausgabe: prüft, ob der konfigurierte TTS-Anbieter
// (z. B. Google WaveNet) tatsächlich funktioniert — und zeigt sonst die
// echte Fehlermeldung an (z. B. "API nicht aktiviert" / "Abrechnung fehlt").
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiUser";

export async function GET() {
  const u = await requireUser();
  if ("error" in u) return u.error;

  const hasGoogle = !!process.env.GOOGLE_TTS_API_KEY;
  const hasEleven = !!process.env.ELEVENLABS_API_KEY;
  const hasAzure = !!process.env.AZURE_SPEECH_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  const configured = hasEleven ? "elevenlabs" : hasGoogle ? "google" : hasAzure ? "azure" : hasOpenAI ? "openai" : "browser";

  // Wir testen konkret Google (häufigster Fall) mit einem kurzen Satz.
  if (hasGoogle) {
    const voice = process.env.GOOGLE_TTS_VOICE || "es-ES-Wavenet-B";
    try {
      const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_API_KEY}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: { text: "Hola, esto es una prueba." }, voice: { languageCode: "es-ES", name: voice }, audioConfig: { audioEncoding: "MP3" } }),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ provider: "google", voice, ok: true, bytes: (data.audioContent || "").length });
      }
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({
        provider: "google", voice, ok: false, status: res.status,
        message: err?.error?.message || "Unbekannter Fehler",
        hinweis: hinweisFuer(res.status, err?.error?.message || ""),
      });
    } catch (e: any) {
      return NextResponse.json({ provider: "google", ok: false, message: e?.message || String(e) });
    }
  }

  return NextResponse.json({ provider: configured, ok: configured !== "browser", hinweis: configured === "browser" ? "Kein TTS-Key gesetzt — es wird die Browserstimme genutzt." : "Anbieter konfiguriert." });
}

function hinweisFuer(status: number, msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("has not been used") || m.includes("disabled") || m.includes("api not enabled"))
    return "Aktiviere im selben Google-Projekt die 'Cloud Text-to-Speech API'.";
  if (m.includes("billing")) return "Aktiviere ein Abrechnungskonto im Google-Projekt (WaveNet braucht Billing, der Free-Tier bleibt kostenlos).";
  if (status === 403 || m.includes("permission") || m.includes("blocked"))
    return "API-Key ist eingeschränkt oder gesperrt. Erlaube die 'Cloud Text-to-Speech API' in den Key-Einstellungen.";
  if (status === 400 && m.includes("voice")) return "Stimmenname prüfen (z. B. es-ES-Wavenet-B).";
  return "Prüfe Key, aktivierte API und Abrechnung im Google-Projekt.";
}

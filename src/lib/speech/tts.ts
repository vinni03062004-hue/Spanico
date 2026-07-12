// Text-to-Speech Abstraktionsschicht (serverseitig).
// Provider werden per ENV gewaehlt. Ergebnis ist immer MP3/opus-Audio als Buffer,
// ODER null => Client nutzt Browser-TTS als Fallback.
//
// Anti-Kontingent-Trick: der aufrufende Route-Handler cached das Ergebnis pro
// (text+voice), sodass wiederholte Phrasen KEIN neues Kontingent verbrauchen.

export type TtsProvider = "browser" | "elevenlabs" | "openai" | "azure" | "google";

export interface TtsRequest {
  text: string;
  provider?: TtsProvider;
  voice?: string;
}

export interface TtsResult {
  audio: Buffer | null; // null => Client soll Browser-TTS nutzen
  contentType: string;
  provider: TtsProvider;
}

export async function synthesize(req: TtsRequest): Promise<TtsResult> {
  const provider = (req.provider || pickDefault()) as TtsProvider;
  try {
    switch (provider) {
      case "elevenlabs":
        return await elevenlabs(req);
      case "openai":
        return await openai(req);
      case "azure":
        return await azure(req);
      case "google":
        return await google(req);
      default:
        return { audio: null, contentType: "text/plain", provider: "browser" };
    }
  } catch (e) {
    // Bei jedem Provider-Fehler: sauberer Fallback auf Browser-TTS.
    return { audio: null, contentType: "text/plain", provider: "browser" };
  }
}

function pickDefault(): TtsProvider {
  if (process.env.ELEVENLABS_API_KEY) return "elevenlabs";
  if (process.env.GOOGLE_TTS_API_KEY) return "google";
  if (process.env.AZURE_SPEECH_KEY) return "azure";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "browser";
}

async function elevenlabs(req: TtsRequest): Promise<TtsResult> {
  const key = process.env.ELEVENLABS_API_KEY!;
  const voice = req.voice || process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({
      text: req.text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.8 },
    }),
  });
  if (!res.ok) throw new Error("elevenlabs " + res.status);
  const audio = Buffer.from(await res.arrayBuffer());
  return { audio, contentType: "audio/mpeg", provider: "elevenlabs" };
}

async function openai(req: TtsRequest): Promise<TtsResult> {
  const key = process.env.OPENAI_API_KEY!;
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
      voice: req.voice || process.env.OPENAI_TTS_VOICE || "alloy",
      input: req.text,
      response_format: "mp3",
    }),
  });
  if (!res.ok) throw new Error("openai-tts " + res.status);
  return { audio: Buffer.from(await res.arrayBuffer()), contentType: "audio/mpeg", provider: "openai" };
}

async function azure(req: TtsRequest): Promise<TtsResult> {
  const key = process.env.AZURE_SPEECH_KEY!;
  const region = process.env.AZURE_SPEECH_REGION || "westeurope";
  const voice = req.voice || "es-ES-ElviraNeural";
  const ssml = `<speak version='1.0' xml:lang='es-ES'><voice name='${voice}'>${escapeXml(
    req.text
  )}</voice></speak>`;
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
    },
    body: ssml,
  });
  if (!res.ok) throw new Error("azure-tts " + res.status);
  return { audio: Buffer.from(await res.arrayBuffer()), contentType: "audio/mpeg", provider: "azure" };
}

async function google(req: TtsRequest): Promise<TtsResult> {
  const key = process.env.GOOGLE_TTS_API_KEY!;
  const voice = req.voice || "es-ES-Neural2-A";
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        input: { text: req.text },
        voice: { languageCode: "es-ES", name: voice },
        audioConfig: { audioEncoding: "MP3" },
      }),
    }
  );
  if (!res.ok) throw new Error("google-tts " + res.status);
  const data = await res.json();
  return {
    audio: Buffer.from(data.audioContent, "base64"),
    contentType: "audio/mpeg",
    provider: "google",
  };
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string));
}

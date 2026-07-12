"use client";
// Client-seitige Sprach-Utilities.
// STT: Web Speech API (spanisch, kontinuierlich, Interim-Ergebnisse -> Live-Transkript).
// TTS: bevorzugt serverseitige Premium-Stimme (/api/tts, gecacht); faellt sonst
//      auf die BESTE verfuegbare Browser-Stimme zurueck (online-neural, nicht eSpeak).

export interface SttHandlers {
  onInterim?: (text: string) => void;
  onFinal?: (text: string, confidence: number) => void;
  onState?: (s: "listening" | "idle" | "error") => void;
}

export class SpanishRecognizer {
  private rec: any = null;
  private active = false;
  supported = false;

  constructor(private handlers: SttHandlers, private biasPhrases: string[] = []) {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    this.supported = true;
    this.rec = new SR();
    this.rec.lang = "es-ES";           // Spanisch priorisiert
    this.rec.continuous = true;         // Gespraech bricht nicht nach jedem Satz ab
    this.rec.interimResults = true;     // Zwischenstaende fuer Live-Transkript
    this.rec.maxAlternatives = 1;

    this.rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          const conf = r[0].confidence ?? 0.6;
          this.handlers.onFinal?.(r[0].transcript.trim(), conf);
        } else {
          interim += r[0].transcript;
        }
      }
      if (interim) this.handlers.onInterim?.(interim.trim());
    };
    this.rec.onerror = () => this.handlers.onState?.("error");
    this.rec.onend = () => {
      // Auto-Neustart fuer quasi-kontinuierliche Konversation (kleine Pausen != Ende).
      if (this.active) {
        try { this.rec.start(); } catch {}
      } else {
        this.handlers.onState?.("idle");
      }
    };
  }

  start() {
    if (!this.rec || this.active) return;
    this.active = true;
    try { this.rec.start(); this.handlers.onState?.("listening"); } catch {}
  }
  stop() {
    this.active = false;
    try { this.rec?.stop(); } catch {}
  }
  get isActive() { return this.active; }
}

// ---- TTS ----
let cachedVoices: SpeechSynthesisVoice[] = [];
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const v = speechSynthesis.getVoices();
    if (v.length) { cachedVoices = v; return resolve(v); }
    speechSynthesis.onvoiceschanged = () => {
      cachedVoices = speechSynthesis.getVoices();
      resolve(cachedVoices);
    };
  });
}

// Waehlt die natuerlichste verfuegbare spanische Browser-Stimme
// (bevorzugt Google/Microsoft-Online-Neural, meidet eSpeak/robotisch).
function bestSpanishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const es = voices.filter((v) => v.lang.toLowerCase().startsWith("es"));
  const rank = (v: SpeechSynthesisVoice) => {
    const n = v.name.toLowerCase();
    if (n.includes("google")) return 3;                 // meist online-neural, natuerlich
    if (n.includes("microsoft") && n.includes("online")) return 3;
    if (n.includes("neural") || n.includes("premium") || n.includes("enhanced")) return 2;
    if (n.includes("espeak")) return -1;                // robotisch -> meiden
    return 1;
  };
  return es.sort((a, b) => rank(b) - rank(a))[0];
}

export interface SpeakOptions {
  provider?: string;     // "browser" erzwingt Browser-TTS
  voice?: string;        // Server-Voice-ID
  onStart?: () => void;
  onEnd?: () => void;
  onBoundary?: (charIndex: number) => void;
}

// Spricht Text. Versucht zuerst Server-Premium-Audio (menschlich, gecacht),
// faellt bei Fehlen/Fehler auf die beste Browser-Stimme zurueck.
export async function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  if (opts.provider !== "browser") {
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, voice: opts.voice }),
      });
      const ct = res.headers.get("content-type") || "";
      if (res.ok && ct.startsWith("audio")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        opts.onStart?.();
        await new Promise<void>((resolve) => {
          audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
          audio.onerror = () => resolve();
          audio.play().catch(() => resolve());
        });
        opts.onEnd?.();
        return;
      }
    } catch {
      // faellt unten auf Browser durch
    }
  }
  // Browser-Fallback
  const voices = cachedVoices.length ? cachedVoices : await loadVoices();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "es-ES";
  const v = bestSpanishVoice(voices);
  if (v) u.voice = v;
  u.rate = 0.98;
  u.pitch = 1.0;
  u.onstart = () => opts.onStart?.();
  u.onend = () => opts.onEnd?.();
  u.onboundary = (e) => opts.onBoundary?.(e.charIndex);
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
  await new Promise<void>((r) => (u.onend = () => r()));
}

export function cancelSpeech() {
  try { speechSynthesis.cancel(); } catch {}
}

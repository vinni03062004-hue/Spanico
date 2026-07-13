"use client";
import { useEffect, useRef, useState } from "react";
import { SpanishRecognizer, speak } from "@/lib/speech/client";

// Shadowing: KI spricht vor, Nutzer wiederholt unmittelbar; System bewertet Naehe.
const CHUNKS = [
  "Hola, ¿qué tal?",
  "Un café con leche, por favor.",
  "¿Me puede ayudar, por favor?",
  "Acabo de llegar a la estación.",
  "Tengo ganas de viajar a España.",
];
const VARIANTS = ["direkt", "leicht verzögert (nach Ton)", "chunkweise", "Prosodie-Fokus"];

export default function Shadowing() {
  const [i, setI] = useState(0);
  const [variant, setVariant] = useState(0);
  const [rec, setRec] = useState<SpanishRecognizer | null>(null);
  const [heard, setHeard] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const delay = variant === 1 ? 900 : 0;

  useEffect(() => {
    const r = new SpanishRecognizer({
      onInterim: setHeard,
      onFinal: (t, c) => { setHeard(t); r.stop(); grade(t, c); },
    });
    setRec(r);
    return () => r.stop();
  }, [i]);

  async function play() {
    setScore(null); setHeard("");
    await speak(CHUNKS[i]);
    setTimeout(() => rec?.start(), delay);
  }
  async function grade(text: string, conf: number) {
    const res = await fetch("/api/pronunciation", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "shadowing", targetText: CHUNKS[i], recognizedText: text, sttConfidence: conf }),
    }).then((r) => r.json());
    setScore(res.similarity);
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="h-title">Shadowing</h1>
      <div className="flex gap-2 flex-wrap">
        {VARIANTS.map((v, vi) => (
          <button key={v} className={`chip ${variant === vi ? "border-primary text-primary" : ""}`} onClick={() => setVariant(vi)}>{v}</button>
        ))}
      </div>
      <div className="card p-6 space-y-4 text-center">
        <p className="text-2xl font-semibold text-primary">{CHUNKS[i]}</p>
        <button className="btn btn-primary" onClick={play} disabled={!rec?.supported}>▶︎ Vorsprechen & nachsprechen</button>
        {heard && <p className="text-muted">Du: „{heard}"</p>}
        {score !== null && (
          <div>
            <div className="meter"><span style={{ width: `${score}%` }} /></div>
            <p className="text-sm mt-2">{score >= 80 ? "Sehr nah 👌" : score >= 60 ? "Gut, Prosodie weiter üben." : "Noch mal — Timing und Laute angleichen."}</p>
          </div>
        )}
        <button className="btn" onClick={() => setI((x) => (x + 1) % CHUNKS.length)}>Nächster Chunk</button>
      </div>
    </div>
  );
}

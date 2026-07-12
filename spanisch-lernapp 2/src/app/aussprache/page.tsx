"use client";
import { useEffect, useRef, useState } from "react";
import { SpanishRecognizer, speak } from "@/lib/speech/client";

const PHRASES = [
  "Buenos días, ¿cómo está?",
  "Quisiera un café con leche, por favor.",
  "¿Dónde está la estación?",
  "Me duele la cabeza.",
  "Muchas gracias, hasta luego.",
  "Gira a la izquierda y luego a la derecha.",
];

export default function Aussprache() {
  const [i, setI] = useState(0);
  const [rec, setRec] = useState<SpanishRecognizer | null>(null);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [result, setResult] = useState<null | { similarity: number; band: string; uncertain: boolean; analysis: any }>(null);
  const confRef = useRef(0.6);

  const phrase = PHRASES[i];
  useEffect(() => {
    const r = new SpanishRecognizer({
      onInterim: setHeard,
      onFinal: (t, c) => { setHeard(t); confRef.current = c; r.stop(); setListening(false); grade(t, c); },
      onState: (s) => setListening(s === "listening"),
    });
    setRec(r);
    return () => r.stop();
  }, [i]);

  async function grade(text: string, conf: number) {
    const res = await fetch("/api/pronunciation", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "aussprache", targetText: phrase, recognizedText: text, sttConfidence: conf }),
    }).then((r) => r.json());
    setResult(res);
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="h-title">Aussprache</h1>
        <span className="chip">{i + 1}/{PHRASES.length}</span>
      </div>
      <div className="card p-6 space-y-4">
        <p className="text-center text-2xl font-semibold text-primary">{phrase}</p>
        <div className="flex gap-2 justify-center">
          <button className="btn" onClick={() => speak(phrase)}>🔊 Vorsprechen</button>
          {!listening ? (
            <button className="btn btn-primary" onClick={() => { setResult(null); setHeard(""); rec?.start(); }} disabled={!rec?.supported}>🎙️ Nachsprechen</button>
          ) : (
            <button className="btn" onClick={() => { rec?.stop(); setListening(false); }}>■ Stop</button>
          )}
        </div>
        {!rec?.supported && <p className="text-bad text-sm text-center">Spracherkennung nicht verfügbar (Chrome/Edge nutzen).</p>}
        {heard && <p className="text-center text-muted">Erkannt: „{heard}"</p>}
        {result && (
          <div className={`rounded-xl p-4 border ${result.uncertain ? "border-warn/50 bg-warn/10" : result.similarity >= 75 ? "border-good/50 bg-good/10" : "border-bad/40 bg-bad/10"}`}>
            <div className="flex justify-between"><span className="font-medium">{result.band}</span><span>{result.similarity}%</span></div>
            <div className="meter mt-2"><span style={{ width: `${result.similarity}%` }} /></div>
            <p className="text-sm text-muted mt-2">{result.analysis?.hinweis}</p>
          </div>
        )}
        <div className="flex justify-between">
          <button className="btn btn-ghost" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}>Zurück</button>
          <button className="btn btn-primary" onClick={() => setI((x) => (x + 1) % PHRASES.length)}>Nächste Phrase</button>
        </div>
      </div>
      <p className="text-xs text-muted">Hinweis: Bei unsicherer Erkennung wird bewusst nicht scheinpräzise bewertet, sondern zur Wiederholung geraten.</p>
    </div>
  );
}

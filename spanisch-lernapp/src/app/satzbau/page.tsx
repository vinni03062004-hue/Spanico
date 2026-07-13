"use client";
import { useState } from "react";

// Satzbau- & Transformationsmodus: aktive Produktion (Freitext), nicht nur Erkennen.
const TASKS = [
  { type: "Übersetze", prompt_de: "Ich möchte einen Kaffee.", expected: "quiero un café", dimension: "grammar" },
  { type: "Lücke füllen", prompt_de: "Vervollständige: »___ agua está fría.« (Artikel)", expected: "el agua está fría", dimension: "grammar" },
  { type: "Zeitform ändern", prompt_de: "Setze in die Gegenwart: »acabo de llegar« → (gerade angekommen sein, wörtlich)", expected: "acabo de llegar", dimension: "grammar" },
  { type: "Frei formulieren", prompt_de: "Frag höflich nach dem Weg zum Bahnhof.", expected: "perdone dónde está la estación", dimension: "transfer" },
  { type: "Korrigieren", prompt_de: "Korrigiere: »Yo tengo hambre mucho.«", expected: "yo tengo mucha hambre", dimension: "grammar" },
];

export default function Satzbau() {
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<null | { correct: boolean; errorType?: string }>(null);
  const t = TASKS[i];

  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[¿?¡!.,]/g, "").replace(/\s+/g, " ").trim();

  function check() {
    const correct = norm(answer) === norm(t.expected) || overlap(norm(answer), norm(t.expected)) >= 0.8;
    // Sofort auswerten (lokal), Speichern im Hintergrund.
    setResult({ correct });
    fetch("/api/attempts", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "satzbau", exerciseType: t.type, prompt: t.prompt_de, expected: t.expected, answer, correct, confidence: correct ? 0.85 : 0.5, dimension: t.dimension, evidence: "usedInSentence", contextNovel: true }),
    })
      .then((r) => r.json())
      .then((res) => setResult({ correct, errorType: res.errorType }))
      .catch(() => {});
  }
  function next() { setI((x) => (x + 1) % TASKS.length); setAnswer(""); setResult(null); }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex justify-between items-center"><h1 className="h-title">Satzbau</h1><span className="chip">{t.type}</span></div>
      <div className="card p-6 space-y-4">
        <p className="text-lg">{t.prompt_de}</p>
        <textarea className="input min-h-[90px]" placeholder="Antwort auf Spanisch…" value={answer} onChange={(e) => setAnswer(e.target.value)} />
        {!result ? (
          <button className="btn btn-primary w-full" onClick={check} disabled={!answer.trim()}>Prüfen</button>
        ) : (
          <div className={`rounded-xl p-4 border ${result.correct ? "border-good/50 bg-good/10" : "border-bad/40 bg-bad/10"}`}>
            <p className="font-medium">{result.correct ? "Richtig 👍" : `Noch nicht — ${result.errorType || "vergleiche die Musterlösung"}`}</p>
            <p className="text-sm text-primary mt-1">Muster: {t.expected}</p>
            <button className="btn btn-primary w-full mt-3" onClick={next}>Weiter</button>
          </div>
        )}
      </div>
    </div>
  );
}
function overlap(a: string, b: string) {
  const at = a.split(" "), bt = b.split(" ");
  return bt.filter((w) => at.includes(w)).length / Math.max(1, bt.length);
}

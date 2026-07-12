"use client";
import { useState } from "react";
import { speak } from "@/lib/speech/client";

// Pruefmodus: hart & ehrlich, gemischte Aufgabentypen, Teilleistungen getrennt.
type Q =
  | { kind: "vokabel"; prompt: string; expected: string; dim: string }
  | { kind: "hoeren"; say: string; prompt: string; opts: string[]; correct: number; dim: string }
  | { kind: "transfer"; prompt: string; expected: string; dim: string };

const EXAM: Q[] = [
  { kind: "vokabel", prompt: "»die Rechnung« auf Spanisch", expected: "la cuenta", dim: "vocabBreadth" },
  { kind: "hoeren", say: "Gira a la izquierda y sigue recto.", prompt: "Wohin abbiegen?", opts: ["rechts", "links", "zurück"], correct: 1, dim: "listening" },
  { kind: "transfer", prompt: "Bitte höflich um Hilfe (frei).", expected: "me puede ayudar por favor", dim: "transfer" },
  { kind: "vokabel", prompt: "»obwohl« auf Spanisch", expected: "aunque", dim: "grammar" },
  { kind: "transfer", prompt: "Sag, dass du Kopfschmerzen hast.", expected: "me duele la cabeza", dim: "transfer" },
];

export default function Pruefung() {
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState("");
  const [picked, setPicked] = useState<number | null>(null);
  const [scores, setScores] = useState<{ dim: string; correct: boolean }[]>([]);
  const [done, setDone] = useState(false);
  const q = EXAM[i];
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[¿?¡!.,]/g, "").trim();

  async function submit(correct: boolean, answerText: string, dim: string, kind: string) {
    await fetch("/api/attempts", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "pruefung", exerciseType: kind, prompt: (q as any).prompt, expected: (q as any).expected, answer: answerText, correct, confidence: 0.7, dimension: dim, contextNovel: true }),
    });
    setScores((s) => [...s, { dim, correct }]);
    if (i + 1 >= EXAM.length) setDone(true);
    else { setI(i + 1); setAnswer(""); setPicked(null); }
  }

  if (done) {
    const byDim: Record<string, { c: number; n: number }> = {};
    scores.forEach((s) => { byDim[s.dim] = byDim[s.dim] || { c: 0, n: 0 }; byDim[s.dim].n++; if (s.correct) byDim[s.dim].c++; });
    const total = Math.round((scores.filter((s) => s.correct).length / scores.length) * 100);
    return (
      <div className="max-w-xl mx-auto card p-6 space-y-4">
        <h1 className="h-title">Prüfungsergebnis</h1>
        <p className="text-4xl font-semibold">{total}%</p>
        <p className="label">Teilleistungen (getrennt, ehrlich):</p>
        <div className="space-y-2">
          {Object.entries(byDim).map(([d, v]) => (
            <div key={d} className="flex justify-between text-sm"><span>{d}</span><span>{v.c}/{v.n}</span></div>
          ))}
        </div>
        <p className="text-xs text-muted">Ergebnisse fließen kritisch in deine Skill-Bänder ein — einmalige Treffer heben die Klasse nicht.</p>
        <a className="btn btn-primary" href="/fortschritt">Zum Fortschritt</a>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex justify-between items-center"><h1 className="h-title">Prüfung</h1><span className="chip">{i + 1}/{EXAM.length} · {q.kind}</span></div>
      <div className="card p-6 space-y-4">
        {q.kind === "hoeren" ? (
          <>
            <button className="btn" onClick={() => speak(q.say)}>🔊 Anhören</button>
            <p>{q.prompt}</p>
            <div className="grid gap-2">
              {q.opts.map((o, oi) => (
                <button key={oi} disabled={picked !== null} onClick={() => { setPicked(oi); submit(oi === q.correct, o, q.dim, q.kind); }}
                  className={`btn justify-start ${picked !== null && oi === q.correct ? "border-good bg-good/15" : ""}`}>{o}</button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-lg">{q.prompt}</p>
            <textarea className="input min-h-[80px]" placeholder="Antwort auf Spanisch…" value={answer} onChange={(e) => setAnswer(e.target.value)} />
            <button className="btn btn-primary w-full" disabled={!answer.trim()}
              onClick={() => submit(norm(answer).includes(norm((q as any).expected)) || norm((q as any).expected).includes(norm(answer)), answer, (q as any).dim, q.kind)}>
              Antwort abgeben
            </button>
          </>
        )}
      </div>
      <p className="text-xs text-muted">Der Prüfmodus bläht Fortschritt nicht auf: freie Antworten, Hörteil und Transfer sind Pflicht.</p>
    </div>
  );
}

"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { speak } from "@/lib/speech/client";

interface Card {
  id: string; lemma: string; pos: string; meaningDe: string; explanationEs: string;
  examples: { es: string; de: string }[]; category: string; frequencyTier: number;
  collocations?: string[]; confusables?: string[]; imageEmoji?: string; pronTargets?: string[];
  _review: boolean;
}

// Aktiver Abruf: Nutzer tippt die spanische Uebersetzung, bevor die Loesung erscheint.
export default function Vokabeln() {
  const [cards, setCards] = useState<Card[]>([]);
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<null | { correct: boolean; mastery?: any; errorType?: string }>(null);
  const [done, setDone] = useState(false);
  const startRef = useRef<number>(Date.now());

  useEffect(() => { load(); }, []);
  async function load() {
    const r = await fetch("/api/vocab?limit=12").then((x) => x.json());
    setCards(r.cards || []);
    setI(0); setDone(false); reset();
  }
  function reset() { setAnswer(""); setRevealed(false); setResult(null); startRef.current = Date.now(); }

  const card = cards[i];
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[¿?¡!.,]/g, "").trim();
  const isCorrect = useMemo(() => {
    if (!card) return false;
    const a = norm(answer);
    return a.length > 1 && (norm(card.lemma).includes(a) || a.includes(norm(card.lemma)));
  }, [answer, card]);

  async function check() {
    if (!card) return;
    setRevealed(true);
    const correct = isCorrect;
    const responseMs = Date.now() - startRef.current;
    const evidence = card._review ? "reproduced" : "recognized";
    const res = await fetch("/api/attempts", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "vokabeln", exerciseType: "uebersetzung", vocabId: card.id,
        prompt: card.meaningDe, expected: card.lemma, answer, correct,
        confidence: correct ? 0.85 : 0.5, responseMs, evidence, dimension: "vocabBreadth",
      }),
    }).then((x) => x.json());
    setResult({ correct, mastery: res.mastery, errorType: res.errorType });
    speak(card.lemma);
  }

  function next() {
    if (i + 1 >= cards.length) setDone(true);
    else { setI(i + 1); reset(); }
  }

  if (done) return (
    <div className="card p-8 text-center space-y-3">
      <h1 className="h-title">Runde abgeschlossen 🎉</h1>
      <p className="label">Deine Antworten wurden in Spacing, Mastery und Fehlergedächtnis verrechnet.</p>
      <div className="flex gap-2 justify-center">
        <button className="btn btn-primary" onClick={load}>Nächste Runde</button>
        <a className="btn" href="/dashboard">Zum Dashboard</a>
      </div>
    </div>
  );
  if (!card) return <p className="label">Lädt Vokabeln…</p>;

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="h-title">Vokabeln</h1>
        <span className="chip">{i + 1}/{cards.length} · {card._review ? "Wiederholung" : "neu"} · Stufe {card.frequencyTier}</span>
      </div>

      <div className="card p-6 space-y-4">
        <div className="text-center">
          {card.imageEmoji && <div className="text-5xl mb-2">{card.imageEmoji}</div>}
          <p className="label">Übersetze ins Spanische</p>
          <p className="text-2xl font-semibold">{card.meaningDe}</p>
          <p className="text-xs text-muted mt-1">{card.pos} · {card.category}</p>
        </div>

        {!revealed ? (
          <form onSubmit={(e) => { e.preventDefault(); check(); }} className="space-y-3">
            <input autoFocus className="input text-center text-lg" placeholder="Auf Spanisch tippen…" value={answer} onChange={(e) => setAnswer(e.target.value)} />
            <div className="flex gap-2">
              <button type="button" className="btn flex-1" onClick={() => setRevealed(true)}>Weiß nicht</button>
              <button type="submit" className="btn btn-primary flex-1">Prüfen</button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div className={`rounded-xl p-4 border ${result?.correct ? "border-good/50 bg-good/10" : "border-bad/50 bg-bad/10"}`}>
              <div className="flex items-center justify-between">
                <p className="text-xl font-semibold">{card.lemma}</p>
                <button className="btn btn-ghost" onClick={() => speak(card.lemma)} aria-label="Anhören">🔊</button>
              </div>
              <p className="text-sm text-muted mt-1">{result?.correct ? "Richtig" : result?.errorType ? `Zu verbessern: ${result.errorType}` : "Noch nicht sicher"}</p>
            </div>
            <div className="text-sm space-y-2">
              <p className="text-muted italic">{card.explanationEs}</p>
              {card.examples?.[0] && <p><span className="text-primary">{card.examples[0].es}</span> — {card.examples[0].de}</p>}
              {card.collocations?.length ? <p className="text-xs text-muted">Kollokationen: {card.collocations.join(", ")}</p> : null}
              {card.confusables?.length ? <p className="text-xs text-warn">Verwechslungsgefahr: {card.confusables.join(", ")}</p> : null}
              {result?.mastery && <p className="chip inline-block">Mastery-Level {result.mastery.level}/7 {result.mastery.stable ? "· stabil ✓" : ""}</p>}
            </div>
            <button className="btn btn-primary w-full" onClick={next}>Weiter</button>
          </div>
        )}
      </div>
    </div>
  );
}

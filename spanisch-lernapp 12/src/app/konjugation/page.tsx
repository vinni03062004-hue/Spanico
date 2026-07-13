"use client";
import { useMemo, useState } from "react";
import { speak } from "@/lib/speech/client";
import { ALL_VERBS, IRREGULAR, REGULAR_VERBS, TENSES, TENSE_LABEL, PERSONS, conjugate, checkForm, Tense, PersonIndex } from "@/lib/conjugation";

// Konjugations-Trainer: übt gezielt die Endungen. Endungsfehler werden als
// "konjugation" ins Fehlergedächtnis geschrieben (dimension: grammar).
export default function Konjugation() {
  const [tense, setTense] = useState<Tense>("presente");
  const [verb, setVerb] = useState<string>(REGULAR_VERBS[0]);
  const [person, setPerson] = useState<PersonIndex>(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<null | { ok: boolean; accentOnly: boolean; correct: string }>(null);

  const correct = useMemo(() => conjugate(verb, tense, person), [verb, tense, person]);
  const isIrregular = !!IRREGULAR[verb];

  function nextRandom() {
    const v = ALL_VERBS[Math.floor(Math.random() * ALL_VERBS.length)];
    const p = Math.floor(Math.random() * 6) as PersonIndex;
    // Tempo beibehalten; nur Verb/Person neu
    setVerb(v); setPerson(p); setAnswer(""); setFeedback(null);
  }

  async function check() {
    if (!correct) return;
    const res = checkForm(answer, correct);
    setFeedback({ ...res, correct });
    speak(correct);
    await fetch("/api/attempts", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "konjugation", exerciseType: `${tense}/${PERSONS[person]}`,
        prompt: `${verb} — ${PERSONS[person]} (${tense})`, expected: correct, answer,
        correct: res.ok, confidence: res.ok ? 0.85 : res.accentOnly ? 0.6 : 0.5,
        dimension: "grammar", evidence: "usedInSentence", contextNovel: true,
      }),
    });
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="h-title">Konjugation</h1>
      <p className="label">Setze die richtige Endung. Fehler landen gezielt im Fehlergedächtnis.</p>

      <div className="card p-5 space-y-4">
        <div className="flex gap-2 flex-wrap">
          {TENSES.map((t) => (
            <button key={t} className={`chip ${tense === t ? "border-primary text-primary" : ""}`} onClick={() => { setTense(t); setFeedback(null); setAnswer(""); }}>{t}</button>
          ))}
        </div>
        <p className="text-xs text-muted">{TENSE_LABEL[tense]}</p>

        <div>
          <label className="label">Verb</label>
          <select className="input" value={verb} onChange={(e) => { setVerb(e.target.value); setFeedback(null); setAnswer(""); }}>
            <optgroup label="Regelmäßig">
              {REGULAR_VERBS.map((v) => <option key={v} value={v}>{v}</option>)}
            </optgroup>
            <optgroup label="Unregelmäßig (häufig)">
              {Object.keys(IRREGULAR).filter((v) => v !== "ir_a").map((v) => <option key={v} value={v}>{v}</option>)}
            </optgroup>
          </select>
        </div>

        <div className="text-center py-2">
          <p className="text-3xl font-semibold text-primary">{PERSONS[person]}</p>
          <p className="label">{verb} · {tense} {isIrregular && <span className="chip ml-1">unregelmäßig</span>}</p>
        </div>

        {!correct ? (
          <p className="text-warn text-sm text-center">Diese Kombination ist (noch) nicht hinterlegt — wähle ein anderes Verb/Tempus.</p>
        ) : !feedback ? (
          <form onSubmit={(e) => { e.preventDefault(); check(); }} className="space-y-2">
            <input autoFocus className="input text-center text-lg" placeholder="Form eingeben…" value={answer} onChange={(e) => setAnswer(e.target.value)} />
            <button type="submit" className="btn btn-primary w-full" disabled={!answer.trim()}>Prüfen</button>
          </form>
        ) : (
          <div className={`rounded-xl p-4 border ${feedback.ok ? "border-good/50 bg-good/10" : feedback.accentOnly ? "border-warn/50 bg-warn/10" : "border-bad/40 bg-bad/10"}`}>
            <p className="font-medium">
              {feedback.ok ? "Richtig 👍" : feedback.accentOnly ? "Fast! Nur der Akzent fehlt/stimmt nicht." : "Falsche Endung"}
            </p>
            <p className="text-lg text-primary mt-1">{PERSONS[person]} {feedback.correct}</p>
            <button className="btn btn-primary w-full mt-3" onClick={nextRandom}>Nächstes Verb</button>
          </div>
        )}

        <button className="btn btn-ghost w-full" onClick={nextRandom}>Zufälliges Verb / Person</button>
      </div>
    </div>
  );
}

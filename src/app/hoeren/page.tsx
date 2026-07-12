"use client";
import { useEffect, useState } from "react";
import { speak } from "@/lib/speech/client";

// Hoerverstehen: Satz wird (mit variabler Geschwindigkeit) vorgelesen,
// Nutzer beantwortet Detail-/Globalfragen. Fehler zahlen in "listening" ein.
const ITEMS = [
  { es: "La estación está a la derecha, muy cerca de aquí.", q: "Wo ist der Bahnhof?", opts: ["rechts, ganz nah", "links, weit weg", "geradeaus, 2 km"], correct: 0 },
  { es: "Quisiera reservar una mesa para dos a las nueve.", q: "Für wie viele Personen?", opts: ["für eine", "für zwei", "für neun"], correct: 1 },
  { es: "Hoy no puedo, pero mañana por la tarde sí.", q: "Wann geht es?", opts: ["heute Morgen", "morgen Nachmittag", "gar nicht"], correct: 1 },
  { es: "Me duele mucho la cabeza desde ayer.", q: "Was ist das Problem?", opts: ["Bauchschmerzen", "Kopfschmerzen seit gestern", "Fieber"], correct: 1 },
];

export default function Hoeren() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [rate, setRate] = useState(1);
  const item = ITEMS[i];
  useEffect(() => setPicked(null), [i]);

  async function pick(oi: number) {
    setPicked(oi);
    const correct = oi === item.correct;
    await fetch("/api/attempts", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "hoeren", exerciseType: "hoerverstehen", prompt: item.q, expected: item.opts[item.correct], answer: item.opts[oi], correct, confidence: 0.8, dimension: "listening" }),
    });
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex justify-between items-center"><h1 className="h-title">Hören</h1><span className="chip">{i + 1}/{ITEMS.length}</span></div>
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3 justify-center">
          <button className="btn btn-primary" onClick={() => speak(item.es)}>🔊 Anhören</button>
          <label className="label flex items-center gap-2">Tempo
            <input type="range" min={0.6} max={1.2} step={0.1} value={rate} onChange={(e) => setRate(+e.target.value)} />
          </label>
        </div>
        <p className="text-center">{item.q}</p>
        <div className="grid gap-2">
          {item.opts.map((o, oi) => {
            const show = picked !== null;
            return (
              <button key={oi} disabled={show} onClick={() => pick(oi)}
                className={`btn justify-start ${show && oi === item.correct ? "border-good bg-good/15" : show && picked === oi ? "border-bad bg-bad/15" : ""}`}>{o}</button>
            );
          })}
        </div>
        {picked !== null && (
          <div className="text-sm text-muted">
            Original: <span className="text-primary">{item.es}</span>
            <button className="btn btn-primary w-full mt-3" onClick={() => setI((x) => (x + 1) % ITEMS.length)}>Weiter</button>
          </div>
        )}
      </div>
    </div>
  );
}

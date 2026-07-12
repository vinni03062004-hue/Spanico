"use client";
import { useEffect, useState } from "react";
import { speak } from "@/lib/speech/client";

// Bildmodus (Picture-first-Heuristik): erst Bildanker zeigen, dann Bedeutung
// aufloesen. Nutzt Emoji-Anker; erweiterbar auf echte Bild-Assets (imageEmoji-Feld).
interface Card { id: string; lemma: string; meaningDe: string; imageEmoji?: string; examples: { es: string; de: string }[] }

export default function Bilder() {
  const [cards, setCards] = useState<Card[]>([]);
  const [i, setI] = useState(0);
  const [options, setOptions] = useState<Card[]>([]);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => { fetch("/api/vocab?limit=20").then((r) => r.json()).then((d) => setCards((d.cards || []).filter((c: Card) => c.imageEmoji))); }, []);
  useEffect(() => {
    if (!cards.length) return;
    const correct = cards[i];
    const distract = cards.filter((_, x) => x !== i).sort(() => Math.random() - 0.5).slice(0, 3);
    setOptions([correct, ...distract].sort(() => Math.random() - 0.5));
    setPicked(null);
  }, [cards, i]);

  const card = cards[i];
  async function pick(c: Card) {
    setPicked(c.id);
    const correct = c.id === card.id;
    if (correct) speak(card.lemma);
    await fetch("/api/attempts", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "bilder", exerciseType: "bildBenennen", vocabId: card.id, prompt: card.imageEmoji || "", expected: card.lemma, answer: c.lemma, correct, confidence: 0.8, evidence: "understood", dimension: "imageSituation", contextNovel: true }),
    });
  }

  if (!card) return <p className="label">Lädt Bilder…</p>;
  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex justify-between items-center"><h1 className="h-title">Bilder</h1><span className="chip">Bild → Wort</span></div>
      <div className="card p-8 text-center">
        <div className="text-8xl mb-6">{card.imageEmoji}</div>
        <p className="label mb-3">Welches spanische Wort passt?</p>
        <div className="grid grid-cols-2 gap-2">
          {options.map((o) => {
            const isCorrect = o.id === card.id;
            const show = picked !== null;
            return (
              <button key={o.id} onClick={() => !picked && pick(o)} disabled={!!picked}
                className={`btn ${show && isCorrect ? "border-good bg-good/15" : show && picked === o.id ? "border-bad bg-bad/15" : ""}`}>
                {o.lemma}
              </button>
            );
          })}
        </div>
        {picked && (
          <div className="mt-4 text-sm">
            <p className="text-primary">{card.lemma} — {card.meaningDe}</p>
            <button className="btn btn-primary mt-3" onClick={() => setI((x) => (x + 1) % cards.length)}>Weiter</button>
          </div>
        )}
      </div>
    </div>
  );
}

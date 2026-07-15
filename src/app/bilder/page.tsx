"use client";
import { useEffect, useState } from "react";
import { speak } from "@/lib/speech/client";
import { VocabSetup } from "@/components/VocabSetup";

// Bildmodus (Picture-first-Heuristik): erst Bildanker zeigen, dann Bedeutung
// aufloesen. Nutzt Emoji-Anker; erweiterbar auf echte Bild-Assets (imageEmoji-Feld).
interface Card { id: string; lemma: string; meaningDe: string; imageEmoji?: string; category?: string }

export default function Bilder() {
  const [cards, setCards] = useState<Card[]>([]);
  const [i, setI] = useState(0);
  const [options, setOptions] = useState<Card[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  function load() {
    setLoaded(false);
    const ch = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("chapter") : null;
    fetch(`/api/vocab/images${ch !== null ? `?chapter=${ch}` : ""}`).then((r) => r.json())
      .then((d) => setCards(d.cards || []))
      .catch(() => setCards([]))
      .finally(() => setLoaded(true));
  }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!cards.length) return;
    const correct = cards[i];
    // Ablenker: anderes Wort, anderes Emoji — bevorzugt aus ANDEREN Kategorien,
    // damit die Optionen sich klar unterscheiden.
    const pool = cards.filter((c, x) => x !== i && c.imageEmoji !== correct.imageEmoji && c.lemma !== correct.lemma);
    const diffCat = pool.filter((c) => c.category !== correct.category).sort(() => Math.random() - 0.5);
    const rest = pool.filter((c) => c.category === correct.category).sort(() => Math.random() - 0.5);
    const distract = [...diffCat, ...rest].slice(0, 3);
    setOptions([correct, ...distract].sort(() => Math.random() - 0.5));
    setPicked(null);
  }, [cards, i]);

  const card = cards[i];

  // Vorab-Erzeugung: die nächsten 2 Bilder im Hintergrund laden -> sofort da,
  // wenn man weiterklickt (kein Warten mehr).
  useEffect(() => {
    const n = cards[i + 1];
    if (n?.lemma) { const im = new Image(); im.src = `/api/image?word=${encodeURIComponent(n.lemma)}&meaning=${encodeURIComponent(n.meaningDe)}`; }
  }, [i, cards]);

  function pick(c: Card) {
    setPicked(c.id);
    const correct = c.id === card.id;
    if (correct) speak(card.lemma);
    fetch("/api/attempts", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "bilder", exerciseType: "bildBenennen", vocabId: card.id, prompt: card.imageEmoji || "", expected: card.lemma, answer: c.lemma, correct, confidence: 0.8, evidence: "understood", dimension: "imageSituation", contextNovel: true }),
    }).catch(() => {});
  }

  if (!loaded) return <p className="label">Lädt Bilder…</p>;
  if (!card) return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="h-title">Bilder</h1>
      <p className="label">Noch keine Vokabeln mit Bildankern. Lade den Grundwortschatz:</p>
      <VocabSetup onDone={load} />
    </div>
  );
  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex justify-between items-center"><h1 className="h-title">Bilder</h1><span className="chip">Bild → Wort</span></div>
      <div className="card p-8 text-center">
        <WordImage word={card.lemma} meaning={card.meaningDe} emoji={card.imageEmoji} />
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
      <p className="text-[10px] text-muted/60 text-center">Erstes Anzeigen erzeugt bei Bedarf ein KI-Bild (einmalig), danach aus dem Cache.</p>
    </div>
  );
}

// Zeigt ein KI-Bild zum Wort. Beim ersten Mal wird es serverseitig erzeugt,
// danach aus dem Cache. Bei Drosselung wird AUTOMATISCH wiederholt (kein Emoji).
function WordImage({ word, meaning }: { word: string; meaning: string; emoji?: string }) {
  const [status, setStatus] = useState<"loading" | "ok" | "retry">("loading");
  const [attempt, setAttempt] = useState(0);
  const [alt, setAlt] = useState(0); // "anderes Bild": zählt Alternativen hoch
  const src = `/api/image?word=${encodeURIComponent(word)}&meaning=${encodeURIComponent(meaning)}${alt > 0 ? `&alt=${alt}` : ""}&r=${attempt}`;
  useEffect(() => { setStatus("loading"); setAttempt(0); setAlt(0); }, [word]);

  function onError() {
    // Auto-Wiederholung mit kurzer Pause (Dienst evtl. kurz ausgelastet).
    if (attempt < 6) {
      setStatus("loading");
      setTimeout(() => setAttempt((a) => a + 1), 2500);
    } else {
      setStatus("retry");
    }
  }

  return (
    <div className="mb-4 flex flex-col items-center justify-center min-h-48">
      <img
        src={src}
        alt=""
        className={`max-h-48 rounded-xl object-contain ${status === "ok" ? "" : "hidden"}`}
        onLoad={() => setStatus("ok")}
        onError={onError}
      />
      {status === "loading" && (
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
          <p className="text-muted text-sm mt-2">Bild wird geladen… {attempt > 0 ? `(Versuch ${attempt + 1})` : ""}</p>
        </div>
      )}
      {status === "retry" && (
        <div className="text-center">
          <p className="text-muted text-sm mb-2">Bild gerade nicht verfügbar.</p>
          <button className="btn btn-primary" onClick={() => { setStatus("loading"); setAttempt((a) => a + 1); }}>Erneut versuchen</button>
        </div>
      )}
      {status === "ok" && (
        <button
          className="text-[11px] text-muted/70 hover:text-primary mt-2 underline underline-offset-2"
          onClick={() => { setStatus("loading"); setAlt((a) => a + 1); }}
        >
          Passt nicht? Anderes Bild
        </button>
      )}
    </div>
  );
}

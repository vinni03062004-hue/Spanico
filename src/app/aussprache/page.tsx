"use client";
import { useEffect, useRef, useState } from "react";
import { SpanishRecognizer, speak } from "@/lib/speech/client";

interface Item { id: string; lemma: string; meaningDe: string; example?: string | null }

export default function Aussprache() {
  const [chapters, setChapters] = useState<{ key: string; title: string; desc: string; count: number }[]>([]);
  const [chapter, setChapter] = useState<number | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [idx, setIdx] = useState(0);
  const [rec, setRec] = useState<SpanishRecognizer | null>(null);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [result, setResult] = useState<null | { similarity: number; band: string; uncertain: boolean; analysis: any }>(null);
  const confRef = useRef(0.6);

  // Roadmap-Metadaten laden
  useEffect(() => {
    fetch("/api/vocab/practice").then((r) => r.json()).then((d) => setChapters(d.chapters || [])).catch(() => {});
  }, []);

  const item = items[idx];
  const target = item ? (item.example || item.lemma) : "";

  // Erkenner an das aktuelle Wort binden; Ergebnis IMMER zurücksetzen (Bugfix).
  useEffect(() => {
    setResult(null); setHeard(""); setListening(false);
    if (!item) return;
    const r = new SpanishRecognizer({
      onInterim: setHeard,
      onFinal: (t, c) => { setHeard(t); confRef.current = c; r.stop(); setListening(false); grade(t, c); },
      onState: (s) => setListening(s === "listening"),
    });
    setRec(r);
    return () => r.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, items]);

  async function openChapter(n: number) {
    const d = await fetch(`/api/vocab/practice?chapter=${n}`).then((r) => r.json());
    setItems(d.items || []); setChapter(n); setIdx(0);
    setResult(null); setHeard(""); setListening(false);
  }

  async function grade(text: string, conf: number) {
    const res = await fetch("/api/pronunciation", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "aussprache", targetText: target, recognizedText: text, sttConfidence: conf }),
    }).then((r) => r.json());
    setResult(res);
  }

  // ---- Roadmap-Ansicht ----
  if (chapter === null) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <div>
          <h1 className="h-title">Aussprache — Roadmap</h1>
          <p className="label">Arbeite dich Kapitel für Kapitel vor: von den häufigsten zu den selteneren Wörtern.</p>
        </div>
        {chapters.length === 0 ? (
          <p className="label">Lädt… (falls leer: erst „Grundwortschatz laden" im Dashboard).</p>
        ) : (
          <div className="relative py-2">
            {chapters.map((c, n) => (
              <div key={c.key} className={`flex ${n % 2 === 0 ? "justify-start" : "justify-end"} mb-3`}>
                <button onClick={() => openChapter(n)} disabled={c.count === 0}
                  className={`card px-5 py-3 transition flex items-center gap-3 max-w-[85%] ${c.count === 0 ? "opacity-40" : "hover:border-primary/60 hover:shadow-glow"}`}>
                  <span className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-r from-primary to-accent text-black font-bold flex items-center justify-center">{n + 1}</span>
                  <span className="text-left">
                    <span className="block font-medium">{c.title}</span>
                    <span className="block text-xs text-muted">{c.desc} · {c.count} Wörter</span>
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---- Übungsansicht ----
  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <button className="btn btn-ghost text-sm" onClick={() => setChapter(null)}>← Roadmap</button>
        <span className="chip">Kapitel {chapter + 1} · {items.length ? idx + 1 : 0}/{items.length}</span>
      </div>

      {!item ? (
        <div className="card p-8 text-center space-y-3">
          <p className="h-title">Kapitel geschafft 🎉</p>
          <div className="flex gap-2 justify-center">
            {chapter + 1 < chapters.length && <button className="btn btn-primary" onClick={() => openChapter(chapter + 1)}>Nächstes Kapitel</button>}
            <button className="btn" onClick={() => setChapter(null)}>Zur Roadmap</button>
          </div>
        </div>
      ) : (
        <div className="card p-6 space-y-4">
          <div className="text-center">
            <p className="text-2xl font-semibold text-primary">{target}</p>
            <p className="label mt-1">{item.meaningDe}</p>
          </div>
          <div className="flex gap-2 justify-center">
            <button className="btn" onClick={() => speak(target)}>🔊 Vorsprechen</button>
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
            <button className="btn btn-ghost" onClick={() => setIdx((x) => Math.max(0, x - 1))} disabled={idx === 0}>Zurück</button>
            <button className="btn btn-primary" onClick={() => setIdx((x) => x + 1)}>Nächstes Wort</button>
          </div>
        </div>
      )}
    </div>
  );
}

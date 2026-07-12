"use client";
import { useEffect, useRef, useState } from "react";
import { SpanishRecognizer, speak, cancelSpeech } from "@/lib/speech/client";

type CoreState = "idle" | "listening" | "thinking" | "speaking" | "interrupted" | "error";
interface Scenario { id: string; key: string; title: string; difficulty: number; steps: any[] }
interface Line { role: "user" | "coach"; text: string; hint?: string }

export default function Jarvis() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenarioKey, setScenarioKey] = useState<string | undefined>();
  const [state, setState] = useState<CoreState>("idle");
  const [interim, setInterim] = useState("");
  const [transcript, setTranscript] = useState<Line[]>([]);
  const [task, setTask] = useState<string>("Wähle ein Szenario oder sprich frei.");
  const [hint, setHint] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const [running, setRunning] = useState(false);

  const recRef = useRef<SpanishRecognizer | null>(null);
  const sessionRef = useRef<string | undefined>();
  const stepRef = useRef(0);
  const speakingRef = useRef(false);

  useEffect(() => {
    fetch("/api/scenarios").then((r) => r.json()).then((d) => setScenarios(d.scenarios || [])).catch(() => {});
    return () => { recRef.current?.stop(); cancelSpeech(); };
  }, []);

  function ensureRecognizer() {
    if (recRef.current) return recRef.current;
    const rec = new SpanishRecognizer(
      {
        onInterim: (t) => {
          setInterim(t);
          // Barge-in: spricht der Nutzer waehrend die KI redet, wird abgebrochen.
          if (speakingRef.current) { cancelSpeech(); speakingRef.current = false; setState("interrupted"); }
        },
        onFinal: (t, conf) => { setInterim(""); handleUser(t, conf); },
        onState: (s) => { if (s === "error") setState("error"); },
      },
      []
    );
    setSupported(rec.supported);
    recRef.current = rec;
    return rec;
  }

  async function start() {
    const rec = ensureRecognizer();
    if (!rec.supported) { setSupported(false); return; }
    setRunning(true);
    setState("listening");
    rec.start();
    // Eroeffnung durch den Coach
    await coachTurn("");
  }
  function stop() {
    setRunning(false);
    recRef.current?.stop();
    cancelSpeech();
    setState("idle");
  }

  async function handleUser(text: string, conf: number) {
    if (!running) return;
    setTranscript((t) => [...t, { role: "user", text }]);
    setState("thinking");
    // Aussprache im Hintergrund bewerten (nur wenn Zielphrase existiert)
    await coachTurn(text, conf);
  }

  async function coachTurn(userSaid: string, conf = 0.6) {
    try {
      const res = await fetch("/api/conversation", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: sessionRef.current, scenarioKey, stepIndex: stepRef.current, userSaid }),
      }).then((r) => r.json());
      sessionRef.current = res.sessionId;
      stepRef.current = res.nextStepIndex ?? stepRef.current;
      setTask(res.stepPromptDe || task);
      setHint(res.hint || null);

      const coachText = [res.reply, res.correction ? `(${res.correction})` : ""].filter(Boolean).join("  ");
      setTranscript((t) => [...t, { role: "coach", text: coachText, hint: res.ruleHint || undefined }]);

      // Aussprachebewertung protokollieren, wenn Nutzer etwas sagte
      if (userSaid) {
        fetch("/api/pronunciation", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ mode: "jarvis", targetText: res.matched?.[0] || userSaid, recognizedText: userSaid, sttConfidence: conf }),
        }).catch(() => {});
      }

      // KI spricht (menschliche Stimme via /api/tts, sonst Browser)
      speakingRef.current = true;
      setState("speaking");
      await speak(res.reply, { onEnd: () => { speakingRef.current = false; } });
      if (running) setState("listening");
    } catch {
      setState("error");
      setTranscript((t) => [...t, { role: "coach", text: "(Keine Antwort vom Server — Datenbank verbunden? Für echte freie Gespräche einen KI-Key setzen.)" }]);
      if (running) setState("listening");
    }
  }

  return (
    <div className="fixed inset-0 top-14 bg-base flex flex-col items-center justify-between overflow-hidden">
      {/* Kopf: Szenario + Aufgabe */}
      <div className="w-full max-w-2xl px-4 pt-4 z-10">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => setScenarioKey(undefined)} className={`chip ${!scenarioKey ? "border-primary text-primary" : ""}`}>Frei</button>
          {scenarios.map((s) => (
            <button key={s.key} onClick={() => { setScenarioKey(s.key); stepRef.current = 0; }}
              className={`chip whitespace-nowrap ${scenarioKey === s.key ? "border-primary text-primary" : ""}`}>{s.title}</button>
          ))}
        </div>
        <p className="text-center text-sm text-muted mt-1">Aufgabe: <span className="text-white">{task}</span></p>
        {hint && <p className="text-center text-xs text-primary/80">Tipp: {hint}</p>}
      </div>

      {/* Reaktorkern */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="reactor-ring" /><div className="reactor-ring two" />
        <div className={`reactor ${state === "speaking" ? "speaking" : ""} ${state === "listening" ? "listening" : ""} ${state === "error" ? "error" : ""}`} />
        <div className="absolute text-center">
          <p className="uppercase tracking-widest text-xs text-primary/80">
            {({ idle: "bereit", listening: "höre zu", thinking: "denke", speaking: "spreche", interrupted: "unterbrochen", error: "fehler" } as any)[state]}
          </p>
        </div>
      </div>

      {/* Live-Transkript (ohne Box, schlank) */}
      <div className="w-full max-w-2xl px-4 pb-6 z-10">
        <div className="h-40 overflow-y-auto space-y-1 text-sm mb-3">
          {transcript.slice(-6).map((l, i) => (
            <p key={i} className={l.role === "user" ? "text-white" : "text-primary/90"}>
              <span className="text-muted">{l.role === "user" ? "Du: " : "Coach: "}</span>{l.text}
              {l.hint && <span className="block text-xs text-warn/80">↳ {l.hint}</span>}
            </p>
          ))}
          {interim && <p className="text-muted italic">Du: {interim}…</p>}
        </div>
        {!supported && <p className="text-bad text-sm text-center mb-2">Dein Browser unterstützt die Spracherkennung nicht. Nutze Chrome/Edge (Desktop/Android) oder den Aussprache-Modus.</p>}
        <div className="flex gap-2 justify-center">
          {!running ? (
            <button className="btn btn-primary px-8" onClick={start}>● Gespräch starten</button>
          ) : (
            <button className="btn px-8" onClick={stop}>■ Beenden</button>
          )}
        </div>
      </div>
    </div>
  );
}

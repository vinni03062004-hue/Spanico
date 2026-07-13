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
  const [notice, setNotice] = useState<string | null>(null);
  const [dbg, setDbg] = useState({ interim: 0, sent: 0 }); // Diagnose

  const recRef = useRef<SpanishRecognizer | null>(null);
  const sessionRef = useRef<string | undefined>();
  const stepRef = useRef(0);
  const speakingRef = useRef(false);
  const pendingRef = useRef("");            // letztes Zwischen-Transkript
  const silenceTimer = useRef<any>(null);   // löst nach kurzer Stille aus
  const processingRef = useRef(false);      // verhindert Doppel-Verarbeitung
  const runningRef = useRef(false);         // immer aktueller Status (gegen veraltete Closures)
  const scenarioRef = useRef<string | undefined>(undefined);
  useEffect(() => { scenarioRef.current = scenarioKey; }, [scenarioKey]);

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
          setDbg((d) => ({ ...d, interim: d.interim + 1 }));
          // Fallback: markiert der Browser nie "final" (z.B. Safari), lösen wir
          // nach kurzer Sprechpause selbst aus.
          pendingRef.current = t;
          if (silenceTimer.current) clearTimeout(silenceTimer.current);
          silenceTimer.current = setTimeout(() => {
            const txt = pendingRef.current.trim();
            pendingRef.current = "";
            if (txt) { setInterim(""); handleUser(txt, 0.6); }
          }, 1800);
        },
        onFinal: (t, conf) => {
          if (silenceTimer.current) clearTimeout(silenceTimer.current);
          pendingRef.current = "";
          setInterim("");
          handleUser(t, conf);
        },
        onState: (s) => { if (s === "error") setState("error"); },
        onError: (code) => {
          // Nur echte Probleme melden; kurz, dann weiter zuhören.
          const map: Record<string, string> = {
            "not-allowed": "Mikrofon nicht erlaubt — bitte im Browser die Mikrofon-Berechtigung für diese Seite erlauben.",
            "service-not-allowed": "Mikrofon blockiert — Berechtigung im Browser erlauben.",
            "audio-capture": "Kein Mikrofon gefunden.",
            "network": "Netzwerkproblem bei der Spracherkennung — nutze am besten Chrome.",
          };
          setNotice(map[code] || `Spracherkennung: ${code}. Für Sprache am besten Chrome (Desktop/Android) nutzen.`);
        },
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
    runningRef.current = true;
    setRunning(true);
    setState("listening");
    setNotice(null);
    rec.start();
    // Begrüßung LOKAL (kein KI-Aufruf -> spart eine Anfrage pro Gespräch).
    const sc = scenarios.find((s) => s.key === scenarioKey);
    const greeting = sc?.steps?.[0]?.coachLine || "¡Hola! ¿De qué quieres hablar hoy?";
    if (sc?.steps?.[0]) { setTask(sc.steps[0].prompt_de); setHint(sc.steps[0].hint || null); }
    setTranscript((t) => [...t, { role: "coach", text: greeting }]);
    speakingRef.current = true;
    setState("speaking");
    recRef.current?.setMuted(true);
    await speak(greeting, { onEnd: () => { speakingRef.current = false; } });
    recRef.current?.setMuted(false);
    setInterim("");
    setState("listening");
  }
  function stop() {
    runningRef.current = false;
    setRunning(false);
    recRef.current?.stop();
    cancelSpeech();
    setState("idle");
  }

  async function handleUser(text: string, conf: number) {
    if (!runningRef.current) return;
    // Sperre nur gegen Doppel-Verarbeitung (Echo ist über die Stummschaltung
    // abgedeckt); NICHT an speakingRef koppeln, damit nichts hängen bleibt.
    if (processingRef.current) return;
    processingRef.current = true;
    setDbg((d) => ({ ...d, sent: d.sent + 1 }));
    setTranscript((t) => [...t, { role: "user", text }]);
    setState("thinking");
    await coachTurn(text, conf);
    processingRef.current = false;
  }
  // Notweg: sendet manuell, was gerade erkannt wurde.
  function sendNow() {
    const txt = (pendingRef.current || interim).trim();
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    pendingRef.current = "";
    if (txt) { setInterim(""); handleUser(txt, 0.6); }
  }

  async function coachTurn(userSaid: string, conf = 0.6) {
    try {
      const res = await fetch("/api/conversation", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: sessionRef.current, scenarioKey: scenarioRef.current, stepIndex: stepRef.current, userSaid }),
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

      // KI spricht (menschliche Stimme via /api/tts, sonst Browser).
      // Mikro stummschalten, damit die eigene Stimme keine "Unterbrechung" auslöst.
      speakingRef.current = true;
      setState("speaking");
      recRef.current?.setMuted(true);
      await speak(res.reply, { onEnd: () => { speakingRef.current = false; } });
      recRef.current?.setMuted(false);
      setInterim("");
      if (runningRef.current) setState("listening");
    } catch {
      setState("error");
      setTranscript((t) => [...t, { role: "coach", text: "(Keine Antwort vom Server — Datenbank verbunden? Für echte freie Gespräche einen KI-Key setzen.)" }]);
      if (runningRef.current) setState("listening");
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
        {notice && <p className="text-warn text-sm text-center mb-2">{notice}</p>}
        <p className="text-[10px] text-muted/60 text-center mb-1">
          v5 (Auto-Fix) · Erkennung: {supported ? "ja" : "nein"} · erkannt: {dbg.interim} · gesendet: {dbg.sent}
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          {!running ? (
            <button className="btn btn-primary px-8" onClick={start}>● Gespräch starten</button>
          ) : (
            <>
              <button className="btn btn-primary px-6" onClick={sendNow}>▶︎ Antwort holen</button>
              <button className="btn px-6" onClick={stop}>■ Beenden</button>
            </>
          )}
        </div>
        {running && <p className="text-[11px] text-muted text-center mt-1">Sprich, mach kurz Pause — oder tippe „Antwort holen", falls nichts passiert.</p>}
      </div>
    </div>
  );
}

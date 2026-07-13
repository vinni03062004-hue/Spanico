"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { speak } from "@/lib/speech/client";

// Kurzer, aber kritischer Einstufungstest. Jede richtige Antwort hebt nur
// begrenzt; im Zweifel wird niedrig eingestuft (keine geschoenten Startlevel).
const VOCAB_Q = [
  { q: "Was bedeutet »la cuenta«?", options: ["die Rechnung", "das Konto-Tier", "die Straße"], correct: 0 },
  { q: "Was bedeutet »aunque«?", options: ["weil", "obwohl", "also"], correct: 1 },
  { q: "»tener ganas de« heißt …", options: ["müde sein", "Lust haben auf", "Angst haben"], correct: 1 },
];
const GRAMMAR_Q = [
  { q: "Wähle korrekt: »___ agua está fría.«", options: ["La", "El", "Los"], correct: 1 },
  { q: "»Acabo ___ llegar.«", options: ["de", "a", "en"], correct: 0 },
  { q: "»Salgo aunque ___ (llover).«", options: ["llueve", "llueva", "lloviendo"], correct: 1 },
];
const LISTEN_Q = [
  { say: "La estación está a la derecha.", q: "Was wurde gesagt?", options: ["Der Bahnhof ist rechts.", "Der Laden ist links.", "Das Café ist geschlossen."], correct: 0 },
  { say: "Quisiera un café con leche.", q: "Was wurde bestellt?", options: ["ein Wasser", "ein Milchkaffee", "die Rechnung"], correct: 1 },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState("alltag");
  const [weeklyMinutes, setWeekly] = useState(120);
  const [intensity, setIntensity] = useState("mittel");
  const [micConsent, setMic] = useState(true);
  const [dataConsent, setData] = useState(true);
  const [vAns, setVAns] = useState<number[]>([]);
  const [gAns, setGAns] = useState<number[]>([]);
  const [lAns, setLAns] = useState<number[]>([]);
  const [spontaneity, setSpont] = useState(20);
  const [freeProd, setFree] = useState(20);
  const [submitting, setSubmitting] = useState(false);

  const pct = (ans: number[], qs: { correct: number }[]) =>
    qs.length ? Math.round((ans.filter((a, i) => a === qs[i].correct).length / qs.length) * 100) : 0;

  async function finish() {
    setSubmitting(true);
    // Kritische Ableitung: richtige Quote leicht gedaempft (Unsicherheit einpreisen).
    const damp = (x: number) => Math.round(x * 0.85);
    const payload = {
      goal, nativeLanguage: "de", weeklyMinutes, intensity, micConsent, dataConsent,
      vocabBreadth: damp(pct(vAns, VOCAB_Q)),
      grammar: damp(pct(gAns, GRAMMAR_Q)),
      listening: damp(pct(lAns, LISTEN_Q)),
      pronunciation: Math.min(spontaneity, 30), // ohne Sprechprobe konservativ
      spontaneity: damp(spontaneity),
      freeProduction: damp(freeProd),
    };
    const res = await fetch("/api/profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    setSubmitting(false);
    if (res.ok) router.push("/dashboard");
  }

  const steps = ["Ziel & Zeit", "Wortschatz", "Grammatik", "Hörverstehen", "Sprechen", "Fertig"];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="h-title">Einstufung</h1>
        <p className="label">Mehrdimensionales Startprofil je Teilkompetenz — bewusst kritisch.</p>
        <div className="flex gap-1 mt-3">
          {steps.map((s, i) => (
            <div key={s} className={`meter flex-1 ${i <= step ? "" : "opacity-40"}`}><span style={{ width: i <= step ? "100%" : "0%" }} /></div>
          ))}
        </div>
      </div>

      {step === 0 && (
        <div className="card p-6 space-y-4">
          <div>
            <p className="label mb-2">Dein Hauptziel</p>
            <div className="grid grid-cols-2 gap-2">
              {[["alltag", "Alltag"], ["reisen", "Reisen"], ["arbeit", "Arbeit"], ["freiSprechen", "Frei sprechen"], ["pruefung", "Prüfung"]].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setGoal(v)} className={`btn ${goal === v ? "btn-primary" : ""}`}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="label mb-1">Wochenzeit: {weeklyMinutes} Min.</p>
            <input type="range" min={30} max={600} step={30} value={weeklyMinutes} onChange={(e) => setWeekly(+e.target.value)} className="w-full" />
          </div>
          <div>
            <p className="label mb-2">Intensität</p>
            <div className="flex gap-2">
              {["leicht", "mittel", "intensiv"].map((v) => (
                <button key={v} type="button" onClick={() => setIntensity(v)} className={`btn flex-1 ${intensity === v ? "btn-primary" : ""}`}>{v}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={micConsent} onChange={(e) => setMic(e.target.checked)} /> Mikrofon für Sprachmodus erlauben</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={dataConsent} onChange={(e) => setData(e.target.checked)} /> Speicherung von Lern- und Sprachdaten</label>
          </div>
        </div>
      )}

      {step === 1 && <Quiz title="Wortschatz" qs={VOCAB_Q} ans={vAns} setAns={setVAns} />}
      {step === 2 && <Quiz title="Grammatik" qs={GRAMMAR_Q} ans={gAns} setAns={setGAns} />}
      {step === 3 && (
        <div className="card p-6 space-y-5">
          <p className="label">Höre zu (Spanisch) und wähle die Bedeutung.</p>
          {LISTEN_Q.map((q, i) => (
            <div key={i} className="space-y-2">
              <button type="button" className="btn" onClick={() => speak(q.say)}>▶︎ Abspielen</button>
              <p>{q.q}</p>
              <div className="grid gap-2">
                {q.options.map((o, oi) => (
                  <button key={oi} type="button" onClick={() => setLAns((a) => { const n = [...a]; n[i] = oi; return n; })}
                    className={`btn justify-start ${lAns[i] === oi ? "btn-primary" : ""}`}>{o}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {step === 4 && (
        <div className="card p-6 space-y-5">
          <div>
            <p className="label mb-1">Wie spontan kannst du in einfachen Situationen reagieren? ({spontaneity})</p>
            <input type="range" min={0} max={100} value={spontaneity} onChange={(e) => setSpont(+e.target.value)} className="w-full" />
          </div>
          <div>
            <p className="label mb-1">Wie gut kannst du frei einfache Sätze bilden? ({freeProd})</p>
            <input type="range" min={0} max={100} value={freeProd} onChange={(e) => setFree(+e.target.value)} className="w-full" />
          </div>
          <p className="text-xs text-muted">Hinweis: Ohne Sprechprobe wird die Aussprache bewusst niedrig angesetzt und im Aussprache-Modus präzisiert.</p>
        </div>
      )}
      {step === 5 && (
        <div className="card p-6 text-center space-y-3">
          <p>Bereit. Dein Startprofil wird kritisch berechnet — Klassen steigen nur bei wiederholt gezeigter Kompetenz.</p>
          <button className="btn btn-primary" onClick={finish} disabled={submitting}>{submitting ? "…" : "Profil erstellen & starten"}</button>
        </div>
      )}

      <div className="flex justify-between mt-4">
        <button className="btn btn-ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Zurück</button>
        {step < 5 && <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>Weiter</button>}
      </div>
    </div>
  );
}

function Quiz({ title, qs, ans, setAns }: { title: string; qs: { q: string; options: string[] }[]; ans: number[]; setAns: (f: (a: number[]) => number[]) => void }) {
  return (
    <div className="card p-6 space-y-5">
      <p className="label">{title}</p>
      {qs.map((q, i) => (
        <div key={i} className="space-y-2">
          <p>{q.q}</p>
          <div className="grid gap-2">
            {q.options.map((o, oi) => (
              <button key={oi} type="button" onClick={() => setAns((a) => { const n = [...a]; n[i] = oi; return n; })}
                className={`btn justify-start ${ans[i] === oi ? "btn-primary" : ""}`}>{o}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

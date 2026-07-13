"use client";
import { useState } from "react";

// Werkzeuge direkt auf dem Dashboard: Wörter laden, alle übersetzen, Stimme testen.
// Damit man den Admin-Bereich nicht suchen muss.
export function VocabSetup({ onDone }: { onDone?: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState<{ processed: number; available: number } | null>(null);
  const [tts, setTts] = useState<any>(null);

  async function seed() {
    await loop("/api/seed", "Lade Grundwortschatz & Bilder …");
  }

  async function loop(url: string, label: string, delayMs = 0) {
    setBusy(true); setMsg(label); setProg(null);
    let offset: number | null = 0;
    try {
      while (offset !== null) {
        const r: any = await fetch(`${url}?offset=${offset}`, { method: "POST" }).then((x) => x.json());
        if (r.error) {
          // Bei Ratenlimit (429) kurz warten und automatisch weiterversuchen.
          if (/429|rate|quota/i.test(r.error)) { setMsg("Kurze Pause wegen Minuten-Limit … läuft gleich weiter."); await sleep(20000); continue; }
          setMsg("Fehler: " + r.error); break;
        }
        setProg({ processed: r.processed, available: r.available });
        offset = r.nextOffset;
        if (r.done) { setMsg(`✓ Fertig — ${(r.total ?? r.gesamt ?? "?")} Wörter in der Datenbank.`); onDone?.(); }
        else if (delayMs) await sleep(delayMs);
      }
    } catch { setMsg("Vorgang unterbrochen — bitte erneut versuchen."); }
    setBusy(false);
  }
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function testTts() {
    setTts(null); setBusy(true);
    try { setTts(await fetch("/api/tts/test").then((r) => r.json())); }
    catch { setTts({ ok: false, message: "Anfrage fehlgeschlagen" }); }
    setBusy(false);
  }

  return (
    <div className="card p-6 border-primary/40 space-y-4">
      <div>
        <h2 className="font-semibold text-lg mb-1">Wörter & Stimme</h2>
        <p className="label">Wörter laden, per KI übersetzen und die Sprachausgabe testen.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={seed} disabled={busy}>Grundwortschatz laden (Kern)</button>
        <button className="btn" onClick={() => loop("/api/enrich", "Übersetze alle 10.000 Wörter per KI (große Blöcke, nur ~25 Anfragen) … ein paar Minuten. Fenster offen lassen.", 4000)} disabled={busy}>Alle 10.000 übersetzen (KI)</button>
        <button className="btn" onClick={() => loop("/api/import-dict", "Importiere ~21.000 FreeDict-Wörter …")} disabled={busy}>21.000 importieren (FreeDict)</button>
        <button className="btn btn-ghost" onClick={testTts} disabled={busy}>🔊 Stimme testen</button>
      </div>
      {prog && (
        <div>
          <div className="meter"><span style={{ width: prog.available ? `${Math.round((prog.processed / prog.available) * 100)}%` : "0%" }} /></div>
          <p className="text-xs text-muted mt-1">{prog.available ? Math.round((prog.processed / prog.available) * 100) : 0}% · {prog.processed}/{prog.available}</p>
        </div>
      )}
      {msg && <p className="text-sm text-primary">{msg}</p>}
      {tts && (
        <div className={`rounded-xl p-3 border text-sm ${tts.ok ? "border-good/50 bg-good/10" : "border-bad/40 bg-bad/10"}`}>
          <p className="font-medium">{tts.ok ? `✓ Stimme funktioniert (${tts.provider}${tts.voice ? ", " + tts.voice : ""})` : `✗ Stimmen-Fehler (${tts.provider || "?"})`}</p>
          {tts.message && <p className="text-muted">{tts.message}</p>}
          {tts.hinweis && <p className="text-warn mt-1">→ {tts.hinweis}</p>}
        </div>
      )}
    </div>
  );
}

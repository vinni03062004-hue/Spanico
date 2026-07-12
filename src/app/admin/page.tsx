"use client";
import { useEffect, useState } from "react";

export default function Admin() {
  const [d, setD] = useState<any>(null);
  const [seedMsg, setSeedMsg] = useState("");
  const [imp, setImp] = useState<{ running: boolean; processed: number; available: number; total: number } | null>(null);
  const [tts, setTts] = useState<any>(null);
  const [ttsBusy, setTtsBusy] = useState(false);
  useEffect(() => { fetch("/api/admin").then((r) => r.json()).then(setD); }, []);
  async function testTts() {
    setTtsBusy(true); setTts(null);
    try { setTts(await fetch("/api/tts/test").then((r) => r.json())); }
    catch { setTts({ ok: false, message: "Anfrage fehlgeschlagen" }); }
    setTtsBusy(false);
  }
  async function seed() {
    setSeedMsg("…");
    const r = await fetch("/api/seed", { method: "POST" }).then((x) => x.json());
    setSeedMsg(`Vokabeln gesamt: ${r.gesamt}, Szenarien: ${r.szenarien}`);
  }
  // Einmaliger Import der ~21.000 FreeDict-Wörter, blockweise mit Fortschritt.
  // Landet dauerhaft in Neon — danach nie wieder nötig.
  async function importDict() {
    setImp({ running: true, processed: 0, available: 0, total: d?.vocabCount ?? 0 });
    let offset: number | null = 0;
    while (offset !== null) {
      const r: any = await fetch(`/api/import-dict?offset=${offset}`, { method: "POST" }).then((x) => x.json());
      if (r.error) { setImp((s) => s && { ...s, running: false }); setSeedMsg("Fehler: " + r.error); return; }
      setImp({ running: !r.done, processed: r.processed, available: r.available, total: r.total });
      offset = r.nextOffset;
    }
  }
  return (
    <div className="space-y-4">
      <h1 className="h-title">Admin & Debug</h1>
      <div className="card p-5 flex items-center justify-between">
        <div><p className="font-medium">Datenbank befüllen (Grundwortschatz)</p><p className="label">Seed-Vokabeln & Szenarien (idempotent). Aktuell: {d?.vocabCount ?? "…"} Vokabeln.</p></div>
        <button className="btn btn-primary" onClick={seed}>Seed ausführen</button>
      </div>
      {seedMsg && <p className="text-sm text-good">{seedMsg}</p>}

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div><p className="font-medium">Sprachausgabe testen (Google/WaveNet)</p><p className="label">Prüft, ob dein TTS-Key funktioniert — sonst mit genauem Hinweis.</p></div>
          <button className="btn btn-primary" onClick={testTts} disabled={ttsBusy}>{ttsBusy ? "…" : "Stimme testen"}</button>
        </div>
        {tts && (
          <div className={`mt-3 rounded-xl p-3 border text-sm ${tts.ok ? "border-good/50 bg-good/10" : "border-bad/40 bg-bad/10"}`}>
            <p className="font-medium">{tts.ok ? `✓ Funktioniert (Anbieter: ${tts.provider}${tts.voice ? ", " + tts.voice : ""})` : `✗ Fehler (Anbieter: ${tts.provider || "?"})`}</p>
            {tts.status && <p className="text-muted">Status {tts.status}</p>}
            {tts.message && <p className="text-muted">{tts.message}</p>}
            {tts.hinweis && <p className="text-warn mt-1">→ {tts.hinweis}</p>}
          </div>
        )}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Großer Wortschatz — ~21.000 Wörter (FreeDict)</p>
            <p className="label">Einmalig. Wird dauerhaft in der Datenbank gespeichert — danach nie wieder nötig.</p>
          </div>
          <button className="btn btn-primary" onClick={importDict} disabled={imp?.running}>
            {imp?.running ? "Importiere…" : "21.000 Wörter importieren"}
          </button>
        </div>
        {imp && (
          <div className="mt-3">
            <div className="meter"><span style={{ width: imp.available ? `${Math.round((imp.processed / imp.available) * 100)}%` : "0%" }} /></div>
            <p className="text-xs text-muted mt-1">
              {imp.running ? "Läuft… " : "Fertig. "}
              {imp.processed}/{imp.available || "?"} verarbeitet · {imp.total} Vokabeln in der DB
            </p>
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-2">Fehlerraten je Modus</h2>
        <div className="space-y-1 text-sm">
          {d?.modes?.map((m: any) => (
            <div key={m.mode} className="flex justify-between"><span>{m.mode}</span><span className="text-muted">{m.count} Versuche · Ø {m.avgScore} · {m.errors} Fehler</span></div>
          )) ?? <p className="label">Noch keine Daten.</p>}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-2">Speech-Konfidenzen</h2>
        <div className="space-y-1 text-sm">
          {d?.speech?.map((s: any, i: number) => (
            <div key={i} className="flex justify-between border-b border-line pb-1">
              <span>{s.mode}: „{s.heard}"</span>
              <span className={s.uncertain ? "text-warn" : "text-muted"}>{s.band} · {Math.round(s.conf * 100)}%</span>
            </div>
          )) ?? null}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-2">Modellaufrufe (Trace)</h2>
        <div className="space-y-1 text-sm">
          {d?.traces?.map((t: any, i: number) => (
            <div key={i} className="flex justify-between"><span>{t.kind} · {t.provider}</span><span className="text-muted">{t.latencyMs}ms {t.ok ? "✓" : "✗"}</span></div>
          )) ?? null}
        </div>
      </div>
    </div>
  );
}

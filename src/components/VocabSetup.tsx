"use client";
import { useState } from "react";

// Prominenter Bereich zum Laden der Vokabeln (Grundwortschatz + großer Import).
// Erscheint auf dem Dashboard und in leeren Modulen, damit der Button nicht
// versteckt ist.
export function VocabSetup({ onDone }: { onDone?: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [imp, setImp] = useState<{ processed: number; available: number } | null>(null);

  async function seed() {
    setBusy(true); setMsg("Lade Grundwortschatz …");
    try {
      const r = await fetch("/api/seed", { method: "POST" }).then((x) => x.json());
      setMsg(`✓ ${r.gesamt} Vokabeln geladen.`);
      onDone?.();
    } catch { setMsg("Fehler beim Laden — Datenbank verbunden?"); }
    setBusy(false);
  }

  async function importBig() {
    setBusy(true); setMsg("Importiere ~21.000 Wörter … das kann 1–2 Minuten dauern.");
    let offset: number | null = 0;
    try {
      while (offset !== null) {
        const r: any = await fetch(`/api/import-dict?offset=${offset}`, { method: "POST" }).then((x) => x.json());
        if (r.error) { setMsg("Fehler: " + r.error); break; }
        setImp({ processed: r.processed, available: r.available });
        offset = r.nextOffset;
        if (r.done) { setMsg(`✓ Fertig — ${r.total} Vokabeln in der Datenbank.`); onDone?.(); }
      }
    } catch { setMsg("Import unterbrochen — bitte erneut versuchen."); }
    setBusy(false);
  }

  return (
    <div className="card p-6 border-primary/40">
      <h2 className="font-semibold text-lg mb-1">Vokabeln laden</h2>
      <p className="label mb-4">Einmalig — die Wörter bleiben danach dauerhaft in deiner Datenbank.</p>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={seed} disabled={busy}>Grundwortschatz laden (~275)</button>
        <button className="btn" onClick={importBig} disabled={busy}>21.000 Wörter importieren</button>
      </div>
      {imp && (
        <div className="mt-3">
          <div className="meter"><span style={{ width: imp.available ? `${Math.round((imp.processed / imp.available) * 100)}%` : "0%" }} /></div>
          <p className="text-xs text-muted mt-1">{imp.processed}/{imp.available} verarbeitet</p>
        </div>
      )}
      {msg && <p className="text-sm mt-3 text-primary">{msg}</p>}
    </div>
  );
}

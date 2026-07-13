"use client";
import { useEffect, useState } from "react";

export default function Admin() {
  const [d, setD] = useState<any>(null);
  const [seedMsg, setSeedMsg] = useState("");
  const [imp, setImp] = useState<{ running: boolean; processed: number; available: number; total: number } | null>(null);
  const [tts, setTts] = useState<any>(null);
  const [ttsBusy, setTtsBusy] = useState(false);
  const [browse, setBrowse] = useState<any>(null);
  const [cat, setCat] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  useEffect(() => { fetch("/api/admin").then((r) => r.json()).then(setD); }, []);
  async function loadBrowse(category?: string | null, q?: string) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (q) params.set("q", q);
    const r = await fetch("/api/vocab/browse?" + params.toString()).then((x) => x.json());
    setBrowse(r);
  }
  async function testTts() {
    setTtsBusy(true); setTts(null);
    try { setTts(await fetch("/api/tts/test").then((r) => r.json())); }
    catch { setTts({ ok: false, message: "Anfrage fehlgeschlagen" }); }
    setTtsBusy(false);
  }
  const [img, setImg] = useState<any>(null);
  const [imgBusy, setImgBusy] = useState(false);
  async function testImage() {
    setImgBusy(true); setImg(null);
    try { setImg(await fetch("/api/image/test").then((r) => r.json())); }
    catch { setImg({ ok: false, message: "Anfrage fehlgeschlagen" }); }
    setImgBusy(false);
  }
  async function seed() {
    let offset: number | null = 0;
    try {
      while (offset !== null) {
        const r: any = await fetch(`/api/seed?offset=${offset}`, { method: "POST" }).then((x) => x.json());
        setSeedMsg(`${Math.round((r.processed / r.available) * 100)}% (${r.phase}) …`);
        offset = r.nextOffset;
        if (r.done) setSeedMsg(`Fertig — ${r.gesamt} Vokabeln in der Datenbank.`);
      }
    } catch { setSeedMsg("Fehler — bitte erneut versuchen."); }
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
  // KI-Übersetzung der kompletten 10.000-Wörter-Liste (braucht Gemini- oder Anthropic-Key).
  async function enrichAll() {
    setImp({ running: true, processed: 0, available: 10000, total: d?.vocabCount ?? 0 });
    let offset: number | null = 0;
    while (offset !== null) {
      const r: any = await fetch(`/api/enrich?offset=${offset}`, { method: "POST" }).then((x) => x.json());
      if (r.error) { setImp((s) => s && { ...s, running: false }); setSeedMsg("Fehler: " + r.error); return; }
      setImp({ running: !r.done, processed: r.processed, available: r.available, total: r.total });
      offset = r.nextOffset;
    }
  }
  return (
    <div className="space-y-4">
      <h1 className="h-title">Admin & Debug</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4"><p className="label">Gespeicherte Stimmen (Cache)</p><p className="text-2xl font-semibold">{d?.audioCache ?? "…"}</p><p className="text-xs text-muted">so viele Sätze kosten künftig 0 Zeichen</p></div>
        <div className="card p-4"><p className="label">Gespeicherte KI-Bilder (Cache)</p><p className="text-2xl font-semibold">{d?.imageCache ?? "…"}</p><p className="text-xs text-muted">einmal erzeugt, danach gratis</p></div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div><p className="font-medium">Vokabeln in der Datenbank</p><p className="label">Zeigt, welche Wörter mit Übersetzung drin sind — nach Kategorien.</p></div>
          <button className="btn btn-primary" onClick={() => loadBrowse(null)}>Übersicht laden</button>
        </div>
        {browse && (
          <div className="mt-3 space-y-3">
            <p className="text-sm">Gesamt: <b>{browse.total}</b> Wörter · {browse.categories.length} Kategorien</p>
            <form onSubmit={(e) => { e.preventDefault(); setCat(null); loadBrowse(null, search); }} className="flex gap-2">
              <input className="input" placeholder="Suche (spanisch oder deutsch)…" value={search} onChange={(e) => setSearch(e.target.value)} />
              <button className="btn" type="submit">Suchen</button>
            </form>
            <div className="flex flex-wrap gap-1">
              {browse.categories.map((c: any) => (
                <button key={c.category} onClick={() => { setCat(c.category); setSearch(""); loadBrowse(c.category); }}
                  className={`chip ${cat === c.category ? "border-primary text-primary" : ""}`}>{c.category} ({c.count})</button>
              ))}
            </div>
            {browse.words?.length > 0 && (
              <div className="max-h-80 overflow-y-auto border border-line rounded-xl divide-y divide-line">
                {browse.words.map((w: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-3 py-1.5 text-sm">
                    <span>{w.imageEmoji ? w.imageEmoji + " " : ""}<b>{w.lemma}</b> — {w.meaningDe}</span>
                    <span className="text-muted text-xs">{w.pos} · {w.category} · Stufe {w.frequencyTier}</span>
                  </div>
                ))}
                {browse.limited && <p className="text-xs text-muted px-3 py-1">… nur die ersten 500 angezeigt.</p>}
              </div>
            )}
            {(cat || search) && browse.words?.length === 0 && <p className="label">Keine Treffer.</p>}
          </div>
        )}
      </div>
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
          <div><p className="font-medium">KI-Bildgenerierung testen</p><p className="label">Prüft, ob echte Bilder erzeugt werden können — sonst mit genauem Grund.</p></div>
          <button className="btn btn-primary" onClick={testImage} disabled={imgBusy}>{imgBusy ? "…" : "Bild testen"}</button>
        </div>
        {img && (
          <div className={`mt-3 rounded-xl p-3 border text-sm ${img.ok ? "border-good/50 bg-good/10" : "border-bad/40 bg-bad/10"}`}>
            <p className="font-medium">{img.ok ? "✓ Bildgenerierung funktioniert" : "✗ Bildgenerierung nicht möglich"}</p>
            {img.keyVar && <p className="text-muted">Key: {img.keyVar} = {img.keyPreview}</p>}
            {img.modelVar && <p className="text-muted">GEMINI_IMAGE_MODEL: {img.modelVar}</p>}
            {img.model && <p className="text-muted">Modell: {img.model}</p>}
            {img.message && <p className="text-muted">{img.message}</p>}
            {img.proModelle?.length ? (
              <div className="text-muted text-xs mt-1">{img.proModelle.map((r: string, i: number) => <p key={i}>• {r}</p>)}</div>
            ) : null}
            {img.verfuegbareBildmodelle?.length ? <p className="text-muted text-xs mt-1">Verfügbar: {img.verfuegbareBildmodelle.join(", ")}</p> : null}
            {img.hinweis && <p className="text-warn mt-1">→ {img.hinweis}</p>}
          </div>
        )}
      </div>

      <div className="card p-5 border-accent/40">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Alle 10.000 Wörter übersetzen (KI)</p>
            <p className="label">Übersetzt die komplette Frequenzliste automatisch ins Deutsche. Braucht einen Gemini- oder Anthropic-Key. Läuft einige Minuten, dann dauerhaft gespeichert.</p>
          </div>
          <button className="btn btn-primary" onClick={enrichAll} disabled={imp?.running}>{imp?.running ? "…" : "Alle übersetzen"}</button>
        </div>
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

"use client";
import { useEffect, useState } from "react";

export default function Fortschritt() {
  const [p, setP] = useState<any>(null);
  useEffect(() => { fetch("/api/progress").then((r) => r.json()).then(setP); }, []);
  if (!p) return <p className="label">Lädt…</p>;
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div><h1 className="h-title">Fortschritt</h1><p className="label">Mehrdimensional, kritisch, transparent.</p></div>
        <div className="card px-5 py-3 text-right"><p className="label">Sprachklasse</p><p className="text-xl font-semibold text-primary">{p.band}</p></div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-3">Alle Teilkompetenzen</h2>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
          {p.dims.map((d: any) => (
            <div key={d.key}>
              <div className="flex justify-between text-sm mb-1"><span>{d.label}</span><span className="text-muted">{Math.round(d.value)} · Stab. {Math.round(d.stability * 100)}%</span></div>
              <div className="meter"><span style={{ width: `${d.value}%`, opacity: 0.4 + d.stability * 0.6 }} /></div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted mt-3">Die Balken-Deckkraft zeigt die Stabilität: unsichere, einmalige Erfolge erscheinen blasser und heben die Klasse nicht.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5"><h2 className="font-semibold mb-2">Stärkste Felder</h2>{p.strongest.map((s: any) => <div key={s.label} className="flex justify-between text-sm"><span>{s.label}</span><span className="text-good">{Math.round(s.value)}</span></div>)}</div>
        <div className="card p-5"><h2 className="font-semibold mb-2">Schwächste Felder</h2>{p.weakest.map((s: any) => <div key={s.label} className="flex justify-between text-sm"><span>{s.label}</span><span className="text-warn">{Math.round(s.value)}</span></div>)}</div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-2">Empfehlungen</h2>
        <ul className="space-y-1 text-sm">{p.recommendations.map((r: string, i: number) => <li key={i} className="flex gap-2"><span className="text-primary">▸</span>{r}</li>)}</ul>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";

interface Data {
  recent: { id: string; label: string; detail?: string; mode: string; lemma?: string; meaningDe?: string; createdAt: string }[];
  categories: { key: string; label: string; count: number }[];
}
export default function Fehler() {
  const [d, setD] = useState<Data | null>(null);
  useEffect(() => { fetch("/api/errors").then((r) => r.json()).then(setD); }, []);
  return (
    <div className="space-y-4">
      <h1 className="h-title">Fehlergedächtnis</h1>
      <p className="label">Nicht nur, dass etwas falsch war — sondern welche Fehlerart. Steuert Wiederholung und Prüfungshärte.</p>
      <div className="card p-5">
        <h2 className="font-semibold mb-3">Fehlerarten</h2>
        {d?.categories?.length ? (
          <div className="space-y-2">
            {d.categories.map((c) => (
              <div key={c.key}>
                <div className="flex justify-between text-sm mb-1"><span>{c.label}</span><span className="text-muted">{c.count}×</span></div>
                <div className="meter"><span style={{ width: `${Math.min(100, c.count * 12)}%` }} /></div>
              </div>
            ))}
          </div>
        ) : <p className="label">Noch keine Fehler — weiter so.</p>}
      </div>
      <div className="card p-5">
        <h2 className="font-semibold mb-3">Zuletzt</h2>
        <div className="space-y-2 text-sm">
          {d?.recent?.map((e) => (
            <div key={e.id} className="flex justify-between border-b border-line pb-2">
              <span><span className="chip mr-2">{e.label}</span>{e.lemma ? <b>{e.lemma}</b> : e.detail}</span>
              <span className="text-muted">{e.mode}</span>
            </div>
          )) ?? null}
        </div>
      </div>
    </div>
  );
}

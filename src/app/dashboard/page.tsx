"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { VocabSetup } from "@/components/VocabSetup";

interface Progress {
  band: string;
  dims: { key: string; label: string; value: number; stability: number }[];
  strongest: { label: string; value: number }[];
  weakest: { label: string; value: number }[];
  topErrors: { category: string; count: number }[];
  masteredStable: number;
  dueNow: number;
  recommendations: string[];
  vocabTotal: number;
}

const MODULES: [string, string, string][] = [
  ["/vokabeln", "Vokabeln", "Aktiver Abruf + Spacing"],
  ["/bilder", "Bilder", "Bedeutung über Bildanker"],
  ["/aussprache", "Aussprache", "Laut- & Prosodieanalyse"],
  ["/shadowing", "Shadowing", "Nachsprechen & Timing"],
  ["/jarvis", "Jarvis", "Freies Live-Gespräch"],
  ["/hoeren", "Hören", "Hörverstehen"],
  ["/satzbau", "Satzbau", "Aktive Produktion"],
  ["/konjugation", "Konjugation", "Endungen trainieren"],
  ["/pruefung", "Prüfung", "Hart & ehrlich"],
];

export default function Dashboard() {
  const [p, setP] = useState<Progress | null>(null);
  useEffect(() => { fetch("/api/progress").then((r) => r.json()).then(setP).catch(() => {}); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="h-title">Dashboard</h1>
          <p className="label">Dein aktueller Stand — mehrdimensional und kritisch.</p>
        </div>
        <div className="card px-5 py-3 text-right">
          <p className="label">Sprachklasse</p>
          <p className="text-xl font-semibold text-primary">{p?.band ?? "…"}</p>
        </div>
      </div>

      {p && p.vocabTotal === 0 && (
        <VocabSetup onDone={() => fetch("/api/progress").then((r) => r.json()).then(setP)} />
      )}

      <div className="grid sm:grid-cols-3 gap-3">
        <Stat label="Fällige Wiederholungen" value={p?.dueNow ?? 0} href="/vokabeln" />
        <Stat label="Stabil beherrscht" value={p?.masteredStable ?? 0} />
        <Stat label="Offene Fehlerarten" value={p?.topErrors?.length ?? 0} href="/fehler" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-semibold mb-3">Teilkompetenzen</h2>
          <div className="space-y-2">
            {p?.dims?.map((d) => (
              <div key={d.key}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{d.label}</span>
                  <span className="text-muted">{Math.round(d.value)} · Stab. {Math.round(d.stability * 100)}%</span>
                </div>
                <div className="meter"><span style={{ width: `${d.value}%`, opacity: 0.4 + d.stability * 0.6 }} /></div>
              </div>
            )) ?? <p className="label">lädt…</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold mb-2">Empfehlung für diese Woche</h2>
            <ul className="space-y-1 text-sm">
              {p?.recommendations?.map((r, i) => <li key={i} className="flex gap-2"><span className="text-primary">▸</span>{r}</li>)}
            </ul>
          </div>
          <div className="card p-5">
            <h2 className="font-semibold mb-2">Häufigste Fehlerarten</h2>
            {p?.topErrors?.length ? (
              <ul className="space-y-1 text-sm">
                {p.topErrors.map((e) => <li key={e.category} className="flex justify-between"><span>{e.category}</span><span className="text-muted">{e.count}×</span></li>)}
              </ul>
            ) : <p className="label">Noch keine Fehler erfasst.</p>}
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Lernmodule</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MODULES.map(([href, title, sub]) => (
            <Link key={href} href={href} className="card p-4 hover:border-primary/60 hover:shadow-glow transition">
              <p className="font-medium">{title}</p>
              <p className="label mt-1">{sub}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const inner = (
    <div className="card p-5">
      <p className="label">{label}</p>
      <p className="text-3xl font-semibold mt-1">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

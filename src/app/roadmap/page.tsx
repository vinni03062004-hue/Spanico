"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Tilt } from "@/components/Tilt";

interface Chapter { key: string; title: string; desc: string; count: number }

// Zentrale Lern-Roadmap im Schatzkarten-Stil: Stationen (Kapitel), durch die man
// sich Insel für Insel arbeitet. Jede Station öffnet Übungen für ihr Thema.
export default function Roadmap() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/vocab/practice").then((r) => r.json()).then((d) => setChapters(d.chapters || [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h1 className="h-title text-3xl">🗺️ Deine Lern-Insel</h1>
        <p className="label mt-1">Arbeite dich Station für Station vor — von der Küste bis ins Landesinnere.</p>
      </div>

      <div className="map-bg p-5 sm:p-8">
        {chapters.length === 0 ? (
          <p className="label text-center py-10">Lädt… (falls leer: erst „Grundwortschatz laden" im Dashboard).</p>
        ) : (
          <div className="relative">
            {chapters.map((c, n) => {
              const side = n % 2 === 0;
              const active = c.count > 0;
              return (
                <div key={c.key} className="relative">
                  <div className={`flex items-center gap-3 mb-1 ${side ? "justify-start" : "justify-end flex-row-reverse"}`}>
                    <Tilt className="shrink-0">
                      <button
                        onClick={() => active && setOpen(open === n ? null : n)}
                        className={`station ${active ? (open === n ? "done" : "") : "locked"}`}
                        title={c.title}
                      >
                        {active ? n + 1 : "🔒"}
                      </button>
                    </Tilt>
                    <div className={`${side ? "text-left" : "text-right"} max-w-[60%]`}>
                      <p className="font-semibold leading-tight">{c.title}</p>
                      <p className="text-xs text-muted">{c.desc} · {c.count} Wörter</p>
                    </div>
                  </div>

                  {/* Verbindungspfad (gepunktet) */}
                  {n < chapters.length - 1 && (
                    <div className="flex justify-center gap-2 py-1 opacity-70">
                      <span className="path-dot" /><span className="path-dot" /><span className="path-dot" />
                    </div>
                  )}

                  {/* Stations-Hub: Übungen für dieses Thema */}
                  {open === n && active && (
                    <div className="card p-4 my-2 mx-auto max-w-md">
                      <p className="font-medium mb-2">{c.title} — womit üben?</p>
                      <div className="grid grid-cols-3 gap-2">
                        <Link className="btn btn-primary text-sm" href={`/vokabeln?chapter=${n}`}>Vokabeln</Link>
                        <Link className="btn text-sm" href={`/bilder?chapter=${n}`}>Bilder</Link>
                        <Link className="btn text-sm" href={`/aussprache?chapter=${n}`}>Aussprache</Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-muted text-center">Jarvis (freies Sprechen) ist bewusst nicht Teil der Roadmap — dort redest du frei über alles.</p>
    </div>
  );
}

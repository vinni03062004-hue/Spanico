// Übersetzt die komplette Frequenzliste (es_all.ts, 10.000 Wörter) automatisch
// ins Deutsche — zuverlässig per KI (Anthropic). Läuft in Blöcken; der Client
// (Admin) ruft die Route wiederholt mit steigendem offset auf (Fortschritt).
// Ergebnis wird dauerhaft in der Datenbank gespeichert.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/apiUser";
import { ALL_ES } from "@/data/es_all";

export const maxDuration = 60;
// Viele Wörter pro Anfrage = wenige Anfragen (schont das Tageslimit RPD).
// 400 Wörter/Anfrage -> ~25 Anfragen für alle 10.000. Begrenzt durch die
// max. Ausgabelänge (~8k Token), nicht durch die 250k Token/Minute.
const BATCH = 400;

function rankToTier(rank: number): number {
  if (rank <= 150) return 1;
  if (rank <= 400) return 2;
  if (rank <= 800) return 3;
  if (rank <= 1500) return 4;
  if (rank <= 2500) return 5;
  if (rank <= 4000) return 6;
  if (rank <= 6000) return 8;
  if (rank <= 10000) return 12;
  return 20;
}

const SYS_TRANS =
  "Du übersetzt spanische Wörter ins Deutsche. Antworte NUR mit striktem JSON-Objekt {\"spanischesWort\":\"deutsche Bedeutung\"}. Bedeutung kurz halten. Bei mehreren Sinnen die häufigsten mit ' / ' trennen. Verben in der passenden Form.";

function parseObj(text: string): Record<string, string> {
  try { return JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)); } catch { return {}; }
}

async function translateBatch(words: string[]): Promise<Record<string, string>> {
  const gemini = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  const anthropic = process.env.ANTHROPIC_API_KEY;

  if (gemini) {
    const model = process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${gemini}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: SYS_TRANS + "\n\nWörter: " + JSON.stringify(words) }] }],
        generationConfig: { maxOutputTokens: 8192, temperature: 0.2 },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error("gemini " + res.status + " " + body.slice(0, 300));
    }
    const data = await res.json();
    return parseObj(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}");
  }

  if (anthropic) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": anthropic, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5", max_tokens: 8000, system: SYS_TRANS, messages: [{ role: "user", content: JSON.stringify(words) }] }),
    });
    if (!res.ok) throw new Error("anthropic " + res.status);
    const data = await res.json();
    return parseObj(data?.content?.[0]?.text ?? "{}");
  }

  throw new Error("kein KI-Key");
}

export async function POST(req: NextRequest) {
  const u = await requireUser();
  if ("error" in u) return u.error;

  const hasKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!hasKey) {
    return NextResponse.json({ error: "Kein KI-Key gesetzt. Trage einen kostenlosen GEMINI_API_KEY (Google AI Studio) in Vercel ein — dann funktioniert die KI-Übersetzung." }, { status: 400 });
  }

  const offset = Math.max(0, Number(new URL(req.url).searchParams.get("offset") || 0));
  const slice = ALL_ES.slice(offset, offset + BATCH);
  if (!slice.length) {
    const total = await prisma.vocabularyEntry.count();
    return NextResponse.json({ ok: true, done: true, nextOffset: null, processed: ALL_ES.length, available: ALL_ES.length, total });
  }

  // Nur noch nicht vorhandene Wörter übersetzen (spart Zeit & Kosten).
  const existing = new Set(
    (await prisma.vocabularyEntry.findMany({ where: { lemma: { in: slice } }, select: { lemma: true } })).map((e) => e.lemma)
  );
  const todo = slice.filter((w) => !existing.has(w));

  let imported = 0;
  if (todo.length) {
    try {
      const map = await translateBatch(todo);
      const rows = todo
        .map((w) => ({ w, de: (map[w] || "").toString().trim() }))
        .filter((x) => x.de)
        .map((x, i) => ({
          lemma: x.w, pos: "?", meaningDe: x.de, explanationEs: "", examples: [],
          category: "import", frequencyTier: rankToTier(offset + i + 1), layer: "thematisch",
          collocations: [], confusables: [], pronTargets: [],
        }));
      if (rows.length) {
        await prisma.vocabularyEntry.createMany({ data: rows as any, skipDuplicates: true });
        imported = rows.length;
      }
    } catch (e: any) {
      return NextResponse.json({ error: "Übersetzung fehlgeschlagen: " + (e?.message || e) }, { status: 502 });
    }
  }

  const total = await prisma.vocabularyEntry.count();
  const nextOffset = offset + BATCH;
  const done = nextOffset >= ALL_ES.length;
  return NextResponse.json({ ok: true, imported, processed: Math.min(nextOffset, ALL_ES.length), available: ALL_ES.length, total, nextOffset: done ? null : nextOffset, done });
}

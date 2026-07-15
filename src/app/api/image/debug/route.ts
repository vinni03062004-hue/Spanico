// Diagnose: zeigt für ein Wort, WONACH die Bildsuche tatsächlich sucht.
// Aufruf im Browser (eingeloggt), z.B.:
//   /api/image/debug?word=zumo&meaning=Saft
//   /api/image/debug?meaning=Saft
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/apiUser";

function clean(s: string): string {
  return (s || "").replace(/["'.\n\r]/g, " ").replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
}

async function mymemory(text: string, pair: string): Promise<{ text: string | null; raw: string }> {
  try {
    const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${pair}`);
    const j = await r.json();
    const raw = j?.responseData?.translatedText || "";
    const t = clean(raw);
    const bad = !t || t.length > 60 || /no query|invalid|mymemory|please/i.test(t) || t.toLowerCase() === text.toLowerCase();
    return { text: bad ? null : t, raw };
  } catch (e: any) { return { text: null, raw: `Fehler: ${e?.message}` }; }
}

async function gemini(de: string, es: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: `Translate to a short, concrete English noun phrase (1-3 words) naming the depictable object, for a photo search. German: "${de}". Spanish: "${es}". Reply with ONLY the English word(s), no punctuation.` }] }], generationConfig: { temperature: 0, maxOutputTokens: 16 } }),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const t = clean(j?.candidates?.[0]?.content?.parts?.[0]?.text || "");
    return t.length >= 2 && t.length <= 60 ? t : null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const u = await requireUser();
  if ("error" in u) return u.error;
  const url = new URL(req.url);
  const word = (url.searchParams.get("word") || "").trim();
  const meaning = (url.searchParams.get("meaning") || "").trim();

  const geminiOut = await gemini(meaning, word);
  const esOut = word ? await mymemory(word, "es|en") : { text: null, raw: "(kein spanisches Wort übergeben)" };
  const deOut = meaning ? await mymemory(meaning, "de|en") : { text: null, raw: "(kein deutsches Wort übergeben)" };
  const chosen = geminiOut || esOut.text || deOut.text || meaning || word;

  const out: any = {
    eingabe: { spanisch: word, deutsch: meaning },
    uebersetzung: {
      gemini: geminiOut || "(kein Gemini-Key oder kein Ergebnis)",
      mymemory_es_en: esOut.text || `(verworfen) roh: ${esOut.raw}`,
      mymemory_de_en: deOut.text || `(verworfen) roh: ${deOut.raw}`,
      VERWENDETER_SUCHBEGRIFF: chosen,
    },
  };

  const q = encodeURIComponent(chosen);
  const px = process.env.PIXABAY_API_KEY;
  out.quelle = px ? "Pixabay (Key aktiv)" : "Openverse (kein Pixabay-Key)";
  try {
    if (px) {
      const r = await fetch(`https://pixabay.com/api/?key=${px}&q=${q}&image_type=photo&per_page=6&safesearch=true&order=popular`);
      const j = await r.json().catch(() => ({}));
      out.pixabay = { status: r.status, treffer: (j?.hits || []).slice(0, 6).map((h: any) => h.tags) };
    } else {
      const r = await fetch(`https://api.openverse.org/v1/images/?q=${q}&page_size=6`, { headers: { "User-Agent": "Spanico/1.0" } });
      const j = await r.json().catch(() => ({}));
      out.openverse = { status: r.status, treffer: (j?.results || []).slice(0, 6).map((h: any) => h.title) };
    }
  } catch (e: any) { out.suchfehler = e?.message; }

  return NextResponse.json(out, { headers: { "cache-control": "no-store" } });
}

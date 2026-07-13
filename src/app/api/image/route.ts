// Bedarfsgesteuerte KI-Bildgenerierung mit dauerhaftem Cache.
// GET /api/image?word=casa&meaning=Haus
//  -> liefert ein PNG. Beim ersten Mal wird es via Gemini erzeugt und gespeichert;
//     danach kommt es aus der Datenbank (keine neue Anfrage/Kosten).
// Ohne Gemini-Key oder bei Fehler: 404 -> der Bildmodus zeigt weiter das Emoji.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/apiUser";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const u = await requireUser();
  if ("error" in u) return u.error;

  const url = new URL(req.url);
  const word = (url.searchParams.get("word") || "").trim().toLowerCase();
  const meaning = (url.searchParams.get("meaning") || "").trim();
  if (!word) return new NextResponse(null, { status: 400 });

  // 1) Cache
  try {
    const row = await prisma.imageCache.findUnique({ where: { key: word } });
    if (row?.data) {
      return new NextResponse(Buffer.from(row.data as any), {
        headers: { "content-type": row.contentType, "x-cache": "db", "cache-control": "public, max-age=31536000" },
      });
    }
  } catch { /* Tabelle evtl. noch nicht da */ }

  // 2) Erzeugen (nur wenn Gemini-Key vorhanden)
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) return new NextResponse(null, { status: 404 });

  // Mehrere mögliche Bildmodelle durchprobieren (Namen ändern sich bei Google).
  const models = [process.env.GEMINI_IMAGE_MODEL, "gemini-2.5-flash-image", "gemini-2.5-flash-image-preview", "gemini-2.0-flash-preview-image-generation"].filter(Boolean) as string[];
  const prompt = `Eine einfache, klare, farbige Illustration von: ${meaning || word} ("${word}" auf Spanisch). Kindgerechter, freundlicher Stil, ein einzelnes zentrales Motiv, schlichter heller Hintergrund, KEIN Text, keine Buchstaben.`;

  try {
    let img: any = null;
    for (const model of models) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("[image]", model, res.status, body.slice(0, 200));
        continue; // nächstes Modell versuchen
      }
      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      img = parts.find((p: any) => p.inlineData?.data);
      if (img) break;
    }
    if (!img) { return new NextResponse(null, { status: 404 }); }

    const buf = Buffer.from(img.inlineData.data, "base64");
    const ct = img.inlineData.mimeType || "image/png";
    try {
      await prisma.imageCache.create({ data: { key: word, contentType: ct, data: buf } });
    } catch { /* Duplikat/Tabelle fehlt */ }
    return new NextResponse(buf, {
      headers: { "content-type": ct, "x-cache": "miss", "cache-control": "public, max-age=31536000" },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}

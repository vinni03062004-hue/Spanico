// Serverseitige Dialog- und Feedback-Engine.
// Nutzt Anthropic (oder OpenAI), wenn ein Key gesetzt ist. Ohne Key laeuft
// ein deterministischer Regel-Coach als Fallback, damit die App IMMER funktioniert.
//
// WICHTIG: API-Keys werden ausschliesslich serverseitig aus process.env gelesen
// und niemals an den Client gegeben.

export interface CoachContext {
  scenarioTitle: string;
  stepPromptDe: string;
  targetsEs: string[];
  userSaid: string;
  memory: {
    zielwoerter?: string[];
    letzteFehler?: string[];
    korrekturen?: string[];
  };
  level: string; // aktuelles Skill-Band
}

export interface CoachResult {
  reply: string; // spanische Coach-Antwort (wird per TTS gesprochen)
  correction?: string; // kurze Korrektur (falls noetig)
  ruleHint?: string; // knappe Regel/Intuition
  goodExample?: string; // richtig-Beispiel
  matchedTargets: string[];
  provider: string;
}

const SYSTEM = `Du bist ein anspruchsvoller, menschlich klingender Spanisch-Sprachcoach fuer eine deutschsprachige Person.
Regeln:
- Antworte primaer auf Spanisch, natuerlich und gespraechig, nicht abgehackt.
- Korrigiere NICHT aggressiv jeden Satz. Gib kurzes, ehrliches Feedback nur bei relevanten Fehlern.
- Passe Schwierigkeit an das angegebene Niveau an.
- Streue gezielt Zielwoerter ein.
- Wenn du unsicher bist, sage das statt scheinpraezise zu urteilen.
Gib striktes JSON zurueck mit Feldern: reply, correction, ruleHint, goodExample.`;

export async function runCoach(ctx: CoachContext): Promise<CoachResult> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

  console.log(`[coach] keys: gemini=${!!geminiKey} anthropic=${!!anthropicKey} openai=${!!openaiKey}`);

  if (geminiKey) {
    try {
      return await viaGemini(ctx, geminiKey);
    } catch (e: any) {
      console.error("[coach] gemini failed -> fallback:", e?.message || e);
    }
  }
  if (anthropicKey) {
    try {
      return await viaAnthropic(ctx, anthropicKey);
    } catch (e) {
      // Fallback bei Fehler
    }
  }
  if (openaiKey) {
    try {
      return await viaOpenAI(ctx, openaiKey);
    } catch (e) {}
  }
  console.warn("[coach] using rule fallback (kein KI-Key aktiv oder alle fehlgeschlagen)");
  return ruleCoach(ctx);
}

// Google Gemini (kostenloser Free-Tier über Google AI Studio).
async function viaGemini(ctx: CoachContext, key: string): Promise<CoachResult> {
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const userText = SYSTEM + "\n\nKontext (JSON): " + JSON.stringify({ szenario: ctx.scenarioTitle, aufgabe: ctx.stepPromptDe, zielphrasen: ctx.targetsEs, niveau: ctx.level, gedaechtnis: ctx.memory, nutzer_sagte: ctx.userSaid });
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: userText }] }],
        // Erzwingt sauberes JSON -> zuverlaessiges Parsen der Felder.
        generationConfig: { temperature: 0.7, responseMimeType: "application/json" },
      }),
    }
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[coach] gemini HTTP", res.status, body.slice(0, 180));
    throw new Error("gemini " + res.status);
  }
  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const parsed = safeJson(text);
  // Falls kein JSON-"reply": Klartext der Antwort direkt verwenden (statt festem Satz).
  let reply: string = typeof parsed.reply === "string" ? parsed.reply : "";
  if (!reply) {
    reply = text.replace(/```[a-z]*|```/gi, "").replace(/^\s*\{[\s\S]*\}\s*$/, "").trim();
  }
  if (!reply) reply = "¿Puedes contarme un poco más?";
  console.log(`[coach] gemini ok · userSaid="${ctx.userSaid.slice(0, 40)}" · reply="${reply.slice(0, 50)}"`);
  return {
    reply,
    correction: parsed.correction,
    ruleHint: parsed.ruleHint,
    goodExample: parsed.goodExample,
    matchedTargets: matched(ctx),
    provider: "gemini",
  };
}

async function viaAnthropic(ctx: CoachContext, key: string): Promise<CoachResult> {
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  const user = JSON.stringify({
    szenario: ctx.scenarioTitle,
    aufgabe: ctx.stepPromptDe,
    zielphrasen: ctx.targetsEs,
    niveau: ctx.level,
    gedaechtnis: ctx.memory,
    nutzer_sagte: ctx.userSaid,
  });
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      system: SYSTEM,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error("anthropic " + res.status);
  const data = await res.json();
  const text = data?.content?.[0]?.text ?? "{}";
  const parsed = safeJson(text);
  return {
    reply: parsed.reply || "¿Puedes repetirlo, por favor?",
    correction: parsed.correction,
    ruleHint: parsed.ruleHint,
    goodExample: parsed.goodExample,
    matchedTargets: matched(ctx),
    provider: "anthropic",
  };
}

async function viaOpenAI(ctx: CoachContext, key: string): Promise<CoachResult> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: JSON.stringify(ctx) },
      ],
    }),
  });
  if (!res.ok) throw new Error("openai " + res.status);
  const data = await res.json();
  const parsed = safeJson(data?.choices?.[0]?.message?.content ?? "{}");
  return {
    reply: parsed.reply || "Vale, sigamos.",
    correction: parsed.correction,
    ruleHint: parsed.ruleHint,
    goodExample: parsed.goodExample,
    matchedTargets: matched(ctx),
    provider: "openai",
  };
}

// Deterministischer Fallback-Coach: fuehrt durch das Szenario, prueft Zielphrasen,
// gibt knappes Feedback. Kein echter LLM, aber immer verfuegbar & offline-tauglich.
function ruleCoach(ctx: CoachContext): CoachResult {
  const m = matched(ctx);
  const said = ctx.userSaid.trim();
  let reply: string;
  let correction: string | undefined;
  let ruleHint: string | undefined;
  let goodExample: string | undefined;

  if (!said) {
    reply = "Te escucho. Cuando quieras, dilo en español.";
  } else if (m.length > 0) {
    reply = pick([
      "¡Muy bien! " + coachContinue(ctx),
      "Perfecto. " + coachContinue(ctx),
      "Genial, eso suena natural. " + coachContinue(ctx),
    ]);
  } else {
    // Kein Ziel getroffen -> sanfter Hinweis, ohne den Fluss zu zerstoeren.
    reply = "Entiendo. " + coachContinue(ctx);
    if (ctx.targetsEs[0]) {
      correction = `Prueba con: "${ctx.targetsEs[0]}"`;
      goodExample = ctx.targetsEs[0];
      ruleHint = "Nutze die Schluesselphrase der Situation.";
    }
  }
  return { reply, correction, ruleHint, goodExample, matchedTargets: m, provider: "rule" };
}

function coachContinue(ctx: CoachContext): string {
  return pick([
    "¿Y algo más?",
    "Cuéntame un poco más.",
    "¿Qué más necesitas?",
    "Sigamos entonces.",
  ]);
}

function matched(ctx: CoachContext): string[] {
  const said = normalize(ctx.userSaid);
  return ctx.targetsEs.filter((t) => {
    const key = normalize(t).split(" ").slice(0, 2).join(" ");
    return said.includes(normalize(t)) || (key && said.includes(key));
  });
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[¿?¡!.,]/g, "").trim();
}
function safeJson(s: string): any {
  try {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    return JSON.parse(s.slice(start, end + 1));
  } catch {
    return {};
  }
}
function pick<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

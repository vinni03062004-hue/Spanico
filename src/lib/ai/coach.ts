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

// Einmal ermitteltes, funktionierendes Chat-Modell (pro Warm-Instanz gecacht).
let RESOLVED_CHAT_MODEL: string | null = null;

// Verfügbare Text-Modelle des Keys ermitteln (flash/lite bevorzugt -> hohe Gratis-Limits).
async function listChatModels(key: string): Promise<string[]> {
  try {
    const lm = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=200`).then((r) => r.json());
    const names = (lm?.models || [])
      .filter((m: any) => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m: any) => (m.name || "").replace("models/", ""))
      .filter((n: string) => n && !n.includes("image") && !n.includes("embedding") && !n.includes("vision") && !n.includes("tts") && !n.includes("audio"));
    const rank = (n: string) => (n.includes("lite") ? 0 : n.includes("flash") ? 1 : 2);
    names.sort((a: string, b: string) => rank(a) - rank(b));
    return names;
  } catch { return []; }
}

// Ein Gemini-Modell aufrufen. Gibt Status + geparste Felder zurück.
async function callGemini(model: string, key: string, userText: string, json = true): Promise<{ status: number; reply?: string; parsed?: any }> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: userText }] }],
      generationConfig: json ? { temperature: 0.7, responseMimeType: "application/json" } : { temperature: 0.7 },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[coach] ${model} HTTP ${res.status} ${body.slice(0, 140)}`);
    // Manche Modelle unterstützen responseMimeType nicht -> einmal ohne wiederholen.
    if (res.status === 400 && json) return callGemini(model, key, userText, false);
    return { status: res.status };
  }
  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const parsed = safeJson(text);
  let reply: string = typeof parsed.reply === "string" ? parsed.reply : "";
  if (!reply) reply = text.replace(/```[a-z]*|```/gi, "").replace(/^\s*\{[\s\S]*\}\s*$/, "").trim();
  return { status: 200, reply, parsed };
}

// Google Gemini: probiert mehrere Modelle, nimmt das erste mit Kontingent.
async function viaGemini(ctx: CoachContext, key: string): Promise<CoachResult> {
  const userText = SYSTEM + "\n\nKontext (JSON): " + JSON.stringify({ szenario: ctx.scenarioTitle, aufgabe: ctx.stepPromptDe, zielphrasen: ctx.targetsEs, niveau: ctx.level, gedaechtnis: ctx.memory, nutzer_sagte: ctx.userSaid });

  // Reihenfolge: zuletzt funktionierendes, dann eingestelltes, dann bewährte Fallbacks.
  let candidates = [RESOLVED_CHAT_MODEL, process.env.GEMINI_MODEL, "gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash-lite", "gemini-1.5-flash-latest"].filter(Boolean) as string[];
  candidates = Array.from(new Set(candidates));

  let sawQuota = false;
  for (const model of candidates) {
    const r = await callGemini(model, key, userText);
    if (r.status === 200) {
      RESOLVED_CHAT_MODEL = model;
      const reply = r.reply || "¿Puedes contarme un poco más?";
      console.log(`[coach] gemini ok (${model}) · userSaid="${ctx.userSaid.slice(0, 40)}" · reply="${reply.slice(0, 50)}"`);
      return { reply, correction: r.parsed?.correction, ruleHint: r.parsed?.ruleHint, goodExample: r.parsed?.goodExample, matchedTargets: matched(ctx), provider: `gemini:${model}` };
    }
    if (r.status === 429) sawQuota = true;
  }

  // Alle bekannten Modelle blockiert -> verfügbare Modelle des Keys ermitteln und durchprobieren.
  const discovered = (await listChatModels(key)).filter((m) => !candidates.includes(m));
  console.log(`[coach] entdecke Modelle: ${discovered.slice(0, 8).join(", ")}`);
  for (const model of discovered) {
    const r = await callGemini(model, key, userText);
    if (r.status === 200) {
      RESOLVED_CHAT_MODEL = model;
      const reply = r.reply || "¿Puedes contarme un poco más?";
      console.log(`[coach] gemini ok via Discovery (${model})`);
      return { reply, correction: r.parsed?.correction, ruleHint: r.parsed?.ruleHint, goodExample: r.parsed?.goodExample, matchedTargets: matched(ctx), provider: `gemini:${model}` };
    }
    if (r.status === 429) sawQuota = true;
  }
  throw new Error("gemini alle Modelle" + (sawQuota ? " 429 (Kontingent)" : " Fehler"));
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

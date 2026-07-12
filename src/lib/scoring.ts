// Kritische, mehrdimensionale Bewertung + strenge Skill-Baender.
// Grundsatz: Einmalige Erfolge zaehlen wenig. Wiederholte, kontextuebergreifende
// Erfolge zaehlen mehr. Unsichere Antworten zaehlen geringer. Scores koennen
// auch sinken oder stagnieren.

export const DIMENSIONS = [
  "pronunciation",
  "fluency",
  "vocabBreadth",
  "vocabDepth",
  "grammar",
  "listening",
  "reactivity",
  "dialogStability",
  "imageSituation",
  "transfer",
] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export const DIMENSION_LABELS: Record<Dimension, string> = {
  pronunciation: "Aussprache",
  fluency: "Fluessigkeit",
  vocabBreadth: "Wortschatzbreite",
  vocabDepth: "Wortschatztiefe",
  grammar: "Grammatikgenauigkeit",
  listening: "Hoerverstehen",
  reactivity: "Reaktionsfaehigkeit",
  dialogStability: "Dialogstabilitaet",
  imageSituation: "Bild-/Situationskompetenz",
  transfer: "Aktive Transferfaehigkeit",
};

// Interne, granulare Skill-Baender (strenger als CEFR, nicht inflationaer).
export const BANDS = [
  "Novice unstable",
  "Novice functional",
  "Basic communicator",
  "Basic communicator stable",
  "Emerging conversational",
  "Conversational limited",
  "Conversational stable",
  "Advanced functional",
  "Advanced natural",
  "Highly reliable",
] as const;
export type Band = (typeof BANDS)[number];

export interface ScoreState {
  value: number; // 0..100
  stability: number; // 0..1
}

// Aktualisiert einen Score kritisch:
// - Erfolg hebt nur, wenn wiederholt/stabil; ein Einzelerfolg mit niedriger
//   Stabilitaet bewegt wenig.
// - Unsichere Antworten (confidence niedrig) zaehlen gedaempft.
// - Fehler senken spuerbar (Score darf sinken).
export function updateScore(
  s: ScoreState,
  opts: { correct: boolean; confidence: number; contextNovel: boolean }
): ScoreState {
  const { correct, confidence, contextNovel } = opts;
  let { value, stability } = s;

  if (correct) {
    const weight = confidence * (contextNovel ? 1.3 : 1); // Transfer zaehlt mehr
    const gain = weight * (1 - value / 100) * 8; // abnehmender Grenznutzen
    value = clamp(value + gain);
    stability = clamp01(stability + 0.12 * confidence);
  } else {
    value = clamp(value - 6 - 4 * confidence); // sicher-falsch kostet mehr
    stability = clamp01(stability - 0.18);
  }
  return { value, stability };
}

// Gesamt-Band: nur wenn genug Dimensionen hoch UND stabil sind.
// Verhindert, dass rezeptive Staerke produktive Schwaeche verdeckt.
export function computeBand(scores: Record<Dimension, ScoreState>): Band {
  const vals = DIMENSIONS.map((d) => scores[d]?.value ?? 0);
  const stabs = DIMENSIONS.map((d) => scores[d]?.stability ?? 0);
  const avg = mean(vals);
  const minCore = Math.min(
    scores.pronunciation?.value ?? 0,
    scores.grammar?.value ?? 0,
    scores.fluency?.value ?? 0,
    scores.transfer?.value ?? 0
  );
  const avgStab = mean(stabs);

  // Effektiver Wert wird durch das schwaechste Kernfeld und die Stabilitaet gebremst.
  const eff = 0.5 * avg + 0.3 * minCore + 20 * avgStab;

  const idx = Math.min(
    BANDS.length - 1,
    Math.max(0, Math.floor((eff / 100) * (BANDS.length - 0.01)))
  );
  return BANDS[idx];
}

// Aussprache-Aehnlichkeit (fuer Aussprache-/Shadowing-Modus).
// Kombiniert Levenshtein auf normalisierten Phonemapproximationen.
export function pronunciationSimilarity(target: string, recognized: string): number {
  const a = phon(target);
  const b = phon(recognized);
  if (!a.length) return 0;
  const dist = levenshtein(a, b);
  return clamp01(1 - dist / Math.max(a.length, b.length)) ;
}

// Gestuftes Aussprache-Feedback statt bloßem Score.
export function pronunciationBand(sim: number, sttConfidence: number): { band: string; uncertain: boolean } {
  const uncertain = sttConfidence < 0.5;
  let band: string;
  if (sim >= 0.9) band = "schnell verstaendlich";
  else if (sim >= 0.75) band = "verstaendlich mit auffaelligen Lautproblemen";
  else if (sim >= 0.55) band = "semantisch erfasst, aber Aussprache unsauber";
  else band = "problematisch fuer reales Verstehen";
  if (uncertain) band = "sehr unsicher erkannt";
  return { band, uncertain };
}

// ---- Hilfsfunktionen ----
function phon(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zñ ]/g, "")
    .replace(/qu/g, "k")
    .replace(/c([ei])/g, "s$1")
    .replace(/c/g, "k")
    .replace(/z/g, "s")
    .replace(/v/g, "b")
    .replace(/h/g, "")
    .replace(/ll/g, "y")
    .replace(/j/g, "x")
    .replace(/\s+/g, "")
    .trim();
}
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return dp[m][n];
}
const clamp = (x: number) => Math.max(0, Math.min(100, x));
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const mean = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

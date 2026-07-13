// Spacing / Wiederholungsplanung.
// Erweiterte SM-2-Variante: beruecksichtigt Antwortqualitaet, Sicherheit,
// Reaktionszeit und Fehlerhaeufigkeit (Lapses) statt reinem richtig/falsch.

export interface ReviewState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
}

export interface GradeInput {
  correct: boolean;
  confidence: number; // 0..1 Selbst-/Systemsicherheit
  responseMs: number; // Reaktionszeit
}

// Bildet Leistung auf SM-2-Qualitaet 0..5 ab.
export function toQuality({ correct, confidence, responseMs }: GradeInput): number {
  if (!correct) return confidence > 0.6 ? 2 : 1; // sicher-falsch schlimmer als geraten-falsch
  // korrekt: Basis 3, Bonus fuer Sicherheit und schnelle Reaktion
  let q = 3;
  if (confidence >= 0.85) q += 1;
  if (responseMs > 0 && responseMs < 4000) q += 1;
  return Math.min(5, q);
}

export function nextReview(state: ReviewState, grade: GradeInput, now = new Date()): ReviewState & { dueAt: Date } {
  const q = toQuality(grade);
  let { easeFactor, intervalDays, repetitions, lapses } = state;

  if (q < 3) {
    // Fehler: zuruecksetzen, Lapse zaehlen, Ease reduzieren.
    repetitions = 0;
    intervalDays = 1;
    lapses += 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 3;
    else intervalDays = Math.round(intervalDays * easeFactor);
    easeFactor = Math.max(
      1.3,
      easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    );
  }

  const dueAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  return { easeFactor, intervalDays, repetitions, lapses, dueAt };
}

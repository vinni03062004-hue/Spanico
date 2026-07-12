// Mehrstufige Mastery-Logik.
// Ein Inhalt gilt NICHT schon als gelernt, wenn er einmal erkannt wurde.
// Erst mehrere Nachweise in unterschiedlichen Kontexten heben den Status.

export type Evidence =
  | "recognized"
  | "understood"
  | "reproduced"
  | "usedInSentence"
  | "usedInDialog"
  | "delayedRecall"
  | "transferred";

export const EVIDENCE_ORDER: Evidence[] = [
  "recognized",
  "understood",
  "reproduced",
  "usedInSentence",
  "usedInDialog",
  "delayedRecall",
  "transferred",
];

export interface MasteryFlags {
  recognized: boolean;
  understood: boolean;
  reproduced: boolean;
  usedInSentence: boolean;
  usedInDialog: boolean;
  delayedRecall: boolean;
  transferred: boolean;
}

export function emptyMastery(): MasteryFlags {
  return {
    recognized: false,
    understood: false,
    reproduced: false,
    usedInSentence: false,
    usedInDialog: false,
    delayedRecall: false,
    transferred: false,
  };
}

// Liefert Mastery-Level 0..7 (Anzahl belegter Nachweise).
export function masteryLevel(f: MasteryFlags): number {
  return EVIDENCE_ORDER.reduce((n, k) => n + (f[k] ? 1 : 0), 0);
}

// Ein Wort gilt erst als "stabil", wenn mind. 4 Nachweise erbracht sind,
// darunter mindestens ein produktiver (Satz oder Dialog) und ein zeitverzoegerter.
export function isStable(f: MasteryFlags): boolean {
  const productive = f.usedInSentence || f.usedInDialog;
  return masteryLevel(f) >= 4 && productive && f.delayedRecall;
}

export function label(level: number): string {
  return (
    [
      "unbekannt",
      "erkannt",
      "verstanden",
      "wiedergegeben",
      "im Satz benutzt",
      "im Dialog benutzt",
      "verzoegert abgerufen",
      "transferiert",
    ][level] || "unbekannt"
  );
}

// Wendet einen neuen Nachweis an. Ein einzelner Erfolg reicht nicht:
// ein Nachweis wird erst gesetzt, wenn er tatsaechlich korrekt erbracht wurde.
export function applyEvidence(f: MasteryFlags, ev: Evidence, correct: boolean): MasteryFlags {
  if (!correct) return f;
  return { ...f, [ev]: true };
}

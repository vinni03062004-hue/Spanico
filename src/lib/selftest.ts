// Eingebaute Selbsttests der Kern-Lernlogik (ohne DB / Netzwerk).
// Start:  npm test
import { nextReview, toQuality } from "./srs";
import { emptyMastery, applyEvidence, masteryLevel, isStable } from "./mastery";
import { updateScore, computeBand, pronunciationSimilarity, pronunciationBand } from "./scoring";
import { classifyTextError } from "./errors";

let passed = 0;
let failed = 0;
function ok(name: string, cond: boolean) {
  if (cond) { passed++; console.log("  ✓", name); }
  else { failed++; console.error("  ✗", name); }
}

console.log("SRS / Spacing");
ok("richtige+sichere Antwort -> Qualitaet 5", toQuality({ correct: true, confidence: 0.9, responseMs: 1500 }) === 5);
ok("falsche Antwort -> Wiederholung 1 Tag", nextReview({ easeFactor: 2.5, intervalDays: 10, repetitions: 3, lapses: 0 }, { correct: false, confidence: 0.7, responseMs: 3000 }).intervalDays === 1);
ok("Erfolg erhoeht Intervall", nextReview({ easeFactor: 2.5, intervalDays: 3, repetitions: 2, lapses: 0 }, { correct: true, confidence: 0.9, responseMs: 1000 }).intervalDays > 3);

console.log("Mastery");
let m = emptyMastery();
["recognized", "understood", "reproduced", "usedInSentence"].forEach((e) => (m = applyEvidence(m, e as any, true)));
ok("4 Nachweise -> Level 4", masteryLevel(m) === 4);
ok("ohne delayedRecall nicht stabil", isStable(m) === false);
m = applyEvidence(m, "delayedRecall", true);
ok("mit produktivem + verzoegertem Nachweis -> stabil", isStable(m) === true);
ok("falscher Nachweis zaehlt nicht", masteryLevel(applyEvidence(emptyMastery(), "recognized", false)) === 0);

console.log("Scoring / Baender");
let s = { value: 0, stability: 0 };
for (let i = 0; i < 6; i++) s = updateScore(s, { correct: true, confidence: 0.9, contextNovel: i % 2 === 0 });
ok("wiederholter Erfolg hebt Score", s.value > 20);
ok("Fehler senkt Score", updateScore({ value: 50, stability: 0.5 }, { correct: false, confidence: 0.8, contextNovel: false }).value < 50);
const lowScores = Object.fromEntries(["pronunciation","fluency","vocabBreadth","vocabDepth","grammar","listening","reactivity","dialogStability","imageSituation","transfer"].map((d) => [d, { value: 5, stability: 0 }])) as any;
ok("niedrige Werte -> Novice unstable", computeBand(lowScores) === "Novice unstable");

console.log("Aussprache");
ok("identisch -> Aehnlichkeit 1", pronunciationSimilarity("hola", "hola") === 1);
ok("aehnlich -> hoher Score", pronunciationSimilarity("gracias", "grasias") > 0.7);
ok("unsichere STT -> markiert", pronunciationBand(0.95, 0.2).uncertain === true);

console.log("Fehlerklassifikation");
ok("leere Antwort -> Abbruch", classifyTextError("hola", "") === "abbruch");
ok("falscher Artikel -> Genusfehler", classifyTextError("el agua", "la agua") === "genus");
ok("Wortreihenfolge -> Wortstellung", classifyTextError("no lo sé", "lo no sé") === "wortstellung");

console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen.`);
if (failed > 0) process.exit(1);

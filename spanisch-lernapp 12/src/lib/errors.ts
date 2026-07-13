// Fehlerkategorien (Fehlergedaechtnis). Zentral fuer adaptive Lernsteuerung.

export const ERROR_CATEGORIES = {
  aussprache: "Aussprachefehler",
  bedeutung: "Bedeutungsverwechslung",
  genus: "Artikel-/Genusfehler",
  konjugation: "Verbkonjugationsfehler",
  praeposition: "Falsche Praeposition",
  wortstellung: "Wortstellungsfehler",
  wortschatz: "Zu wenig Wortschatz",
  transfer_l1: "Uebertragung aus der Muttersprache",
  hoerverstehen: "Hoerverstehensfehler",
  kollokation: "Falsche Kollokation",
  unsicherheit: "Unsicherheitsfehler",
  abbruch: "Gespraechsabbruch / zu lange Reaktionszeit",
} as const;

export type ErrorCategory = keyof typeof ERROR_CATEGORIES;

// Heuristische Fehlerklassifikation fuer Texteingaben (DE-Lerner -> ES).
// Bewusst konservativ: im Zweifel "unsicherheit", nie scheinpraezise.
export function classifyTextError(expected: string, answer: string): ErrorCategory {
  const e = norm(expected);
  const a = norm(answer);
  if (!a) return "abbruch";

  const eTok = e.split(" ");
  const aTok = a.split(" ");

  // Genus / Artikel
  const artRe = /\b(el|la|los|las|un|una|unos|unas)\b/;
  if (artRe.test(e) && artRe.test(a)) {
    const ea = e.match(artRe)?.[0];
    const aa = a.match(artRe)?.[0];
    if (ea && aa && ea !== aa) return "genus";
  }

  // Praeposition
  const prep = /\b(a|de|en|con|por|para|sin|sobre|entre|hasta|desde)\b/g;
  const ep = (e.match(prep) || []).join(" ");
  const ap = (a.match(prep) || []).join(" ");
  if (ep && ep !== ap) return "praeposition";

  // Gleiche Woerter, andere Reihenfolge -> Wortstellung
  if ([...eTok].sort().join(" ") === [...aTok].sort().join(" ") && e !== a)
    return "wortstellung";

  // Verbendungen (grobe Heuristik fuer Konjugation)
  const verbEnd = /(o|as|a|amos|an|es|e|emos|en|i|iste|io|imos|ieron|ar|er|ir)$/;
  const lastE = eTok[eTok.length - 1];
  const lastA = aTok[aTok.length - 1];
  if (lastE && lastA && stem(lastE) === stem(lastA) && lastE !== lastA && verbEnd.test(lastE))
    return "konjugation";

  // Zu kurze Antwort -> zu wenig Wortschatz
  if (aTok.length < Math.max(1, eTok.length - 2)) return "wortschatz";

  // Sonst Bedeutungs-/Wortwahlproblem, wenn deutlich abweichend
  const overlap = aTok.filter((t) => eTok.includes(t)).length / Math.max(1, eTok.length);
  if (overlap < 0.4) return "bedeutung";

  return "unsicherheit";
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // Akzente entfernen fuer Vergleich
    .replace(/[.,!?¿¡;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function stem(w: string): string {
  return w.replace(/(o|as|a|amos|an|es|e|emos|en|i|iste|io|imos|ieron|ar|er|ir)$/, "");
}

// Didaktischer Lehrplan (Roadmap): thematische Kapitel, von leicht nach schwer.
// Jedes Kapitel bündelt passende Wortschatz-Kategorien.
export interface Chapter { key: string; title: string; desc: string; categories: string[] }

export const CURRICULUM: Chapter[] = [
  { key: "begruessung", title: "Begrüßung & Höflichkeit", desc: "Hallo, danke, bitte, Verabschiedung", categories: ["begruessung", "hoeflichkeit", "gespraech"] },
  { key: "basis", title: "Basiswörter", desc: "Ja, nein, Fragewörter, Pronomen", categories: ["basis", "pronomen", "fragen"] },
  { key: "zahlen", title: "Zahlen", desc: "Zählen von null bis tausend", categories: ["zahlen"] },
  { key: "farben", title: "Farben", desc: "Die wichtigsten Farben", categories: ["farben"] },
  { key: "zeit", title: "Zeit & Uhrzeit", desc: "Tage, Uhrzeit, heute/morgen", categories: ["zeit"] },
  { key: "familie", title: "Familie & Menschen", desc: "Mutter, Vater, Freunde …", categories: ["familie", "menschen"] },
  { key: "essen", title: "Essen & Trinken", desc: "Lebensmittel, Getränke", categories: ["essen_trinken"] },
  { key: "restaurant", title: "Im Café & Restaurant", desc: "Bestellen, Rechnung, höflich fragen", categories: ["restaurant"] },
  { key: "einkaufen", title: "Einkaufen", desc: "Preise, Geld, Läden", categories: ["einkaufen"] },
  { key: "wege", title: "Nach dem Weg fragen", desc: "Links, rechts, wo ist …?", categories: ["orientierung", "reise", "orte"] },
  { key: "koerper", title: "Körper & Gesundheit", desc: "Körperteile, beim Arzt", categories: ["koerper", "gesundheit"] },
  { key: "kleidung", title: "Kleidung", desc: "Was man trägt", categories: ["kleidung"] },
  { key: "wohnen", title: "Zuhause & Wohnen", desc: "Räume, Möbel, Wohnung", categories: ["wohnen"] },
  { key: "natur", title: "Natur & Wetter", desc: "Tiere, Wetter, Landschaft", categories: ["natur"] },
  { key: "arbeit", title: "Arbeit & Schule", desc: "Beruf, Büro, Unterricht", categories: ["arbeit", "fitness"] },
  { key: "verben", title: "Wichtige Verben", desc: "Die häufigsten Tätigkeiten", categories: ["verben"] },
  { key: "grammatik", title: "Verbindungswörter & Grammatik", desc: "weil, obwohl, Präpositionen", categories: ["grammatik", "adverb", "chunks"] },
  { key: "alltag", title: "Alltag & Ausdrücke", desc: "Nützliche Wendungen", categories: ["alltag", "adjektive", "situativ"] },
  { key: "haeufig", title: "Häufigste Wörter", desc: "Die wichtigsten Wörter aus echten Gesprächen", categories: ["haeufig"] },
  { key: "rest", title: "Großer Wortschatz", desc: "Alle weiteren Wörter (importiert/übersetzt)", categories: ["import", "freedict", "bild"] },
];

// Konjugations-Engine.
// Regelmäßige -ar/-er/-ir-Verben werden algorithmisch korrekt gebildet.
// Häufige unregelmäßige Verben stehen als geprüfte Tabelle (damit nie falsche
// Formen gelehrt werden). Nicht abgedeckte Kombinationen liefern null.

export type Tense = "presente" | "preterito" | "imperfecto" | "futuro";
export const TENSES: Tense[] = ["presente", "preterito", "imperfecto", "futuro"];
export const TENSE_LABEL: Record<Tense, string> = {
  presente: "Presente (Gegenwart)",
  preterito: "Pretérito indefinido (abgeschl. Vergangenheit)",
  imperfecto: "Imperfecto (Verlaufsvergangenheit)",
  futuro: "Futuro (Zukunft)",
};

export const PERSONS = ["yo", "tú", "él/ella", "nosotros", "vosotros", "ellos"] as const;
export type PersonIndex = 0 | 1 | 2 | 3 | 4 | 5;

// Regelmäßige Endungen
const REG = {
  ar: {
    presente: ["o", "as", "a", "amos", "áis", "an"],
    preterito: ["é", "aste", "ó", "amos", "asteis", "aron"],
    imperfecto: ["aba", "abas", "aba", "ábamos", "abais", "aban"],
  },
  er: {
    presente: ["o", "es", "e", "emos", "éis", "en"],
    preterito: ["í", "iste", "ió", "imos", "isteis", "ieron"],
    imperfecto: ["ía", "ías", "ía", "íamos", "íais", "ían"],
  },
  ir: {
    presente: ["o", "es", "e", "imos", "ís", "en"],
    preterito: ["í", "iste", "ió", "imos", "isteis", "ieron"],
    imperfecto: ["ía", "ías", "ía", "íamos", "íais", "ían"],
  },
} as const;
const FUT = ["é", "ás", "á", "emos", "éis", "án"]; // an Infinitiv angehängt

// Verben, die sich (in diesen Zeiten) regelmäßig verhalten -> sicher generierbar.
export const REGULAR_VERBS = [
  "hablar", "trabajar", "estudiar", "comprar", "tomar", "llegar", "necesitar", "escuchar", "ayudar", "viajar",
  "comer", "aprender", "beber", "correr", "vender", "comprender",
  "vivir", "escribir", "abrir", "recibir", "decidir",
];

// Unregelmäßige, häufige Verben — vollständig ausgeschriebene, geprüfte Formen.
type Table = Partial<Record<Tense, string[]>>;
export const IRREGULAR: Record<string, Table> = {
  ser: {
    presente: ["soy", "eres", "es", "somos", "sois", "son"],
    preterito: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
    imperfecto: ["era", "eras", "era", "éramos", "erais", "eran"],
    futuro: ["seré", "serás", "será", "seremos", "seréis", "serán"],
  },
  estar: {
    presente: ["estoy", "estás", "está", "estamos", "estáis", "están"],
    preterito: ["estuve", "estuviste", "estuvo", "estuvimos", "estuvisteis", "estuvieron"],
    imperfecto: ["estaba", "estabas", "estaba", "estábamos", "estabais", "estaban"],
    futuro: ["estaré", "estarás", "estará", "estaremos", "estaréis", "estarán"],
  },
  tener: {
    presente: ["tengo", "tienes", "tiene", "tenemos", "tenéis", "tienen"],
    preterito: ["tuve", "tuviste", "tuvo", "tuvimos", "tuvisteis", "tuvieron"],
    imperfecto: ["tenía", "tenías", "tenía", "teníamos", "teníais", "tenían"],
    futuro: ["tendré", "tendrás", "tendrá", "tendremos", "tendréis", "tendrán"],
  },
  ir: {
    presente: ["voy", "vas", "va", "vamos", "vais", "van"],
    preterito: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
    imperfecto: ["iba", "ibas", "iba", "íbamos", "ibais", "iban"],
    futuro: ["iré", "irás", "irá", "iremos", "iréis", "irán"],
  },
  hacer: {
    presente: ["hago", "haces", "hace", "hacemos", "hacéis", "hacen"],
    preterito: ["hice", "hiciste", "hizo", "hicimos", "hicisteis", "hicieron"],
    imperfecto: ["hacía", "hacías", "hacía", "hacíamos", "hacíais", "hacían"],
    futuro: ["haré", "harás", "hará", "haremos", "haréis", "harán"],
  },
  poder: {
    presente: ["puedo", "puedes", "puede", "podemos", "podéis", "pueden"],
    preterito: ["pude", "pudiste", "pudo", "pudimos", "pudisteis", "pudieron"],
    imperfecto: ["podía", "podías", "podía", "podíamos", "podíais", "podían"],
    futuro: ["podré", "podrás", "podrá", "podremos", "podréis", "podrán"],
  },
  querer: {
    presente: ["quiero", "quieres", "quiere", "queremos", "queréis", "quieren"],
    preterito: ["quise", "quisiste", "quiso", "quisimos", "quisisteis", "quisieron"],
    imperfecto: ["quería", "querías", "quería", "queríamos", "queríais", "querían"],
    futuro: ["querré", "querrás", "querrá", "querremos", "querréis", "querrán"],
  },
  decir: {
    presente: ["digo", "dices", "dice", "decimos", "decís", "dicen"],
    preterito: ["dije", "dijiste", "dijo", "dijimos", "dijisteis", "dijeron"],
    imperfecto: ["decía", "decías", "decía", "decíamos", "decíais", "decían"],
    futuro: ["diré", "dirás", "dirá", "diremos", "diréis", "dirán"],
  },
  ver: {
    presente: ["veo", "ves", "ve", "vemos", "veis", "ven"],
    preterito: ["vi", "viste", "vio", "vimos", "visteis", "vieron"],
    imperfecto: ["veía", "veías", "veía", "veíamos", "veíais", "veían"],
    futuro: ["veré", "verás", "verá", "veremos", "veréis", "verán"],
  },
  ir_a: {}, // Platzhalter zur Vermeidung von Namenskonflikten
};

export const ALL_VERBS = [...REGULAR_VERBS, ...Object.keys(IRREGULAR).filter((v) => v !== "ir_a")];

// Liefert die korrekte Form oder null, wenn nicht sicher bekannt.
export function conjugate(verb: string, tense: Tense, person: PersonIndex): string | null {
  const v = verb.toLowerCase().trim();
  const irr = IRREGULAR[v];
  if (irr && irr[tense]) return irr[tense]![person];

  const ending = v.slice(-2);
  const stem = v.slice(0, -2);
  if (!["ar", "er", "ir"].includes(ending)) return null;
  if (!REGULAR_VERBS.includes(v)) return null; // nur bewusst freigegebene Verben auto-bilden

  if (tense === "futuro") return v + FUT[person];
  const table = REG[ending as "ar" | "er" | "ir"][tense as "presente" | "preterito" | "imperfecto"];
  return stem + table[person];
}

// Prüft eine Eingabe (akzent-tolerant für Teil-Feedback, aber markiert Akzentfehler).
export function checkForm(input: string, correct: string): { ok: boolean; accentOnly: boolean } {
  const norm = (s: string) => s.toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const exact = input.toLowerCase().trim() === correct.toLowerCase().trim();
  const loose = norm(input) === norm(correct);
  return { ok: exact, accentOnly: !exact && loose };
}

// Konjugations-Engine.
// Regelmäßige -ar/-er/-ir-Verben werden algorithmisch korrekt gebildet.
// Für unregelmäßige Verben stehen alle unregelmäßigen Formen als GEPRÜFTE Tabelle
// (presente + pretérito immer; imperfecto/futuro nur wo unregelmäßig).
// Fehlende Zeiten bekannter Verben werden regelkonform ergänzt (imperfecto ist
// außer bei ser/ir/ver regelmäßig; futuro ist außer bei Stammänderern regelmäßig).

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

// Unregelmäßige, häufige Verben — geprüfte Formen.
type Table = Partial<Record<Tense, string[]>>;
export const IRREGULAR: Record<string, Table> = {
  ser: { presente: ["soy","eres","es","somos","sois","son"], preterito: ["fui","fuiste","fue","fuimos","fuisteis","fueron"], imperfecto: ["era","eras","era","éramos","erais","eran"], futuro: ["seré","serás","será","seremos","seréis","serán"] },
  estar: { presente: ["estoy","estás","está","estamos","estáis","están"], preterito: ["estuve","estuviste","estuvo","estuvimos","estuvisteis","estuvieron"] },
  tener: { presente: ["tengo","tienes","tiene","tenemos","tenéis","tienen"], preterito: ["tuve","tuviste","tuvo","tuvimos","tuvisteis","tuvieron"], futuro: ["tendré","tendrás","tendrá","tendremos","tendréis","tendrán"] },
  ir: { presente: ["voy","vas","va","vamos","vais","van"], preterito: ["fui","fuiste","fue","fuimos","fuisteis","fueron"], imperfecto: ["iba","ibas","iba","íbamos","ibais","iban"] },
  hacer: { presente: ["hago","haces","hace","hacemos","hacéis","hacen"], preterito: ["hice","hiciste","hizo","hicimos","hicisteis","hicieron"], futuro: ["haré","harás","hará","haremos","haréis","harán"] },
  poder: { presente: ["puedo","puedes","puede","podemos","podéis","pueden"], preterito: ["pude","pudiste","pudo","pudimos","pudisteis","pudieron"], futuro: ["podré","podrás","podrá","podremos","podréis","podrán"] },
  querer: { presente: ["quiero","quieres","quiere","queremos","queréis","quieren"], preterito: ["quise","quisiste","quiso","quisimos","quisisteis","quisieron"], futuro: ["querré","querrás","querrá","querremos","querréis","querrán"] },
  decir: { presente: ["digo","dices","dice","decimos","decís","dicen"], preterito: ["dije","dijiste","dijo","dijimos","dijisteis","dijeron"], futuro: ["diré","dirás","dirá","diremos","diréis","dirán"] },
  ver: { presente: ["veo","ves","ve","vemos","veis","ven"], preterito: ["vi","viste","vio","vimos","visteis","vieron"], imperfecto: ["veía","veías","veía","veíamos","veíais","veían"] },
  dar: { presente: ["doy","das","da","damos","dais","dan"], preterito: ["di","diste","dio","dimos","disteis","dieron"] },
  saber: { presente: ["sé","sabes","sabe","sabemos","sabéis","saben"], preterito: ["supe","supiste","supo","supimos","supisteis","supieron"], futuro: ["sabré","sabrás","sabrá","sabremos","sabréis","sabrán"] },
  poner: { presente: ["pongo","pones","pone","ponemos","ponéis","ponen"], preterito: ["puse","pusiste","puso","pusimos","pusisteis","pusieron"], futuro: ["pondré","pondrás","pondrá","pondremos","pondréis","pondrán"] },
  salir: { presente: ["salgo","sales","sale","salimos","salís","salen"], preterito: ["salí","saliste","salió","salimos","salisteis","salieron"], futuro: ["saldré","saldrás","saldrá","saldremos","saldréis","saldrán"] },
  venir: { presente: ["vengo","vienes","viene","venimos","venís","vienen"], preterito: ["vine","viniste","vino","vinimos","vinisteis","vinieron"], futuro: ["vendré","vendrás","vendrá","vendremos","vendréis","vendrán"] },
  traer: { presente: ["traigo","traes","trae","traemos","traéis","traen"], preterito: ["traje","trajiste","trajo","trajimos","trajisteis","trajeron"] },
  conocer: { presente: ["conozco","conoces","conoce","conocemos","conocéis","conocen"], preterito: ["conocí","conociste","conoció","conocimos","conocisteis","conocieron"] },
  conducir: { presente: ["conduzco","conduces","conduce","conducimos","conducís","conducen"], preterito: ["conduje","condujiste","condujo","condujimos","condujisteis","condujeron"] },
  pedir: { presente: ["pido","pides","pide","pedimos","pedís","piden"], preterito: ["pedí","pediste","pidió","pedimos","pedisteis","pidieron"] },
  servir: { presente: ["sirvo","sirves","sirve","servimos","servís","sirven"], preterito: ["serví","serviste","sirvió","servimos","servisteis","sirvieron"] },
  dormir: { presente: ["duermo","duermes","duerme","dormimos","dormís","duermen"], preterito: ["dormí","dormiste","durmió","dormimos","dormisteis","durmieron"] },
  sentir: { presente: ["siento","sientes","siente","sentimos","sentís","sienten"], preterito: ["sentí","sentiste","sintió","sentimos","sentisteis","sintieron"] },
  seguir: { presente: ["sigo","sigues","sigue","seguimos","seguís","siguen"], preterito: ["seguí","seguiste","siguió","seguimos","seguisteis","siguieron"] },
  empezar: { presente: ["empiezo","empiezas","empieza","empezamos","empezáis","empiezan"], preterito: ["empecé","empezaste","empezó","empezamos","empezasteis","empezaron"] },
  entender: { presente: ["entiendo","entiendes","entiende","entendemos","entendéis","entienden"], preterito: ["entendí","entendiste","entendió","entendimos","entendisteis","entendieron"] },
  volver: { presente: ["vuelvo","vuelves","vuelve","volvemos","volvéis","vuelven"], preterito: ["volví","volviste","volvió","volvimos","volvisteis","volvieron"] },
  encontrar: { presente: ["encuentro","encuentras","encuentra","encontramos","encontráis","encuentran"], preterito: ["encontré","encontraste","encontró","encontramos","encontrasteis","encontraron"] },
  pensar: { presente: ["pienso","piensas","piensa","pensamos","pensáis","piensan"], preterito: ["pensé","pensaste","pensó","pensamos","pensasteis","pensaron"] },
  jugar: { presente: ["juego","juegas","juega","jugamos","jugáis","juegan"], preterito: ["jugué","jugaste","jugó","jugamos","jugasteis","jugaron"] },
  contar: { presente: ["cuento","cuentas","cuenta","contamos","contáis","cuentan"], preterito: ["conté","contaste","contó","contamos","contasteis","contaron"] },
  oír: { presente: ["oigo","oyes","oye","oímos","oís","oyen"], preterito: ["oí","oíste","oyó","oímos","oísteis","oyeron"], imperfecto: ["oía","oías","oía","oíamos","oíais","oían"], futuro: ["oiré","oirás","oirá","oiremos","oiréis","oirán"] },
  leer: { presente: ["leo","lees","lee","leemos","leéis","leen"], preterito: ["leí","leíste","leyó","leímos","leísteis","leyeron"] },
  creer: { presente: ["creo","crees","cree","creemos","creéis","creen"], preterito: ["creí","creíste","creyó","creímos","creísteis","creyeron"] },
  haber: { presente: ["he","has","ha","hemos","habéis","han"], preterito: ["hube","hubiste","hubo","hubimos","hubisteis","hubieron"], futuro: ["habré","habrás","habrá","habremos","habréis","habrán"] },
  preferir: { presente: ["prefiero","prefieres","prefiere","preferimos","preferís","prefieren"], preterito: ["preferí","preferiste","prefirió","preferimos","preferisteis","prefirieron"] },
};

export const ALL_VERBS = [...REGULAR_VERBS, ...Object.keys(IRREGULAR)];

function group(v: string): "ar" | "er" | "ir" {
  if (v.endsWith("ar")) return "ar";
  if (v.endsWith("er")) return "er";
  return "ir"; // deckt auch -ír (z.B. oír) ab
}

// Liefert die korrekte Form oder null, wenn nicht sicher bekannt.
export function conjugate(verb: string, tense: Tense, person: PersonIndex): string | null {
  const v = verb.toLowerCase().trim();
  const irr = IRREGULAR[v];

  if (irr) {
    if (irr[tense]) return irr[tense]![person];
    const g = group(v);
    const stem = v.slice(0, -2);
    if (tense === "imperfecto") return stem + REG[g].imperfecto[person]; // regelm. außer ser/ir/ver (in Tabelle)
    if (tense === "futuro") return v + FUT[person];                       // regelm. außer Stammänderer (in Tabelle)
    if (tense === "preterito") return stem + REG[g].preterito[person];    // Fallback
    return null;
  }

  if (!REGULAR_VERBS.includes(v)) return null;
  const g = group(v);
  const stem = v.slice(0, -2);
  if (tense === "futuro") return v + FUT[person];
  return stem + REG[g][tense as "presente" | "preterito" | "imperfecto"][person];
}

// Prüft eine Eingabe (akzent-tolerant für Teil-Feedback, markiert aber Akzentfehler).
export function checkForm(input: string, correct: string): { ok: boolean; accentOnly: boolean } {
  const norm = (s: string) => s.toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const exact = input.toLowerCase().trim() === correct.toLowerCase().trim();
  const loose = norm(input) === norm(correct);
  return { ok: exact, accentOnly: !exact && loose };
}

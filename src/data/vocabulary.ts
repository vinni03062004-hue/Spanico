// Seed-Wortschatz mit vollstaendigen Feldern gemaess Spezifikation.
// In Schichten aufgebaut (kern, alltagsphrasen, thematisch, kollokation,
// satzbaustein, situativ). Erweiterbar: einfach Eintraege ergaenzen und neu seeden.
import { FREQ_WORDS } from "./es_freq";
import { FREQ_WORDS2 } from "./es_freq2";
import { EMOJI_MAP } from "./emojiMap";

export interface SeedVocab {
  lemma: string;
  pos: string;
  meaningDe: string;
  explanationEs: string;
  examples: { es: string; de: string }[];
  category: string;
  frequencyTier: number;
  layer: string;
  morphology?: string;
  collocations?: string[];
  confusables?: string[];
  imageEmoji?: string;
  pronTargets?: string[];
}

const RICH: SeedVocab[] = [
  { lemma: "hola", pos: "interjección", meaningDe: "hallo", explanationEs: "Saludo informal para empezar una conversación.", examples: [{ es: "¡Hola! ¿Qué tal?", de: "Hallo! Wie geht's?" }], category: "begruessung", frequencyTier: 1, layer: "kern", imageEmoji: "👋", pronTargets: ["h stumm", "offenes o"] },
  { lemma: "gracias", pos: "interjección", meaningDe: "danke", explanationEs: "Se usa para agradecer algo.", examples: [{ es: "Muchas gracias por tu ayuda.", de: "Vielen Dank für deine Hilfe." }], category: "hoeflichkeit", frequencyTier: 1, layer: "kern", collocations: ["muchas gracias", "gracias por"], imageEmoji: "🙏", pronTargets: ["gr-Verbindung", "c wie th/s"] },
  { lemma: "por favor", pos: "locución", meaningDe: "bitte", explanationEs: "Se usa para pedir algo con cortesía.", examples: [{ es: "Un café, por favor.", de: "Einen Kaffee, bitte." }], category: "hoeflichkeit", frequencyTier: 1, layer: "alltagsphrasen", imageEmoji: "🙂" },
  { lemma: "buenos días", pos: "locución", meaningDe: "guten Morgen / guten Tag (vormittags)", explanationEs: "Saludo formal por la mañana.", examples: [{ es: "Buenos días, ¿cómo está?", de: "Guten Morgen, wie geht es Ihnen?" }], category: "begruessung", frequencyTier: 1, layer: "alltagsphrasen", confusables: ["buenas noches", "buenas tardes"], imageEmoji: "🌅" },
  { lemma: "sí", pos: "adverbio", meaningDe: "ja", explanationEs: "Respuesta afirmativa.", examples: [{ es: "Sí, claro.", de: "Ja, klar." }], category: "basis", frequencyTier: 1, layer: "kern", confusables: ["si (falls)"], imageEmoji: "✅" },
  { lemma: "no", pos: "adverbio", meaningDe: "nein/nicht", explanationEs: "Respuesta negativa o negación.", examples: [{ es: "No entiendo.", de: "Ich verstehe nicht." }], category: "basis", frequencyTier: 1, layer: "kern", imageEmoji: "❌" },
  { lemma: "agua", pos: "sustantivo", meaningDe: "Wasser", explanationEs: "Líquido que bebemos.", examples: [{ es: "¿Me trae un vaso de agua?", de: "Bringen Sie mir ein Glas Wasser?" }], category: "essen_trinken", frequencyTier: 1, layer: "thematisch", morphology: "f., aber 'el agua'", collocations: ["agua con gas", "agua sin gas"], imageEmoji: "💧", pronTargets: ["gua-Diphthong"] },
  { lemma: "café", pos: "sustantivo", meaningDe: "Kaffee", explanationEs: "Bebida caliente muy común en España.", examples: [{ es: "Un café con leche, por favor.", de: "Einen Milchkaffee, bitte." }], category: "essen_trinken", frequencyTier: 1, layer: "thematisch", collocations: ["café con leche", "café solo"], imageEmoji: "☕", pronTargets: ["Betonung auf é"] },
  { lemma: "la cuenta", pos: "sustantivo", meaningDe: "die Rechnung", explanationEs: "Lo que pagas en un bar o restaurante.", examples: [{ es: "La cuenta, por favor.", de: "Die Rechnung, bitte." }], category: "restaurant", frequencyTier: 2, layer: "situativ", collocations: ["pedir la cuenta"], imageEmoji: "🧾" },
  { lemma: "quiero", pos: "verbo", meaningDe: "ich möchte/will", explanationEs: "Primera persona de 'querer', para expresar deseo.", examples: [{ es: "Quiero un bocadillo.", de: "Ich möchte ein Brötchen." }], category: "verben", frequencyTier: 1, layer: "satzbaustein", morphology: "querer, e->ie", collocations: ["quiero un/una", "quiero ir"], confusables: ["quiere", "quieres"], imageEmoji: "🙋" },
  { lemma: "necesito", pos: "verbo", meaningDe: "ich brauche", explanationEs: "Primera persona de 'necesitar'.", examples: [{ es: "Necesito ayuda.", de: "Ich brauche Hilfe." }], category: "verben", frequencyTier: 1, layer: "satzbaustein", collocations: ["necesito un/una"], imageEmoji: "🆘" },
  { lemma: "¿dónde está...?", pos: "locución", meaningDe: "wo ist...?", explanationEs: "Pregunta por la ubicación de algo.", examples: [{ es: "¿Dónde está el baño?", de: "Wo ist die Toilette?" }], category: "orientierung", frequencyTier: 1, layer: "satzbaustein", collocations: ["¿dónde está el/la...?"], imageEmoji: "📍" },
  { lemma: "la estación", pos: "sustantivo", meaningDe: "der Bahnhof/die Station", explanationEs: "Lugar donde paran trenes o autobuses.", examples: [{ es: "La estación está cerca.", de: "Der Bahnhof ist in der Nähe." }], category: "reise", frequencyTier: 2, layer: "thematisch", collocations: ["estación de tren", "estación de metro"], imageEmoji: "🚉" },
  { lemma: "izquierda", pos: "sustantivo", meaningDe: "links", explanationEs: "Dirección opuesta a la derecha.", examples: [{ es: "Gira a la izquierda.", de: "Bieg links ab." }], category: "orientierung", frequencyTier: 2, layer: "thematisch", confusables: ["derecha"], imageEmoji: "⬅️", pronTargets: ["z wie th/s", "qui"] },
  { lemma: "derecha", pos: "sustantivo", meaningDe: "rechts", explanationEs: "Dirección opuesta a la izquierda.", examples: [{ es: "La tienda está a la derecha.", de: "Der Laden ist rechts." }], category: "orientierung", frequencyTier: 2, layer: "thematisch", confusables: ["izquierda", "derecho (gerade)"], imageEmoji: "➡️" },
  { lemma: "ayer", pos: "adverbio", meaningDe: "gestern", explanationEs: "El día anterior a hoy.", examples: [{ es: "Ayer fui al médico.", de: "Gestern war ich beim Arzt." }], category: "zeit", frequencyTier: 2, layer: "kern", confusables: ["hoy", "mañana"], imageEmoji: "📅" },
  { lemma: "mañana", pos: "sustantivo/adverbio", meaningDe: "morgen/Morgen", explanationEs: "El día siguiente, o la parte del día por la mañana.", examples: [{ es: "Mañana tengo clase.", de: "Morgen habe ich Unterricht." }], category: "zeit", frequencyTier: 1, layer: "kern", confusables: ["ayer", "la mañana"], imageEmoji: "🌇" },
  { lemma: "el médico", pos: "sustantivo", meaningDe: "der Arzt", explanationEs: "Persona que cuida tu salud.", examples: [{ es: "Necesito ir al médico.", de: "Ich muss zum Arzt." }], category: "gesundheit", frequencyTier: 2, layer: "thematisch", collocations: ["ir al médico", "pedir cita"], imageEmoji: "🩺" },
  { lemma: "me duele", pos: "locución", meaningDe: "mir tut weh", explanationEs: "Se usa para decir que algo causa dolor.", examples: [{ es: "Me duele la cabeza.", de: "Mir tut der Kopf weh." }], category: "gesundheit", frequencyTier: 2, layer: "satzbaustein", collocations: ["me duele la/el..."], morphology: "doler, o->ue", imageEmoji: "🤕" },
  { lemma: "trabajar", pos: "verbo", meaningDe: "arbeiten", explanationEs: "Hacer una actividad por un empleo.", examples: [{ es: "Trabajo en una oficina.", de: "Ich arbeite in einem Büro." }], category: "arbeit", frequencyTier: 2, layer: "thematisch", morphology: "regelmäßig -ar", collocations: ["trabajar en", "trabajar de"], imageEmoji: "💼", pronTargets: ["j wie ch (rau)"] },
  { lemma: "entrenar", pos: "verbo", meaningDe: "trainieren", explanationEs: "Hacer ejercicio para mejorar.", examples: [{ es: "Entreno tres veces por semana.", de: "Ich trainiere dreimal pro Woche." }], category: "fitness", frequencyTier: 3, layer: "thematisch", collocations: ["entrenar fuerza", "entrenar hoy"], imageEmoji: "🏋️" },
  { lemma: "¿cuánto cuesta?", pos: "locución", meaningDe: "wie viel kostet es?", explanationEs: "Pregunta por el precio.", examples: [{ es: "¿Cuánto cuesta esto?", de: "Wie viel kostet das?" }], category: "einkaufen", frequencyTier: 1, layer: "satzbaustein", collocations: ["¿cuánto cuesta ...?"], imageEmoji: "💶" },
  { lemma: "barato", pos: "adjetivo", meaningDe: "billig", explanationEs: "Que cuesta poco dinero.", examples: [{ es: "Es muy barato.", de: "Es ist sehr billig." }], category: "einkaufen", frequencyTier: 2, layer: "thematisch", confusables: ["caro (teuer)"], imageEmoji: "🏷️" },
  { lemma: "el piso", pos: "sustantivo", meaningDe: "die Wohnung", explanationEs: "Vivienda en un edificio.", examples: [{ es: "Busco un piso céntrico.", de: "Ich suche eine zentrale Wohnung." }], category: "wohnen", frequencyTier: 2, layer: "thematisch", confusables: ["el suelo (Boden)"], collocations: ["alquilar un piso"], imageEmoji: "🏢" },
  { lemma: "porque", pos: "conjunción", meaningDe: "weil", explanationEs: "Introduce una razón o causa.", examples: [{ es: "No voy porque estoy cansado.", de: "Ich gehe nicht, weil ich müde bin." }], category: "grammatik", frequencyTier: 1, layer: "satzbaustein", confusables: ["¿por qué? (warum)"], imageEmoji: "🔗" },
  { lemma: "aunque", pos: "conjunción", meaningDe: "obwohl", explanationEs: "Expresa una oposición o concesión.", examples: [{ es: "Salgo aunque llueva.", de: "Ich gehe raus, obwohl es regnet." }], category: "grammatik", frequencyTier: 3, layer: "satzbaustein", morphology: "oft mit Subjuntivo", imageEmoji: "🔗" },
  { lemma: "tener ganas de", pos: "locución", meaningDe: "Lust haben auf", explanationEs: "Sentir deseo de hacer algo.", examples: [{ es: "Tengo ganas de viajar.", de: "Ich habe Lust zu reisen." }], category: "chunks", frequencyTier: 3, layer: "kollokation", collocations: ["tener ganas de + Infinitiv"], imageEmoji: "✨" },
  { lemma: "acabar de", pos: "locución", meaningDe: "gerade eben (getan haben)", explanationEs: "Indica una acción muy reciente.", examples: [{ es: "Acabo de llegar.", de: "Ich bin gerade angekommen." }], category: "chunks", frequencyTier: 3, layer: "kollokation", collocations: ["acabar de + Infinitiv"], imageEmoji: "⏱️" },
  { lemma: "vale", pos: "interjección", meaningDe: "okay/in Ordnung", explanationEs: "Expresión muy típica en España para aceptar.", examples: [{ es: "Vale, nos vemos luego.", de: "Okay, bis später." }], category: "gespraech", frequencyTier: 1, layer: "satzbaustein", imageEmoji: "👌" },
  { lemma: "¿me puede ayudar?", pos: "locución", meaningDe: "können Sie mir helfen?", explanationEs: "Petición cortés de ayuda.", examples: [{ es: "Perdone, ¿me puede ayudar?", de: "Entschuldigung, können Sie mir helfen?" }], category: "gespraech", frequencyTier: 2, layer: "situativ", imageEmoji: "🤝" },
  { lemma: "quisiera", pos: "verbo", meaningDe: "ich hätte gern", explanationEs: "Forma cortés de 'querer' para pedir.", examples: [{ es: "Quisiera reservar una mesa.", de: "Ich hätte gern einen Tisch reserviert." }], category: "restaurant", frequencyTier: 2, layer: "satzbaustein", confusables: ["quiero"], morphology: "Condicional/Höflichkeit", imageEmoji: "🍽️" },
];

// Kompakte Grundwortschatzliste: [lemma, Wortart, deutsche Bedeutung, Häufigkeitsstufe, Kategorie].
// Nach Häufigkeit geordnet. Wird unten automatisch in vollständige Einträge umgewandelt.
type Row = [string, string, string, number, string];
const COMPACT: Row[] = [
  // --- Funktionswörter / häufigste Wörter (Stufe 1) ---
  ["el", "artículo", "der (m.)", 1, "grammatik"], ["la", "artículo", "die (f.)", 1, "grammatik"],
  ["un", "artículo", "ein (m.)", 1, "grammatik"], ["una", "artículo", "eine (f.)", 1, "grammatik"],
  ["y", "conjunción", "und", 1, "grammatik"], ["o", "conjunción", "oder", 1, "grammatik"],
  ["pero", "conjunción", "aber", 1, "grammatik"], ["que", "conjunción", "dass / der/die/das", 1, "grammatik"],
  ["de", "preposición", "von / aus", 1, "grammatik"], ["en", "preposición", "in / auf", 1, "grammatik"],
  ["a", "preposición", "zu / nach / an", 1, "grammatik"], ["con", "preposición", "mit", 1, "grammatik"],
  ["por", "preposición", "für / durch / wegen", 1, "grammatik"], ["para", "preposición", "für / um zu", 1, "grammatik"],
  ["sin", "preposición", "ohne", 1, "grammatik"], ["sobre", "preposición", "über / auf", 2, "grammatik"],
  ["entre", "preposición", "zwischen", 2, "grammatik"], ["hasta", "preposición", "bis", 2, "grammatik"],
  ["desde", "preposición", "seit / ab", 2, "grammatik"], ["según", "preposición", "laut / gemäß", 3, "grammatik"],
  ["yo", "pronombre", "ich", 1, "pronomen"], ["tú", "pronombre", "du", 1, "pronomen"],
  ["él", "pronombre", "er", 1, "pronomen"], ["ella", "pronombre", "sie", 1, "pronomen"],
  ["nosotros", "pronombre", "wir", 1, "pronomen"], ["vosotros", "pronombre", "ihr", 2, "pronomen"],
  ["ellos", "pronombre", "sie (Pl.)", 1, "pronomen"], ["usted", "pronombre", "Sie (höflich)", 1, "pronomen"],
  ["este", "pronombre", "dieser", 1, "pronomen"], ["esta", "pronombre", "diese", 1, "pronomen"],
  ["eso", "pronombre", "das (da)", 1, "pronomen"], ["esto", "pronombre", "das (hier)", 1, "pronomen"],
  ["mi", "posesivo", "mein", 1, "pronomen"], ["tu", "posesivo", "dein", 1, "pronomen"],
  ["su", "posesivo", "sein / ihr / Ihr", 1, "pronomen"], ["nuestro", "posesivo", "unser", 2, "pronomen"],
  ["muy", "adverbio", "sehr", 1, "adverb"], ["más", "adverbio", "mehr", 1, "adverb"],
  ["menos", "adverbio", "weniger", 2, "adverb"], ["también", "adverbio", "auch", 1, "adverb"],
  ["tampoco", "adverbio", "auch nicht", 2, "adverb"], ["siempre", "adverbio", "immer", 1, "adverb"],
  ["nunca", "adverbio", "nie", 1, "adverb"], ["ahora", "adverbio", "jetzt", 1, "adverb"],
  ["luego", "adverbio", "später / dann", 1, "adverb"], ["ya", "adverbio", "schon / bereits", 1, "adverb"],
  ["todavía", "adverbio", "noch", 2, "adverb"], ["aquí", "adverbio", "hier", 1, "adverb"],
  ["allí", "adverbio", "dort", 1, "adverb"], ["cerca", "adverbio", "nah", 2, "adverb"],
  ["lejos", "adverbio", "weit", 2, "adverb"], ["bien", "adverbio", "gut", 1, "adverb"],
  ["mal", "adverbio", "schlecht", 1, "adverb"], ["mucho", "adverbio", "viel", 1, "adverb"],
  ["poco", "adverbio", "wenig", 1, "adverb"], ["demasiado", "adverbio", "zu viel", 2, "adverb"],
  ["quizás", "adverbio", "vielleicht", 2, "adverb"], ["así", "adverbio", "so", 2, "adverb"],
  // --- Fragewörter ---
  ["qué", "interrogativo", "was", 1, "fragen"], ["quién", "interrogativo", "wer", 1, "fragen"],
  ["cómo", "interrogativo", "wie", 1, "fragen"], ["cuándo", "interrogativo", "wann", 1, "fragen"],
  ["dónde", "interrogativo", "wo", 1, "fragen"], ["por qué", "interrogativo", "warum", 1, "fragen"],
  ["cuánto", "interrogativo", "wie viel", 1, "fragen"], ["cuál", "interrogativo", "welcher", 1, "fragen"],
  // --- Häufige Verben (Infinitiv) ---
  ["ser", "verbo", "sein (dauerhaft)", 1, "verben"], ["estar", "verbo", "sein (Zustand/Ort)", 1, "verben"],
  ["tener", "verbo", "haben", 1, "verben"], ["hacer", "verbo", "machen / tun", 1, "verben"],
  ["poder", "verbo", "können", 1, "verben"], ["decir", "verbo", "sagen", 1, "verben"],
  ["ir", "verbo", "gehen / fahren", 1, "verben"], ["ver", "verbo", "sehen", 1, "verben"],
  ["dar", "verbo", "geben", 1, "verben"], ["saber", "verbo", "wissen", 1, "verben"],
  ["querer", "verbo", "wollen / mögen", 1, "verben"], ["llegar", "verbo", "ankommen", 1, "verben"],
  ["pasar", "verbo", "passieren / vorbeigehen", 1, "verben"], ["deber", "verbo", "müssen / sollen", 1, "verben"],
  ["poner", "verbo", "stellen / legen", 1, "verben"], ["parecer", "verbo", "scheinen", 2, "verben"],
  ["quedar", "verbo", "bleiben / sich treffen", 2, "verben"], ["creer", "verbo", "glauben", 1, "verben"],
  ["hablar", "verbo", "sprechen", 1, "verben"], ["llevar", "verbo", "tragen / bringen", 1, "verben"],
  ["dejar", "verbo", "lassen", 1, "verben"], ["seguir", "verbo", "folgen / weitermachen", 1, "verben"],
  ["encontrar", "verbo", "finden", 1, "verben"], ["llamar", "verbo", "rufen / anrufen / heißen", 1, "verben"],
  ["venir", "verbo", "kommen", 1, "verben"], ["pensar", "verbo", "denken", 1, "verben"],
  ["salir", "verbo", "hinausgehen / ausgehen", 1, "verben"], ["volver", "verbo", "zurückkommen", 1, "verben"],
  ["tomar", "verbo", "nehmen / trinken", 1, "verben"], ["conocer", "verbo", "kennen(lernen)", 1, "verben"],
  ["vivir", "verbo", "leben / wohnen", 1, "verben"], ["sentir", "verbo", "fühlen", 2, "verben"],
  ["comer", "verbo", "essen", 1, "essen_trinken"], ["beber", "verbo", "trinken", 1, "essen_trinken"],
  ["comprar", "verbo", "kaufen", 1, "einkaufen"], ["pagar", "verbo", "bezahlen", 1, "einkaufen"],
  ["escribir", "verbo", "schreiben", 1, "verben"], ["leer", "verbo", "lesen", 1, "verben"],
  ["escuchar", "verbo", "hören / zuhören", 1, "verben"], ["esperar", "verbo", "warten / hoffen", 1, "verben"],
  ["ayudar", "verbo", "helfen", 1, "verben"], ["empezar", "verbo", "anfangen", 1, "verben"],
  ["terminar", "verbo", "beenden", 1, "verben"], ["abrir", "verbo", "öffnen", 1, "verben"],
  ["cerrar", "verbo", "schließen", 1, "verben"], ["entender", "verbo", "verstehen", 1, "verben"],
  ["aprender", "verbo", "lernen", 1, "verben"], ["trabajar", "verbo", "arbeiten", 1, "arbeit"],
  ["viajar", "verbo", "reisen", 1, "reise"], ["dormir", "verbo", "schlafen", 1, "verben"],
  ["gustar", "verbo", "gefallen / mögen", 1, "verben"], ["usar", "verbo", "benutzen", 2, "verben"],
  // --- Menschen / Familie ---
  ["hombre", "sustantivo", "Mann", 1, "menschen"], ["mujer", "sustantivo", "Frau", 1, "menschen"],
  ["niño", "sustantivo", "Kind / Junge", 1, "menschen"], ["niña", "sustantivo", "Mädchen", 1, "menschen"],
  ["amigo", "sustantivo", "Freund", 1, "menschen"], ["amiga", "sustantivo", "Freundin", 1, "menschen"],
  ["familia", "sustantivo", "Familie", 1, "familie"], ["madre", "sustantivo", "Mutter", 1, "familie"],
  ["padre", "sustantivo", "Vater", 1, "familie"], ["hijo", "sustantivo", "Sohn", 1, "familie"],
  ["hija", "sustantivo", "Tochter", 1, "familie"], ["hermano", "sustantivo", "Bruder", 1, "familie"],
  ["hermana", "sustantivo", "Schwester", 1, "familie"], ["gente", "sustantivo", "Leute", 1, "menschen"],
  ["persona", "sustantivo", "Person", 1, "menschen"], ["señor", "sustantivo", "Herr", 1, "menschen"],
  ["señora", "sustantivo", "Frau (Anrede)", 1, "menschen"],
  // --- Alltag / Dinge ---
  ["casa", "sustantivo", "Haus / Zuhause", 1, "wohnen"], ["cosa", "sustantivo", "Sache / Ding", 1, "alltag"],
  ["tiempo", "sustantivo", "Zeit / Wetter", 1, "alltag"], ["día", "sustantivo", "Tag", 1, "zeit"],
  ["semana", "sustantivo", "Woche", 1, "zeit"], ["mes", "sustantivo", "Monat", 1, "zeit"],
  ["año", "sustantivo", "Jahr", 1, "zeit"], ["hora", "sustantivo", "Stunde / Uhrzeit", 1, "zeit"],
  ["noche", "sustantivo", "Nacht", 1, "zeit"], ["trabajo", "sustantivo", "Arbeit / Job", 1, "arbeit"],
  ["dinero", "sustantivo", "Geld", 1, "einkaufen"], ["ciudad", "sustantivo", "Stadt", 1, "orte"],
  ["país", "sustantivo", "Land", 1, "orte"], ["calle", "sustantivo", "Straße", 1, "orte"],
  ["coche", "sustantivo", "Auto", 1, "reise"], ["tren", "sustantivo", "Zug", 1, "reise"],
  ["avión", "sustantivo", "Flugzeug", 2, "reise"], ["autobús", "sustantivo", "Bus", 1, "reise"],
  ["billete", "sustantivo", "Fahrkarte / Ticket", 2, "reise"], ["hotel", "sustantivo", "Hotel", 1, "reise"],
  ["habitación", "sustantivo", "Zimmer", 2, "reise"], ["baño", "sustantivo", "Bad / Toilette", 1, "wohnen"],
  ["comida", "sustantivo", "Essen / Mahlzeit", 1, "essen_trinken"], ["desayuno", "sustantivo", "Frühstück", 2, "essen_trinken"],
  ["almuerzo", "sustantivo", "Mittagessen", 2, "essen_trinken"], ["cena", "sustantivo", "Abendessen", 2, "essen_trinken"],
  ["pan", "sustantivo", "Brot", 1, "essen_trinken"], ["leche", "sustantivo", "Milch", 1, "essen_trinken"],
  ["vino", "sustantivo", "Wein", 2, "essen_trinken"], ["cerveza", "sustantivo", "Bier", 2, "essen_trinken"],
  ["carne", "sustantivo", "Fleisch", 2, "essen_trinken"], ["pescado", "sustantivo", "Fisch", 2, "essen_trinken"],
  ["fruta", "sustantivo", "Obst", 2, "essen_trinken"], ["verdura", "sustantivo", "Gemüse", 2, "essen_trinken"],
  ["mesa", "sustantivo", "Tisch", 1, "wohnen"], ["silla", "sustantivo", "Stuhl", 2, "wohnen"],
  ["puerta", "sustantivo", "Tür", 1, "wohnen"], ["ventana", "sustantivo", "Fenster", 2, "wohnen"],
  ["teléfono", "sustantivo", "Telefon", 1, "alltag"], ["móvil", "sustantivo", "Handy", 1, "alltag"],
  ["escuela", "sustantivo", "Schule", 1, "arbeit"],
  ["problema", "sustantivo", "Problem", 1, "alltag"], ["nombre", "sustantivo", "Name", 1, "alltag"],
  ["vida", "sustantivo", "Leben", 1, "alltag"], ["mundo", "sustantivo", "Welt", 1, "alltag"],
  ["parte", "sustantivo", "Teil", 1, "alltag"], ["lugar", "sustantivo", "Ort", 1, "orte"],
  ["mano", "sustantivo", "Hand", 1, "koerper"], ["cabeza", "sustantivo", "Kopf", 1, "koerper"],
  ["ojo", "sustantivo", "Auge", 2, "koerper"], ["pie", "sustantivo", "Fuß", 2, "koerper"],
  ["cuerpo", "sustantivo", "Körper", 2, "koerper"], ["agua", "sustantivo", "Wasser", 1, "essen_trinken"],
  // --- Adjektive ---
  ["bueno", "adjetivo", "gut", 1, "adjektive"], ["malo", "adjetivo", "schlecht", 1, "adjektive"],
  ["grande", "adjetivo", "groß", 1, "adjektive"], ["pequeño", "adjetivo", "klein", 1, "adjektive"],
  ["nuevo", "adjetivo", "neu", 1, "adjektive"], ["viejo", "adjetivo", "alt", 1, "adjektive"],
  ["joven", "adjetivo", "jung", 2, "adjektive"], ["alto", "adjetivo", "hoch / groß (Person)", 1, "adjektive"],
  ["bajo", "adjetivo", "niedrig / klein (Person)", 1, "adjektive"], ["largo", "adjetivo", "lang", 2, "adjektive"],
  ["corto", "adjetivo", "kurz", 2, "adjektive"], ["caro", "adjetivo", "teuer", 1, "einkaufen"],
  ["barato", "adjetivo", "billig", 1, "einkaufen"], ["fácil", "adjetivo", "leicht / einfach", 1, "adjektive"],
  ["difícil", "adjetivo", "schwierig", 1, "adjektive"], ["rápido", "adjetivo", "schnell", 1, "adjektive"],
  ["lento", "adjetivo", "langsam", 2, "adjektive"], ["caliente", "adjetivo", "heiß / warm", 1, "adjektive"],
  ["frío", "adjetivo", "kalt", 1, "adjektive"], ["bonito", "adjetivo", "hübsch / schön", 1, "adjektive"],
  ["feo", "adjetivo", "hässlich", 2, "adjektive"], ["contento", "adjetivo", "zufrieden / froh", 1, "adjektive"],
  ["triste", "adjetivo", "traurig", 1, "adjektive"], ["cansado", "adjetivo", "müde", 1, "adjektive"],
  ["enfermo", "adjetivo", "krank", 1, "gesundheit"], ["importante", "adjetivo", "wichtig", 1, "adjektive"],
  ["mismo", "adjetivo", "selbe / gleich", 1, "adjektive"], ["próximo", "adjetivo", "nächste", 2, "adjektive"],
  ["último", "adjetivo", "letzte", 2, "adjektive"], ["primero", "adjetivo", "erste", 1, "adjektive"],
  // --- Zahlen ---
  ["cero", "número", "null", 1, "zahlen"], ["uno", "número", "eins", 1, "zahlen"],
  ["dos", "número", "zwei", 1, "zahlen"], ["tres", "número", "drei", 1, "zahlen"],
  ["cuatro", "número", "vier", 1, "zahlen"], ["cinco", "número", "fünf", 1, "zahlen"],
  ["seis", "número", "sechs", 1, "zahlen"], ["siete", "número", "sieben", 1, "zahlen"],
  ["ocho", "número", "acht", 1, "zahlen"], ["nueve", "número", "neun", 1, "zahlen"],
  ["diez", "número", "zehn", 1, "zahlen"], ["veinte", "número", "zwanzig", 2, "zahlen"],
  ["cien", "número", "hundert", 2, "zahlen"], ["mil", "número", "tausend", 2, "zahlen"],
  // --- Zeit / Tage / Monate ---
  ["hoy", "adverbio", "heute", 1, "zeit"], ["mañana", "adverbio", "morgen", 1, "zeit"],
  ["ayer", "adverbio", "gestern", 1, "zeit"], ["lunes", "sustantivo", "Montag", 2, "zeit"],
  ["martes", "sustantivo", "Dienstag", 2, "zeit"], ["miércoles", "sustantivo", "Mittwoch", 2, "zeit"],
  ["jueves", "sustantivo", "Donnerstag", 2, "zeit"], ["viernes", "sustantivo", "Freitag", 2, "zeit"],
  ["sábado", "sustantivo", "Samstag", 2, "zeit"], ["domingo", "sustantivo", "Sonntag", 2, "zeit"],
  // --- Höflichkeit / Gespräch ---
  ["adiós", "interjección", "tschüss / auf Wiedersehen", 1, "begruessung"],
  ["buenas tardes", "locución", "guten Tag / guten Abend", 1, "begruessung"],
  ["buenas noches", "locución", "gute Nacht", 1, "begruessung"],
  ["perdón", "interjección", "Entschuldigung", 1, "hoeflichkeit"],
  ["lo siento", "locución", "es tut mir leid", 1, "hoeflichkeit"],
  ["de nada", "locución", "gern geschehen", 1, "hoeflichkeit"],
  ["claro", "adverbio", "klar / natürlich", 1, "gespraech"],
  ["por supuesto", "locución", "selbstverständlich", 2, "gespraech"],

  // --- Farben ---
  ["rojo", "adjetivo", "rot", 2, "farben"], ["azul", "adjetivo", "blau", 2, "farben"],
  ["verde", "adjetivo", "grün", 2, "farben"], ["amarillo", "adjetivo", "gelb", 2, "farben"],
  ["negro", "adjetivo", "schwarz", 2, "farben"], ["blanco", "adjetivo", "weiß", 2, "farben"],
  ["gris", "adjetivo", "grau", 3, "farben"], ["marrón", "adjetivo", "braun", 3, "farben"],
  ["naranja", "adjetivo", "orange", 3, "farben"], ["rosa", "adjetivo", "rosa", 3, "farben"],
  // --- Essen & Trinken ---
  ["comida", "sustantivo", "Essen / Mahlzeit", 1, "essen_trinken"], ["fruta", "sustantivo", "Obst", 2, "essen_trinken"],
  ["manzana", "sustantivo", "Apfel", 2, "essen_trinken"], ["naranja", "sustantivo", "Orange", 2, "essen_trinken"],
  ["plátano", "sustantivo", "Banane", 3, "essen_trinken"], ["tomate", "sustantivo", "Tomate", 3, "essen_trinken"],
  ["patata", "sustantivo", "Kartoffel", 3, "essen_trinken"], ["arroz", "sustantivo", "Reis", 2, "essen_trinken"],
  ["huevo", "sustantivo", "Ei", 2, "essen_trinken"], ["queso", "sustantivo", "Käse", 2, "essen_trinken"],
  ["azúcar", "sustantivo", "Zucker", 2, "essen_trinken"], ["sal", "sustantivo", "Salz", 2, "essen_trinken"],
  ["aceite", "sustantivo", "Öl", 3, "essen_trinken"], ["sopa", "sustantivo", "Suppe", 3, "essen_trinken"],
  ["ensalada", "sustantivo", "Salat", 3, "essen_trinken"], ["postre", "sustantivo", "Nachtisch", 3, "essen_trinken"],
  ["té", "sustantivo", "Tee", 2, "essen_trinken"], ["zumo", "sustantivo", "Saft", 3, "essen_trinken"],
  ["hambre", "sustantivo", "Hunger", 2, "essen_trinken"], ["sed", "sustantivo", "Durst", 2, "essen_trinken"],
  ["rico", "adjetivo", "lecker / reich", 2, "essen_trinken"], ["dulce", "adjetivo", "süß", 3, "essen_trinken"],
  // --- Körper & Gesundheit ---
  ["cara", "sustantivo", "Gesicht", 2, "koerper"], ["pelo", "sustantivo", "Haar", 2, "koerper"],
  ["oreja", "sustantivo", "Ohr", 3, "koerper"], ["nariz", "sustantivo", "Nase", 3, "koerper"],
  ["boca", "sustantivo", "Mund", 2, "koerper"], ["diente", "sustantivo", "Zahn", 3, "koerper"],
  ["brazo", "sustantivo", "Arm", 2, "koerper"], ["pierna", "sustantivo", "Bein", 2, "koerper"],
  ["espalda", "sustantivo", "Rücken", 3, "koerper"], ["corazón", "sustantivo", "Herz", 2, "koerper"],
  ["estómago", "sustantivo", "Magen / Bauch", 3, "koerper"], ["salud", "sustantivo", "Gesundheit", 2, "gesundheit"],
  ["dolor", "sustantivo", "Schmerz", 2, "gesundheit"], ["fiebre", "sustantivo", "Fieber", 3, "gesundheit"],
  ["medicina", "sustantivo", "Medizin", 3, "gesundheit"], ["farmacia", "sustantivo", "Apotheke", 2, "gesundheit"],
  ["hospital", "sustantivo", "Krankenhaus", 2, "gesundheit"], ["cita", "sustantivo", "Termin", 3, "gesundheit"],
  // --- Kleidung ---
  ["ropa", "sustantivo", "Kleidung", 2, "kleidung"], ["camisa", "sustantivo", "Hemd", 3, "kleidung"],
  ["pantalón", "sustantivo", "Hose", 3, "kleidung"], ["zapato", "sustantivo", "Schuh", 2, "kleidung"],
  ["vestido", "sustantivo", "Kleid", 3, "kleidung"], ["chaqueta", "sustantivo", "Jacke", 3, "kleidung"],
  ["abrigo", "sustantivo", "Mantel", 3, "kleidung"], ["gafas", "sustantivo", "Brille", 3, "kleidung"],
  ["talla", "sustantivo", "Größe (Kleidung)", 3, "kleidung"], ["color", "sustantivo", "Farbe", 2, "kleidung"],
  // --- Haus & Wohnen ---
  ["cocina", "sustantivo", "Küche", 2, "wohnen"], ["dormitorio", "sustantivo", "Schlafzimmer", 3, "wohnen"],
  ["cama", "sustantivo", "Bett", 2, "wohnen"], ["sofá", "sustantivo", "Sofa", 3, "wohnen"],
  ["llave", "sustantivo", "Schlüssel", 2, "wohnen"], ["luz", "sustantivo", "Licht", 2, "wohnen"],
  ["suelo", "sustantivo", "Boden", 3, "wohnen"], ["pared", "sustantivo", "Wand", 3, "wohnen"],
  ["jardín", "sustantivo", "Garten", 3, "wohnen"], ["edificio", "sustantivo", "Gebäude", 3, "wohnen"],
  ["alquiler", "sustantivo", "Miete", 3, "wohnen"], ["vecino", "sustantivo", "Nachbar", 3, "wohnen"],
  // --- Stadt & Orte ---
  ["tienda", "sustantivo", "Laden / Geschäft", 2, "orte"], ["mercado", "sustantivo", "Markt", 2, "orte"],
  ["banco", "sustantivo", "Bank", 2, "orte"], ["iglesia", "sustantivo", "Kirche", 3, "orte"],
  ["parque", "sustantivo", "Park", 2, "orte"], ["playa", "sustantivo", "Strand", 2, "orte"],
  ["restaurante", "sustantivo", "Restaurant", 2, "orte"], ["bar", "sustantivo", "Bar / Kneipe", 2, "orte"],
  ["aeropuerto", "sustantivo", "Flughafen", 2, "reise"], ["museo", "sustantivo", "Museum", 3, "orte"],
  ["centro", "sustantivo", "Zentrum", 2, "orte"], ["pueblo", "sustantivo", "Dorf", 3, "orte"],
  ["plaza", "sustantivo", "Platz", 2, "orte"], ["esquina", "sustantivo", "Ecke", 3, "orte"],
  // --- Reise & Verkehr ---
  ["viaje", "sustantivo", "Reise", 2, "reise"], ["maleta", "sustantivo", "Koffer", 3, "reise"],
  ["mapa", "sustantivo", "Karte / Landkarte", 2, "reise"], ["metro", "sustantivo", "U-Bahn", 2, "reise"],
  ["taxi", "sustantivo", "Taxi", 2, "reise"], ["bicicleta", "sustantivo", "Fahrrad", 3, "reise"],
  ["camino", "sustantivo", "Weg", 2, "reise"], ["puente", "sustantivo", "Brücke", 3, "reise"],
  ["recto", "adverbio", "geradeaus", 2, "orientierung"], ["cerca de", "locución", "in der Nähe von", 2, "orientierung"],
  // --- Natur & Wetter ---
  ["sol", "sustantivo", "Sonne", 2, "natur"], ["lluvia", "sustantivo", "Regen", 2, "natur"],
  ["viento", "sustantivo", "Wind", 3, "natur"], ["nieve", "sustantivo", "Schnee", 3, "natur"],
  ["calor", "sustantivo", "Hitze / Wärme", 2, "natur"], ["frío", "sustantivo", "Kälte", 2, "natur"],
  ["cielo", "sustantivo", "Himmel", 3, "natur"], ["mar", "sustantivo", "Meer", 2, "natur"],
  ["montaña", "sustantivo", "Berg", 3, "natur"], ["río", "sustantivo", "Fluss", 3, "natur"],
  ["árbol", "sustantivo", "Baum", 3, "natur"], ["flor", "sustantivo", "Blume", 3, "natur"],
  ["animal", "sustantivo", "Tier", 2, "natur"], ["perro", "sustantivo", "Hund", 2, "natur"],
  ["gato", "sustantivo", "Katze", 2, "natur"], ["tiempo", "sustantivo", "Wetter / Zeit", 1, "natur"],
  // --- Beruf & Arbeit ---
  ["oficina", "sustantivo", "Büro", 2, "arbeit"], ["jefe", "sustantivo", "Chef", 3, "arbeit"],
  ["reunión", "sustantivo", "Besprechung", 3, "arbeit"], ["empresa", "sustantivo", "Firma", 3, "arbeit"],
  ["sueldo", "sustantivo", "Gehalt", 3, "arbeit"], ["profesor", "sustantivo", "Lehrer", 2, "arbeit"],
  ["médico", "sustantivo", "Arzt", 2, "arbeit"], ["camarero", "sustantivo", "Kellner", 3, "arbeit"],
  ["policía", "sustantivo", "Polizei / Polizist", 3, "arbeit"], ["estudiante", "sustantivo", "Student/in", 2, "arbeit"],
  // --- Gefühle & Adjektive ---
  ["feliz", "adjetivo", "glücklich", 2, "adjektive"], ["enfadado", "adjetivo", "wütend", 3, "adjektive"],
  ["nervioso", "adjetivo", "nervös", 3, "adjektive"], ["tranquilo", "adjetivo", "ruhig", 2, "adjektive"],
  ["ocupado", "adjetivo", "beschäftigt", 3, "adjektive"], ["libre", "adjetivo", "frei", 2, "adjektive"],
  ["listo", "adjetivo", "fertig / schlau", 2, "adjektive"], ["fuerte", "adjetivo", "stark", 2, "adjektive"],
  ["débil", "adjetivo", "schwach", 3, "adjektive"], ["lleno", "adjetivo", "voll", 3, "adjektive"],
  ["vacío", "adjetivo", "leer", 3, "adjektive"], ["limpio", "adjetivo", "sauber", 3, "adjektive"],
  ["sucio", "adjetivo", "schmutzig", 3, "adjektive"], ["peligroso", "adjetivo", "gefährlich", 3, "adjektive"],
  ["seguro", "adjetivo", "sicher", 2, "adjektive"], ["posible", "adjetivo", "möglich", 2, "adjektive"],
  // --- Mehr Verben ---
  ["gustar", "verbo", "gefallen / mögen", 1, "verben"], ["encantar", "verbo", "sehr gefallen", 2, "verben"],
  ["preguntar", "verbo", "fragen", 2, "verben"], ["contestar", "verbo", "antworten", 2, "verben"],
  ["comprar", "verbo", "kaufen", 1, "verben"], ["vender", "verbo", "verkaufen", 2, "verben"],
  ["buscar", "verbo", "suchen", 1, "verben"], ["encontrar", "verbo", "finden", 1, "verben"],
  ["perder", "verbo", "verlieren", 2, "verben"], ["ganar", "verbo", "gewinnen / verdienen", 2, "verben"],
  ["cambiar", "verbo", "ändern / wechseln", 2, "verben"], ["usar", "verbo", "benutzen", 2, "verben"],
  ["viajar", "verbo", "reisen", 1, "verben"], ["cocinar", "verbo", "kochen", 2, "verben"],
  ["limpiar", "verbo", "putzen", 2, "verben"], ["descansar", "verbo", "sich ausruhen", 2, "verben"],
  ["recordar", "verbo", "sich erinnern", 2, "verben"], ["olvidar", "verbo", "vergessen", 2, "verben"],
  ["ayudar", "verbo", "helfen", 1, "verben"], ["mostrar", "verbo", "zeigen", 2, "verben"],
  ["intentar", "verbo", "versuchen", 2, "verben"], ["conseguir", "verbo", "erreichen / schaffen", 2, "verben"],
  ["explicar", "verbo", "erklären", 2, "verben"], ["preparar", "verbo", "vorbereiten", 2, "verben"],
  ["pagar", "verbo", "bezahlen", 1, "verben"], ["reservar", "verbo", "reservieren", 2, "verben"],
  // --- Zeit & häufige Ausdrücke ---
  ["antes", "adverbio", "vorher / früher", 2, "zeit"], ["después", "adverbio", "nachher / danach", 2, "zeit"],
  ["temprano", "adverbio", "früh", 2, "zeit"], ["tarde", "adverbio", "spät", 2, "zeit"],
  ["pronto", "adverbio", "bald", 2, "zeit"], ["a veces", "locución", "manchmal", 2, "zeit"],
  ["a menudo", "locución", "oft", 3, "zeit"], ["ahora mismo", "locución", "genau jetzt", 2, "zeit"],
  ["otra vez", "locución", "noch einmal", 2, "gespraech"], ["en seguida", "locución", "sofort", 3, "gespraech"],
  ["¿verdad?", "locución", "oder? / stimmt's?", 2, "gespraech"], ["depende", "verbo", "kommt darauf an", 2, "gespraech"],
  ["me gustaría", "locución", "ich würde gern", 2, "gespraech"], ["tengo que", "locución", "ich muss", 1, "gespraech"],
  ["hay que", "locución", "man muss", 2, "gespraech"], ["está bien", "locución", "in Ordnung / passt", 1, "gespraech"],
];

// Kompakt-Tupel in vollständige SeedVocab-Einträge umwandeln.
const toEntry = ([lemma, pos, meaningDe, tier, category]: [string, string, string, number, string]): SeedVocab => ({
  lemma, pos, meaningDe,
  explanationEs: "",
  examples: [],
  category,
  frequencyTier: tier,
  layer: tier <= 1 ? "kern" : tier <= 2 ? "thematisch" : "fortgeschritten",
  imageEmoji: EMOJI_MAP[lemma] || undefined, // Bildanker, wenn konkreter Begriff
});
const EXPANDED: SeedVocab[] = COMPACT.map(toEntry);
const FREQ: SeedVocab[] = [...FREQ_WORDS, ...FREQ_WORDS2].map(toEntry);

// Zusammenführen und doppelte Lemmata entfernen; RICH (volle Datentiefe) hat Vorrang.
const seen = new Set<string>();
export const VOCABULARY: SeedVocab[] = [...RICH, ...EXPANDED, ...FREQ].filter((e) => {
  if (seen.has(e.lemma)) return false;
  seen.add(e.lemma);
  return true;
});

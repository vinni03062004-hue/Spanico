// Rollen- und Szenariosimulationen (wiederverwendbar in Jarvis-, Bild- und Pruefmodus).
export interface ScenarioStep {
  prompt_de: string;      // Was der Nutzer erreichen soll
  targetsEs: string[];    // akzeptierte Zielphrasen
  hint: string;
  coachLine: string;      // was der Coach sagt/fragt (Spanisch)
}
export interface SeedScenario {
  key: string;
  title: string;
  difficulty: number;
  steps: ScenarioStep[];
  targetVocab: string[];
}

export const SCENARIOS: SeedScenario[] = [
  {
    key: "cafe",
    title: "Im Café bestellen",
    difficulty: 1,
    targetVocab: ["café", "por favor", "la cuenta", "quisiera"],
    steps: [
      { prompt_de: "Begrüße den Kellner.", targetsEs: ["hola", "buenos días", "buenas"], hint: "Hola / Buenos días", coachLine: "¡Buenos días! Bienvenido. ¿Qué le pongo?" },
      { prompt_de: "Bestelle einen Milchkaffee.", targetsEs: ["un café con leche", "quiero un café", "quisiera un café con leche"], hint: "Un café con leche, por favor", coachLine: "Muy bien. ¿Algo más?" },
      { prompt_de: "Frag nach der Rechnung.", targetsEs: ["la cuenta", "la cuenta por favor", "me trae la cuenta"], hint: "La cuenta, por favor", coachLine: "Claro, ahora mismo se la traigo." },
    ],
  },
  {
    key: "wegbeschreibung",
    title: "Nach dem Weg fragen",
    difficulty: 2,
    targetVocab: ["¿dónde está...?", "izquierda", "derecha", "la estación"],
    steps: [
      { prompt_de: "Frag höflich, wo der Bahnhof ist.", targetsEs: ["dónde está la estación", "perdone dónde está la estación"], hint: "¿Dónde está la estación?", coachLine: "Perdone, ¿en qué puedo ayudarle?" },
      { prompt_de: "Bestätige und frag, ob es links oder rechts ist.", targetsEs: ["a la izquierda", "a la derecha", "izquierda o derecha"], hint: "¿A la izquierda o a la derecha?", coachLine: "Está muy cerca. Siga recto y luego gire." },
      { prompt_de: "Bedanke dich.", targetsEs: ["gracias", "muchas gracias"], hint: "Muchas gracias", coachLine: "De nada, ¡que tenga un buen día!" },
    ],
  },
  {
    key: "arzt",
    title: "Beim Arzt / in der Apotheke",
    difficulty: 3,
    targetVocab: ["el médico", "me duele", "necesito"],
    steps: [
      { prompt_de: "Sag, dass du Kopfschmerzen hast.", targetsEs: ["me duele la cabeza"], hint: "Me duele la cabeza", coachLine: "Buenos días, ¿qué le pasa?" },
      { prompt_de: "Sag, dass du etwas brauchst.", targetsEs: ["necesito algo", "necesito una medicina", "necesito ayuda"], hint: "Necesito una medicina", coachLine: "Entiendo. ¿Desde cuándo le duele?" },
      { prompt_de: "Bedanke dich und verabschiede dich.", targetsEs: ["gracias", "adiós", "hasta luego"], hint: "Gracias, hasta luego", coachLine: "Que se mejore. ¡Hasta luego!" },
    ],
  },
];

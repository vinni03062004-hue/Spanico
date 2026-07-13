// Kopplung Wortschatz <-> Sprachklasse.
// Steuert, welche Haeufigkeitsstufen bei welchem Skill-Band freigeschaltet sind.
// Ziel: vom Grundwortschatz bis zu muttersprachlicher Breite - gestaffelt.
import { Band, BANDS } from "./scoring";

// frequencyTier: 1 = haeufigste Woerter ... hoehere Tier = seltener/spezieller.
// Pro Band ein maximaler Tier, der aktiv geuebt wird (native ~ alle Stufen).
export const BAND_MAX_TIER: Record<Band, number> = {
  "Novice unstable": 1,
  "Novice functional": 2,
  "Basic communicator": 3,
  "Basic communicator stable": 4,
  "Emerging conversational": 5,
  "Conversational limited": 6,
  "Conversational stable": 8,
  "Advanced functional": 12,
  "Advanced natural": 20,
  "Highly reliable": 999, // gesamter Wortschatz bis muttersprachlich
};

// Grobe Orientierung: wie viele Woerter eine Klasse ungefaehr aktiv beherrscht.
export const BAND_VOCAB_TARGET: Record<Band, number> = {
  "Novice unstable": 150,
  "Novice functional": 400,
  "Basic communicator": 800,
  "Basic communicator stable": 1500,
  "Emerging conversational": 2500,
  "Conversational limited": 4000,
  "Conversational stable": 6000,
  "Advanced functional": 10000,
  "Advanced natural": 16000,
  "Highly reliable": 25000,
};

export function maxTierForBand(band: string): number {
  return BAND_MAX_TIER[(band as Band)] ?? 3;
}

export function bandIndex(band: string): number {
  return Math.max(0, BANDS.indexOf(band as Band));
}

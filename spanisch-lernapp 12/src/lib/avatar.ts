// Comic-Avatare (anpassbar) über DiceBear "avataaars".
// Es wird nur eine Bild-URL erzeugt (SVG) — keine zusätzliche Abhängigkeit nötig.
// Die gewählten Optionen werden pro Profil gespeichert (User.avatar als JSON).

export interface AvatarOptions {
  seed: string;
  skinColor: string;      // hex ohne #
  hairColor: string;      // hex ohne #
  top: string;            // Frisur / Kopfbedeckung
  accessories: string;    // Brille etc.
  clothing: string;
  clothesColor: string;   // hex ohne #
  eyes: string;
  mouth: string;
  backgroundColor: string; // hex ohne #
}

// Auswahlmöglichkeiten für den Editor (Werte = DiceBear-Optionen).
export const CHOICES = {
  skinColor: ["f2d3b1", "edb98a", "d08b5b", "ae5d29", "614335", "ffdbb4"],
  hairColor: ["2c1b18", "4a312c", "724133", "a55728", "b58143", "c93305", "e8e1e1", "ecdcbf"],
  top: ["shortFlat", "shortCurly", "shortWaved", "theCaesar", "bigHair", "bob", "bun", "curly", "curvy", "dreads", "frida", "fro", "longButNotTooLong", "miaWallace", "straight01", "straight02", "hat", "hijab", "turban", "winterHat1"],
  accessories: ["blank", "prescription01", "prescription02", "round", "sunglasses", "wayfarers", "eyepatch"],
  clothing: ["blazerAndShirt", "hoodie", "overall", "shirtCrewNeck", "shirtVNeck", "collarAndSweater", "graphicShirt", "blazerAndSweater"],
  clothesColor: ["3c4f5c", "65c9ff", "5199e4", "25557c", "e6e6e6", "929598", "a7ffc4", "ffdeb5", "ffafb9", "ffffb1", "ff5c5c", "ff488e", "b1e2ff"],
  eyes: ["default", "happy", "wink", "squint", "surprised", "hearts", "side", "closed"],
  mouth: ["smile", "twinkle", "default", "serious", "eating", "grimace", "tongue"],
  backgroundColor: ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf", "transparent"],
} as const;

export function defaultAvatar(seed = "coach"): AvatarOptions {
  return {
    seed,
    skinColor: "edb98a",
    hairColor: "2c1b18",
    top: "shortFlat",
    accessories: "blank",
    clothing: "hoodie",
    clothesColor: "5199e4",
    eyes: "happy",
    mouth: "smile",
    backgroundColor: "b6e3f4",
  };
}

export function randomAvatar(): AvatarOptions {
  const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
  return {
    seed: Math.random().toString(36).slice(2, 8),
    skinColor: pick(CHOICES.skinColor),
    hairColor: pick(CHOICES.hairColor),
    top: pick(CHOICES.top),
    accessories: Math.random() < 0.35 ? pick(CHOICES.accessories) : "blank",
    clothing: pick(CHOICES.clothing),
    clothesColor: pick(CHOICES.clothesColor),
    eyes: pick(CHOICES.eyes),
    mouth: pick(CHOICES.mouth),
    backgroundColor: pick(CHOICES.backgroundColor),
  };
}

// Baut die DiceBear-SVG-URL aus den Optionen.
export function avatarUrl(o?: Partial<AvatarOptions> | null, size = 160): string {
  const a = { ...defaultAvatar(), ...(o || {}) };
  const p = new URLSearchParams();
  p.set("seed", a.seed || "coach");
  p.set("size", String(size));
  p.set("skinColor", a.skinColor);
  p.set("hairColor", a.hairColor);
  p.set("top", a.top);
  if (a.accessories && a.accessories !== "blank") {
    p.set("accessories", a.accessories);
    p.set("accessoriesProbability", "100");
  } else {
    p.set("accessoriesProbability", "0");
  }
  p.set("clothing", a.clothing);
  p.set("clothesColor", a.clothesColor);
  p.set("eyes", a.eyes);
  p.set("mouth", a.mouth);
  if (a.backgroundColor && a.backgroundColor !== "transparent") p.set("backgroundColor", a.backgroundColor);
  return `https://api.dicebear.com/9.x/avataaars/svg?${p.toString()}`;
}

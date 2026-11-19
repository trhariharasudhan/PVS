import type { SareeDesign } from "./render";

/**
 * Trending starting points for the designer and the "trending" strip on the home page.
 * Names/notes live in the dictionaries under `presets.<id>`. These are design ideas
 * a customer can start from — not stock that PVS holds.
 */
export const PRESET_IDS = ["templeBride", "gangaJamuna", "vairaoosi", "kattam", "pastel", "midnightJaal"] as const;
export type PresetId = (typeof PRESET_IDS)[number];

export const PRESETS: Record<PresetId, SareeDesign> = {
  // Classic Kanchi-style bridal: arakku body, bottle-green temple border, peacock row, elephant pallu
  templeBride: {
    body: "#7A1022",
    border: "#0F4D3A",
    pallu: "#7A1022",
    zari: "gold",
    borderStyle: "temple",
    borderMotif: "peacock",
    bodyPattern: "buttas",
    bodyMotif: "flower",
    palluStyle: "grand",
    palluMotif: "elephant",
    sheen: 1,
  },
  // Two-colour border, mango buttas, annam rows in the pallu
  gangaJamuna: {
    body: "#E9B21B",
    border: "#0F4D3A",
    border2: "#C2185B",
    pallu: "#C2185B",
    zari: "gold",
    borderStyle: "gangaJamuna",
    borderMotif: "mango",
    bodyPattern: "buttas",
    bodyMotif: "mango",
    palluStyle: "motifRows",
    palluMotif: "annam",
    sheen: 1,
  },
  // Light soft-silk look: fine vairaoosi dots, silver zari
  vairaoosi: {
    body: "#E7A1A8",
    border: "#5B1E5E",
    pallu: "#5B1E5E",
    zari: "silver",
    borderStyle: "vairaoosi",
    borderMotif: null,
    bodyPattern: "vairaoosi",
    bodyMotif: null,
    palluStyle: "stripes",
    palluMotif: null,
    sheen: 0.8,
  },
  // Traditional checks with chakram, kattam border
  kattam: {
    body: "#5DA130",
    border: "#7A1022",
    pallu: "#7A1022",
    zari: "gold",
    borderStyle: "kattam",
    borderMotif: "rudraksha",
    bodyPattern: "checks",
    bodyMotif: "chakram",
    palluStyle: "stripes",
    palluMotif: null,
    sheen: 1,
  },
  // Trending pastel with antique zari, tiny lotus buttas, slim border
  pastel: {
    body: "#9C86C4",
    border: "#9C86C4",
    pallu: "#5B1E5E",
    zari: "antique",
    borderStyle: "minimal",
    borderMotif: null,
    bodyPattern: "buttas",
    bodyMotif: "lotus",
    palluStyle: "motifRows",
    palluMotif: "lotus",
    sheen: 0.9,
  },
  // Deep midnight with a gold jaal and a grand peacock pallu
  midnightJaal: {
    body: "#121B3D",
    border: "#B3122E",
    pallu: "#B3122E",
    zari: "gold",
    borderStyle: "rettaiPettu",
    borderMotif: "annam",
    bodyPattern: "jaal",
    bodyMotif: "flower",
    palluStyle: "grand",
    palluMotif: "peacock",
    sheen: 1,
  },
};

/** The saree woven in the home-page hero (also drawn in the static fallback). */
export const HERO_SAREE_DESIGN: SareeDesign = {
  ...PRESETS.templeBride,
  // shot silk: a slightly brighter red warp under the arakku weft makes the body shimmer
  shot: "#A3182E",
  bodyMotif: "mango",
};

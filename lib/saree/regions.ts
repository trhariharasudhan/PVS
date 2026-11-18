import type { SareeDesign } from "./render";

/**
 * Tamil Nadu regional saree styles (text in dictionaries → regions.items).
 * Each gets a woven-style illustration in the style's typical look, and a designer
 * preset to start a PVS saree "inspired by" it. GI names belong to their regions:
 * PVS never sells its sarees under those names.
 */
export const REGION_IDS = ["kanchipuram", "arani", "thirubuvanam", "salem", "kovai", "sungudi"] as const;
export type RegionId = (typeof REGION_IDS)[number];

export const REGION_DESIGNS: Record<RegionId, SareeDesign> = {
  // heavy silk, contrast temple border, grand zari pallu
  kanchipuram: {
    body: "#C48A12",
    border: "#5B1E5E",
    pallu: "#5B1E5E",
    zari: "gold",
    borderStyle: "temple",
    borderMotif: "peacock",
    bodyPattern: "buttas",
    bodyMotif: "annam",
    palluStyle: "grand",
    palluMotif: "elephant",
    sheen: 1,
  },
  // lighter silk, small buttas, simpler border
  arani: {
    body: "#0B4F8A",
    border: "#C2185B",
    pallu: "#C2185B",
    zari: "gold",
    borderStyle: "rettaiPettu",
    borderMotif: null,
    bodyPattern: "buttas",
    bodyMotif: "flower",
    palluStyle: "motifRows",
    palluMotif: "flower",
    sheen: 0.85,
  },
  // body and border from the same warp (same colour), zari motifs
  thirubuvanam: {
    body: "#0F4D3A",
    border: "#0F4D3A",
    pallu: "#7A1022",
    zari: "gold",
    borderStyle: "vairaoosi",
    borderMotif: "mango",
    bodyPattern: "buttas",
    bodyMotif: "mango",
    palluStyle: "grand",
    palluMotif: "peacock",
    sheen: 1,
  },
  // Salem: cream silk with a gold zari border
  salem: {
    body: "#F2E8D5",
    border: "#F2E8D5",
    pallu: "#F2E8D5",
    zari: "gold",
    borderStyle: "rettaiPettu",
    borderMotif: "rudraksha",
    bodyPattern: "plain",
    bodyMotif: null,
    palluStyle: "stripes",
    palluMotif: null,
    sheen: 0.9,
  },
  // kora silk-cotton: crisp, light, checks
  kovai: {
    body: "#E7A1A8",
    border: "#5B1E5E",
    pallu: "#5B1E5E",
    zari: "antique",
    borderStyle: "kattam",
    borderMotif: null,
    bodyPattern: "checks",
    bodyMotif: "rudraksha",
    palluStyle: "stripes",
    palluMotif: null,
    sheen: 0.4,
  },
  // sungudi dots on a bold ground, thread border
  sungudi: {
    body: "#7A1022",
    border: "#141113",
    pallu: "#141113",
    zari: "none",
    borderStyle: "minimal",
    borderMotif: null,
    bodyPattern: "sungudi",
    bodyMotif: null,
    palluStyle: "stripes",
    palluMotif: null,
    sheen: 0.3,
  },
};


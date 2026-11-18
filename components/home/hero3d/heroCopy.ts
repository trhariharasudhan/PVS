import type { SceneId } from "./sceneConfig";

/** All hero text in one place (easy to edit / translate). B2B-first: no retail prices. */
export const HERO_COPY: Record<SceneId, { eyebrow?: string; title: string; body?: string }> = {
  loom: {
    eyebrow: "PVS SILKS • Salem, Tamil Nadu",
    title: "Where Tradition Begins",
    body: "Every thread carries a story.",
  },
  threads: {
    eyebrow: "Step 01 — Warp",
    title: "Silk, Thread by Thread",
    body: "Fine silk warp is wound on the beam and drawn through the heddles and the jacquard harness, thread by thread.",
  },
  weaving: {
    eyebrow: "Step 02 — Weaving",
    title: "Woven on the Loom",
    body: "Punch cards set the border design, the shuttle flies through the open warp, and the reed beats each thread home — pick by pick.",
  },
  saree: {
    eyebrow: "Step 03 — Finish",
    title: "Pure Silk. Gold Zari.",
    body: "A finished pattu saree with a woven zari border, ready for inspection.",
  },
  brand: {
    eyebrow: "The Mark of PVS",
    title: "PVS SILKS — Parampariyam • Vannam • Silk",
    body: "Heritage • Colour • Silk. Woven into every saree we make.",
  },
  packaging: {
    eyebrow: "Step 04 — Dispatch",
    title: "Packed With Care",
    body: "Folded, wrapped and packed for safe delivery to your store.",
  },
  final: {
    eyebrow: "Woven to order",
    title: "Crafted With Tradition.",
    body: "From the loom to your legacy. Discover the art of traditional silk weaving with PVS.",
  },
};

/** Concrete reasons for a retailer/wholesaler to enquire (only claims the business already makes). */
export const VALUE_POINTS = [
  "Woven to your colours and design",
  "Direct from our looms in Salem district — no middlemen",
  "For families, boutiques and wholesale buyers",
];

export const HERO_CTAS = {
  primary: { label: "Start Custom Order", href: "/custom-order" },
  secondary: { label: "How We Weave", href: "/our-craft" },
  tertiary: { label: "Wholesale enquiry", href: "/wholesale" },
};

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
    body: "Fine red silk warp is drawn in, aligned and tensioned across the loom.",
  },
  weaving: {
    eyebrow: "Step 02 — Weaving",
    title: "Woven on the Loom",
    body: "Shuttle, reed and warp move as one. Pick by pick, the saree takes shape.",
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
    eyebrow: "Direct Manufacturer",
    title: "Crafted With Tradition.",
    body: "From the loom to your legacy. Discover the art of traditional silk weaving with PVS.",
  },
};

/** Concrete reasons for a retailer/wholesaler to enquire (only claims the business already makes). */
export const VALUE_POINTS = [
  "Direct from our looms in Salem, Tamil Nadu",
  "Wholesale & bulk supply for boutiques and retailers",
  "Custom weave enquiries welcome",
];

export const HERO_CTAS = {
  primary: { label: "Request a Manufacturing Quote", href: "/wholesale" },
  secondary: { label: "Explore Our Craft", href: "/our-craft" },
  tertiary: { label: "Contact PVS", href: "/contact" },
};

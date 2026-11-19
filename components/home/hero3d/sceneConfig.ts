/**
 * PVS 3D hero — single source of truth for the scroll story.
 *
 * Every scene reads the same normalised scroll progress (0..1). Ranges below are
 * the only place scene timing is defined; models, camera and overlay all use them.
 */

export type SceneId = "loom" | "threads" | "weaving" | "saree" | "brand" | "packaging" | "final";

export const SCENES: Record<SceneId, readonly [number, number]> = {
  loom: [0.0, 0.15],
  threads: [0.15, 0.25],
  weaving: [0.25, 0.4],
  saree: [0.4, 0.6],
  brand: [0.6, 0.72],
  packaging: [0.72, 0.93],
  final: [0.93, 1.0],
};

/** Brand palette used inside the 3D scene (from the hero brief). */
export const PALETTE = {
  deepMaroon: "#641B2B",
  burgundy: "#3F101D",
  antiqueGold: "#C6A15B",
  warmIvory: "#F6F0E6",
  darkBrown: "#281B17",
  silkRed: "#8E1426",
  background: "#140c0a",
  wood: "#6b4428",
  woodDark: "#3d2516",
  metal: "#9a9188",
} as const;

export type QualityTier = "high" | "medium" | "low";

export interface QualitySettings {
  tier: QualityTier;
  /** Number of warp threads (instanced). */
  warpThreads: number;
  /** Saree cloth grid resolution. */
  clothSegments: [number, number];
  shadows: boolean;
  dpr: [number, number];
  /** Scroll length of the pinned story, in viewport heights. */
  scrollVh: number;
  textureSize: number;
}

export const QUALITY: Record<QualityTier, QualitySettings> = {
  high: {
    tier: "high",
    warpThreads: 180,
    clothSegments: [96, 36],
    shadows: true,
    dpr: [1, 1.75],
    scrollVh: 760,
    textureSize: 2048,
  },
  medium: {
    tier: "medium",
    warpThreads: 120,
    clothSegments: [64, 24],
    shadows: true,
    dpr: [1, 1.5],
    scrollVh: 640,
    textureSize: 1536,
  },
  low: {
    tier: "low",
    warpThreads: 64,
    clothSegments: [40, 16],
    shadows: false,
    dpr: [1, 1.25],
    scrollVh: 500,
    textureSize: 1024,
  },
};

/* ------------------------------------------------------------------ */
/* Geometry layout of the loom (world units ≈ metres, front faces +Z)  */
/* ------------------------------------------------------------------ */
export const LOOM = {
  width: 2.2,
  depth: 2.3,
  height: 1.9,
  /** Width of the warp sheet across the loom (X). */
  warpWidth: 1.5,
  /** Height of the weaving plane. */
  warpY: 0.92,
  backBeamZ: -1.0,
  heddleZ: -0.15,
  /** Jacquard harness plane (border threads are lifted here). */
  harnessZ: -0.36,
  /** Comber board height and jacquard machine height. */
  comberY: 1.6,
  jacquardY: 2.6,
  breastBeamZ: 0.95,
  clothBeamY: 0.46,
  /** Fell line (edge of woven cloth). Nearly fixed, as on a real loom: progress is
   *  shown by cloth advancing over the breast beam and winding onto the cloth beam. */
  fellStartZ: 0.58,
  fellEndZ: 0.54,
  /** Overhead batten pivot (beater swings from here). */
  battenPivot: [0, 1.82, 0.25] as const,
  battenLength: 0.94,
  reedRestZ: 0.14,
  /** Shed half-opening at the heddles. */
  shedOpen: 0.075,
} as const;

/** Detached saree (presentation cloth) dimensions, local units. */
export const SAREE = {
  length: 3.0,
  height: 1.2,
  presentPosition: [0, 1.55, 1.6] as const,
  folds: 6,
} as const;

/** Shopping bag dimensions & resting position (right of the packing table). */
export const BAG = {
  width: 1.05,
  height: 1.25,
  depth: 0.38,
  position: [1.3, 0, 1.55] as const,
} as const;

/**
 * Folding in the air + packing, as local times inside the "packaging" scene (0..1).
 * Follows PVS's silk-saree folding procedure:
 *   1 spread & align → 2 first lengthwise fold → 3 second lengthwise fold →
 *   4 crosswise accordion folds (alternating) → 5 pallu on top → 6 square the shape →
 *   7 quality check — then the box rises under the floating saree, tissue, lid.
 * The closed box goes into the bag in the "final" scene.
 */
export const FOLD = {
  spread: [0.0, 0.07],
  half: [0.07, 0.17],
  second: [0.17, 0.27],
  accordion: [0.27, 0.55],
  pallu: [0.55, 0.61],
  square: [0.61, 0.66],
  check: [0.64, 0.73],
  boxIn: [0.66, 0.77],
  lower: [0.76, 0.83],
  tissue: [0.82, 0.87],
  lid: [0.86, 0.95],
} as const satisfies Record<string, readonly [number, number]>;

/** The seven folding steps, in order (labels live in the dictionaries: hero.foldSteps). */
export const FOLD_STEPS = ["spread", "half", "second", "accordion", "pallu", "square", "check"] as const;

/** Panels in the accordion fold (odd, so the pallu end finishes face-up on top). */
export const ACCORDION_PANELS = 11;

export const PACK = {
  /** Where the saree floats while it is folded (world). */
  foldPos: [0.3, 1.15, 1.7] as const,
  /** Bottom centre of the open box once it has risen under the saree. */
  boxPos: [0.3, 0.86, 1.7] as const,
  /** Box outer size: x (width), y (height), z (depth) — fits the folded stack (≈0.27 × 0.30). */
  box: [0.34, 0.1, 0.38] as const,
} as const;

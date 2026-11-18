/**
 * Shedding logic shared by the warp threads, ground shafts and jacquard harness.
 *
 * Real silk-saree looms combine:
 *  - ground shafts for the body (plain weave: odd/even threads alternate every pick)
 *  - a jacquard for the borders, which lifts threads individually from punch cards
 *    (one card = one weft row), so motifs can be woven.
 */
import { LOOM } from "./sceneConfig";

/**
 * The hero loom follows the classic floor-loom layout (head roller, heddle shafts, beater,
 * treadles, ratchet rollers), so every warp thread is on the shafts: no jacquard threads.
 * Set BORDER_FRACTION > 0 to bring back jacquard-controlled border threads.
 */
export const BORDER_FRACTION = 0;

export function borderCount(total: number) {
  return BORDER_FRACTION > 0 ? Math.max(4, Math.round(total * BORDER_FRACTION)) : 0;
}

export function isBorderThread(i: number, total: number) {
  const b = borderCount(total);
  return b > 0 && (i < b || i >= total - b);
}

/**
 * +1 = lifted, -1 = lowered for thread i on pick `pick`.
 * Body: plain weave. Border: a small diamond motif, read like a punch card row.
 */
export function liftSign(i: number, total: number, pick: number): 1 | -1 {
  if (!isBorderThread(i, total)) return (i + pick) % 2 === 0 ? 1 : -1;
  const b = borderCount(total);
  const local = i < b ? i : total - 1 - i; // mirror both borders
  const row = ((pick % 8) + 8) % 8;
  const col = local % 8;
  const d = Math.abs(col - 3.5);
  const inMotif = d <= (row < 4 ? row : 7 - row) + 0.5;
  // motif = 3/1 float over plain ground
  const ground = (i + pick) % 2 === 0;
  return (inMotif ? (i + pick) % 4 !== 0 : ground) ? 1 : -1;
}

/** Warp x-position of thread i. */
export function threadX(i: number, total: number) {
  return -LOOM.warpWidth / 2 + ((i + 0.5) / total) * LOOM.warpWidth;
}

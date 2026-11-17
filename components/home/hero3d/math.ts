import { SCENES, type SceneId } from "./sceneConfig";

/** Mutable progress holder shared by the timeline and the 3D scene (no React state per frame). */
export interface ProgressStore {
  value: number;
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 0..1 position of `p` inside [a, b]. */
export const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

/** Smooth Hermite ease (zero velocity at both ends). */
export const smooth = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

/** Ease in/out that is gentler at the edges than smoothstep. */
export const smoother = (t: number) => {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

/** Local 0..1 progress of a named scene. */
export const sceneT = (p: number, id: SceneId) => {
  const [a, b] = SCENES[id];
  return range(p, a, b);
};

/** Sub-range inside a scene's local progress, eased. */
export const step = (t: number, a: number, b: number) => smooth(range(t, a, b));

/** Triangle wave 0→1→0 over one period, used for back-and-forth mechanics. */
export const triangle = (t: number) => {
  const f = t - Math.floor(t);
  return f < 0.5 ? f * 2 : 2 - f * 2;
};

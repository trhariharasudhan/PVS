/**
 * Can this device comfortably run a WebGL scene?
 * Same rules as the hero's pre-paint script: reduced motion, data saver, low memory/CPU
 * or no WebGL → no 3D.
 */
export function canRun3d(): boolean {
  try {
    if (typeof window === "undefined") return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    const n = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    if (n.connection?.saveData) return false;
    if ((n.deviceMemory && n.deviceMemory <= 2) || (n.hardwareConcurrency && n.hardwareConcurrency <= 2)) return false;
    const cv = document.createElement("canvas");
    const gl = (cv.getContext("webgl2") || cv.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * Procedural canvas textures for the hero (no external image assets needed).
 *
 * - Wood grain for the loom frame
 * - Red silk saree with gold zari borders, kovil (temple) border motif and pallu
 * - "PVS SILKS" embroidered brand mark (real vector text, never AI-generated)
 * - Maroon shopping-bag front with gold branding
 *
 * Each colour map has a matching ORM map (R = AO, G = roughness, B = metalness)
 * so the gold zari reads as metal while the silk stays soft.
 * Callers own the returned textures and must dispose them.
 */
import * as THREE from "three";
import { PALETTE } from "./sceneConfig";
import { renderSareeCanvas, type SareeDesign } from "@/lib/saree/render";
import { HERO_SAREE_DESIGN } from "@/lib/saree/presets";

type Ink = { silk: string; red2: string; gold: string; goldDark: string; line: string };
// ORM inks for the bag texture (R = AO, G = roughness, B = metalness)

// R = ambient occlusion, G = roughness, B = metalness
const ORM_INK: Ink = {
  silk: "rgb(255,135,0)",
  red2: "rgb(255,150,0)",
  gold: "rgb(255,80,235)",
  goldDark: "rgb(255,105,205)",
  line: "rgb(255,70,245)",
};

/* ------------------------------------------------------------------ */
/* Fonts                                                               */
/* ------------------------------------------------------------------ */

/** Resolve the next/font family behind a CSS variable (e.g. --font-serif). */
export function resolveFontFamily(cssVar: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

/** Wait until the brand serif is ready so canvas text never falls back mid-draw. */
export async function ensureFonts(serif: string, sans: string): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load(`700 120px ${serif}`),
      document.fonts.load(`600 40px ${sans}`),
    ]);
  } catch {
    /* fall back to system fonts silently */
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2D canvas not available");
  return { c, ctx };
}

function toTexture(c: HTMLCanvasElement, srgb: boolean, anisotropy = 8) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = anisotropy;
  t.needsUpdate = true;
  return t;
}

/** Deterministic PRNG so textures look identical on every load. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Draw text with manual letter spacing (canvas letterSpacing is not universal). */
function spacedText(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, spacing: number) {
  const chars = Array.from(text);
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let x = cx - total / 2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = "left";
  chars.forEach((ch, i) => {
    ctx.fillText(ch, x, y);
    x += widths[i] + spacing;
  });
  ctx.textAlign = prevAlign;
  return total;
}

/* ------------------------------------------------------------------ */
/* Wood                                                                */
/* ------------------------------------------------------------------ */

export function createWoodTexture(size = 512): THREE.CanvasTexture {
  const { c, ctx } = makeCanvas(size, size);
  const r = rng(7);
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(0, 0, size, size);
  // Long grain lines along V (texture is mapped along the beam length)
  for (let i = 0; i < 140; i++) {
    const x = r() * size;
    const w = 0.6 + r() * 2.4;
    const dark = r() > 0.5;
    ctx.strokeStyle = dark ? `rgba(40,22,12,${0.12 + r() * 0.25})` : `rgba(150,100,60,${0.06 + r() * 0.12})`;
    ctx.lineWidth = w;
    ctx.beginPath();
    const amp = 2 + r() * 6;
    const freq = 0.004 + r() * 0.01;
    const ph = r() * 10;
    for (let y = 0; y <= size; y += 8) {
      const xx = x + Math.sin(y * freq + ph) * amp;
      if (y === 0) ctx.moveTo(xx, y);
      else ctx.lineTo(xx, y);
    }
    ctx.stroke();
  }
  // A few knots
  for (let k = 0; k < 3; k++) {
    const kx = r() * size;
    const ky = r() * size;
    for (let ring = 0; ring < 6; ring++) {
      ctx.strokeStyle = `rgba(35,18,10,${0.25 - ring * 0.03})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(kx, ky, 3 + ring * 3, 8 + ring * 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  const t = toTexture(c, true);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/* ------------------------------------------------------------------ */
/* Saree (shared design engine: lib/saree)                             */
/* ------------------------------------------------------------------ */

/** PVS signature bridal design used in the 3D story. */
export function createSareeTextures(size = 2048, design: SareeDesign = HERO_SAREE_DESIGN) {
  const W = size;
  const H = Math.round(size * 0.42); // matches the saree aspect (≈ 3.0 x 1.2)
  const color = renderSareeCanvas(W, H, design, "color");
  const orm = renderSareeCanvas(W, H, design, "orm");
  return { map: toTexture(color, true), orm: toTexture(orm, false) };
}

/* ------------------------------------------------------------------ */
/* Brand mark (embroidered decal)                                      */
/* ------------------------------------------------------------------ */

export function createBrandMarkTexture(serif: string, sans: string, size = 2048) {
  const W = size;
  const H = Math.round(size * 0.3);
  const { c, ctx } = makeCanvas(W, H);
  ctx.clearRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Ornamental lines
  ctx.fillStyle = "#fff";
  const lineY = H * 0.08;
  ctx.fillRect(W * 0.18, lineY, W * 0.64, H * 0.01);
  ctx.beginPath();
  ctx.moveTo(W / 2, lineY - H * 0.03);
  ctx.lineTo(W / 2 + H * 0.03, lineY + H * 0.005);
  ctx.lineTo(W / 2, lineY + H * 0.04);
  ctx.lineTo(W / 2 - H * 0.03, lineY + H * 0.005);
  ctx.fill();

  ctx.font = `700 ${Math.round(H * 0.46)}px ${serif}`;
  spacedText(ctx, "PVS SILKS", W / 2, H * 0.62, H * 0.05);

  ctx.font = `600 ${Math.round(H * 0.11)}px ${sans}`;
  spacedText(ctx, "PARAMPARIYAM  •  VANNAM  •  SILK", W / 2, H * 0.86, H * 0.025);
  ctx.fillRect(W * 0.3, H * 0.93, W * 0.4, H * 0.006);

  // Stitch texture inside the glyphs (embroidery look), drawn only where text exists.
  ctx.globalCompositeOperation = "source-atop";
  ctx.strokeStyle = "rgba(0,0,0,0.28)";
  ctx.lineWidth = 2;
  for (let x = -H; x < W + H; x += 7) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + H * 0.35, H);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";

  return toTexture(c, true);
}

/* ------------------------------------------------------------------ */
/* Shopping bag                                                        */
/* ------------------------------------------------------------------ */

function drawBag(ctx: CanvasRenderingContext2D, W: number, H: number, serif: string, sans: string, orm: boolean) {
  // Satin gold foil: less metallic than zari so it stays bright in a dark room.
  const gold = orm ? "rgb(255,95,140)" : "#d9b66c";
  if (orm) {
    ctx.fillStyle = "rgb(255,215,0)"; // matte paper: rough, non-metal
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, PALETTE.deepMaroon);
    g.addColorStop(1, "#4d1522");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // paper fibre noise
    const r = rng(11);
    for (let i = 0; i < 9000; i++) {
      ctx.fillStyle = `rgba(255,255,255,${r() * 0.025})`;
      ctx.fillRect(r() * W, r() * H, 1 + r() * 2, 1);
    }
  }

  // Inset gold frame
  ctx.strokeStyle = gold;
  ctx.lineWidth = W * 0.006;
  ctx.strokeRect(W * 0.07, H * 0.06, W * 0.86, H * 0.88);
  ctx.lineWidth = W * 0.002;
  ctx.strokeRect(W * 0.09, H * 0.075, W * 0.82, H * 0.85);

  ctx.fillStyle = gold;
  ctx.textAlign = "center";
  // Motif above the name
  const my = H * 0.3;
  ctx.beginPath();
  ctx.moveTo(W / 2, my - W * 0.05);
  ctx.lineTo(W / 2 + W * 0.035, my);
  ctx.lineTo(W / 2, my + W * 0.05);
  ctx.lineTo(W / 2 - W * 0.035, my);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(W * 0.25, my - W * 0.003, W * 0.18, W * 0.006);
  ctx.fillRect(W * 0.57, my - W * 0.003, W * 0.18, W * 0.006);

  ctx.font = `700 ${Math.round(W * 0.26)}px ${serif}`;
  spacedText(ctx, "PVS", W / 2, H * 0.53, W * 0.02);
  ctx.font = `600 ${Math.round(W * 0.075)}px ${serif}`;
  spacedText(ctx, "SILKS", W / 2, H * 0.62, W * 0.04);
  ctx.fillRect(W * 0.32, H * 0.66, W * 0.36, W * 0.004);
  ctx.font = `600 ${Math.round(W * 0.03)}px ${sans}`;
  spacedText(ctx, "PARAMPARIYAM • VANNAM • SILK", W / 2, H * 0.71, W * 0.008);
}

export function createBagTextures(serif: string, sans: string, size = 1024) {
  const W = size;
  const H = Math.round(size * 1.19);
  const color = makeCanvas(W, H);
  drawBag(color.ctx, W, H, serif, sans, false);
  const orm = makeCanvas(W, H);
  drawBag(orm.ctx, W, H, serif, sans, true);
  return { map: toTexture(color.c, true), orm: toTexture(orm.c, false) };
}

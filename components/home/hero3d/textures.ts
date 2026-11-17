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

type Ink = { silk: string; red2: string; gold: string; goldDark: string; line: string };

const COLOR_INK: Ink = {
  silk: PALETTE.silkRed,
  red2: "#6e0f1d",
  gold: PALETTE.antiqueGold,
  goldDark: "#9a7a3a",
  line: "#d9bd7a",
};
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
/* Saree                                                               */
/* ------------------------------------------------------------------ */

/** Kovil (temple tower) border: a row of stepped triangles pointing inward. */
function kovilRow(ctx: CanvasRenderingContext2D, x0: number, x1: number, baseY: number, h: number, dir: 1 | -1, fill: string) {
  const w = h * 0.9;
  ctx.fillStyle = fill;
  for (let x = x0; x < x1; x += w) {
    ctx.beginPath();
    // stepped tower outline (3 tiers)
    const tiers = 3;
    const tierH = h / tiers;
    ctx.moveTo(x, baseY);
    for (let t = 0; t < tiers; t++) {
      const inset = (w / 2) * (t / tiers) + w * 0.06;
      ctx.lineTo(x + inset, baseY + dir * t * tierH);
      ctx.lineTo(x + inset, baseY + dir * (t + 1) * tierH * 0.98);
    }
    ctx.lineTo(x + w / 2, baseY + dir * h);
    for (let t = tiers - 1; t >= 0; t--) {
      const inset = (w / 2) * (t / tiers) + w * 0.06;
      ctx.lineTo(x + w - inset, baseY + dir * (t + 1) * tierH * 0.98);
      ctx.lineTo(x + w - inset, baseY + dir * t * tierH);
    }
    ctx.lineTo(x + w, baseY);
    ctx.closePath();
    ctx.fill();
  }
}

/** Mango / paisley motif used in the pallu. */
function paisley(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, fill: string, line: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(0, s);
  ctx.bezierCurveTo(-s * 0.9, s * 0.6, -s * 0.8, -s * 0.6, 0, -s * 0.7);
  ctx.bezierCurveTo(s * 0.55, -s * 0.75, s * 0.75, -s * 0.25, s * 0.35, s * 0.05);
  ctx.bezierCurveTo(s * 0.05, s * 0.35, s * 0.35, s * 0.8, 0, s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = Math.max(1, s * 0.06);
  ctx.beginPath();
  ctx.arc(-s * 0.1, -s * 0.15, s * 0.28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSaree(ctx: CanvasRenderingContext2D, W: number, H: number, ink: Ink, colorMode: boolean) {
  const r = rng(42);
  const band = H * 0.13;
  const palluStart = W * 0.78;

  // Body
  ctx.fillStyle = ink.silk;
  ctx.fillRect(0, 0, W, H);

  if (colorMode) {
    // Fine weave: alternating micro-lines for warp/weft sheen
    for (let x = 0; x < W; x += 2) {
      ctx.fillStyle = `rgba(255,255,255,${0.012 + r() * 0.02})`;
      ctx.fillRect(x, 0, 1, H);
    }
    for (let y = 0; y < H; y += 2) {
      ctx.fillStyle = `rgba(0,0,0,${0.02 + r() * 0.03})`;
      ctx.fillRect(0, y, W, 1);
    }
  }

  // Body buttas (small gold flowers) on a diamond grid
  const gx = W * 0.045;
  const gy = (H - band * 2) / 5;
  for (let row = 0; row < 5; row++) {
    for (let x = gx / 2 + (row % 2 ? gx / 2 : 0); x < palluStart - gx * 0.3; x += gx) {
      const y = band + gy * (row + 0.5);
      const s = Math.min(W, H) * 0.012;
      ctx.fillStyle = ink.gold;
      for (let p = 0; p < 4; p++) {
        const a = (p / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.7, s * 0.45, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = ink.red2;
      ctx.beginPath();
      ctx.arc(x, y, s * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Zari borders (top and bottom)
  const drawBorder = (y0: number, inward: 1 | -1) => {
    ctx.fillStyle = ink.gold;
    ctx.fillRect(0, y0, W, band);
    // inner red ribbon with fine gold lines
    const ribbonY = inward === 1 ? y0 + band * 0.22 : y0 + band * 0.52;
    ctx.fillStyle = ink.red2;
    ctx.fillRect(0, ribbonY, W, band * 0.26);
    ctx.fillStyle = ink.line;
    ctx.fillRect(0, ribbonY + band * 0.06, W, Math.max(1, band * 0.025));
    ctx.fillRect(0, ribbonY + band * 0.18, W, Math.max(1, band * 0.025));
    // small diamonds in the ribbon
    ctx.fillStyle = ink.gold;
    const dStep = band * 0.32;
    for (let x = dStep / 2; x < W; x += dStep) {
      const cy = ribbonY + band * 0.13;
      const d = band * 0.05;
      ctx.beginPath();
      ctx.moveTo(x, cy - d);
      ctx.lineTo(x + d, cy);
      ctx.lineTo(x, cy + d);
      ctx.lineTo(x - d, cy);
      ctx.closePath();
      ctx.fill();
    }
    // darker gold edge lines
    ctx.fillStyle = ink.goldDark;
    ctx.fillRect(0, y0, W, Math.max(1, band * 0.04));
    ctx.fillRect(0, y0 + band - Math.max(1, band * 0.04), W, Math.max(1, band * 0.04));
    // kovil temple motif pointing into the body
    const baseY = inward === 1 ? y0 + band : y0;
    kovilRow(ctx, 0, palluStart, baseY, band * 0.42, inward, ink.gold);
  };
  drawBorder(0, 1);
  drawBorder(H - band, -1);

  // Pallu: dense gold stripes and paisleys
  ctx.fillStyle = ink.goldDark;
  ctx.fillRect(palluStart, 0, W - palluStart, H);
  const stripes = 9;
  const sw = (W - palluStart) / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? ink.gold : ink.red2;
    ctx.fillRect(palluStart + i * sw, band, sw * (i % 2 === 0 ? 0.92 : 1), H - band * 2);
  }
  for (let i = 0; i < stripes; i += 2) {
    for (let y = band + H * 0.08; y < H - band; y += H * 0.15) {
      paisley(ctx, palluStart + i * sw + sw / 2, y, sw * 0.32, ink.red2, ink.line);
    }
  }
  // Pallu separator lines
  ctx.fillStyle = ink.line;
  ctx.fillRect(palluStart - W * 0.004, 0, W * 0.003, H);
  ctx.fillRect(palluStart - W * 0.009, 0, W * 0.0015, H);
}

export function createSareeTextures(size = 2048) {
  const W = size;
  const H = Math.round(size * 0.42); // matches the saree aspect (≈ 3.0 x 1.2)
  const color = makeCanvas(W, H);
  drawSaree(color.ctx, W, H, COLOR_INK, true);
  const orm = makeCanvas(W, H);
  drawSaree(orm.ctx, W, H, ORM_INK, false);
  return { map: toTexture(color.c, true), orm: toTexture(orm.c, false) };
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

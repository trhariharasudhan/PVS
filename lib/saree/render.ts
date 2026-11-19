/**
 * Saree design renderer (canvas 2D) shared by the 3D hero texture, the live preview
 * and the "What We Weave" illustrations.
 *
 * Layout: x = saree length (pallu at the right end), y = saree width (borders top & bottom).
 * Two passes with the same geometry:
 *   - "color": what you see (shot-silk weave, metallic zari, embossed motifs)
 *   - "orm":   R = AO, G = roughness, B = metalness — makes zari behave like metal in 3D
 */
import { drawMotif, type MotifId } from "./motifs";

export type BorderStyle = "temple" | "rettaiPettu" | "gangaJamuna" | "vairaoosi" | "kattam" | "minimal";
export type BodyPattern = "plain" | "buttas" | "checks" | "stripes" | "vairaoosi" | "jaal" | "sungudi";
export type PalluStyle = "grand" | "motifRows" | "stripes" | "minimal";
export type ZariKind = "gold" | "antique" | "silver" | "none";

export interface SareeDesign {
  body: string;
  border: string;
  /** Second border colour (Ganga Jamuna: each side a different colour). */
  border2?: string;
  pallu: string;
  zari: ZariKind;
  borderStyle: BorderStyle;
  borderMotif?: MotifId | null;
  bodyPattern: BodyPattern;
  bodyMotif?: MotifId | null;
  palluStyle: PalluStyle;
  palluMotif?: MotifId | null;
  /** 0..1 lustre (pure silk ≈ 1, blends lower) */
  sheen?: number;
  /** Shot silk: warp yarn in a different colour from the weft (body shimmers between both). */
  shot?: string;
}

export const DEFAULT_DESIGN: SareeDesign = {
  body: "#8E1426",
  border: "#0F4D3A",
  pallu: "#8E1426",
  zari: "gold",
  borderStyle: "temple",
  borderMotif: "peacock",
  bodyPattern: "buttas",
  bodyMotif: "flower",
  palluStyle: "grand",
  palluMotif: "elephant",
  sheen: 1,
};

type Mode = "color" | "orm";

/* ------------------------------------------------------------------ colour utils */

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(hex: string, amt: number) {
  // amt > 0 lighten towards white, < 0 darken towards black
  const [r, g, b] = rgb(hex);
  const t = amt > 0 ? 255 : 0;
  const k = Math.abs(amt);
  return `rgb(${Math.round(r + (t - r) * k)},${Math.round(g + (t - g) * k)},${Math.round(b + (t - b) * k)})`;
}
function luminance(hex: string) {
  const [r, g, b] = rgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

const ZARI_TONES: Record<Exclude<ZariKind, "none">, [string, string, string]> = {
  gold: ["#7A5A1E", "#E9D08F", "#B68E42"],
  antique: ["#5F4519", "#C9A964", "#8E6C2E"],
  silver: ["#6E6E74", "#F2F2F4", "#A9A9B0"],
};

// ORM inks: R=AO, G=roughness, B=metalness
const ORM_SILK = "rgb(255,135,0)";
const ORM_ZARI = "rgb(255,78,235)";

interface Inks {
  mode: Mode;
  /** Pre-drawn motif sprites for this render (drawing each motif once is ~100× faster than
   *  re-drawing paths + shadow blur for every repeat — matters on phones and software canvas). */
  sprites?: Map<string, HTMLCanvasElement | OffscreenCanvas>;
  zari: string | CanvasGradient | CanvasPattern;
  zariFlat: string;
  zariDark: string;
  silk: (hex: string) => string;
}

/** Metallic zari tile: woven weft lines + subtle sparkle. Gradient runs along the weft only,
 *  so large zari areas don't show diagonal banding when the tile repeats. */
function zariPattern(ctx: CanvasRenderingContext2D, kind: Exclude<ZariKind, "none">, scale: number): CanvasPattern | string {
  const [d, l, m] = ZARI_TONES[kind];
  const w = 64;
  const h = Math.max(6, Math.round(8 * scale));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const t = c.getContext("2d");
  if (!t) return m;
  // one weft "pick": bright centre, darker edges (round metallic thread)
  const g = t.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, d);
  g.addColorStop(0.45, l);
  g.addColorStop(0.6, m);
  g.addColorStop(1, d);
  t.fillStyle = g;
  t.fillRect(0, 0, w, h);
  // warp crossing points where silk ties down the zari (every few pixels, offset)
  t.fillStyle = "rgba(0,0,0,0.18)";
  for (let x = 0; x < w; x += 8) t.fillRect(x, 0, 1, h);
  t.fillStyle = "rgba(255,255,255,0.5)";
  t.fillRect(11, Math.floor(h * 0.45), 2, 1);
  t.fillRect(43, Math.floor(h * 0.5), 2, 1);
  return ctx.createPattern(c, "repeat") ?? m;
}

function makeInks(ctx: CanvasRenderingContext2D, d: SareeDesign, mode: Mode, scale: number): Inks {
  if (mode === "orm") {
    return { mode, zari: d.zari === "none" ? ORM_SILK : ORM_ZARI, zariFlat: d.zari === "none" ? ORM_SILK : ORM_ZARI, zariDark: ORM_ZARI, silk: () => ORM_SILK };
  }
  if (d.zari === "none") {
    // silk-thread motifs in a contrasting thread colour
    const thread = luminance(d.body) > 0.55 ? mix(d.border, -0.15) : "#EFE3C2";
    return { mode, zari: thread, zariFlat: thread, zariDark: mix(thread, -0.3), silk: (h) => h };
  }
  const [dark, , mid] = ZARI_TONES[d.zari];
  return { mode, zari: zariPattern(ctx, d.zari, scale), zariFlat: mid, zariDark: dark, silk: (h) => h };
}

/* ------------------------------------------------------------------ silk ground */

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Shot-silk ground: warp & weft in slightly different tones + slub irregularity. */
function silkGround(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, hex: string, ink: Inks, seed: number, shot?: string) {
  ctx.fillStyle = ink.silk(hex);
  ctx.fillRect(x, y, w, h);
  if (ink.mode === "orm") return;
  const r = rng(seed);
  const warp = shot ?? mix(hex, 0.08);
  const weft = mix(hex, -0.1);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = warp;
  for (let i = x; i < x + w; i += 2) ctx.fillRect(i, y, 1, h);
  ctx.fillStyle = weft;
  for (let j = y; j < y + h; j += 2) ctx.fillRect(x, j, w, 1);
  ctx.globalAlpha = 1;
  // slubs: occasional slightly thicker weft picks
  for (let k = 0; k < (w * h) / 900; k++) {
    ctx.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
    ctx.fillRect(x + r() * w, y + r() * h, 6 + r() * 26, 1);
  }
}

/* ------------------------------------------------------------------ motif stamps */

function makeSprite(w: number, h: number): HTMLCanvasElement | OffscreenCanvas | null {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  if (typeof document !== "undefined") {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }
  return null;
}

function drawStampDirect(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, ink: Inks, id: MotifId, cx: number, cy: number, size: number, cut: string, flip: boolean) {
  const c = ctx as CanvasRenderingContext2D;
  if (ink.mode === "color") {
    // embossed: soft shadow under raised zari
    c.save();
    c.shadowColor = "rgba(0,0,0,0.35)";
    c.shadowBlur = Math.max(1, size * 0.03);
    c.shadowOffsetY = Math.max(0.5, size * 0.02);
    drawMotif(c, id, cx, cy, size, ink.zari, cut, flip);
    c.restore();
  } else {
    drawMotif(c, id, cx, cy, size, ink.zari, ORM_SILK, flip);
  }
}

function stamp(ctx: CanvasRenderingContext2D, ink: Inks, id: MotifId, cx: number, cy: number, size: number, cut: string, flip = false) {
  const px = Math.max(4, Math.round(size));
  const S = Math.ceil(px * 1.25) + 4; // room for the shadow
  const key = `${id}|${px}|${cut}|${flip ? 1 : 0}`;
  ink.sprites ??= new Map();
  let sp = ink.sprites.get(key);
  if (!sp) {
    const made = makeSprite(S, S);
    const sctx = made?.getContext("2d") as CanvasRenderingContext2D | null | undefined;
    if (!made || !sctx) return drawStampDirect(ctx, ink, id, cx, cy, size, cut, flip);
    drawStampDirect(sctx, ink, id, S / 2, S / 2, px, cut, flip);
    ink.sprites.set(key, made);
    sp = made;
  }
  ctx.drawImage(sp as CanvasImageSource, Math.round(cx - S / 2), Math.round(cy - S / 2));
}

/* ------------------------------------------------------------------ borders */

function zariLine(ctx: CanvasRenderingContext2D, ink: Inks, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = ink.zari;
  ctx.fillRect(x, y, w, Math.max(1, h));
}

/** Kovil (temple tower) row in the border colour, rising into the body. */
function kovilRow(ctx: CanvasRenderingContext2D, ink: Inks, x0: number, x1: number, base: number, h: number, dir: 1 | -1, colour: string) {
  const w = h * 0.95;
  for (let x = x0; x < x1; x += w) {
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(x, base);
      ctx.lineTo(x + w * 0.12, base);
      ctx.lineTo(x + w * 0.12, base + dir * h * 0.32);
      ctx.lineTo(x + w * 0.26, base + dir * h * 0.32);
      ctx.lineTo(x + w * 0.26, base + dir * h * 0.62);
      ctx.lineTo(x + w * 0.38, base + dir * h * 0.62);
      ctx.lineTo(x + w * 0.5, base + dir * h);
      ctx.lineTo(x + w * 0.62, base + dir * h * 0.62);
      ctx.lineTo(x + w * 0.74, base + dir * h * 0.62);
      ctx.lineTo(x + w * 0.74, base + dir * h * 0.32);
      ctx.lineTo(x + w * 0.88, base + dir * h * 0.32);
      ctx.lineTo(x + w * 0.88, base);
      ctx.lineTo(x + w, base);
      ctx.closePath();
    };
    path();
    ctx.fillStyle = ink.silk(colour);
    ctx.fill();
    path();
    ctx.lineWidth = Math.max(1, h * 0.05);
    ctx.strokeStyle = ink.zari as string;
    ctx.stroke();
    // kalasam dot on top
    ctx.fillStyle = ink.zari;
    ctx.beginPath();
    ctx.arc(x + w * 0.5, base + dir * h * 1.04, h * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
}

function diamondChain(ctx: CanvasRenderingContext2D, ink: Inks, x0: number, x1: number, cy: number, s: number) {
  ctx.fillStyle = ink.zari;
  for (let x = x0 + s; x < x1; x += s * 2.2) {
    ctx.beginPath();
    ctx.moveTo(x, cy - s);
    ctx.lineTo(x + s, cy);
    ctx.lineTo(x, cy + s);
    ctx.lineTo(x - s, cy);
    ctx.closePath();
    ctx.fill();
  }
}

function lattice(ctx: CanvasRenderingContext2D, ink: Inks, x: number, y: number, w: number, h: number, step: number, lw: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = ink.zari as string;
  ctx.lineWidth = lw;
  for (let k = -h; k < w + h; k += step) {
    ctx.beginPath();
    ctx.moveTo(x + k, y);
    ctx.lineTo(x + k + h, y + h);
    ctx.moveTo(x + k + h, y);
    ctx.lineTo(x + k, y + h);
    ctx.stroke();
  }
  ctx.restore();
}

/** One border band. `inward` = direction towards the body (+1 for top band, −1 for bottom). */
function borderBand(
  ctx: CanvasRenderingContext2D,
  ink: Inks,
  d: SareeDesign,
  colour: string,
  x0: number,
  x1: number,
  y0: number,
  bh: number,
  inward: 1 | -1,
  seed: number,
) {
  const W = x1 - x0;
  const style = d.borderStyle;
  const edgeY = inward === 1 ? y0 : y0 + bh; // outer selvedge side
  if (style === "minimal") {
    silkGround(ctx, x0, y0, W, bh, colour, ink, seed);
    zariLine(ctx, ink, x0, y0 + bh * 0.35, W, bh * 0.12);
    zariLine(ctx, ink, x0, y0 + bh * 0.6, W, bh * 0.05);
    return;
  }

  silkGround(ctx, x0, y0, W, bh, colour, ink, seed);

  if (style === "rettaiPettu") {
    // double border: wide band + body-colour gap + narrow band
    const gap = bh * 0.14;
    const narrowH = bh * 0.22;
    const innerY = inward === 1 ? y0 + bh - narrowH - gap : y0 + gap + narrowH;
    silkGround(ctx, x0, inward === 1 ? innerY : y0 + narrowH, W, gap, d.body, ink, seed + 3);
    const narrowY = inward === 1 ? y0 + bh - narrowH : y0;
    zariLine(ctx, ink, x0, narrowY + narrowH * 0.2, W, narrowH * 0.18);
    diamondChain(ctx, ink, x0, x1, narrowY + narrowH * 0.6, narrowH * 0.18);
    const wideY = inward === 1 ? y0 : y0 + narrowH + gap;
    const wideH = bh - narrowH - gap;
    zariLine(ctx, ink, x0, wideY + wideH * 0.08, W, wideH * 0.07);
    zariLine(ctx, ink, x0, wideY + wideH * 0.85, W, wideH * 0.07);
    if (d.borderMotif) {
      const s = wideH * 0.62;
      for (let x = x0 + s * 0.8; x < x1 - s * 0.5; x += s * 1.35) stamp(ctx, ink, d.borderMotif, x, wideY + wideH * 0.47, s, mix(colour, -0.1));
    } else diamondChain(ctx, ink, x0, x1, wideY + wideH * 0.47, wideH * 0.18);
    return;
  }

  // outer & inner zari lines
  zariLine(ctx, ink, x0, edgeY + (inward === 1 ? bh * 0.06 : -bh * 0.12), W, bh * 0.06);
  zariLine(ctx, ink, x0, y0 + (inward === 1 ? bh * 0.86 : bh * 0.08), W, bh * 0.06);

  if (style === "vairaoosi") {
    lattice(ctx, ink, x0, y0 + bh * 0.2, W, bh * 0.6, bh * 0.22, Math.max(1, bh * 0.025));
    return;
  }
  if (style === "kattam") {
    ctx.fillStyle = ink.zari;
    const s = bh * 0.3;
    for (let x = x0, i = 0; x < x1; x += s, i++) {
      for (let r = 0; r < 2; r++) {
        if ((i + r) % 2 === 0) ctx.fillRect(x, y0 + bh * 0.2 + r * s, s, s);
      }
    }
    return;
  }

  // temple / gangaJamuna: motif row inside the band + kovil towers into the body
  if (d.borderMotif) {
    const s = bh * 0.5;
    let i = 0;
    for (let x = x0 + s * 0.8; x < x1 - s * 0.5; x += s * 1.45, i++) {
      stamp(ctx, ink, d.borderMotif, x, y0 + bh * 0.47, s, mix(colour, -0.12), i % 2 === 1 && d.borderMotif !== "chakram" && d.borderMotif !== "flower");
    }
  } else {
    diamondChain(ctx, ink, x0, x1, y0 + bh * 0.47, bh * 0.12);
  }
}

/** Korvai join: where the border is interlocked with the body, small teeth of each colour
 *  bite into the other along the line, outlined by a fine zari thread. */
function korvaiTeeth(ctx: CanvasRenderingContext2D, ink: Inks, x0: number, x1: number, y: number, s: number, dir: 1 | -1, borderHex: string) {
  ctx.fillStyle = ink.silk(borderHex);
  ctx.beginPath();
  for (let x = x0; x < x1; x += s) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + s / 2, y + dir * s * 0.7);
    ctx.lineTo(x + s, y);
  }
  ctx.fill();
  ctx.fillStyle = ink.zari;
  ctx.fillRect(x0, y - Math.max(1, s * 0.06) / 2, x1 - x0, Math.max(1, s * 0.06));
}

/* ------------------------------------------------------------------ body */

function body(ctx: CanvasRenderingContext2D, ink: Inks, d: SareeDesign, x0: number, x1: number, y0: number, y1: number, unit: number) {
  const W = x1 - x0;
  const H = y1 - y0;
  silkGround(ctx, x0, y0, W, H, d.body, ink, 11, d.shot);
  const cut = mix(d.body, -0.08);
  const motif = d.bodyMotif ?? "flower";

  switch (d.bodyPattern) {
    case "plain":
      return;
    case "stripes": {
      const step = unit * 0.9;
      for (let x = x0 + step / 2; x < x1; x += step) {
        zariLine(ctx, ink, x, y0, Math.max(1, unit * 0.06), H);
        ctx.fillStyle = ink.zari;
        ctx.fillRect(x + unit * 0.12, y0, Math.max(1, unit * 0.025), H);
      }
      return;
    }
    case "checks": {
      const s = H / 5;
      ctx.fillStyle = ink.zari;
      for (let x = x0; x < x1; x += s) ctx.fillRect(x, y0, Math.max(1, unit * 0.05), H);
      for (let y = y0; y <= y1; y += s) ctx.fillRect(x0, y, W, Math.max(1, unit * 0.05));
      let i = 0;
      for (let x = x0; x < x1 - s * 0.5; x += s, i++) {
        for (let r = 0; r < 5; r++) {
          if ((i + r) % 2 === 0) stamp(ctx, ink, motif, x + s / 2, y0 + s * r + s / 2, s * 0.55, cut);
        }
      }
      return;
    }
    case "vairaoosi": {
      // tiny diamond points everywhere (fine "diamond needle" body)
      ctx.fillStyle = ink.zari;
      const s = unit * 0.38;
      for (let y = y0 + s / 2, row = 0; y < y1; y += s, row++) {
        for (let x = x0 + (row % 2 ? s / 2 : 0); x < x1; x += s) {
          const k = Math.max(0.8, unit * 0.045);
          ctx.beginPath();
          ctx.moveTo(x, y - k);
          ctx.lineTo(x + k, y);
          ctx.lineTo(x, y + k);
          ctx.lineTo(x - k, y);
          ctx.fill();
        }
      }
      return;
    }
    case "sungudi": {
      // tie-and-dye dots (Madurai sungudi style): small light rings in diamond clusters
      if (ink.mode !== "color") return; // dye, not zari: no metal in the ORM pass
      const s = unit * 1.6;
      const dot = (x: number, y: number, r: number) => {
        ctx.fillStyle = "rgba(255,246,222,0.92)";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = d.body;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
        ctx.fill();
      };
      for (let y = y0 + s / 2, row = 0; y < y1; y += s, row++) {
        for (let x = x0 + (row % 2 ? s / 2 : 0) + s / 2; x < x1; x += s) {
          const r = Math.max(1, unit * 0.09);
          dot(x, y, r * 1.2);
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) dot(x + dx * r * 3.2, y + dy * r * 3.2, r);
        }
      }
      return;
    }
    case "jaal": {
      const step = H / 3.2;
      lattice(ctx, ink, x0, y0, W, H, step, Math.max(1, unit * 0.035));
      for (let y = y0, r = 0; y <= y1; y += step / 2, r++) {
        for (let x = x0 + (r % 2 ? step / 2 : 0); x < x1; x += step) stamp(ctx, ink, "flower", x, y, step * 0.22, cut);
      }
      return;
    }
    case "buttas":
    default: {
      // trending: smaller, finer buttas in a staggered grid
      const rows = 5;
      const gy = H / rows;
      const gx = gy * 1.15;
      for (let r = 0; r < rows; r++) {
        for (let x = x0 + gx / 2 + (r % 2 ? gx / 2 : 0); x < x1 - gx * 0.25; x += gx) {
          stamp(ctx, ink, motif, x, y0 + gy * (r + 0.5), gy * 0.5, cut, r % 2 === 1 && (motif === "peacock" || motif === "elephant" || motif === "annam"));
        }
      }
    }
  }
}

/* ------------------------------------------------------------------ pallu */

function pallu(ctx: CanvasRenderingContext2D, ink: Inks, d: SareeDesign, x0: number, x1: number, y0: number, y1: number, unit: number) {
  const W = x1 - x0;
  const H = y1 - y0;
  silkGround(ctx, x0, y0, W, H, d.pallu, ink, 23);
  const motif = d.palluMotif ?? "mango";
  const cut = mix(d.pallu, -0.05);

  // separator stripes where the pallu begins
  zariLine(ctx, ink, x0, y0, unit * 0.12, H);
  zariLine(ctx, ink, x0 + unit * 0.22, y0, unit * 0.04, H);

  if (d.palluStyle === "minimal") {
    for (let k = 0; k < 4; k++) zariLine(ctx, ink, x0 + W * (0.25 + k * 0.18), y0, unit * 0.05, H);
    return;
  }
  if (d.palluStyle === "stripes") {
    const n = 9;
    const sw = W / n;
    for (let i = 0; i < n; i += 2) {
      zariLine(ctx, ink, x0 + i * sw + sw * 0.1, y0, sw * 0.8, H);
      if (i % 4 === 0) for (let y = y0 + sw; y < y1; y += sw * 1.6) stamp(ctx, ink, "flower", x0 + i * sw + sw / 2, y, sw * 0.5, mix(d.pallu, -0.1));
    }
    return;
  }
  if (d.palluStyle === "motifRows") {
    const rows = 3;
    const gy = H / rows;
    for (let r = 0; r < rows; r++) {
      for (let x = x0 + gy * 0.7; x < x1 - gy * 0.3; x += gy * 0.95) stamp(ctx, ink, motif, x, y0 + gy * (r + 0.5), gy * 0.72, cut, r % 2 === 1);
    }
    return;
  }
  // grand pallu: wide zari field with framed big motifs in the pallu colour
  const pad = unit * 0.45;
  ctx.fillStyle = ink.zari;
  ctx.fillRect(x0 + pad, y0, W - pad * 1.4, H);
  if (ink.mode === "color") {
    const lg = ctx.createLinearGradient(x0, y0, x1, y1);
    lg.addColorStop(0, "rgba(0,0,0,0.12)");
    lg.addColorStop(0.5, "rgba(255,255,255,0.08)");
    lg.addColorStop(1, "rgba(0,0,0,0.15)");
    ctx.fillStyle = lg;
    ctx.fillRect(x0 + pad, y0, W - pad * 1.4, H);
  }
  const fieldX = x0 + pad;
  const fieldW = W - pad * 1.4;
  const cols = Math.max(2, Math.round(fieldW / (H * 0.36)));
  const cw = fieldW / cols;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < 3; r++) {
      const cx = fieldX + cw * (c + 0.5);
      const cy = y0 + (H / 3) * (r + 0.5);
      // inverse motif: pallu silk showing through the zari
      if (ink.mode === "color") drawMotif(ctx, motif, cx, cy, Math.min(cw, H / 3) * 0.78, ink.silk(d.pallu), ink.zariFlat, r % 2 === 1);
      else drawMotif(ctx, motif, cx, cy, Math.min(cw, H / 3) * 0.78, ORM_SILK, ORM_ZARI, r % 2 === 1);
    }
  }
  // silk rules between the motif rows, each with a fine zari-on-silk diamond chain
  if (ink.mode === "color") {
    for (let r = 1; r < 3; r++) {
      const y = y0 + (H / 3) * r;
      ctx.fillStyle = ink.silk(d.pallu);
      ctx.fillRect(fieldX, y - unit * 0.07, fieldW, unit * 0.14);
      diamondChain(ctx, ink, fieldX, fieldX + fieldW, y, unit * 0.04);
    }
    // frame lines down each motif column
    ctx.fillStyle = ink.silk(d.pallu);
    for (let c = 1; c < cols; c++) ctx.fillRect(fieldX + cw * c - unit * 0.025, y0, unit * 0.05, H);
  }
  // stripes at the very end
  for (let k = 0; k < 3; k++) {
    silkGround(ctx, x1 - pad * 0.4 - k * unit * 0.3, y0, unit * 0.12, H, d.pallu, ink, 40 + k);
  }
}

/* ------------------------------------------------------------------ main */

export interface RenderOptions {
  /** Pallu fraction of the length (0.18–0.3). */
  palluFraction?: number;
  /** Border band height as a fraction of saree width. */
  borderFraction?: number;
  /** Weaver's mark woven in zari just before the pallu (e.g. "PVS SILKS"). */
  wovenText?: { text: string; sub?: string; font: string; subFont?: string };
}

/** Weaver's mark: a small silk cartouche with the name in zari, woven into the body just
 *  before the pallu (where real silk sarees carry the weaver's / brand mark). */
function wovenName(ctx: CanvasRenderingContext2D, ink: Inks, d: SareeDesign, palluX: number, H: number, bh: number, unit: number, wt: NonNullable<RenderOptions["wovenText"]>) {
  const capH = (H - 2 * bh) * 0.13;
  ctx.save();
  ctx.font = `700 ${Math.round(capH)}px ${wt.font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const tw = ctx.measureText(wt.text).width;
  ctx.font = `600 ${Math.round(capH * 0.3)}px ${wt.subFont ?? wt.font}`;
  const sw = wt.sub ? ctx.measureText(wt.sub).width : 0;
  const pw = Math.max(tw, sw) + capH * 1.4;
  const ph = capH * (wt.sub ? 2.5 : 1.9);
  const cx = palluX - unit * 0.9 - pw / 2;
  const cy = H / 2;
  // plain silk panel so buttas don't run through the letters
  if (ink.mode === "color") silkGround(ctx, cx - pw / 2, cy - ph / 2, pw, ph, d.body, ink, 77, d.shot);
  else {
    ctx.fillStyle = ORM_SILK;
    ctx.fillRect(cx - pw / 2, cy - ph / 2, pw, ph);
  }
  // fine zari frame with corner diamonds
  ctx.strokeStyle = ink.zari as string;
  ctx.lineWidth = Math.max(1.5, capH * 0.045);
  ctx.strokeRect(cx - pw / 2 + capH * 0.15, cy - ph / 2 + capH * 0.15, pw - capH * 0.3, ph - capH * 0.3);
  ctx.fillStyle = ink.zari;
  for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const x = cx + dx * (pw / 2 - capH * 0.15);
    const y = cy + dy * (ph / 2 - capH * 0.15);
    const k = capH * 0.12;
    ctx.beginPath();
    ctx.moveTo(x, y - k);
    ctx.lineTo(x + k, y);
    ctx.lineTo(x, y + k);
    ctx.lineTo(x - k, y);
    ctx.fill();
  }
  const textY = wt.sub ? cy - capH * 0.28 : cy;
  if (ink.mode === "color") {
    // raised zari: soft shadow under the letters
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = capH * 0.06;
    ctx.shadowOffsetY = capH * 0.04;
  }
  ctx.font = `700 ${Math.round(capH)}px ${wt.font}`;
  ctx.fillText(wt.text, cx, textY);
  if (wt.sub) {
    ctx.font = `600 ${Math.round(capH * 0.3)}px ${wt.subFont ?? wt.font}`;
    ctx.fillText(wt.sub, cx, cy + capH * 0.62);
  }
  ctx.restore();
}

export function renderSaree(ctx: CanvasRenderingContext2D, W: number, H: number, d: SareeDesign, mode: Mode = "color", opts: RenderOptions = {}) {
  const ink = makeInks(ctx, d, mode, H / 400);
  const bf = opts.borderFraction ?? (d.borderStyle === "minimal" ? 0.07 : d.borderStyle === "rettaiPettu" ? 0.17 : 0.14);
  const bh = H * bf;
  const palluX = W * (1 - (opts.palluFraction ?? 0.24));
  const unit = H / 12;

  body(ctx, ink, d, 0, palluX, bh, H - bh, unit);
  if (opts.wovenText) wovenName(ctx, ink, d, palluX, H, bh, unit, opts.wovenText);
  pallu(ctx, ink, d, palluX, W, bh, H - bh, unit);

  const top = d.border;
  const bottom = d.borderStyle === "gangaJamuna" ? d.border2 ?? d.pallu : d.border;
  borderBand(ctx, ink, d, top, 0, W, 0, bh, 1, 101);
  borderBand(ctx, ink, d, bottom, 0, W, H - bh, bh, -1, 202);

  // korvai: border interlocked with the body (teeth along the join)
  if (d.borderStyle !== "minimal") {
    korvaiTeeth(ctx, ink, 0, palluX, bh, unit * 0.22, 1, top);
    korvaiTeeth(ctx, ink, 0, palluX, H - bh, unit * 0.22, -1, bottom);
  }
  // temple towers rising from the borders into the body (temple & Ganga Jamuna)
  if (d.borderStyle === "temple" || d.borderStyle === "gangaJamuna") {
    kovilRow(ctx, ink, 0, palluX, bh, bh * 0.42, 1, top);
    kovilRow(ctx, ink, 0, palluX, H - bh, bh * 0.42, -1, bottom);
  }

  // selvedge: thin dark edge lines
  if (mode === "color") {
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, W, Math.max(1, H * 0.004));
    ctx.fillRect(0, H - Math.max(1, H * 0.004), W, Math.max(1, H * 0.004));
    // overall silk lustre
    const sheen = d.sheen ?? 1;
    const g = ctx.createLinearGradient(0, 0, W * 0.6, H);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, `rgba(255,255,255,${0.04 + sheen * 0.08})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
}

/** Convenience: render to a new canvas. */
export function renderSareeCanvas(W: number, H: number, d: SareeDesign, mode: Mode = "color", opts?: RenderOptions) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  if (ctx) renderSaree(ctx, W, H, d, mode, opts);
  return c;
}

"use client";

import { useEffect, useRef } from "react";
import { renderSaree, type SareeDesign } from "@/lib/saree/render";

type Variant = "full" | "fold";

/** Deterministic fold layout so the same saree always looks the same. */
function folds(seed: number, n: number) {
  let s = seed >>> 0;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  return Array.from({ length: n }, (_, i) => ({ x: (i + 0.3 + r() * 0.4) / n, w: 0.03 + r() * 0.05, d: 0.06 + r() * 0.1 }));
}

/**
 * Realistic 2D saree illustration.
 *  - "full": the whole saree laid out flat with soft cloth folds and a shadow
 *  - "fold": the way shops display a folded saree — pallu panel on top, border strip below
 */
function draw(canvas: HTMLCanvasElement, d: SareeDesign, variant: Variant) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = canvas.clientWidth || 640;
  const cssH = canvas.clientHeight || 240;
  const W = Math.round(cssW * dpr);
  const H = Math.round(cssH * dpr);
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, W, H);

  // The woven texture at a fixed, crisp resolution
  const TW = 1800;
  const TH = 560;
  const tex = document.createElement("canvas");
  tex.width = TW;
  tex.height = TH;
  const tctx = tex.getContext("2d");
  if (!tctx) return;
  renderSaree(tctx, TW, TH, d, "color");

  if (variant === "full") {
    const pad = W * 0.03;
    const x0 = pad;
    const y0 = H * 0.08;
    const w = W - pad * 2;
    const h = H * 0.8;
    // cast shadow on the table
    ctx.save();
    ctx.shadowColor = "rgba(40,20,10,0.35)";
    ctx.shadowBlur = 24 * dpr;
    ctx.shadowOffsetY = 10 * dpr;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.roundRect(x0, y0, w, h, 6 * dpr);
    ctx.fill();
    ctx.restore();
    // slightly wavy outline: draw in vertical slices with a gentle sag
    const slices = 120;
    for (let i = 0; i < slices; i++) {
      const u0 = i / slices;
      const sag = Math.sin(u0 * Math.PI * 3.2) * h * 0.012;
      ctx.drawImage(tex, u0 * TW, 0, TW / slices + 1, TH, x0 + u0 * w, y0 + sag, w / slices + 1, h);
    }
    // cloth folds: soft light/dark bands across the width
    for (const f of folds(7, 9)) {
      const cx = x0 + f.x * w;
      const fw = f.w * w;
      const g = ctx.createLinearGradient(cx - fw, 0, cx + fw, 0);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.45, `rgba(0,0,0,${f.d})`);
      g.addColorStop(0.55, `rgba(255,240,220,${f.d * 0.8})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(cx - fw, y0 - h * 0.02, fw * 2, h * 1.05);
    }
    return;
  }

  // "fold": a folded saree photographed on a table, the way shops show it — pallu on top,
  // the border running along the folded front edge, the stacked layers visible at the edge.
  const pad = W * 0.07;
  const fw = W - pad * 2; // folded width
  const depth = H * 0.62; // top face height (foreshortened)
  const edge = Math.max(10 * dpr, H * 0.09); // thickness of the stack at the front edge
  const skew = fw * 0.07; // perspective: back edge slightly narrower/shifted
  const x0 = pad;
  const y0 = (H - depth - edge) * 0.42;

  // soft contact shadow on the table
  ctx.save();
  const sh = ctx.createRadialGradient(W / 2, y0 + depth + edge, fw * 0.1, W / 2, y0 + depth + edge, fw * 0.62);
  sh.addColorStop(0, "rgba(40,22,12,0.45)");
  sh.addColorStop(1, "rgba(40,22,12,0)");
  ctx.fillStyle = sh;
  ctx.fillRect(0, y0 + depth * 0.6, W, H - (y0 + depth * 0.6));
  ctx.restore();

  // front edge: the stacked layers of the fold (body colour, with the border on alternate layers)
  const layers = 7;
  for (let i = 0; i < layers; i++) {
    const ly = y0 + depth + (edge / layers) * i;
    const lh = edge / layers + 0.6;
    ctx.fillStyle = i % 2 === 0 ? shade(d.border, -0.25 - i * 0.02) : shade(d.body, -0.3 - i * 0.02);
    ctx.beginPath();
    ctx.roundRect(x0 + i * 0.4, ly, fw - i * 0.8, lh, lh / 2);
    ctx.fill();
    // zari glint on the border layers
    if (i % 2 === 0 && d.zari !== "none") {
      ctx.fillStyle = "rgba(240,205,120,0.35)";
      ctx.fillRect(x0 + fw * 0.02, ly + lh * 0.35, fw * 0.96, Math.max(1, lh * 0.18));
    }
  }

  // top face: pallu end, half the width (one border along the folded front edge)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0 + skew, y0);
  ctx.lineTo(x0 + fw - skew * 0.4, y0);
  ctx.lineTo(x0 + fw, y0 + depth);
  ctx.lineTo(x0, y0 + depth);
  ctx.closePath();
  ctx.clip();
  // slices so the face follows the trapezoid (cheap perspective)
  const srcX = TW * 0.66;
  const srcW = TW * 0.34;
  const srcY = TH * 0.42;
  const srcH = TH * 0.58;
  const rows = 40;
  for (let r = 0; r < rows; r++) {
    const t0 = r / rows;
    const l = x0 + skew * (1 - t0);
    const rgt = x0 + fw - skew * 0.4 * (1 - t0);
    ctx.drawImage(tex, srcX, srcY + (srcH * r) / rows, srcW, srcH / rows + 1, l, y0 + depth * t0, rgt - l, depth / rows + 1);
  }
  // silk lighting: soft diagonal sheen + gentle cloth waviness
  const g = ctx.createLinearGradient(x0, y0, x0 + fw, y0 + depth);
  g.addColorStop(0, "rgba(255,255,255,0.16)");
  g.addColorStop(0.45, "rgba(255,255,255,0.02)");
  g.addColorStop(1, "rgba(0,0,0,0.18)");
  ctx.fillStyle = g;
  ctx.fillRect(x0, y0, fw, depth);
  for (let k = 0; k < 4; k++) {
    const cx = x0 + fw * (0.15 + k * 0.23);
    const wg = ctx.createLinearGradient(cx - fw * 0.06, 0, cx + fw * 0.06, 0);
    wg.addColorStop(0, "rgba(0,0,0,0)");
    wg.addColorStop(0.5, k % 2 ? "rgba(255,240,215,0.07)" : "rgba(0,0,0,0.08)");
    wg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = wg;
    ctx.fillRect(cx - fw * 0.06, y0, fw * 0.12, depth);
  }
  // rounded fold at the back edge (cloth turns under)
  const bk = ctx.createLinearGradient(0, y0, 0, y0 + depth * 0.08);
  bk.addColorStop(0, "rgba(0,0,0,0.35)");
  bk.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bk;
  ctx.fillRect(x0, y0, fw, depth * 0.08);
  // front fold highlight
  const fr = ctx.createLinearGradient(0, y0 + depth * 0.94, 0, y0 + depth);
  fr.addColorStop(0, "rgba(255,245,225,0)");
  fr.addColorStop(1, "rgba(255,245,225,0.22)");
  ctx.fillStyle = fr;
  ctx.fillRect(x0, y0 + depth * 0.94, fw, depth * 0.06);
  ctx.restore();
}

/** Lighten (amt > 0) or darken (amt < 0) a hex colour. */
function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.round(Math.min(255, Math.max(0, amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

export function SareeFlat({
  design,
  variant = "full",
  className = "",
  label,
}: {
  design: SareeDesign;
  variant?: Variant;
  className?: string;
  label: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = JSON.stringify(design);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let raf = requestAnimationFrame(() => draw(c, design, variant));
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => draw(c, design, variant));
    });
    ro.observe(c);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, variant]);

  return <canvas ref={ref} role="img" aria-label={label} className={`block w-full ${className}`} />;
}

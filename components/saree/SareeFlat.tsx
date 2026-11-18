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

  // "fold": a folded saree as shops show it
  const cardX = W * 0.08;
  const cardW = W * 0.84;
  const topH = H * 0.62;
  const stripH = H * 0.2;
  const y1 = H * 0.06;
  ctx.save();
  ctx.shadowColor = "rgba(40,20,10,0.4)";
  ctx.shadowBlur = 22 * dpr;
  ctx.shadowOffsetY = 12 * dpr;
  ctx.fillStyle = "#000";
  ctx.fillRect(cardX, y1, cardW, topH + stripH);
  ctx.restore();

  // pallu panel (rotated so the border runs along the bottom like a real fold)
  const palluSrcX = TW * 0.72;
  ctx.drawImage(tex, palluSrcX, 0, TW * 0.28, TH, cardX, y1, cardW, topH);
  // the folded body strip with its border showing beneath
  ctx.drawImage(tex, TW * 0.2, TH * 0.55, TW * 0.4, TH * 0.45, cardX, y1 + topH, cardW, stripH);
  // fold crease shading
  const g = ctx.createLinearGradient(0, y1 + topH - 10 * dpr, 0, y1 + topH + 14 * dpr);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.5, "rgba(0,0,0,0.35)");
  g.addColorStop(0.7, "rgba(255,240,220,0.18)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(cardX, y1 + topH - 10 * dpr, cardW, 24 * dpr);
  // gentle highlight on the top panel
  const hl = ctx.createLinearGradient(cardX, y1, cardX + cardW, y1 + topH);
  hl.addColorStop(0, "rgba(255,255,255,0.10)");
  hl.addColorStop(0.5, "rgba(255,255,255,0)");
  hl.addColorStop(1, "rgba(0,0,0,0.12)");
  ctx.fillStyle = hl;
  ctx.fillRect(cardX, y1, cardW, topH);
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

"use client";

import { useEffect, useRef } from "react";

export interface PreviewSpec {
  body: string;
  border: string;
  pallu: string;
  /** Zari tone (hex) or "" for silk-thread motifs. */
  zari: string;
  /** 0..1 — how much lustre to show (pure silk > blends). */
  sheen: number;
  borderStyle?: string;
}

/** Pick a readable thread colour for motifs when there is no zari. */
function contrast(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#3F101D" : "#F1E5C4";
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + 255 * amt)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function draw(ctx: CanvasRenderingContext2D, W: number, H: number, s: PreviewSpec) {
  const motif = s.zari || contrast(s.body);
  const band = H * 0.15;
  const palluX = W * 0.74;
  const temple = s.borderStyle ? /temple|kovil/i.test(s.borderStyle) : true;
  const minimal = s.borderStyle ? /borderless|minimal/i.test(s.borderStyle) : false;
  const bandH = minimal ? band * 0.35 : band;

  // Body with fine weave
  ctx.fillStyle = s.body;
  ctx.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 3) {
    ctx.fillStyle = `rgba(255,255,255,${0.018 + ((x * 7) % 5) * 0.004})`;
    ctx.fillRect(x, 0, 1, H);
  }

  // Buttas (small motifs) on the body
  const gx = W * 0.06;
  const rows = 4;
  const gy = (H - bandH * 2) / rows;
  ctx.fillStyle = motif;
  for (let r = 0; r < rows; r++) {
    for (let x = gx / 2 + (r % 2 ? gx / 2 : 0); x < palluX - gx * 0.4; x += gx) {
      const y = bandH + gy * (r + 0.5);
      const k = H * 0.014;
      for (let p = 0; p < 4; p++) {
        const a = (p / 4) * Math.PI * 2 + Math.PI / 4;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * k, y + Math.sin(a) * k, k * 0.75, k * 0.42, a, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Borders (top & bottom) in the border colour, with zari lines and kovil towers
  const border = (y0: number, dir: 1 | -1) => {
    ctx.fillStyle = s.border;
    ctx.fillRect(0, y0, W, bandH);
    ctx.fillStyle = motif;
    const l = Math.max(1.5, bandH * 0.05);
    ctx.fillRect(0, y0 + bandH * 0.18, W, l);
    ctx.fillRect(0, y0 + bandH * 0.78, W, l);
    if (!minimal) {
      // diamond chain
      for (let x = bandH * 0.3; x < W; x += bandH * 0.55) {
        const cy = y0 + bandH * 0.48;
        const d = bandH * 0.13;
        ctx.beginPath();
        ctx.moveTo(x, cy - d);
        ctx.lineTo(x + d, cy);
        ctx.lineTo(x, cy + d);
        ctx.lineTo(x - d, cy);
        ctx.fill();
      }
    }
    if (temple && !minimal) {
      ctx.fillStyle = s.border;
      const tw = bandH * 0.7;
      const th = bandH * 0.55;
      const base = dir === 1 ? y0 + bandH : y0;
      for (let x = 0; x < palluX; x += tw) {
        ctx.beginPath();
        ctx.moveTo(x, base);
        ctx.lineTo(x + tw * 0.2, base);
        ctx.lineTo(x + tw * 0.2, base + dir * th * 0.4);
        ctx.lineTo(x + tw * 0.35, base + dir * th * 0.4);
        ctx.lineTo(x + tw * 0.35, base + dir * th * 0.75);
        ctx.lineTo(x + tw * 0.5, base + dir * th);
        ctx.lineTo(x + tw * 0.65, base + dir * th * 0.75);
        ctx.lineTo(x + tw * 0.65, base + dir * th * 0.4);
        ctx.lineTo(x + tw * 0.8, base + dir * th * 0.4);
        ctx.lineTo(x + tw * 0.8, base);
        ctx.lineTo(x + tw, base);
        ctx.fill();
      }
    }
  };
  border(0, 1);
  border(H - bandH, -1);

  // Pallu
  ctx.fillStyle = s.pallu;
  ctx.fillRect(palluX, 0, W - palluX, H);
  const stripes = 7;
  const sw = (W - palluX) / stripes;
  for (let i = 0; i < stripes; i++) {
    if (i % 2 === 0) {
      ctx.fillStyle = motif;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(palluX + i * sw + sw * 0.15, bandH * 0.5, sw * 0.7, H - bandH);
      ctx.globalAlpha = 1;
      // mango motifs on the zari stripe
      ctx.fillStyle = s.pallu;
      for (let y = bandH; y < H - bandH; y += H * 0.16) {
        const cx = palluX + i * sw + sw / 2;
        const k = sw * 0.22;
        ctx.beginPath();
        ctx.moveTo(cx, y + k * 1.6);
        ctx.bezierCurveTo(cx - k * 1.1, y + k, cx - k, y - k * 0.6, cx, y - k * 0.6);
        ctx.bezierCurveTo(cx + k * 0.8, y - k * 0.6, cx + k, y + k * 0.3, cx, y + k * 1.6);
        ctx.fill();
      }
    }
  }
  ctx.fillStyle = motif;
  ctx.fillRect(palluX - W * 0.006, 0, W * 0.004, H);
  ctx.fillRect(palluX - W * 0.013, 0, W * 0.002, H);

  // Pleat shading on the left (draped look) + silk sheen
  for (let i = 0; i < 7; i++) {
    const x = i * W * 0.035;
    const g = ctx.createLinearGradient(x, 0, x + W * 0.035, 0);
    g.addColorStop(0, "rgba(0,0,0,0.22)");
    g.addColorStop(0.5, `rgba(255,255,255,${0.06 + s.sheen * 0.1})`);
    g.addColorStop(1, "rgba(0,0,0,0.18)");
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, W * 0.035, H);
  }
  const sheen = ctx.createLinearGradient(0, 0, W, H);
  sheen.addColorStop(0, "rgba(255,255,255,0)");
  sheen.addColorStop(0.45, `rgba(255,255,255,${0.05 + s.sheen * 0.16})`);
  sheen.addColorStop(0.55, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = shade(s.body, -0.25);
  ctx.globalAlpha = 0.15;
  ctx.fillRect(0, H - 3, W, 3);
  ctx.globalAlpha = 1;
}

/** Live, code-drawn preview of the customer's saree spec (not a photo of a real product). */
export function SareePreview({ spec, className = "" }: { spec: PreviewSpec; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = 900;
    const H = 400;
    c.width = W * dpr;
    c.height = H * dpr;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, W, H, spec);
  }, [spec]);

  return (
    <div className={`[perspective:1200px] ${className}`}>
      <canvas
        ref={ref}
        role="img"
        aria-label={`Preview: body ${spec.body}, border ${spec.border}, pallu ${spec.pallu}${spec.zari ? ", zari motifs" : ", silk-thread motifs"}`}
        className="w-full h-auto rounded-xl shadow-[0_30px_60px_-30px_rgba(43,24,18,0.6)] transition-transform duration-700 [transform:rotateX(8deg)_rotateY(-6deg)] hover:[transform:rotateX(0deg)_rotateY(0deg)]"
      />
    </div>
  );
}

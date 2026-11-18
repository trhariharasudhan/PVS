"use client";

import { useEffect, useRef } from "react";
import { drawMotif, type MotifId } from "@/lib/saree/motifs";

/** Small gold-on-silk tile showing one motif (used in the designer pickers). */
export function MotifIcon({ id, size = 44, ground = "#7A1022" }: { id: MotifId | "none"; size?: number; ground?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = c.height = Math.round(size * dpr);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const S = c.width;
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, S, S);
    if (id === "none") {
      ctx.strokeStyle = "rgba(233,200,120,0.7)";
      ctx.lineWidth = S * 0.05;
      ctx.beginPath();
      ctx.moveTo(S * 0.28, S * 0.72);
      ctx.lineTo(S * 0.72, S * 0.28);
      ctx.stroke();
      return;
    }
    const g = ctx.createLinearGradient(0, 0, 0, S);
    g.addColorStop(0, "#F3D98B");
    g.addColorStop(0.5, "#C9A24E");
    g.addColorStop(1, "#8C6A25");
    drawMotif(ctx, id, S / 2, S / 2, S * 0.78, g, ground);
  }, [id, size, ground]);
  return <canvas ref={ref} style={{ width: size, height: size }} className="rounded-lg" aria-hidden="true" />;
}

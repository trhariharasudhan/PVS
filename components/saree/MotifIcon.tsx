import { useId } from "react";
import { MOTIF_SHAPES, type MotifId } from "@/lib/saree/motifs";

/** Gold-on-silk motif tile (SVG, same shapes the saree renderer uses). */
export function MotifIcon({ id, size = 44, ground = "#7A1022" }: { id: MotifId | "none"; size?: number; ground?: string }) {
  const gid = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="rounded-lg" aria-hidden="true">
      <defs>
        <linearGradient id={`z${gid}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#F6DE95" />
          <stop offset="0.45" stopColor="#D2AA55" />
          <stop offset="1" stopColor="#8C6A25" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={ground} />
      {id === "none" ? (
        <path d="M28,72L72,28" stroke="rgba(233,200,120,0.7)" strokeWidth="5" strokeLinecap="round" />
      ) : (
        <g transform="translate(11 11) scale(0.78)">
          {MOTIF_SHAPES[id].map(([kind, d, w], i) =>
            kind === "fill" ? (
              <path key={i} d={d} fill={`url(#z${gid})`} />
            ) : kind === "cut" ? (
              <path key={i} d={d} fill={ground} />
            ) : (
              <path key={i} d={d} fill="none" stroke={kind === "fstroke" ? `url(#z${gid})` : ground} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
            ),
          )}
        </g>
      )}
    </svg>
  );
}

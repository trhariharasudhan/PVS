/**
 * Traditional ornaments drawn as SVG (no images): kovil (temple tower) border,
 * kolam dot-and-loop motif and a small diamond divider. Colour follows currentColor.
 */

export function KovilBorder({ className = "", count = 24 }: { className?: string; count?: number }) {
  const w = 24;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${w * count} 16`}
      preserveAspectRatio="none"
      aria-hidden="true"
      fill="currentColor"
    >
      {Array.from({ length: count }, (_, i) => {
        const x = i * w;
        return (
          <path
            key={i}
            d={`M${x} 16 L${x + 3} 16 L${x + 3} 11 L${x + 6} 11 L${x + 6} 6 L${x + 9} 6 L${x + 9} 2 L${x + 12} 0 L${x + 15} 2 L${x + 15} 6 L${x + 18} 6 L${x + 18} 11 L${x + 21} 11 L${x + 21} 16 L${x + 24} 16 Z`}
          />
        );
      })}
    </svg>
  );
}

export function Kolam({ className = "" }: { className?: string }) {
  // 3x3 pulli kolam: dots with a continuous looping line
  const dots = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) dots.push([30 + c * 30, 30 + r * 30]);
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M60 8 C88 8 112 32 112 60 C112 88 88 112 60 112 C32 112 8 88 8 60 C8 32 32 8 60 8Z" opacity="0.5" />
        <path d="M60 15 L105 60 L60 105 L15 60 Z" />
        <path d="M45 15 C45 30 30 45 15 45 M75 15 C75 30 90 45 105 45 M45 105 C45 90 30 75 15 75 M75 105 C75 90 90 75 105 75" />
        <circle cx="60" cy="60" r="12" />
      </g>
      <g fill="currentColor">
        {dots.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.4" />
        ))}
      </g>
    </svg>
  );
}

export function DiamondRule({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden="true">
      <span className="h-px flex-1 bg-current opacity-40" />
      <span className="h-2 w-2 rotate-45 bg-current" />
      <span className="h-px flex-1 bg-current opacity-40" />
    </div>
  );
}

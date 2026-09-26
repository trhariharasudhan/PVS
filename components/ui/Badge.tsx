import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "gold" | "red" | "maroon" | "burgundy" | "ivory" | "brown" | "emerald" | "outline";
  className?: string;
}

export function Badge({
  children,
  variant = "gold",
  className = "",
}: BadgeProps) {
  const variantStyles = {
    gold: "bg-gold-50 text-gold-800 border border-gold-400/60",
    red: "bg-silk-red-50 text-silk-red-700 border border-silk-red-200",
    maroon: "bg-deep-maroon-800 text-ivory-50 border border-gold-500/40",
    burgundy: "bg-silk-red-700 text-ivory-50 border border-silk-red-800",
    ivory: "bg-ivory-100 text-heritage-brown-900 border border-ivory-300",
    brown: "bg-heritage-brown-900 text-ivory-50 border border-gold-500/40",
    emerald: "bg-emerald-50 text-emerald-800 border border-emerald-300",
    outline: "bg-transparent text-heritage-brown-900 border border-gold-500/70",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-[4px] text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase font-sans ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

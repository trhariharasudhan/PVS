import React from "react";

interface GoldDividerProps {
  variant?: "diamond" | "motif" | "star" | "simple";
  theme?: "light" | "dark";
  className?: string;
}

export function GoldDivider({
  variant = "diamond",
  theme = "light",
  className = "",
}: GoldDividerProps) {
  const isDark = theme === "dark";

  return (
    <div className={`flex items-center justify-center gap-3 my-3.5 ${className}`}>
      <div
        className={`h-[1px] w-12 sm:w-20 ${
          isDark
            ? "bg-gradient-to-r from-transparent via-gold-400/60 to-gold-400"
            : "bg-gradient-to-r from-transparent via-gold-500/60 to-gold-600"
        }`}
      />
      {variant === "diamond" && (
        <div
          className={`w-2 h-2 rotate-45 border ${
            isDark
              ? "bg-gold-400 border-gold-300 shadow-[0_0_6px_rgba(212,181,106,0.6)]"
              : "bg-gold-500 border-gold-600 shadow-sm"
          }`}
        />
      )}
      {variant === "motif" && (
        <span
          className={`text-sm ${
            isDark ? "text-gold-300 drop-shadow-[0_0_4px_rgba(212,181,106,0.6)]" : "text-gold-600"
          }`}
        >
          ❖
        </span>
      )}
      {variant === "star" && (
        <span
          className={`text-xs ${
            isDark ? "text-gold-300 drop-shadow-[0_0_4px_rgba(212,181,106,0.6)]" : "text-gold-600"
          }`}
        >
          ✦
        </span>
      )}
      {variant === "simple" && (
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            isDark ? "bg-gold-400" : "bg-gold-600"
          }`}
        />
      )}
      <div
        className={`h-[1px] w-12 sm:w-20 ${
          isDark
            ? "bg-gradient-to-l from-transparent via-gold-400/60 to-gold-400"
            : "bg-gradient-to-l from-transparent via-gold-500/60 to-gold-600"
        }`}
      />
    </div>
  );
}

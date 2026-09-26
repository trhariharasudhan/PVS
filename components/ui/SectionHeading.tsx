import React from "react";
import { GoldDivider } from "@/components/ui/GoldDivider";

interface SectionHeadingProps {
  subtitle?: string;
  title: string;
  description?: string;
  align?: "left" | "center" | "right";
  theme?: "light" | "dark";
  className?: string;
}

export function SectionHeading({
  subtitle,
  title,
  description,
  align = "center",
  theme = "light",
  className = "",
}: SectionHeadingProps) {
  const isDark = theme === "dark";
  const alignClass =
    align === "center"
      ? "text-center items-center"
      : align === "right"
      ? "text-right items-end"
      : "text-left items-start";

  return (
    <div className={`flex flex-col ${alignClass} ${className}`}>
      {subtitle && (
        <span
          className={`text-xs font-semibold tracking-ultra uppercase mb-1.5 ${
            isDark ? "text-gold-400" : "text-silk-red-700"
          }`}
        >
          {subtitle}
        </span>
      )}
      <h2
        className={`font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight ${
          isDark ? "text-ivory-50" : "text-heritage-brown-900"
        }`}
      >
        {title}
      </h2>
      {/* Subtle Handcrafted Zari Divider */}
      <GoldDivider
        variant="diamond"
        theme={theme}
        className={align === "left" ? "!justify-start !my-3" : align === "right" ? "!justify-end !my-3" : "!my-3.5"}
      />
      {description && (
        <p
          className={`text-sm sm:text-base max-w-2xl font-sans leading-relaxed ${
            isDark ? "text-ivory-200/90" : "text-heritage-brown-700"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

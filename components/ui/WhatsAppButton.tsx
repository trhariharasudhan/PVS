import React from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getWhatsAppLink } from "@/config/site";

interface WhatsAppButtonProps {
  message?: string;
  label?: string;
  variant?: "primary" | "secondary" | "gold" | "heritage" | "outline" | "emerald" | "subtle";
  size?: "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
}

export function WhatsAppButton({
  message = "Hello PVS Silk S, I would like to inquire about your pure silk sarees.",
  label = "Enquire on WhatsApp",
  variant = "primary",
  size = "md",
  className = "",
  showIcon = true,
}: WhatsAppButtonProps) {
  const url = getWhatsAppLink(message);

  const baseStyles =
    "inline-flex items-center justify-center font-sans font-semibold transition-all duration-200 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-offset-2";

  const sizeStyles = {
    sm: "text-[11px] px-3.5 py-2 gap-1.5 tracking-wider uppercase",
    md: "text-xs sm:text-sm px-5 py-2.5 gap-2 tracking-wider uppercase",
    lg: "text-xs sm:text-sm px-7 py-3.5 gap-2.5 tracking-widest uppercase",
  };

  const variantStyles = {
    // Primary: Silk Red (#7A1625) -> Hover Deep Maroon (#541019)
    primary:
      "bg-silk-red-700 hover:bg-deep-maroon-800 text-ivory-50 border border-silk-red-700 hover:border-deep-maroon-800 shadow-luxury focus:ring-silk-red-700",
    // Secondary: Heritage Brown text + Antique Gold Border -> Hover Gold bg
    secondary:
      "bg-transparent hover:bg-gold-500 text-heritage-brown-800 hover:text-ivory-50 border border-gold-500 hover:border-gold-500 shadow-sm focus:ring-gold-500",
    // Gold: Antique Zari Gold CTA
    gold:
      "bg-gold-500 hover:bg-gold-600 text-ivory-50 border border-gold-500 shadow-luxury focus:ring-gold-500",
    // Heritage: Deep Maroon (#541019) with Gold Accent
    heritage:
      "bg-deep-maroon-800 hover:bg-heritage-brown-900 text-ivory-50 border border-gold-500/60 shadow-luxury focus:ring-gold-500",
    // Outline: Transparent with Antique Gold Border
    outline:
      "bg-transparent hover:bg-gold-500/10 text-gold-400 hover:text-gold-300 border border-gold-500/60 focus:ring-gold-500",
    // Emerald: Traditional Dark Silk Emerald
    emerald:
      "bg-emerald-800 hover:bg-emerald-700 text-ivory-50 border border-emerald-800 shadow-sm focus:ring-emerald-700",
    // Subtle: Warm Ivory surface
    subtle:
      "bg-ivory-100 hover:bg-ivory-200 text-heritage-brown-900 border border-gold-300 focus:ring-gold-500",
  };

  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      aria-label={`${label} via WhatsApp`}
    >
      {showIcon && <MessageCircle className="w-4 h-4 text-current flex-shrink-0" />}
      <span>{label}</span>
    </Link>
  );
}

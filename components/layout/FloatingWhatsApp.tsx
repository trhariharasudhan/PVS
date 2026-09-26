"use client";

import React, { useState, useEffect } from "react";
import { siteConfig, getWhatsAppLink } from "@/config/site";
import { MessageCircle, X } from "lucide-react";

export function FloatingWhatsApp() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasDismissedTooltip, setHasDismissedTooltip] = useState(false);

  useEffect(() => {
    // Show after scrolling 150px
    const handleScroll = () => {
      if (window.scrollY > 150) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  const url = getWhatsAppLink(siteConfig.whatsappTemplates.general);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 animate-fade-in-subtle">
      {/* Floating Tooltip Pill */}
      {!hasDismissedTooltip && (
        <div className="hidden sm:flex items-center gap-2 bg-heritage-brown-900 text-ivory-50 text-xs px-3.5 py-2 rounded-[4px] shadow-luxury border border-gold-500/40 font-sans">
          <span className="font-serif">Enquire on WhatsApp</span>
          <button
            type="button"
            onClick={() => setHasDismissedTooltip(true)}
            className="text-gold-300 hover:text-white ml-1"
            aria-label="Dismiss message"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Floating Button in Deep Maroon & Antique Gold Accent */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-13 h-13 p-3.5 bg-deep-maroon-800 hover:bg-silk-red-700 text-ivory-50 rounded-full shadow-luxury flex items-center justify-center transition-all duration-300 hover:scale-105 border-2 border-gold-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
        aria-label="Direct WhatsApp Consultation with PVS Silk S"
      >
        <MessageCircle className="w-6 h-6 text-gold-300" />
      </a>
    </div>
  );
}

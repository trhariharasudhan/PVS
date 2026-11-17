import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { ShoppingBag, Building2, MessageCircle, ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="py-20 sm:py-28 bg-silk-red-900 text-ivory-50 text-center relative overflow-hidden border-b border-gold-500/40">
      {/* Background Textile Texture */}
      <div className="absolute inset-0 bg-zari-pattern opacity-15 mix-blend-overlay pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <span className="text-xs font-semibold tracking-widest uppercase text-gold-300 font-mono">
          MANUFACTURER • WHOLESALE • RETAIL
        </span>

        <GoldDivider variant="motif" theme="dark" className="!my-2" />

        <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white uppercase leading-tight">
          Looking for Pattu Sarees?
        </h2>

        <p className="text-sm sm:text-base md:text-lg text-ivory-200 font-sans max-w-2xl mx-auto leading-relaxed">
          Explore our complete collection online, submit a wholesale inquiry for boutique supply,
          or chat directly with Sathish Kumar on WhatsApp.
        </p>

        {/* 3 Buttons: Shop Collection, Wholesale Enquiry, WhatsApp Us */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gold-50 text-heritage-brown-950 font-semibold px-8 py-4 text-xs sm:text-sm tracking-widest uppercase rounded-[4px] shadow-lg transition-all"
          >
            <ShoppingBag className="w-4 h-4 text-silk-red-700" />
            <span>Shop Collection</span>
          </Link>

          <Link
            href="/wholesale"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-heritage-brown-950 hover:bg-black text-ivory-50 font-semibold px-8 py-4 text-xs sm:text-sm tracking-widest uppercase rounded-[4px] border border-gold-400 shadow-lg transition-all"
          >
            <Building2 className="w-4 h-4 text-gold-400" />
            <span>Wholesale Enquiry</span>
          </Link>

          <a
            href={`https://wa.me/${siteConfig.business.whatsapp}?text=${encodeURIComponent(
              siteConfig.whatsappTemplates.general()
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-8 py-4 text-xs sm:text-sm tracking-widest uppercase rounded-[4px] shadow-lg transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Us</span>
          </a>
        </div>

        <p className="text-xs text-gold-300/80 font-sans pt-2">
          Raaja Veedhi, Panjakalipatti, Kalipatti, Tamil Nadu 636455 • +91 99651 76136
        </p>
      </div>
    </section>
  );
}

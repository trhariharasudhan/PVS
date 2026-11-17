import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Building2, ArrowRight, MessageCircle, CheckCircle } from "lucide-react";

export function WholesaleTeaser() {
  const highlights = [
    "Bulk Orders",
    "Retailer Supply",
    "Boutique Supply",
    "Reseller Orders",
    "Business Enquiries",
  ];

  return (
    <section className="py-20 sm:py-28 bg-heritage-brown-950 text-ivory-100 relative overflow-hidden border-b border-gold-500/30">
      <div className="absolute inset-0 bg-zari-pattern opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-heritage-brown-900 border border-gold-500/40 rounded-[4px] p-8 sm:p-12 lg:p-16 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Heading & Value Proposition */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-gold-400">
                <Building2 className="w-4 h-4 text-gold-400" />
                <span>PVS Manufacturer Supply</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-ivory-50 leading-tight">
                Built for Wholesale
              </h2>

              <p className="text-base sm:text-lg text-ivory-200 font-sans leading-relaxed max-w-xl">
                From individual retailers to boutiques and resellers, PVS supplies pattu sarees
                for wholesale requirements.
              </p>

              {/* 5 Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {highlights.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs font-sans text-ivory-300">
                    <CheckCircle className="w-4 h-4 text-gold-400 flex-shrink-0" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gold-300/80 font-mono pt-2">
                Panjakalipatti, Kalipatti, Salem, Tamil Nadu
              </p>
            </div>

            {/* Right Column: 2 CTAs */}
            <div className="lg:col-span-5 flex flex-col gap-4 justify-center items-stretch lg:items-end">
              <Link
                href="/wholesale"
                className="inline-flex items-center justify-center gap-2 bg-silk-red-700 hover:bg-deep-maroon-800 text-ivory-50 font-semibold px-8 py-4 text-xs sm:text-sm tracking-widest uppercase rounded-[4px] border border-silk-red-700 shadow-luxury transition-all group text-center"
              >
                <span>Start Wholesale Enquiry</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-gold-300" />
              </Link>

              <a
                href={`https://wa.me/${siteConfig.business.whatsapp}?text=${encodeURIComponent(
                  siteConfig.whatsappTemplates.wholesale()
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gold-50 text-heritage-brown-950 font-semibold px-8 py-3.5 text-xs sm:text-sm tracking-widest uppercase rounded-[4px] border border-gold-400 shadow-sm transition-all text-center"
              >
                <MessageCircle className="w-4 h-4 text-emerald-700" />
                <span>WhatsApp Wholesale Team</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

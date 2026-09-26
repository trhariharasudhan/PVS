import React from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ShieldCheck, Sparkles, Building2, Layers, ArrowRight } from "lucide-react";

export function BrandIntro() {
  return (
    <section id="brand-intro" className="py-20 sm:py-28 bg-ivory-50 text-heritage-brown-950 border-b border-gold-400/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Brand Statement & Asymmetric Narrative */}
          <div className="lg:col-span-6 space-y-6">
            <SectionHeading
              subtitle="OUR HERITAGE"
              title="A TRADITION WOVEN INTO EVERY THREAD"
              align="left"
              className="mb-2"
            />

            <p className="font-serif text-xl sm:text-2xl text-silk-red-700 font-normal leading-snug">
              Every PVS Silk S creation carries the profound spirit of South Indian handloom mastery,
              crafted with devotion for life&apos;s most sacred and celebratory moments.
            </p>

            <p className="text-sm sm:text-base text-heritage-brown-700 font-sans leading-relaxed">
              Rooted in the revered weaving tradition of Tamil Nadu, our family enterprise honors
              generations of craftsmanship. From the careful inspection of Grade-A mulberry silk to
              the precision interlacing of electroplated zari motifs, we ensure that every saree
              stands as an enduring masterpiece of heritage and grace.
            </p>

            {/* Editable Configuration Highlights */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-white border border-gold-300/80 rounded-[4px] shadow-sm">
                <div className="text-[11px] uppercase tracking-wider text-heritage-brown-600 font-medium">
                  Weaving Heritage
                </div>
                <div className="font-serif text-lg sm:text-xl font-bold text-silk-red-700 mt-1">
                  {siteConfig.business.experiencePlaceholder}
                </div>
                <div className="text-[10px] text-heritage-brown-500 mt-0.5">
                  Direct Loom Artistry
                </div>
              </div>

              <div className="p-4 bg-white border border-gold-300/80 rounded-[4px] shadow-sm">
                <div className="text-[11px] uppercase tracking-wider text-heritage-brown-600 font-medium">
                  Loom Infrastructure
                </div>
                <div className="font-serif text-lg sm:text-xl font-bold text-silk-red-700 mt-1">
                  {siteConfig.business.manufacturingCapacityPlaceholder}
                </div>
                <div className="text-[10px] text-heritage-brown-500 mt-0.5">
                  Wholesale & Custom Weaves
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-silk-red-700 hover:text-silk-red-900 transition-colors group"
              >
                <span>Read Our Heritage Story</span>
                <ArrowRight className="w-4 h-4 text-gold-600 group-hover:translate-x-1 transition-transform" />
              </Link>
              <span className="text-gold-400">•</span>
              <Link
                href="/manufacturing"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-heritage-brown-700 hover:text-silk-red-700 transition-colors"
              >
                <span>Explore Looms & Craft</span>
              </Link>
            </div>
          </div>

          {/* Right Column: 4 Credibility Pillars */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-6 bg-white border border-gold-300/80 rounded-[4px] shadow-sm hover:shadow-luxury hover:border-gold-500 transition-all duration-300">
              <div className="w-10 h-10 rounded-[4px] bg-silk-red-50 border border-silk-red-200 flex items-center justify-center text-silk-red-700 mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-base font-bold text-heritage-brown-950">
                Direct Looms
              </h4>
              <p className="text-xs text-heritage-brown-700 mt-2 leading-relaxed font-sans">
                In-house production utilizing calibrated electronic Jacquards and traditional shuttle looms in Tamil Nadu.
              </p>
            </div>

            <div className="p-6 bg-white border border-gold-300/80 rounded-[4px] shadow-sm hover:shadow-luxury hover:border-gold-500 transition-all duration-300">
              <div className="w-10 h-10 rounded-[4px] bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-700 mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-base font-bold text-heritage-brown-950">
                Pure Mulberry Silk
              </h4>
              <p className="text-xs text-heritage-brown-700 mt-2 leading-relaxed font-sans">
                Certified high-density mulberry silk warp and weft filaments tested for lasting luster, tensile strength, and drape.
              </p>
            </div>

            <div className="p-6 bg-white border border-gold-300/80 rounded-[4px] shadow-sm hover:shadow-luxury hover:border-gold-500 transition-all duration-300">
              <div className="w-10 h-10 rounded-[4px] bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-700 mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-base font-bold text-heritage-brown-950">
                Sacred Motifs
              </h4>
              <p className="text-xs text-heritage-brown-700 mt-2 leading-relaxed font-sans">
                Traditional Temple Gopuram, Mayil (Peacock), Rudraksham, and floral vines woven with architectural symmetry.
              </p>
            </div>

            <div className="p-6 bg-white border border-gold-300/80 rounded-[4px] shadow-sm hover:shadow-luxury hover:border-gold-500 transition-all duration-300">
              <div className="w-10 h-10 rounded-[4px] bg-silk-red-50 border border-silk-red-200 flex items-center justify-center text-silk-red-700 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-base font-bold text-heritage-brown-950">
                Honest Provenance
              </h4>
              <p className="text-xs text-heritage-brown-700 mt-2 leading-relaxed font-sans">
                Direct manufacturer-to-patron transparency without inflated retail distributor markups.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

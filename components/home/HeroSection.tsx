"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { ChevronDown, Sparkles, ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] lg:min-h-[94vh] flex items-center justify-center overflow-hidden bg-ivory-50 text-heritage-brown-950 border-b border-gold-400/40">
      {/* Background Image with Warm Cinematic South Indian Lighting */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=2000&auto=format&fit=crop"
          alt="Authentic Kanchipuram Silk Saree Weaving and Gold Zari Texture - PVS Silk S"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105 animate-fade-in-subtle filter brightness-[0.88] contrast-105"
        />
        {/* Layered Warm Ivory and Heritage Vignette Overlays for Breathing Space */}
        <div className="absolute inset-0 bg-gradient-to-r from-ivory-50/96 via-ivory-50/88 to-ivory-50/92" />
        <div className="absolute inset-0 bg-gradient-to-t from-ivory-50 via-transparent to-ivory-50/80" />
        {/* Subtle Textile Weave Texture */}
        <div className="absolute inset-0 bg-textile-weave opacity-60 mix-blend-multiply" />
      </div>

      {/* Hero Content Area */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex flex-col items-center">
        {/* Top Eyebrow Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[4px] bg-silk-red-50 border border-silk-red-200 text-silk-red-700 text-xs font-semibold tracking-widest uppercase mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-gold-600" />
          <span>PURE KANCHIPURAM SILKS • TAMIL NADU</span>
        </div>

        {/* Gold Ornamental Divider Above Headline */}
        <GoldDivider variant="motif" theme="light" className="!my-2" />

        {/* Master Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-heritage-brown-950 uppercase leading-[1.08] drop-shadow-sm mt-2">
          WOVEN BY TRADITION.<br />
          <span className="text-silk-red-700 block sm:inline">DRAPED IN LEGACY.</span>
        </h1>

        {/* Gold Ornamental Divider Below Headline */}
        <GoldDivider variant="diamond" theme="light" className="!my-3" />

        {/* Supporting Text */}
        <p className="mt-2 text-base sm:text-xl md:text-2xl text-heritage-brown-700 font-normal max-w-2xl font-sans tracking-wide leading-relaxed">
          The timeless elegance of South India, in every weave.
        </p>

        {/* Micro-Attributes Strip */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-gold-700 tracking-wider uppercase font-semibold">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-silk-red-700" /> 100% Pure Mulberry Silk
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-silk-red-700" /> Tested Antique Zari
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-silk-red-700" /> Direct Loom Manufacturing
          </span>
        </div>

        {/* Dual Call to Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link
            href="/collections"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-silk-red-700 hover:bg-deep-maroon-800 text-ivory-50 font-semibold px-8 py-4 text-xs sm:text-sm tracking-widest uppercase rounded-[4px] border border-silk-red-700 shadow-luxury transition-all duration-200 group"
          >
            <span>Explore Our Collections</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform text-gold-300" />
          </Link>

          <Link
            href="/manufacturing"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gold-50 text-heritage-brown-800 hover:text-silk-red-700 font-semibold px-8 py-4 text-xs sm:text-sm tracking-widest uppercase rounded-[4px] border border-gold-400 shadow-sm transition-all duration-200"
          >
            <span>Our Craftsmanship</span>
          </Link>
        </div>

        {/* Editorial Scroll Down Indicator */}
        <a
          href="#heritage-trust"
          className="mt-14 sm:mt-16 inline-flex flex-col items-center gap-2 text-heritage-brown-600 hover:text-silk-red-700 transition-colors group cursor-pointer"
          aria-label="Scroll to discover PVS Silk S"
        >
          <span className="text-[10px] tracking-ultra uppercase text-gold-700 font-semibold">
            Discover The Heritage
          </span>
          <ChevronDown className="w-4 h-4 animate-bounce text-silk-red-700" />
        </a>
      </div>
    </section>
  );
}

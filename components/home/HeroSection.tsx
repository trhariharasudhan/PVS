"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { ChevronDown, Sparkles, ArrowRight, ShoppingBag, Building2 } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] lg:min-h-[94vh] flex items-center justify-center overflow-hidden bg-ivory-50 text-heritage-brown-950 border-b border-gold-400/40">
      {/* Background Image with Warm Cinematic South Indian Lighting */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=2000&auto=format&fit=crop"
          alt="PVS Traditional Pattu Saree Weaving - Salem, Tamil Nadu"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105 animate-fade-in-subtle filter brightness-[0.88] contrast-105"
        />
        {/* Layered Warm Ivory Vignette Overlays for Maximum Legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-ivory-50/96 via-ivory-50/88 to-ivory-50/92" />
        <div className="absolute inset-0 bg-gradient-to-t from-ivory-50 via-transparent to-ivory-50/85" />
        {/* Subtle Textile Weave Texture */}
        <div className="absolute inset-0 bg-textile-weave opacity-60 mix-blend-multiply" />
      </div>

      {/* Hero Content Area */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex flex-col items-center">
        {/* Top Badge: Wholesale & Retail Available */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[4px] bg-silk-red-50 border border-silk-red-200 text-silk-red-700 text-xs font-semibold tracking-widest uppercase mb-3 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-gold-600" />
          <span>Wholesale & Retail Available</span>
        </div>

        {/* Gold Ornamental Divider Above Headline */}
        <GoldDivider variant="motif" theme="light" className="!my-2" />

        {/* Master Headline: Tradition Woven Into Every Saree */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-heritage-brown-950 uppercase leading-[1.08] drop-shadow-sm mt-2">
          Tradition Woven<br />
          <span className="text-silk-red-700 block sm:inline">Into Every Saree</span>
        </h1>

        {/* Gold Ornamental Divider Below Headline */}
        <GoldDivider variant="diamond" theme="light" className="!my-3" />

        {/* Supporting Text */}
        <p className="mt-2 text-base sm:text-xl md:text-2xl text-heritage-brown-700 font-normal max-w-3xl font-sans tracking-wide leading-relaxed">
          Pattu sarees crafted with traditional elegance, distinctive colours and timeless
          craftsmanship from Salem, Tamil Nadu.
        </p>

        {/* Three Action Buttons: Explore Collection, Shop Sarees, Wholesale Enquiry */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
          <Link
            href="/collections"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-silk-red-700 hover:bg-deep-maroon-800 text-ivory-50 font-semibold px-7 py-4 text-xs sm:text-sm tracking-widest uppercase rounded-[4px] border border-silk-red-700 shadow-luxury transition-all duration-200 group"
          >
            <span>Explore Collection</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform text-gold-300" />
          </Link>

          <Link
            href="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-heritage-brown-900 hover:bg-heritage-brown-950 text-ivory-50 font-semibold px-7 py-4 text-xs sm:text-sm tracking-widest uppercase rounded-[4px] border border-heritage-brown-800 shadow-sm transition-all duration-200"
          >
            <ShoppingBag className="w-4 h-4 text-gold-400" />
            <span>Shop Sarees</span>
          </Link>

          <Link
            href="/wholesale"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gold-50 text-heritage-brown-900 hover:text-silk-red-700 font-semibold px-7 py-4 text-xs sm:text-sm tracking-widest uppercase rounded-[4px] border border-gold-400 shadow-sm transition-all duration-200"
          >
            <Building2 className="w-4 h-4 text-gold-600" />
            <span>Wholesale Enquiry</span>
          </Link>
        </div>

        {/* Editorial Scroll Down Indicator */}
        <a
          href="#brand-intro"
          className="mt-12 sm:mt-14 inline-flex flex-col items-center gap-1.5 text-heritage-brown-600 hover:text-silk-red-700 transition-colors group cursor-pointer"
          aria-label="Scroll to discover PVS"
        >
          <span className="text-[10px] tracking-ultra uppercase text-gold-700 font-semibold font-mono">
            Discover The Craft
          </span>
          <ChevronDown className="w-4 h-4 animate-bounce text-silk-red-700" />
        </a>
      </div>
    </section>
  );
}

import React from "react";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Sparkles, Layers, Building2, ShoppingBag, ArrowRight } from "lucide-react";

export function BrandIntro() {
  const highlights = [
    {
      title: "Traditional Craft",
      desc: "Rooted in authentic handloom and Jacquard techniques, weaving timeless motifs that honor South Indian heritage.",
      icon: <Sparkles className="w-5 h-5 text-silk-red-700" />,
      tag: "Craftsmanship",
    },
    {
      title: "Quality Materials",
      desc: "Selected pure mulberry silk yarns and tested zari crafted for natural biological sheen, weight, and durability.",
      icon: <Layers className="w-5 h-5 text-gold-700" />,
      tag: "Pure Silk",
    },
    {
      title: "Wholesale Supply",
      desc: "Direct manufacturer supply for retail stores, boutiques, merchants, and resellers with volume terms.",
      icon: <Building2 className="w-5 h-5 text-silk-red-700" />,
      tag: "B2B Supply",
    },
    {
      title: "Retail Availability",
      desc: "Individual retail customers can purchase authentic pattu sarees directly from our manufacturing source.",
      icon: <ShoppingBag className="w-5 h-5 text-gold-700" />,
      tag: "Direct to You",
    },
  ];

  return (
    <section id="brand-intro" className="py-20 sm:py-28 bg-ivory-50 text-heritage-brown-950 border-b border-gold-400/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Heading & Narrative */}
          <div className="lg:col-span-6 space-y-6">
            <SectionHeading
              subtitle="PATTU SAREE MANUFACTURER"
              title="PVS — Where Tradition Meets Craft"
              align="left"
              className="mb-2"
            />

            <p className="font-serif text-xl sm:text-2xl text-silk-red-700 font-normal leading-snug">
              PVS is a pattu saree manufacturing business based in Salem, Tamil Nadu, offering sarees
              for wholesale buyers, retailers, resellers and individual customers.
            </p>

            <p className="text-sm sm:text-base text-heritage-brown-700 font-sans leading-relaxed">
              From Raaja Veedhi, Panjakalipatti, Kalipatti, PVS operates with direct control over weaving,
              yarn selection, and finish quality. We eliminate intermediary layers, allowing both bulk
              retailers and discerning saree patrons to access genuine silk artistry directly from the makers.
            </p>

            {/* Approved Brand Meanings Callout */}
            <div className="p-4 bg-white border border-gold-300 rounded-[4px] shadow-sm space-y-2 text-xs">
              <div className="font-serif font-bold text-heritage-brown-950">
                PVS — Pattu • Vasthiram • Saree
              </div>
              <div className="text-heritage-brown-600 font-sans">
                PVS — Parampariyam • Vannam • Silk
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-silk-red-700 hover:text-silk-red-900 transition-colors group"
              >
                <span>The Story Behind PVS</span>
                <ArrowRight className="w-4 h-4 text-gold-600 group-hover:translate-x-1 transition-transform" />
              </Link>
              <span className="text-gold-400">•</span>
              <Link
                href="/our-craft"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-heritage-brown-700 hover:text-silk-red-700 transition-colors"
              >
                <span>Explore Our Craft</span>
              </Link>
            </div>
          </div>

          {/* Right Column: 4 Highlights */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="p-6 bg-white border border-gold-300/80 rounded-[4px] shadow-sm hover:shadow-luxury hover:border-gold-500 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-[4px] bg-gold-50 border border-gold-200 flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-gold-700 font-bold block mb-1">
                    {item.tag}
                  </span>
                  <h4 className="font-serif text-lg font-bold text-heritage-brown-950">
                    {item.title}
                  </h4>
                  <p className="text-xs text-heritage-brown-700 mt-2 leading-relaxed font-sans">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

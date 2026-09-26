import React from "react";
import { qualityPillars } from "@/data/manufacturing";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { Sparkles, Layers, Sliders, CheckSquare } from "lucide-react";

export function QualityPhilosophy() {
  const icons = [
    <Sparkles key="design" className="w-5 h-5 text-gold-400" />,
    <Layers key="weaving" className="w-5 h-5 text-gold-400" />,
    <Sliders key="finishing" className="w-5 h-5 text-gold-400" />,
    <CheckSquare key="quality" className="w-5 h-5 text-gold-400" />,
  ];

  return (
    <section className="py-20 sm:py-28 bg-deep-maroon-900 text-ivory-100 relative overflow-hidden border-b border-gold-500/30">
      {/* Background Zari Pattern Overlay */}
      <div className="absolute inset-0 bg-zari-pattern opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Brand Master Statement */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold tracking-widest uppercase text-gold-400">
            OUR PHILOSOPHY
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-ivory-50 mt-2 leading-tight">
            We do not simply weave sarees.<br />
            <span className="text-gold-300 font-normal italic">We preserve a tradition.</span>
          </h2>
          <GoldDivider variant="motif" theme="dark" className="!my-4" />
          <p className="text-xs sm:text-sm text-ivory-200 mt-2 font-sans leading-relaxed">
            Every saree from PVS Silk S represents generations of devotion to authentic handloom
            craftsmanship, uncompromised pure mulberry silk denier, and sacred South Indian weaving heritage.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {qualityPillars.map((pillar, idx) => (
            <div
              key={pillar.title}
              className="p-6 sm:p-8 bg-heritage-brown-900/90 border border-gold-500/30 rounded-[4px] shadow-sm hover:shadow-luxury hover:border-gold-400 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-full bg-gold-500/15 border border-gold-400/40 flex items-center justify-center mb-6">
                  {icons[idx]}
                </div>
                <span className="text-[11px] font-mono tracking-widest text-gold-400 font-bold">
                  PILLAR 0{idx + 1}
                </span>
                <h3 className="font-serif text-xl font-bold text-ivory-50 mt-1">
                  {pillar.title}
                </h3>
                <h4 className="text-xs font-semibold text-gold-300 mt-1">
                  {pillar.subtitle}
                </h4>
                <p className="text-xs text-ivory-300 leading-relaxed mt-3 font-sans">
                  {pillar.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-heritage-brown-800 text-[10px] uppercase tracking-wider text-gold-400 font-semibold font-mono">
                Verified Benchmark
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

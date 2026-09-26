import React from "react";
import { Sparkles, Crown, ShieldCheck, Heart } from "lucide-react";

export function HeritageTrustStrip() {
  const trustItems = [
    {
      title: "Pure Handloom",
      subtitle: "Authentic Weaves",
      icon: Sparkles,
    },
    {
      title: "Traditional Designs",
      subtitle: "Rooted in Heritage",
      icon: Crown,
    },
    {
      title: "Kanchipuram Silk",
      subtitle: "Timeless Craftsmanship",
      icon: Heart,
    },
    {
      title: "Trusted Quality",
      subtitle: "Crafted with Care",
      icon: ShieldCheck,
    },
  ];

  return (
    <section id="heritage-trust" className="bg-heritage-brown-900 text-ivory-100 py-8 sm:py-10 border-b border-gold-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
          {trustItems.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === trustItems.length - 1;
            return (
              <div
                key={item.title}
                className={`flex items-center justify-center gap-3.5 px-4 text-center md:text-left ${
                  !isLast ? "md:border-r md:border-gold-500/30" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-[4px] bg-gold-500/15 border border-gold-400/40 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <h4 className="font-serif text-sm sm:text-base font-bold text-ivory-50 tracking-wide">
                    {item.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-gold-300 font-sans mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

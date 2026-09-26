import React from "react";
import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowRight } from "lucide-react";

export function EditorialShowcase() {
  const editorialItems = [
    {
      title: "The Body Weave & Lustrous Drape",
      subtitle: "THE ART OF THE DRAPE",
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=900&auto=format&fit=crop",
      description: "High-density mulberry silk threads woven under uniform tension create a fluid, flattering drape that holds pleats effortlessly.",
    },
    {
      title: "Korvai Temple Borders & Zari Edges",
      subtitle: "INTERLOCKING PRECISION",
      image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=900&auto=format&fit=crop",
      description: "Centuries-old Dravidian temple spires (Gopuram) and sacred peacocks (Mayil) locked into pure gold and copper zari.",
    },
    {
      title: "Heavy Floral & Architectural Pallu",
      subtitle: "JACQUARD MASTERPIECE",
      image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=900&auto=format&fit=crop",
      description: "Dense brocade patterning guided by computerized Jacquard punch-cards for unmatched geometric symmetry.",
    },
    {
      title: "Protective Folding & Packaging",
      subtitle: "BOUTIQUE & EXPORT READY",
      image: "https://images.unsplash.com/photo-1610030469854-41125208f237?q=80&w=900&auto=format&fit=crop",
      description: "Wrapped in acid-free barrier paper to protect pure zari threads from moisture, tarnishing, and fold stress.",
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-heritage-brown-950 text-ivory-100 border-b border-gold-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14">
          <SectionHeading
            subtitle="TEXTILE ANATOMY"
            title="THE ART OF THE DRAPE"
            description="Examine the microscopic details of authentic zari, warp density, and artisanal finishing."
            theme="dark"
            align="left"
          />

          <Link
            href="/collections"
            className="mt-6 md:mt-0 inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-gold-400 hover:text-gold-300 transition-colors group"
          >
            <span>View Saree Archive</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 4-Item Luxury Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {editorialItems.map((item, idx) => (
            <div
              key={idx}
              className="group bg-heritage-brown-900 border border-gold-500/30 rounded-[4px] overflow-hidden flex flex-col justify-between hover:border-gold-400 transition-all duration-300 shadow-sm hover:shadow-luxury"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-heritage-brown-950">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-heritage-brown-950 via-transparent to-transparent opacity-85" />
                <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-mono tracking-widest uppercase bg-heritage-brown-950/90 text-gold-400 px-2.5 py-1 rounded-[4px] border border-gold-500/40">
                    DETAIL {`0${idx + 1}`}
                  </span>
                </div>
              </div>

              <div className="p-5 flex flex-col justify-between flex-grow">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-gold-400">
                    {item.subtitle}
                  </div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-ivory-50 mt-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-ivory-300 mt-2 leading-relaxed font-sans">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

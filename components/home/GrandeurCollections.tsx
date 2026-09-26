import React from "react";
import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowRight } from "lucide-react";

export function GrandeurCollections() {
  const collections = [
    {
      title: "Kanchipuram Silks",
      subtitle: "The Crown Jewel",
      description: "Dense pure mulberry silk with rich electroplated gold and silver zari pallus.",
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=900&auto=format&fit=crop",
      link: "/collections?category=pure-silk",
    },
    {
      title: "Wedding Collection",
      subtitle: "Bridal Splendor",
      description: "Heirloom bridal brocades woven with intricate temple borders and sacred motifs.",
      image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=900&auto=format&fit=crop",
      link: "/collections?category=bridal",
    },
    {
      title: "Temple & Traditional",
      subtitle: "Sacred Weaves",
      description: "Centuries-old Korvai interlocking techniques featuring Gopuram and Rudraksham patterns.",
      image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=900&auto=format&fit=crop",
      link: "/collections?category=traditional",
    },
    {
      title: "Festive Collection",
      subtitle: "Celebration Drapes",
      description: "Vibrant lightweight soft silks with modern dual-tone hues and delicate zari borders.",
      image: "https://images.unsplash.com/photo-1610030469854-41125208f237?q=80&w=900&auto=format&fit=crop",
      link: "/collections?category=soft-silk",
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-ivory-50 text-heritage-brown-950 border-b border-gold-400/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          subtitle="TIMELESS ARCHIVES"
          title="THE GRANDEUR OF SOUTH INDIAN SILK"
          description="Discover timeless weaves for life's most beautiful moments, woven on authentic Tamil Nadu looms."
          align="center"
          className="mb-14"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {collections.map((col, idx) => (
            <Link
              key={idx}
              href={col.link}
              className="group relative aspect-[3/4] rounded-[4px] overflow-hidden border border-gold-400/60 shadow-sm hover:shadow-luxury hover:border-gold-400 transition-all duration-500 block bg-heritage-brown-950"
            >
              <Image
                src={col.image}
                alt={col.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out brightness-[0.88] group-hover:brightness-95"
              />

              {/* Gradient Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-heritage-brown-950 via-heritage-brown-950/40 to-transparent" />

              {/* Top Accent Tag */}
              <div className="absolute top-4 left-4 z-10">
                <span className="text-[10px] font-mono tracking-widest uppercase bg-heritage-brown-950/85 text-gold-300 px-2.5 py-1 rounded-[4px] border border-gold-500/40">
                  {col.subtitle}
                </span>
              </div>

              {/* Bottom Content Details */}
              <div className="absolute bottom-0 inset-x-0 p-5 z-10 flex flex-col justify-end">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-ivory-50 group-hover:text-gold-300 transition-colors">
                  {col.title}
                </h3>
                <p className="text-xs text-ivory-200/80 mt-1 line-clamp-2 font-sans">
                  {col.description}
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-gold-400 group-hover:text-gold-300 uppercase tracking-widest">
                  <span>Explore Weaves</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

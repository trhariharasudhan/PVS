"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { Maximize2, X, Sparkles, ArrowRight, MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";

interface GalleryItem {
  id: string;
  title: string;
  category: "Manufacturing" | "Loom" | "Weaving" | "Sarees" | "Collections" | "Finished Products";
  caption: string;
  image: string;
  aspect: "square" | "tall" | "wide";
}

// Easy-to-maintain Gallery Assets list
const galleryItems: GalleryItem[] = [
  {
    id: "g-01",
    title: "Pure Crimson Silk & Antique Gold Zari",
    category: "Sarees",
    caption: "Aadrika bridal pattu drape showing Korvai temple border and intricate pallu work.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
    aspect: "tall",
  },
  {
    id: "g-02",
    title: "Handloom Warp Preparation",
    category: "Loom",
    caption: "High-tension warp beam setup aligning thousands of mulberry silk threads.",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
    aspect: "wide",
  },
  {
    id: "g-03",
    title: "Intricate Floral Zari Brocade",
    category: "Weaving",
    caption: "Sub-millimeter Jacquard coordination interlacing metallic zari into pure silk.",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop",
    aspect: "square",
  },
  {
    id: "g-04",
    title: "Natural Mulberry Silk Hanks",
    category: "Manufacturing",
    caption: "Grade-A pure mulberry silk yarns prepared for degumming and eco-friendly dye baths.",
    image: "https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=1200&auto=format&fit=crop",
    aspect: "square",
  },
  {
    id: "g-05",
    title: "Emerald Green & Mustard Gold Saree",
    category: "Collections",
    caption: "Mayuri wedding pattu with dual contrast borders ready for boutique distribution.",
    image: "https://images.unsplash.com/photo-1610030469668-93530c17b58f?q=80&w=1200&auto=format&fit=crop",
    aspect: "tall",
  },
  {
    id: "g-06",
    title: "Finished Saree Packaging",
    category: "Finished Products",
    caption: "Carefully folded with acid-free paper to protect pure zari threads for shipping.",
    image: "https://images.unsplash.com/photo-1610030469854-41125208f237?q=80&w=1200&auto=format&fit=crop",
    aspect: "square",
  },
  {
    id: "g-07",
    title: "Electronic Jacquard Loom in Motion",
    category: "Loom",
    caption: "Precision shedding mechanism creating temple motifs with exact architectural symmetry.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
    aspect: "wide",
  },
  {
    id: "g-08",
    title: "Dyed Silk Yarn Inspection",
    category: "Manufacturing",
    caption: "Checking color fastness and luster before beam warping in Kalipatti.",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
    aspect: "tall",
  },
  {
    id: "g-09",
    title: "Gold Zari Temple Spire Detail",
    category: "Weaving",
    caption: "Macro view of Korvai interlocking weft threads along the saree selvedge.",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop",
    aspect: "square",
  },
];

const categories = [
  "All",
  "Manufacturing",
  "Loom",
  "Weaving",
  "Sarees",
  "Collections",
  "Finished Products",
] as const;

export default function GalleryPage() {
  const [selectedCat, setSelectedCat] = useState<string>("All");
  const [activeModalItem, setActiveModalItem] = useState<GalleryItem | null>(null);

  const filteredItems =
    selectedCat === "All"
      ? galleryItems
      : galleryItems.filter((i) => i.category === selectedCat);

  return (
    <div className="min-h-screen bg-ivory-50 pb-24">
      {/* Header Banner */}
      <section className="bg-silk-cream-100/70 py-16 sm:py-24 border-b border-gold-300/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-textile-weave opacity-40 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-3">
          <span className="text-xs uppercase font-mono tracking-widest text-silk-red-700 font-bold">
            PVS VISUAL ARCHIVE
          </span>
          <GoldDivider variant="motif" theme="light" className="!my-2" />
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-heritage-brown-950">
            Craft, Looms & Sarees
          </h1>
          <p className="mt-3 text-base sm:text-lg text-heritage-brown-700 max-w-2xl mx-auto font-sans leading-relaxed">
            A photographic look inside our manufacturing processes, loom machinery, raw silk materials,
            and finished South Indian pattu drapes.
          </p>
        </div>
      </section>

      {/* Main Gallery Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14">
        {/* Category Filter Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-6 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCat === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCat(cat)}
                className={`text-xs uppercase tracking-wider font-semibold px-4 py-2 rounded-[4px] whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-silk-red-700 text-ivory-50 shadow-sm border border-silk-red-700 font-bold"
                    : "bg-white text-heritage-brown-800 border border-gold-300 hover:border-gold-500 hover:text-silk-red-700"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Masonry / Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveModalItem(item)}
              className="group relative bg-white border border-gold-300/80 rounded-[4px] overflow-hidden shadow-sm hover:shadow-luxury hover:border-gold-500 transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div
                className={`relative w-full bg-gold-50 overflow-hidden ${
                  item.aspect === "tall"
                    ? "aspect-[3/4]"
                    : item.aspect === "wide"
                    ? "aspect-[16/10]"
                    : "aspect-square"
                }`}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-heritage-brown-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="p-2.5 bg-ivory-50 text-heritage-brown-900 rounded-full shadow border border-gold-400">
                    <Maximize2 className="w-4 h-4 text-silk-red-700" />
                  </span>
                </div>
                <div className="absolute top-3 left-3 bg-heritage-brown-950/90 text-ivory-100 font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-[3px] border border-gold-400/40">
                  {item.category}
                </div>
              </div>

              <div className="p-4 space-y-1 bg-white">
                <h3 className="font-serif text-sm font-bold text-heritage-brown-950 group-hover:text-silk-red-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-heritage-brown-600 line-clamp-2 font-sans">
                  {item.caption}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Note on Photography & Replacing Placeholders */}
        <div className="mt-14 p-6 bg-gold-50 border border-gold-200 rounded-[4px] text-xs text-heritage-brown-700 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
          <div>
            <p className="font-bold text-heritage-brown-950 font-serif">
              Authentic Loom & Workshop Visuals
            </p>
            <p className="text-[11px] text-heritage-brown-600 mt-0.5">
              These reference images represent our craftsmanship standards. New factory floor photos from our Salem looms are added regularly.
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-silk-red-700 hover:text-silk-red-900 whitespace-nowrap"
          >
            <span>View Finished Sarees</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Lightbox Modal */}
      {activeModalItem && (
        <div
          className="fixed inset-0 z-50 bg-heritage-brown-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-subtle"
          onClick={() => setActiveModalItem(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-ivory-50 rounded-[4px] overflow-hidden border border-gold-400 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModalItem(null)}
              className="absolute top-3 right-3 z-20 p-2 bg-white text-heritage-brown-950 rounded-full shadow border border-gold-300 hover:text-silk-red-700"
              aria-label="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative aspect-[4/3] bg-black">
              <Image
                src={activeModalItem.image}
                alt={activeModalItem.title}
                fill
                className="object-contain"
              />
            </div>

            <div className="p-6 space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-silk-red-700 font-bold bg-silk-red-50 border border-silk-red-200 px-2.5 py-0.5 rounded">
                {activeModalItem.category}
              </span>
              <h3 className="font-serif text-xl font-bold text-heritage-brown-950">
                {activeModalItem.title}
              </h3>
              <p className="text-xs sm:text-sm text-heritage-brown-700 font-sans leading-relaxed">
                {activeModalItem.caption}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

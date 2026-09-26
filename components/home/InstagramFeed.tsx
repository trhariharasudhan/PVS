import React from "react";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Instagram, Video, Sparkles, Heart } from "lucide-react";

export function InstagramFeed() {
  const feedItems = [
    {
      type: "video",
      title: "Loom in Motion: Jacquard Weave Run",
      tag: "#LoomLife",
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=600&auto=format&fit=crop",
    },
    {
      type: "image",
      title: "Crimson & Antique Gold Bridal Drape",
      tag: "#BridalSilk",
      image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=600&auto=format&fit=crop",
    },
    {
      type: "image",
      title: "Pure Mulberry Silk Yarn Degumming",
      tag: "#BehindTheLoom",
      image: "https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=600&auto=format&fit=crop",
    },
    {
      type: "image",
      title: "Temple Gopuram Border Zari Alignment",
      tag: "#ZariArt",
      image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=600&auto=format&fit=crop",
    },
    {
      type: "image",
      title: "Fresh Weave Unrolling & Inspection",
      tag: "#QualityCheck",
      image: "https://images.unsplash.com/photo-1610030469668-93530c17b58f?q=80&w=600&auto=format&fit=crop",
    },
    {
      type: "image",
      title: "Folded & Packed in Acid-Free Paper",
      tag: "#SareePackaging",
      image: "https://images.unsplash.com/photo-1610030469854-41125208f237?q=80&w=600&auto=format&fit=crop",
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-ivory-50 text-heritage-brown-950 border-b border-gold-300/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <SectionHeading
            subtitle="Live Behind The Scenes"
            title="FOLLOW THE WEAVING JOURNEY"
            description="Experience our daily loom runs, fresh saree unraveling, and master weaving updates."
            align="left"
          />

          <a
            href={siteConfig.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 bg-white hover:bg-gold-50 text-heritage-brown-950 font-semibold px-5 py-2.5 text-xs tracking-wider uppercase border border-gold-300 rounded-[4px] shadow-sm transition-all"
          >
            <Instagram className="w-4 h-4 text-silk-red-600" />
            <span>Follow {siteConfig.social.instagramHandle}</span>
          </a>
        </div>

        {/* 6-Card Instagram Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {feedItems.map((item, idx) => (
            <a
              key={idx}
              href={siteConfig.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square rounded-[4px] overflow-hidden bg-ivory-100 border border-gold-300/60 block"
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover object-center group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-heritage-brown-950/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3 text-white">
                <div className="flex justify-between items-center text-[10px]">
                  {item.type === "video" ? (
                    <Video className="w-3.5 h-3.5 text-gold-300" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-gold-300" />
                  )}
                  <Heart className="w-3.5 h-3.5 text-silk-red-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gold-300 font-mono">{item.tag}</p>
                  <p className="text-[11px] font-serif font-medium line-clamp-2 leading-tight text-ivory-100">
                    {item.title}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

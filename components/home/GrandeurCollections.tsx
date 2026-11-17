"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { collectionsData } from "@/data/categories";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowRight, Sparkles } from "lucide-react";

export function GrandeurCollections() {
  return (
    <section className="py-20 sm:py-28 bg-silk-cream-100/40 text-heritage-brown-950 border-b border-gold-400/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          subtitle="MANUFACTURER CATALOGUE"
          title="Explore Our Collections"
          description="From celebratory bridal drapes to refined contemporary weaves, explore our distinctive pattu collections."
          align="center"
          className="mb-14"
        />

        {/* 6 Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {collectionsData.map((col) => (
            <div
              key={col.id}
              className="group relative bg-white border border-gold-300/80 rounded-[4px] overflow-hidden shadow-sm hover:shadow-luxury hover:border-gold-500 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Image Area */}
              <div className="relative aspect-[4/3] overflow-hidden bg-ivory-100">
                <Image
                  src={col.image}
                  alt={col.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-heritage-brown-950/70 via-transparent to-transparent opacity-80" />

                {col.badge && (
                  <div className="absolute top-3 left-3">
                    <span className="bg-heritage-brown-950/90 text-ivory-100 text-[10px] font-sans font-semibold uppercase tracking-wider px-2.5 py-1 rounded-[3px] border border-gold-400/40">
                      {col.badge}
                    </span>
                  </div>
                )}

                <div className="absolute bottom-3 left-4 right-4">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-gold-300 block">
                    {col.tagline}
                  </span>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                    {col.name}
                  </h3>
                </div>
              </div>

              {/* Description & Action */}
              <div className="p-5 flex flex-col justify-between flex-grow space-y-4">
                <p className="text-xs text-heritage-brown-700 leading-relaxed font-sans line-clamp-3">
                  {col.description}
                </p>

                <div className="pt-3 border-t border-gold-200/80 flex items-center justify-between">
                  <Link
                    href={`/shop?category=${col.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-silk-red-700 hover:text-silk-red-900 transition-colors group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Explore Collection</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gold-600" />
                  </Link>

                  <Link
                    href={`/wholesale?collection=${encodeURIComponent(col.name)}`}
                    className="text-[11px] text-heritage-brown-500 hover:text-heritage-brown-900 font-sans"
                  >
                    Wholesale
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA to Full Collections */}
        <div className="mt-14 text-center">
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 bg-heritage-brown-900 hover:bg-heritage-brown-950 text-ivory-50 text-xs sm:text-sm font-semibold px-8 py-4 rounded-[4px] uppercase tracking-widest shadow-md transition-all group"
          >
            <span>View All Collections Overview</span>
            <ArrowRight className="w-4 h-4 text-gold-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}

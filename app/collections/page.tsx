"use client";

import React, { useState } from "react";
import Link from "next/link";
import { collectionsData } from "@/data/categories";
import { sampleProducts } from "@/data/products";
import { ProductCard } from "@/components/products/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowRight, ShoppingBag, Building2 } from "lucide-react";

export default function CollectionsPage() {
  const [selectedCollectionSlug, setSelectedCollectionSlug] = useState<string>("all");

  const displayedProducts =
    selectedCollectionSlug === "all"
      ? sampleProducts
      : sampleProducts.filter(
          (p) =>
            p.categorySlug.toLowerCase() === selectedCollectionSlug.toLowerCase() ||
            p.category.toLowerCase() === selectedCollectionSlug.toLowerCase()
        );

  return (
    <div className="min-h-screen bg-ivory-50 pb-24">
      {/* Header Banner */}
      <section className="bg-silk-cream-100/70 text-heritage-brown-950 py-16 sm:py-24 border-b border-gold-300/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-textile-weave opacity-40 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-3">
          <span className="text-xs font-semibold tracking-widest uppercase text-silk-red-700 font-mono">
            PVS WEAVING ARCHIVE
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-heritage-brown-950">
            Explore Our Collections
          </h1>
          <p className="mt-3 text-base sm:text-lg text-heritage-brown-700 max-w-2xl mx-auto font-sans leading-relaxed">
            From majestic bridal brocades to lightweight pure silk drapes, discover our 6 signature
            pattu saree collections crafted directly on Salem looms.
          </p>
        </div>
      </section>

      {/* 6 Collections Overview Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {collectionsData.map((col) => (
            <div
              key={col.id}
              className="bg-white border border-gold-300 rounded-[4px] p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-gold-500 hover:shadow-luxury transition-all"
            >
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-gold-700 font-bold block mb-1">
                  {col.badge || "PVS Collection"}
                </span>
                <h2 className="font-serif text-xl font-bold text-heritage-brown-950">
                  {col.name}
                </h2>
                <p className="text-xs text-silk-red-700 font-semibold mt-0.5">
                  {col.tagline}
                </p>
                <p className="text-xs text-heritage-brown-700 mt-2 font-sans leading-relaxed">
                  {col.description}
                </p>
              </div>

              <div className="pt-3 border-t border-gold-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedCollectionSlug(col.slug)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-silk-red-700 hover:text-silk-red-900"
                >
                  <span>Filter Below</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <Link
                  href={`/shop?category=${col.slug}`}
                  className="text-xs font-semibold text-heritage-brown-800 hover:underline"
                >
                  Shop This Collection →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Filtered Products Area */}
        <div className="pt-8 border-t border-gold-300/60">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-gold-700 font-bold">
                CATALOGUE PIECES
              </span>
              <h3 className="font-serif text-2xl font-bold text-heritage-brown-950 mt-1">
                {selectedCollectionSlug === "all"
                  ? "All Pattu Sarees"
                  : collectionsData.find((c) => c.slug === selectedCollectionSlug)?.name || "Sarees"}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              {selectedCollectionSlug !== "all" && (
                <button
                  onClick={() => setSelectedCollectionSlug("all")}
                  className="text-xs font-semibold text-silk-red-700 hover:underline"
                >
                  Show All ({sampleProducts.length})
                </button>
              )}
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 bg-silk-red-700 text-ivory-50 text-xs font-semibold px-4 py-2 rounded-[4px] uppercase tracking-wider shadow-sm"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Open Full Shop</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

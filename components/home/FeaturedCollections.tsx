"use client";

import React, { useState } from "react";
import Link from "next/link";
import { sampleProducts } from "@/data/products";
import { shopCategories } from "@/data/categories";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductCard } from "@/components/products/ProductCard";
import { ArrowRight, ShoppingBag } from "lucide-react";

export function FeaturedCollections() {
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>("all");

  const filteredProducts =
    activeCategorySlug === "all"
      ? sampleProducts.slice(0, 6)
      : sampleProducts
          .filter((p) => p.categorySlug.toLowerCase() === activeCategorySlug.toLowerCase())
          .slice(0, 6);

  return (
    <section className="py-20 sm:py-28 bg-ivory-50 text-heritage-brown-950 border-b border-gold-400/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          subtitle="MANUFACTURING SHOWCASE"
          title="Featured Sarees"
          description="Crafted with pure mulberry silk yarns, distinct color harmonies, and tested zari from our Salem looms."
          align="center"
          className="mb-8"
        />

        {/* Category Pill Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-12">
          {shopCategories.map((cat) => {
            const isActive = activeCategorySlug === cat.slug;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setActiveCategorySlug(cat.slug)}
                className={`text-xs uppercase tracking-wider font-semibold px-4 py-2 rounded-[4px] transition-all duration-200 ${
                  isActive
                    ? "bg-silk-red-700 text-ivory-50 shadow-sm border border-silk-red-700 font-bold"
                    : "bg-white text-heritage-brown-800 border border-gold-300 hover:border-gold-500 hover:text-silk-red-700"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredProducts.map((product, idx) => (
            <ProductCard key={product.id} product={product} priority={idx < 2} />
          ))}
        </div>

        {/* Bottom CTA to Full Catalog */}
        <div className="mt-14 text-center space-y-3">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-silk-red-700 hover:bg-deep-maroon-800 text-ivory-50 font-semibold px-8 py-4 text-xs sm:text-sm tracking-widest uppercase rounded-[4px] border border-silk-red-700 shadow-luxury transition-all group"
          >
            <ShoppingBag className="w-4 h-4 text-gold-300" />
            <span>View Complete Shop Catalogue</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-gold-300" />
          </Link>
          <p className="text-xs text-heritage-brown-600 font-sans">
            Wholesale merchants and boutique buyers can also initiate direct bulk inquiries via our{" "}
            <Link href="/wholesale" className="text-silk-red-700 font-bold underline hover:text-silk-red-900">
              Wholesale Portal
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}

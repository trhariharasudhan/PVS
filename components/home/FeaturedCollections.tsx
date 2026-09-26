"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getProducts, getCategories, adaptApiProductListToProduct } from "@/lib/api";
import { Product, ApiCategory } from "@/types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductCard } from "@/components/products/ProductCard";
import { ArrowRight } from "lucide-react";

export function FeaturedCollections() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>("All");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [catList, prodRes] = await Promise.all([
          getCategories(),
          getProducts({ limit: 8, featured: true }),
        ]);
        setCategories(catList);
        setProducts(prodRes.items.map(adaptApiProductListToProduct));
      } catch (err) {
        console.warn("Failed to load featured products from API:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredProducts =
    activeCategorySlug === "All"
      ? products.slice(0, 6)
      : products.filter((p) => p.categorySlug === activeCategorySlug || p.category === activeCategorySlug).slice(0, 6);

  return (
    <section className="py-20 sm:py-28 bg-ivory-50 text-heritage-brown-950 border-b border-gold-400/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          subtitle="CURATED SHOWCASE"
          title="AUTHENTIC HANDLOOM SAREES"
          description="A selection of our finest pure mulberry silk sarees straight from our active looms in Tamil Nadu."
          align="center"
          className="mb-8"
        />

        {/* Category Pill Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12">
          <button
            type="button"
            onClick={() => setActiveCategorySlug("All")}
            className={`text-xs uppercase tracking-wider font-semibold px-4 py-2 rounded-[4px] transition-all duration-200 ${
              activeCategorySlug === "All"
                ? "bg-silk-red-700 text-ivory-50 shadow-sm border border-silk-red-700 font-bold"
                : "bg-white text-heritage-brown-800 border border-gold-300/80 hover:border-gold-500 hover:text-silk-red-700"
            }`}
          >
            All Sarees
          </button>
          {categories.map((cat) => {
            const isActive = activeCategorySlug === cat.slug;
            return (
              <button
                key={cat.id || cat.slug}
                type="button"
                onClick={() => setActiveCategorySlug(cat.slug)}
                className={`text-xs uppercase tracking-wider font-semibold px-4 py-2 rounded-[4px] transition-all duration-200 ${
                  isActive
                    ? "bg-silk-red-700 text-ivory-50 shadow-sm border border-silk-red-700 font-bold"
                    : "bg-white text-heritage-brown-800 border border-gold-300/80 hover:border-gold-500 hover:text-silk-red-700"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Product Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 animate-pulse">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-white border border-gold-200 rounded-[4px] p-3 space-y-3">
                <div className="aspect-[3/4] bg-gold-100/60 rounded-[4px]" />
                <div className="h-4 bg-gold-100 rounded w-3/4" />
                <div className="h-3 bg-gold-50 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Bottom CTA to Full Catalog */}
        <div className="mt-14 text-center">
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 bg-silk-red-700 hover:bg-deep-maroon-800 text-ivory-50 font-semibold px-8 py-4 text-xs sm:text-sm tracking-widest uppercase rounded-[4px] border border-silk-red-700 shadow-luxury transition-all group"
          >
            <span>Explore Complete Saree Archive</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-gold-300" />
          </Link>
          <p className="text-xs text-heritage-brown-600 mt-3 font-sans">
            Looking for bulk or customized boutique orders? Check out our{" "}
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

"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { sampleProducts, ProductItem } from "@/data/products";
import { shopCategories } from "@/data/categories";
import { ProductCard } from "@/components/products/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Search, Filter, SlidersHorizontal, ShoppingBag, X } from "lucide-react";
import { SHOW_RETAIL_PRICES } from "@/lib/pricing";

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "newest" | "price-asc" | "price-desc">("featured");
  const [selectedFabric, setSelectedFabric] = useState<string>("all");
  const [selectedAvailability, setSelectedAvailability] = useState<string>("all");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Extract unique fabrics
  const fabricList = useMemo(() => {
    const list = Array.from(new Set(sampleProducts.map((p) => p.fabric)));
    return ["all", ...list];
  }, []);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return sampleProducts
      .filter((p) => {
        // Category filter
        if (selectedCategory !== "all") {
          if (p.categorySlug.toLowerCase() !== selectedCategory.toLowerCase()) {
            return false;
          }
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchCode = p.code.toLowerCase().includes(q);
          const matchColor = p.color.toLowerCase().includes(q);
          const matchFabric = p.fabric.toLowerCase().includes(q);
          if (!matchName && !matchCode && !matchColor && !matchFabric) {
            return false;
          }
        }
        // Fabric filter
        if (selectedFabric !== "all" && p.fabric !== selectedFabric) {
          return false;
        }
        // Availability filter
        if (selectedAvailability !== "all" && p.availability !== selectedAvailability) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "newest") return a.code.localeCompare(b.code);
        // Featured
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [selectedCategory, searchQuery, selectedFabric, selectedAvailability, sortBy]);

  return (
    <div className="min-h-screen bg-ivory-50 pb-24">
      {/* Shop Header Banner */}
      <section className="bg-silk-cream-100/60 py-12 sm:py-16 border-b border-gold-300/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-semibold tracking-widest uppercase text-silk-red-700 font-mono">
            PVS Saree Archive • Wholesale & Retail
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-heritage-brown-950 mt-2">
            Shop Pattu Sarees
          </h1>
          <p className="text-sm sm:text-base text-heritage-brown-700 max-w-2xl mx-auto mt-3 font-sans">
            Explore pure silk sarees directly from our manufacturing looms in Salem, Tamil Nadu.
            Available for both individual retail and wholesale bulk requirements.
          </p>
        </div>
      </section>

      {/* Main Catalog Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* Top Control Bar: Search & Sort */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-6 border-b border-gold-300/60">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {shopCategories.map((cat) => {
              const isActive = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`text-xs uppercase tracking-wider font-semibold px-3.5 py-2 rounded-[4px] whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-silk-red-700 text-ivory-50 font-bold shadow-sm"
                      : "bg-white text-heritage-brown-800 border border-gold-300/80 hover:border-gold-500 hover:text-silk-red-700"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-heritage-brown-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search color, code, fabric..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gold-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-gold-500 text-heritage-brown-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-heritage-brown-400 hover:text-heritage-brown-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="text-xs bg-white border border-gold-300 rounded-[4px] px-3 py-2 text-heritage-brown-900 focus:outline-none focus:ring-1 focus:ring-gold-500 font-sans"
            >
              <option value="featured">Featured First</option>
              <option value="newest">Newest Looms</option>
              {SHOW_RETAIL_PRICES && <option value="price-asc">Price: Low to High</option>}
              {SHOW_RETAIL_PRICES && <option value="price-desc">Price: High to Low</option>}
            </select>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="md:hidden p-2 bg-white border border-gold-300 rounded-[4px] text-heritage-brown-700"
              aria-label="Filter products"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Layout Grid: Sidebar Filters + Products */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="p-5 bg-white border border-gold-300/80 rounded-[4px] shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gold-200 pb-3">
                <span className="font-serif text-sm font-bold text-heritage-brown-950 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-gold-600" />
                  <span>Refine Catalog</span>
                </span>
                {(selectedFabric !== "all" || selectedAvailability !== "all") && (
                  <button
                    onClick={() => {
                      setSelectedFabric("all");
                      setSelectedAvailability("all");
                    }}
                    className="text-[10px] text-silk-red-700 hover:underline font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Fabric Filter */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-heritage-brown-900 block">
                  Fabric Type
                </label>
                <div className="space-y-1.5">
                  {fabricList.map((f) => (
                    <label key={f} className="flex items-center gap-2 text-xs text-heritage-brown-700 cursor-pointer hover:text-heritage-brown-950">
                      <input
                        type="radio"
                        name="fabric"
                        checked={selectedFabric === f}
                        onChange={() => setSelectedFabric(f)}
                        className="text-silk-red-700 focus:ring-gold-500"
                      />
                      <span className="capitalize">{f === "all" ? "All Fabrics" : f}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Availability Filter */}
              <div className="space-y-2 pt-4 border-t border-gold-200">
                <label className="text-[11px] font-bold uppercase tracking-wider text-heritage-brown-900 block">
                  Availability
                </label>
                <div className="space-y-1.5">
                  {["all", "In Stock", "Bulk Available", "Made to Order"].map((avail) => (
                    <label key={avail} className="flex items-center gap-2 text-xs text-heritage-brown-700 cursor-pointer hover:text-heritage-brown-950">
                      <input
                        type="radio"
                        name="availability"
                        checked={selectedAvailability === avail}
                        onChange={() => setSelectedAvailability(avail)}
                        className="text-silk-red-700 focus:ring-gold-500"
                      />
                      <span>{avail === "all" ? "All Statuses" : avail}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Wholesale Note Box */}
              <div className="p-3.5 bg-gold-50 border border-gold-200 rounded-[3px] text-xs text-heritage-brown-800 space-y-1">
                <p className="font-bold text-silk-red-700 font-serif">Wholesale Orders</p>
                <p className="text-[11px] leading-relaxed">
                  Boutiques & retail merchants can request volume tiers & GST invoicing on all catalogue sarees.
                </p>
              </div>
            </div>
          </aside>

          {/* Main Products Grid */}
          <main className="lg:col-span-9">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white border border-gold-200 rounded-[4px] p-8 space-y-4">
                <ShoppingBag className="w-12 h-12 text-gold-500 mx-auto opacity-60" />
                <h3 className="font-serif text-lg font-bold text-heritage-brown-950">
                  No Sarees Found
                </h3>
                <p className="text-xs text-heritage-brown-600 max-w-sm mx-auto font-sans">
                  Try adjusting your search criteria or resetting filters to view all manufactured sarees.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setSearchQuery("");
                    setSelectedFabric("all");
                    setSelectedAvailability("all");
                  }}
                  className="inline-flex items-center gap-1.5 bg-silk-red-700 text-ivory-50 text-xs font-semibold px-5 py-2.5 rounded-[4px] uppercase tracking-wider"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4 text-xs text-heritage-brown-600 font-sans">
                  <span>
                    Showing <strong className="text-heritage-brown-950">{filteredProducts.length}</strong> creations
                  </span>
                  <span className="text-[11px] text-gold-800 font-medium">
                    Direct from Salem Looms
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory-50 p-20 text-center font-serif">Loading PVS Shop...</div>}>
      <ShopContent />
    </Suspense>
  );
}

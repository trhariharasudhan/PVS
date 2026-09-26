"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getCategories, getProducts, adaptApiProductListToProduct } from "@/lib/api";
import { Product, ApiCategory } from "@/types";
import { ProductCard } from "@/components/products/ProductCard";
import { Search, RefreshCw, AlertCircle } from "lucide-react";

export default function CollectionsPage() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedAvailability, setSelectedAvailability] = useState<string>("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search query input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Categories on Mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const catList = await getCategories();
        setCategories(catList);
      } catch (err) {
        console.warn("Failed to load categories:", err);
      }
    }
    loadCategories();
  }, []);

  // Fetch Products whenever filters, search, or page changes
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getProducts({
        page: currentPage,
        limit: 12,
        search: debouncedSearch.trim() || undefined,
        category_slug: selectedCategory !== "all" ? selectedCategory : undefined,
        availability: selectedAvailability !== "all" ? selectedAvailability : undefined,
      });

      const adapted = response.items.map(adaptApiProductListToProduct);
      setProducts(adapted);
      setTotalCount(response.total);
      setTotalPages(response.total_pages);
    } catch (err) {
      console.error("Error loading products:", err);
      setError("Unable to connect to the saree archive. Please ensure the backend is running or retry.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, debouncedSearch, selectedAvailability, currentPage]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const activeCategoryInfo = categories.find((c) => c.slug === selectedCategory);

  return (
    <div className="min-h-screen bg-ivory-50 pb-24">
      {/* Header Banner */}
      <section className="bg-ivory-100 text-heritage-brown-950 py-16 sm:py-20 relative overflow-hidden border-b border-gold-300/40">
        <div className="absolute inset-0 bg-textile-weave opacity-50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-xs font-semibold tracking-widest uppercase text-silk-red-600">
            Direct Loom Catalogue
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight mt-2 text-heritage-brown-950">
            SILK SAREE COLLECTIONS
          </h1>
          <p className="mt-4 text-sm sm:text-base text-heritage-brown-700 max-w-2xl mx-auto font-sans">
            Explore our complete archive of pure mulberry silk sarees, bridal brocades, and traditional Tamil Nadu handloom creations.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Category Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none border-b border-gold-300/40">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setCurrentPage(1);
            }}
            className={`text-xs uppercase tracking-wider font-semibold px-4 py-2.5 rounded-[4px] whitespace-nowrap transition-all duration-200 ${
              selectedCategory === "all"
                ? "bg-silk-red-600 text-ivory-50 shadow-sm border border-silk-red-600 font-bold"
                : "bg-white text-heritage-brown-800 hover:bg-gold-50 border border-gold-300/80"
            }`}
          >
            All Sarees
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id || cat.slug}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.slug);
                  setCurrentPage(1);
                }}
                className={`text-xs uppercase tracking-wider font-semibold px-4 py-2.5 rounded-[4px] whitespace-nowrap transition-all duration-200 ${
                  isSelected
                    ? "bg-silk-red-600 text-ivory-50 shadow-sm border border-silk-red-600 font-bold"
                    : "bg-white text-heritage-brown-800 hover:bg-gold-50 border border-gold-300/80"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Search & Filter Controls Bar */}
        <div className="mt-8 bg-white p-4 sm:p-5 rounded-[4px] border border-gold-300/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-gold-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by code (PVS-001), color, or motif..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-ivory-50/70 border border-gold-300/70 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-silk-red-600 focus:border-silk-red-600 focus:bg-white text-heritage-brown-950 placeholder:text-heritage-brown-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-heritage-brown-500 hover:text-heritage-brown-950"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Dropdowns & Stats */}
          <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
            {/* Availability Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-heritage-brown-600 font-medium whitespace-nowrap">
                Availability:
              </span>
              <select
                value={selectedAvailability}
                onChange={(e) => {
                  setSelectedAvailability(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs py-2 px-3 bg-ivory-50 border border-gold-300/80 rounded-[4px] text-heritage-brown-950 focus:outline-none focus:ring-1 focus:ring-silk-red-600"
              >
                <option value="all">All Items</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="MADE_TO_ORDER">Made to Order</option>
                <option value="LIMITED_WEAVE">Limited Weave</option>
                <option value="BULK_AVAILABLE">Bulk Available</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="text-xs text-heritage-brown-500 font-mono pl-2 border-l border-gold-300">
              Showing <span className="font-bold text-silk-red-600">{totalCount}</span> Sarees
            </div>
          </div>
        </div>

        {/* Category Description Banner (if specific category) */}
        {selectedCategory !== "all" && activeCategoryInfo && (
          <div className="mt-6 p-4 sm:p-5 bg-gold-50/70 border-l-4 border-gold-600 rounded-r-[4px] border border-gold-200">
            <h3 className="font-serif text-base font-bold text-heritage-brown-950">
              {activeCategoryInfo.name} {activeCategoryInfo.tagline ? `— ${activeCategoryInfo.tagline}` : ""}
            </h3>
            {activeCategoryInfo.description && (
              <p className="text-xs text-heritage-brown-700 mt-1 font-sans">
                {activeCategoryInfo.description}
              </p>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-8 p-6 bg-red-50/80 border border-red-200 rounded-[4px] text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <h3 className="font-serif text-base font-bold text-red-950">Failed to Load Catalogue</h3>
            <p className="text-xs text-red-700 mt-1">{error}</p>
            <button
              type="button"
              onClick={loadProducts}
              className="mt-4 px-4 py-2 bg-silk-red-600 text-ivory-50 text-xs uppercase tracking-wider font-semibold rounded-[4px] hover:bg-silk-red-800 border border-silk-red-600"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="bg-white border border-gold-200 rounded-[4px] overflow-hidden p-3 space-y-3">
                <div className="aspect-[3/4] bg-gold-100/60 rounded-[4px]" />
                <div className="h-4 bg-gold-100 rounded w-3/4" />
                <div className="h-3 bg-gold-50 rounded w-1/2" />
                <div className="h-4 bg-gold-100/80 rounded w-1/3 pt-2" />
              </div>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && !error && products.length > 0 && (
          <>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="px-4 py-2 text-xs uppercase tracking-wider font-semibold bg-white border border-gold-300 rounded-[4px] text-heritage-brown-700 disabled:opacity-40 hover:bg-gold-50"
                >
                  Previous
                </button>
                <span className="text-xs font-mono px-3 text-heritage-brown-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="px-4 py-2 text-xs uppercase tracking-wider font-semibold bg-white border border-gold-300 rounded-[4px] text-heritage-brown-700 disabled:opacity-40 hover:bg-gold-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && !error && products.length === 0 && (
          <div className="mt-16 text-center py-16 bg-white border border-gold-300/60 rounded-[4px] shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gold-100 flex items-center justify-center mx-auto text-gold-700 mb-3">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-heritage-brown-950">
              No matching sarees found
            </h3>
            <p className="text-xs text-heritage-brown-600 max-w-sm mx-auto mt-1 font-sans">
              Try adjusting your search criteria or resetting your category filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
                setSelectedAvailability("all");
                setCurrentPage(1);
              }}
              className="mt-4 inline-flex items-center text-xs uppercase tracking-wider font-semibold text-silk-red-600 underline"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

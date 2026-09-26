"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getDealerProducts } from "@/lib/api";
import { DealerProductItem } from "@/lib/api/dealer";
import { Package, Search, Loader2, ArrowRight, Sparkles } from "lucide-react";

export default function DealerProductsPage() {
  const [products, setProducts] = useState<DealerProductItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        setIsLoading(true);
        const data = await getDealerProducts({ search: search || undefined, limit: 50 });
        setProducts(data.items || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error("Failed to load dealer catalogue:", err);
      } finally {
        setIsLoading(false);
      }
    }

    const timeout = setTimeout(loadProducts, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-heritage-brown-950">Wholesale Saree Catalogue</h1>
          <p className="text-xs sm:text-sm text-heritage-brown-600 mt-1 font-sans">
            Browse genuine pure silk sarees with server-authoritative wholesale tiered volume pricing
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gold-700" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU, weave, color..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-gold-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-silk-red-600 focus:border-silk-red-600 text-heritage-brown-950"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-silk-red-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-[4px] p-12 text-center border border-gold-300/60 shadow-sm">
          <Package className="w-10 h-10 text-gold-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-heritage-brown-950">No matching sarees found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => {
            const hasTiers = p.pricing_tiers && p.pricing_tiers.length > 0;
            const lowestTier = hasTiers
              ? p.pricing_tiers.reduce((min, t) => (t.tier_price < min ? t.tier_price : min), p.pricing_tiers[0].tier_price)
              : null;

            return (
              <div
                key={p.id}
                className="bg-white rounded-[4px] shadow-sm border border-gold-300/60 overflow-hidden flex flex-col hover:border-gold-500 transition-all group hover:shadow-luxury"
              >
                {/* Product Image / Placeholder */}
                <div className="relative aspect-[4/3] bg-ivory-100 overflow-hidden flex items-center justify-center">
                  {p.primary_image_url ? (
                    <img
                      src={p.primary_image_url}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="text-center p-6">
                      <Package className="w-12 h-12 text-gold-400 mx-auto mb-2" />
                      <span className="text-xs text-heritage-brown-500">Pure Silk Sample</span>
                    </div>
                  )}

                  {/* Stock Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2.5 py-1 rounded-[4px] text-[10px] font-semibold tracking-wide uppercase ${
                        p.available_stock > 5
                          ? "bg-emerald-800 text-ivory-50 border border-emerald-600"
                          : p.available_stock > 0
                          ? "bg-gold-500 text-ivory-50 font-bold border border-gold-400"
                          : "bg-heritage-brown-950/80 text-ivory-200"
                      }`}
                    >
                      {p.available_stock > 0 ? `${p.available_stock} In Stock` : "Made to Order"}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-heritage-brown-500 mb-1">
                      <span className="font-mono font-bold text-silk-red-700">{p.code}</span>
                      <span className="text-gold-700 font-medium">{p.category_name || "Pure Silk"}</span>
                    </div>
                    <h3 className="text-base font-serif font-bold text-heritage-brown-950 group-hover:text-silk-red-600 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-xs text-heritage-brown-600 mt-1">
                      {p.fabric} • {p.color} • {p.border}
                    </p>
                  </div>

                  {/* Tier Pricing Matrix Snippet */}
                  <div className="mt-4 pt-4 border-t border-ivory-200 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-heritage-brown-600">Retail MSRP:</span>
                      <span className="text-sm font-semibold text-heritage-brown-950">
                        INR {p.base_retail_price?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "On Enquiry"}
                      </span>
                    </div>

                    {lowestTier && (
                      <div className="bg-gold-50/80 rounded-[4px] p-2.5 text-xs text-heritage-brown-950 border border-gold-300 flex items-center justify-between">
                        <span className="font-semibold flex items-center gap-1 text-gold-800">
                          <Sparkles className="w-3.5 h-3.5 text-gold-600" /> Wholesale From:
                        </span>
                        <span className="font-bold text-silk-red-700 font-serif">
                          INR {lowestTier.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}

                    <Link
                      href={`/portal/dealer/products/${p.id}`}
                      className="w-full mt-2 py-2.5 px-3 rounded-[4px] bg-silk-red-600 hover:bg-silk-red-800 text-ivory-50 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors border border-silk-red-600 shadow-sm"
                    >
                      Calculate Bulk Quote & Order <ArrowRight className="w-3.5 h-3.5 text-gold-300" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

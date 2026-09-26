"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getAdminProducts,
  getAdminCategories,
  deactivateAdminProduct,
  updateAdminProduct,
} from "@/lib/api";
import { AdminProductList, AdminCategory } from "@/types";
import {
  Package,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Sparkles,
  Edit,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductList[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedAvailability, setSelectedAvailability] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("all"); // "all", "active", "inactive"
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const cats = await getAdminCategories();
      setCategories(cats);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const isActiveParam =
        activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined;

      const res = await getAdminProducts({
        page,
        limit: 12,
        search: search.trim() || undefined,
        category_id: selectedCategory || undefined,
        availability: selectedAvailability || undefined,
        is_active: isActiveParam,
      });

      setProducts(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error("Failed to fetch admin products:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, selectedCategory, selectedAvailability, activeFilter]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleToggleActive = async (product: AdminProductList) => {
    try {
      if (product.is_active) {
        await deactivateAdminProduct(product.id);
        setActionMessage(`Product '${product.code}' has been archived.`);
      } else {
        await updateAdminProduct(product.id, { is_active: true });
        setActionMessage(`Product '${product.code}' has been restored to active catalogue.`);
      }
      fetchProducts();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      console.error("Toggle active error:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
            Saree Catalogue Management
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Create, update specifications, manage photography angles, and configure availability status.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Saree</span>
        </Link>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white border border-gold-300/80 rounded-sm shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code, name, fabric, motif..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 focus:bg-white text-charcoal-900"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 focus:bg-white text-charcoal-900"
            >
              <option value="">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.product_count})
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <select
              value={selectedAvailability}
              onChange={(e) => {
                setSelectedAvailability(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 focus:bg-white text-charcoal-900"
            >
              <option value="">All Availability States</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="MADE_TO_ORDER">Made to Order</option>
              <option value="LIMITED_WEAVE">Limited Weave</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>

          {/* Active / Archived Toggle */}
          <div>
            <select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 focus:bg-white text-charcoal-900"
            >
              <option value="all">All Records (Active & Archived)</option>
              <option value="active">Active Storefront Items</option>
              <option value="inactive">Archived Only</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gold-200/60 text-xs text-charcoal-500">
          <span>
            Showing <strong>{products.length}</strong> of <strong>{total}</strong> sarees in database
          </span>
          {(search || selectedCategory || selectedAvailability || activeFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("");
                setSelectedAvailability("");
                setActiveFilter("all");
                setPage(1);
              }}
              className="text-xs text-burgundy-900 font-semibold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-7 h-7 text-burgundy-900 animate-spin" />
            <span className="text-xs font-mono text-charcoal-500">Loading saree catalogue...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Package className="w-10 h-10 text-gold-400 mx-auto" />
            <h3 className="font-serif text-base font-bold text-burgundy-950">
              No Sarees Found
            </h3>
            <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
              No products match your search or active filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-charcoal-700">
              <thead className="bg-ivory-50 text-[10px] uppercase tracking-wider text-charcoal-500 border-b border-gold-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">SKU & Photo</th>
                  <th className="px-4 py-3 font-semibold">Saree Details</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Price Status</th>
                  <th className="px-4 py-3 font-semibold">Availability</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-200/60">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-ivory-50/70 transition-colors">
                    {/* Photo & Code */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-14 bg-gold-100 rounded-sm border border-gold-300 relative overflow-hidden shrink-0 flex items-center justify-center">
                          {p.primary_image_url ? (
                            <Image
                              src={p.primary_image_url}
                              alt={p.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-gold-500" />
                          )}
                        </div>
                        <div>
                          <span className="font-mono font-bold text-xs text-charcoal-900 block">
                            {p.code}
                          </span>
                          <span className="text-[10px] text-charcoal-500 flex items-center gap-1 mt-0.5">
                            <ImageIcon className="w-3 h-3" />
                            <span>{p.image_count} photos</span>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Details */}
                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-charcoal-900 block truncate">
                          {p.name}
                        </span>
                        {p.is_featured && (
                          <span
                            title="Featured on Homepage"
                            className="text-[9px] px-1 py-0.2 bg-gold-100 text-gold-800 border border-gold-300 rounded font-semibold shrink-0"
                          >
                            ★ Featured
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-charcoal-500 block mt-0.5">
                        {p.fabric} • {p.color}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5 text-charcoal-700 font-medium">
                      {p.category_name}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3.5">
                      {p.is_price_on_enquiry ? (
                        <span className="text-[11px] text-gold-800 font-semibold bg-gold-50 px-2 py-0.5 rounded border border-gold-200">
                          Enquiry Basis
                        </span>
                      ) : p.price ? (
                        <span className="font-mono font-bold text-charcoal-900">
                          ₹{Number(p.price).toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="text-charcoal-400">—</span>
                      )}
                    </td>

                    {/* Availability */}
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {p.availability_status.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Active State */}
                    <td className="px-4 py-3.5">
                      {p.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-charcoal-400">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Archived</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-ivory-100 hover:bg-gold-100 text-charcoal-800 border border-gold-300 rounded text-xs font-medium transition-colors"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(p)}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                          p.is_active
                            ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                        }`}
                        title={p.is_active ? "Archive from public catalogue" : "Restore to public catalogue"}
                      >
                        {p.is_active ? "Archive" : "Restore"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gold-200 flex items-center justify-between text-xs">
            <span className="text-charcoal-500">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gold-300 rounded-sm text-charcoal-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gold-50"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gold-300 rounded-sm text-charcoal-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gold-50"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

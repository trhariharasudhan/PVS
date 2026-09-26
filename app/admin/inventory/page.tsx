"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getAdminInventory,
  getAdminCategories,
  adjustAdminInventory,
} from "@/lib/api";
import { AdminInventoryItem, AdminCategory, MovementType } from "@/types";
import {
  Boxes,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  History,
  X,
  Flame,
  ArrowRight,
} from "lucide-react";

export default function AdminInventoryPage() {
  const [items, setItems] = useState<AdminInventoryItem[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Adjustment Modal State
  const [adjustingItem, setAdjustingItem] = useState<AdminInventoryItem | null>(null);
  const [movementType, setMovementType] = useState<MovementType>("PURCHASE");
  const [quantityDelta, setQuantityDelta] = useState<string>("10");
  const [referenceId, setReferenceId] = useState("");
  const [warehouseLocation, setWarehouseLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  const fetchCategories = async () => {
    try {
      const cats = await getAdminCategories();
      setCategories(cats);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminInventory({
        page,
        limit: 15,
        search: search.trim() || undefined,
        category_id: selectedCategory || undefined,
        stock_status: stockStatus || undefined,
        low_stock_only: lowStockOnly || undefined,
      });

      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      console.error("Failed to fetch inventory:", err);
      setError(err?.message || "Failed to load inventory.");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, selectedCategory, stockStatus, lowStockOnly]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const openAdjustModal = (item: AdminInventoryItem) => {
    setAdjustingItem(item);
    setMovementType("PURCHASE");
    setQuantityDelta("10");
    setReferenceId("");
    setWarehouseLocation(item.warehouse_location || "");
    setNotes("");
    setError(null);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;

    const delta = Number(quantityDelta);
    if (isNaN(delta) || delta === 0) {
      setError("Please enter a non-zero integer delta.");
      return;
    }

    if (adjustingItem.quantity_on_hand + delta < 0) {
      setError(
        `Adjustment would result in negative stock (${adjustingItem.quantity_on_hand + delta}). Operation blocked.`
      );
      return;
    }

    setIsSubmittingAdjust(true);
    setError(null);
    try {
      await adjustAdminInventory(adjustingItem.product_id, {
        movement_type: movementType,
        quantity_delta: delta,
        reference_id: referenceId.trim() || undefined,
        warehouse_location: warehouseLocation.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setActionMessage(
        `Stock for '${adjustingItem.product_code}' updated (${delta > 0 ? "+" : ""}${delta} units).`
      );
      setAdjustingItem(null);
      fetchInventory();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      console.error("Adjustment failure:", err);
      setError(err?.message || "Failed to record stock adjustment.");
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  const totalUnits = items.reduce((acc, i) => acc + i.quantity_on_hand, 0);
  const lowStockCount = items.filter((i) => i.stock_status === "LOW_STOCK").length;
  const outOfStockCount = items.filter((i) => i.stock_status === "OUT_OF_STOCK").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
            Saree Finished Stock Inventory
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Real-time physical stock counts, threshold alerts, and immutable movement ledger tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchInventory}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gold-300 hover:bg-gold-50 text-charcoal-700 text-xs font-medium rounded-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gold-600" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-sm text-xs text-red-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-gold-300/80 rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-charcoal-500 font-semibold block">
              Units On-Hand (Page)
            </span>
            <span className="font-serif text-2xl font-bold text-burgundy-950">
              {totalUnits}
            </span>
          </div>
          <Boxes className="w-6 h-6 text-emerald-600" />
        </div>

        <div className="p-4 bg-white border border-gold-300/80 rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-charcoal-500 font-semibold block">
              Low Stock Alerts
            </span>
            <span className="font-serif text-2xl font-bold text-amber-700">
              {lowStockCount}
            </span>
          </div>
          <Flame className="w-6 h-6 text-amber-600" />
        </div>

        <div className="p-4 bg-white border border-gold-300/80 rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-charcoal-500 font-semibold block">
              Out of Stock SKUs
            </span>
            <span className="font-serif text-2xl font-bold text-red-700">
              {outOfStockCount}
            </span>
          </div>
          <XCircle className="w-6 h-6 text-red-600" />
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white border border-gold-300/80 rounded-sm shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search SKU, name, fabric, location..."
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
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div>
            <select
              value={stockStatus}
              onChange={(e) => {
                setStockStatus(e.target.value);
                setLowStockOnly(false);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 focus:bg-white text-charcoal-900"
            >
              <option value="">All Stock Levels</option>
              <option value="IN_STOCK">Optimal Stock (Above Threshold)</option>
              <option value="LOW_STOCK">Low Stock (At or Below Threshold)</option>
              <option value="OUT_OF_STOCK">Out of Stock (0 Units)</option>
            </select>
          </div>

          {/* Low Stock Quick Checkbox */}
          <div className="flex items-center">
            <label className="flex items-center gap-2 text-xs font-semibold text-charcoal-800 cursor-pointer">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => {
                  setLowStockOnly(e.target.checked);
                  if (e.target.checked) setStockStatus("");
                  setPage(1);
                }}
                className="rounded text-burgundy-900 focus:ring-gold-500 w-4 h-4"
              />
              <span className="flex items-center gap-1 text-amber-900 font-semibold">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span>Show Low Stock Only</span>
              </span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gold-200/60 text-xs text-charcoal-500">
          <span>
            Showing <strong>{items.length}</strong> of <strong>{total}</strong> tracked saree SKUs
          </span>
          {(search || selectedCategory || stockStatus || lowStockOnly) && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("");
                setStockStatus("");
                setLowStockOnly(false);
                setPage(1);
              }}
              className="text-xs text-burgundy-900 font-semibold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-7 h-7 text-burgundy-900 animate-spin" />
            <span className="text-xs font-mono text-charcoal-500">Loading inventory records...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Boxes className="w-10 h-10 text-gold-400 mx-auto" />
            <h3 className="font-serif text-base font-bold text-burgundy-950">
              No Inventory Items Found
            </h3>
            <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
              No items match your active search or filter parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-charcoal-700">
              <thead className="bg-ivory-50 text-[10px] uppercase tracking-wider text-charcoal-500 border-b border-gold-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">SKU & Photo</th>
                  <th className="px-4 py-3 font-semibold">Saree Model</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold text-center">On Hand</th>
                  <th className="px-4 py-3 font-semibold text-center">Threshold</th>
                  <th className="px-4 py-3 font-semibold">Warehouse Location</th>
                  <th className="px-4 py-3 font-semibold">Stock Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-200/60">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-ivory-50/70 transition-colors">
                    {/* Photo & SKU */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 bg-gold-100 rounded-sm border border-gold-300 relative overflow-hidden shrink-0 flex items-center justify-center">
                          {item.primary_image_url ? (
                            <Image
                              src={item.primary_image_url}
                              alt={item.product_name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-gold-500" />
                          )}
                        </div>
                        <span className="font-mono font-bold text-xs text-charcoal-900">
                          {item.product_code}
                        </span>
                      </div>
                    </td>

                    {/* Saree Name */}
                    <td className="px-4 py-3.5 font-medium text-charcoal-900 max-w-xs truncate">
                      {item.product_name}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5 text-charcoal-600">{item.category_name}</td>

                    {/* On Hand */}
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                          item.quantity_on_hand === 0
                            ? "bg-red-100 text-red-800"
                            : item.quantity_on_hand <= item.reorder_threshold
                            ? "bg-amber-100 text-amber-900"
                            : "bg-emerald-50 text-emerald-900"
                        }`}
                      >
                        {item.quantity_on_hand} pcs
                      </span>
                    </td>

                    {/* Threshold */}
                    <td className="px-4 py-3.5 text-center font-mono text-charcoal-500">
                      {item.reorder_threshold} pcs
                    </td>

                    {/* Warehouse Location */}
                    <td className="px-4 py-3.5 text-charcoal-600 font-mono text-[11px]">
                      {item.warehouse_location || "Central Godown"}
                    </td>

                    {/* Stock Status Badge */}
                    <td className="px-4 py-3.5">
                      {item.stock_status === "IN_STOCK" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Optimal Stock
                        </span>
                      )}
                      {item.stock_status === "LOW_STOCK" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 w-fit">
                          <Flame className="w-3 h-3 text-amber-600" />
                          <span>Low Stock</span>
                        </span>
                      )}
                      {item.stock_status === "OUT_OF_STOCK" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800 border border-red-300">
                          Out of Stock
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openAdjustModal(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 rounded text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        <span>Adjust</span>
                      </button>

                      <Link
                        href={`/admin/inventory/${item.product_id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-ivory-100 hover:bg-gold-100 text-charcoal-800 border border-gold-300 rounded text-xs font-medium transition-colors"
                        title="View chronological movement audit ledger"
                      >
                        <History className="w-3 h-3" />
                        <span>Ledger</span>
                      </Link>
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

      {/* Stock Adjustment Modal / Drawer */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gold-400 rounded-sm shadow-2xl max-w-lg w-full p-6 space-y-5 animate-fade-in-subtle">
            <div className="flex items-center justify-between border-b border-gold-200 pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-burgundy-950">
                  Stock Adjustment: {adjustingItem.product_code}
                </h3>
                <p className="text-xs text-charcoal-500 mt-0.5">{adjustingItem.product_name}</p>
              </div>
              <button
                onClick={() => setAdjustingItem(null)}
                className="p-1 text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              {/* Stock Preview Calculation Box */}
              <div className="p-4 bg-ivory-50 border border-gold-300 rounded-sm flex items-center justify-around text-center">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-charcoal-500 font-semibold block">
                    Current Stock
                  </span>
                  <span className="font-mono text-lg font-bold text-charcoal-900">
                    {adjustingItem.quantity_on_hand}
                  </span>
                </div>

                <div className="text-gold-600 font-bold text-lg">&rarr;</div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-charcoal-500 font-semibold block">
                    Adjustment
                  </span>
                  <span
                    className={`font-mono text-lg font-bold ${
                      Number(quantityDelta) > 0
                        ? "text-emerald-700"
                        : Number(quantityDelta) < 0
                        ? "text-red-700"
                        : "text-charcoal-400"
                    }`}
                  >
                    {Number(quantityDelta) > 0 ? `+${quantityDelta}` : quantityDelta || "0"}
                  </span>
                </div>

                <div className="text-gold-600 font-bold text-lg">=</div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-charcoal-500 font-semibold block">
                    New Resulting Stock
                  </span>
                  <span
                    className={`font-mono text-lg font-bold ${
                      adjustingItem.quantity_on_hand + (Number(quantityDelta) || 0) < 0
                        ? "text-red-600 underline"
                        : "text-burgundy-950 font-black"
                    }`}
                  >
                    {adjustingItem.quantity_on_hand + (Number(quantityDelta) || 0)}
                  </span>
                </div>
              </div>

              {/* Movement Type & Delta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Movement Reason Type <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={movementType}
                    onChange={(e) => {
                      const t = e.target.value as MovementType;
                      setMovementType(t);
                      if (["DAMAGE", "SALE"].includes(t) && Number(quantityDelta) > 0) {
                        setQuantityDelta(`-${Math.abs(Number(quantityDelta))}`);
                      } else if (
                        ["PURCHASE", "PRODUCTION", "RETURN"].includes(t) &&
                        Number(quantityDelta) < 0
                      ) {
                        setQuantityDelta(`${Math.abs(Number(quantityDelta))}`);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-gold-300 rounded-sm focus:outline-none"
                  >
                    <option value="PURCHASE">Purchase / Direct Procurement (+)</option>
                    <option value="PRODUCTION">Production Loom Weave (+)</option>
                    <option value="RETURN">Customer / Trade Return (+)</option>
                    <option value="ADJUSTMENT">Physical Audit Count Adjustment (+/-)</option>
                    <option value="DAMAGE">Loom Defect / Water Damage (-)</option>
                    <option value="SALE">Direct Manual Sale (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Quantity Delta (Units) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={quantityDelta}
                    onChange={(e) => setQuantityDelta(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-gold-300 rounded-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Reference ID & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Reference ID (PO / Batch / Invoice)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PO-8801 or BATCH-01"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gold-300 rounded-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Warehouse Location
                  </label>
                  <input
                    type="text"
                    placeholder="Aisle 4 - Shelf C"
                    value={warehouseLocation}
                    onChange={(e) => setWarehouseLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gold-300 rounded-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Audit Notes / Reason
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain the reason for this inventory adjustment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gold-300 rounded-sm focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gold-200">
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="px-4 py-2 bg-white border border-gold-300 text-charcoal-700 text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-gold-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all disabled:opacity-60"
                >
                  {isSubmittingAdjust ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Commit Stock Adjustment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

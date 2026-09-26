"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getAdminProductInventory,
  getAdminInventoryMovements,
  adjustAdminInventory,
} from "@/lib/api";
import {
  AdminInventoryDetail,
  AdminInventoryMovement,
  MovementType,
} from "@/types";
import {
  Boxes,
  History,
  ArrowLeft,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Flame,
  X,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";

export default function AdminInventoryProductLedgerPage() {
  const params = useParams();
  const productId = params.id as string;

  const [detail, setDetail] = useState<AdminInventoryDetail | null>(null);
  const [movements, setMovements] = useState<AdminInventoryMovement[]>([]);
  const [totalMovements, setTotalMovements] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [movementType, setMovementType] = useState<MovementType>("PURCHASE");
  const [quantityDelta, setQuantityDelta] = useState<string>("10");
  const [referenceId, setReferenceId] = useState("");
  const [warehouseLocation, setWarehouseLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  const fetchLedger = useCallback(async () => {
    if (!productId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [invDetail, movs] = await Promise.all([
        getAdminProductInventory(productId),
        getAdminInventoryMovements(productId, { page, limit: 15 }),
      ]);
      setDetail(invDetail);
      setMovements(movs.items);
      setTotalMovements(movs.total);
      setTotalPages(movs.total_pages);
      setWarehouseLocation(invDetail.inventory.warehouse_location || "");
    } catch (err: any) {
      console.error("Ledger query error:", err);
      setError(err?.message || "Failed to load inventory movement history.");
    } finally {
      setIsLoading(false);
    }
  }, [productId, page]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;

    const delta = Number(quantityDelta);
    if (isNaN(delta) || delta === 0) {
      setError("Please enter a non-zero integer delta.");
      return;
    }

    if (detail.inventory.quantity_on_hand + delta < 0) {
      setError(
        `Adjustment would result in negative stock (${detail.inventory.quantity_on_hand + delta}). Operation blocked.`
      );
      return;
    }

    setIsSubmittingAdjust(true);
    setError(null);
    try {
      await adjustAdminInventory(productId, {
        movement_type: movementType,
        quantity_delta: delta,
        reference_id: referenceId.trim() || undefined,
        warehouse_location: warehouseLocation.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setActionMessage(`Stock adjustment recorded (${delta > 0 ? "+" : ""}${delta} units).`);
      setShowAdjustModal(false);
      fetchLedger();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      console.error("Adjustment failure:", err);
      setError(err?.message || "Failed to commit stock adjustment.");
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  if (isLoading && !detail) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-burgundy-900 animate-spin" />
        <span className="text-xs font-mono text-charcoal-500">Querying stock audit ledger...</span>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-8 text-center bg-white border border-gold-300 rounded-sm">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
        <h2 className="font-serif text-lg font-bold text-burgundy-950">Product Inventory Not Found</h2>
        <Link href="/admin/inventory" className="text-xs text-burgundy-900 font-semibold underline mt-3 inline-block">
          &larr; Back to Inventory
        </Link>
      </div>
    );
  }

  const inv = detail.inventory;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/admin/inventory"
            className="text-xs text-burgundy-900 font-semibold hover:underline inline-flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Finished Inventory</span>
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
            Movement Audit Ledger: {inv.product_code}
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            {inv.product_name} &bull; <span className="font-mono">{inv.category_name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLedger}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gold-300 hover:bg-gold-50 text-charcoal-700 text-xs font-medium rounded-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gold-600" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setShowAdjustModal(true);
              setMovementType("PURCHASE");
              setQuantityDelta("10");
              setReferenceId("");
              setNotes("");
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adjust Stock</span>
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

      {/* Product & Stock Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gold-300 rounded-sm">
          <span className="text-[11px] uppercase tracking-wider text-charcoal-500 font-semibold block">
            Quantity On Hand
          </span>
          <span className="font-serif text-2xl font-bold text-burgundy-950">
            {inv.quantity_on_hand} pcs
          </span>
        </div>

        <div className="p-4 bg-white border border-gold-300 rounded-sm">
          <span className="text-[11px] uppercase tracking-wider text-charcoal-500 font-semibold block">
            Available for Dispatch
          </span>
          <span className="font-serif text-2xl font-bold text-emerald-800">
            {inv.quantity_available} pcs
          </span>
        </div>

        <div className="p-4 bg-white border border-gold-300 rounded-sm">
          <span className="text-[11px] uppercase tracking-wider text-charcoal-500 font-semibold block">
            Reorder Threshold
          </span>
          <span className="font-serif text-2xl font-bold text-charcoal-800">
            {inv.reorder_threshold} pcs
          </span>
        </div>

        <div className="p-4 bg-white border border-gold-300 rounded-sm">
          <span className="text-[11px] uppercase tracking-wider text-charcoal-500 font-semibold block">
            Warehouse Location
          </span>
          <span className="font-mono text-sm font-bold text-charcoal-900 block mt-1">
            {inv.warehouse_location || "Central Godown"}
          </span>
        </div>
      </div>

      {/* Movement Ledger Table */}
      <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gold-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-gold-600" />
            <h2 className="font-serif text-sm font-bold text-burgundy-950">
              Chronological Audit Trail ({totalMovements} Records)
            </h2>
          </div>
          <span className="text-[11px] text-charcoal-400 font-mono">Immutable Append-Only Ledger</span>
        </div>

        {movements.length === 0 ? (
          <div className="py-12 text-center text-charcoal-400 text-xs">
            No stock movements recorded for this saree model yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-charcoal-700">
              <thead className="bg-ivory-50 text-[10px] uppercase tracking-wider text-charcoal-500 border-b border-gold-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Timestamp (UTC)</th>
                  <th className="px-4 py-3 font-semibold">Movement Type</th>
                  <th className="px-4 py-3 font-semibold text-center">Delta</th>
                  <th className="px-4 py-3 font-semibold">Staff Operator</th>
                  <th className="px-4 py-3 font-semibold">Reference ID</th>
                  <th className="px-4 py-3 font-semibold">Audit Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-200/60 font-sans">
                {movements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-ivory-50/70 transition-colors">
                    {/* Timestamp */}
                    <td className="px-4 py-3 text-charcoal-600 font-mono text-[11px] whitespace-nowrap">
                      {new Date(mov.created_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    {/* Movement Type */}
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          mov.movement_type === "PRODUCTION"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : mov.movement_type === "PURCHASE"
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            : mov.movement_type === "RETURN"
                            ? "bg-blue-100 text-blue-900 border border-blue-300"
                            : mov.movement_type === "DAMAGE"
                            ? "bg-red-100 text-red-900 border border-red-300"
                            : mov.movement_type === "SALE"
                            ? "bg-purple-100 text-purple-900 border border-purple-300"
                            : "bg-gray-100 text-gray-800 border border-gray-300"
                        }`}
                      >
                        {mov.movement_type}
                      </span>
                    </td>

                    {/* Delta */}
                    <td className="px-4 py-3 text-center font-mono font-bold">
                      <span
                        className={
                          mov.quantity_delta > 0
                            ? "text-emerald-700 font-black"
                            : "text-red-700 font-black"
                        }
                      >
                        {mov.quantity_delta > 0 ? `+${mov.quantity_delta}` : mov.quantity_delta} pcs
                      </span>
                    </td>

                    {/* Staff */}
                    <td className="px-4 py-3 text-charcoal-800 font-medium flex items-center gap-1.5">
                      <User className="w-3 h-3 text-gold-600 shrink-0" />
                      <span>{mov.performed_by_name || "PVS System Staff"}</span>
                    </td>

                    {/* Reference ID */}
                    <td className="px-4 py-3 font-mono text-charcoal-700 text-[11px]">
                      {mov.reference_id || "-"}
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-3 text-charcoal-600 text-[11px] max-w-sm truncate">
                      {mov.notes || "-"}
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
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gold-300 rounded-sm text-charcoal-700 disabled:opacity-40 hover:bg-gold-50"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gold-300 rounded-sm text-charcoal-700 disabled:opacity-40 hover:bg-gold-50"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Adjust Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gold-400 rounded-sm shadow-2xl max-w-lg w-full p-6 space-y-5 animate-fade-in-subtle">
            <div className="flex items-center justify-between border-b border-gold-200 pb-3">
              <h3 className="font-serif text-base font-bold text-burgundy-950">
                Record Stock Movement
              </h3>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="p-1 text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div className="p-4 bg-ivory-50 border border-gold-300 rounded-sm flex items-center justify-around text-center">
                <div>
                  <span className="text-[10px] uppercase text-charcoal-500 font-semibold block">
                    Current Stock
                  </span>
                  <span className="font-mono text-lg font-bold text-charcoal-900">
                    {inv.quantity_on_hand}
                  </span>
                </div>
                <div className="text-gold-600 font-bold text-lg">&rarr;</div>
                <div>
                  <span className="text-[10px] uppercase text-charcoal-500 font-semibold block">
                    Delta
                  </span>
                  <span
                    className={`font-mono text-lg font-bold ${
                      Number(quantityDelta) > 0 ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {Number(quantityDelta) > 0 ? `+${quantityDelta}` : quantityDelta}
                  </span>
                </div>
                <div className="text-gold-600 font-bold text-lg">=</div>
                <div>
                  <span className="text-[10px] uppercase text-charcoal-500 font-semibold block">
                    New Stock
                  </span>
                  <span className="font-mono text-lg font-black text-burgundy-950">
                    {inv.quantity_on_hand + (Number(quantityDelta) || 0)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Movement Type
                  </label>
                  <select
                    value={movementType}
                    onChange={(e) => {
                      const t = e.target.value as MovementType;
                      setMovementType(t);
                      if (["DAMAGE", "SALE"].includes(t) && Number(quantityDelta) > 0) {
                        setQuantityDelta(`-${Math.abs(Number(quantityDelta))}`);
                      } else if (["PURCHASE", "PRODUCTION", "RETURN"].includes(t) && Number(quantityDelta) < 0) {
                        setQuantityDelta(`${Math.abs(Number(quantityDelta))}`);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-gold-300 rounded-sm focus:outline-none"
                  >
                    <option value="PURCHASE">Purchase (+)</option>
                    <option value="PRODUCTION">Production Weave (+)</option>
                    <option value="RETURN">Return (+)</option>
                    <option value="ADJUSTMENT">Audit Adjustment (+/-)</option>
                    <option value="DAMAGE">Damage (-)</option>
                    <option value="SALE">Direct Sale (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Quantity Delta
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Reference ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PO-8801"
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
                    value={warehouseLocation}
                    onChange={(e) => setWarehouseLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gold-300 rounded-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Audit Notes / Reason
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gold-300 rounded-sm focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gold-200">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 bg-white border border-gold-300 text-charcoal-700 text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-gold-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all disabled:opacity-60"
                >
                  {isSubmittingAdjust ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Commit Adjustment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

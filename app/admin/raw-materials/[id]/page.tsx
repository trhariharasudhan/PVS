"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAdminRawMaterial,
  updateAdminRawMaterial,
  adjustAdminRawMaterialStock,
} from "@/lib/api/admin";
import {
  AdminRawMaterialDetail,
  RawMaterialMovementType,
} from "@/types";
import {
  Scissors,
  ArrowLeft,
  RefreshCw,
  Sliders,
  Boxes,
  Clock,
  User as UserIcon,
  AlertTriangle,
  Flame,
  CheckCircle,
  Loader2,
  FileText,
  MapPin,
  Building2,
  X,
} from "lucide-react";

export default function AdminRawMaterialDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [material, setMaterial] = useState<AdminRawMaterialDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustDelta, setAdjustDelta] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<RawMaterialMovementType>("ADJUSTMENT");
  const [adjustRef, setAdjustRef] = useState<string>("");
  const [adjustNotes, setAdjustNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminRawMaterial(id);
      setMaterial(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load raw material details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustDelta === 0) {
      setModalError("Delta adjustment cannot be zero.");
      return;
    }
    setIsSubmitting(true);
    setModalError(null);
    try {
      await adjustAdminRawMaterialStock(id, {
        movement_type: adjustType,
        quantity_delta: Number(adjustDelta),
        reference_id: adjustRef.trim() || undefined,
        notes: adjustNotes.trim() || undefined,
      });
      setIsAdjustModalOpen(false);
      fetchDetail();
    } catch (err: any) {
      setModalError(err?.message || "Failed to adjust raw material stock.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-burgundy-900 animate-spin" />
        <p className="text-xs font-semibold text-charcoal-500 font-mono">
          Querying Raw Material Audit Ledger...
        </p>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-sm text-center">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
        <p className="text-sm font-semibold text-red-900 mb-4">{error || "Material not found"}</p>
        <Link
          href="/admin/raw-materials"
          className="inline-flex items-center gap-2 px-4 py-2 bg-burgundy-900 text-gold-200 text-xs font-semibold rounded-sm uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Raw Materials</span>
        </Link>
      </div>
    );
  }

  const movementTypeColors: Record<string, string> = {
    PURCHASE_RECEIPT: "bg-emerald-100 text-emerald-900 border-emerald-300",
    PRODUCTION_CONSUMPTION: "bg-amber-100 text-amber-900 border-amber-300",
    ADJUSTMENT: "bg-blue-100 text-blue-900 border-blue-300",
    WASTAGE_DAMAGE: "bg-red-100 text-red-900 border-red-300",
    RETURN_TO_SUPPLIER: "bg-purple-100 text-purple-900 border-purple-300",
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/admin/raw-materials"
            className="inline-flex items-center gap-1.5 text-xs text-burgundy-900 font-semibold hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Raw Materials</span>
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950 flex items-center gap-2.5">
            <span className="font-mono bg-gold-100 px-2 py-0.5 rounded text-lg text-burgundy-950 border border-gold-300">
              {material.material_code}
            </span>
            <span>{material.name}</span>
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Category: <strong className="text-charcoal-800">{material.material_type}</strong> | UOM:{" "}
            <strong className="text-charcoal-800">{material.unit_of_measure}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setAdjustDelta(0);
              setAdjustType("ADJUSTMENT");
              setAdjustRef("");
              setAdjustNotes("");
              setModalError(null);
              setIsAdjustModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm transition-all"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Adjust Stock</span>
          </button>
          <button
            onClick={fetchDetail}
            className="p-2 border border-gold-300 rounded-sm hover:bg-gold-50 text-charcoal-600"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stock Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* On-Hand */}
        <div className="p-4 bg-white border border-gold-300/80 rounded-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500 block">
            Quantity On-Hand
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-burgundy-950">
              {Number(material.stock.quantity_on_hand).toFixed(2)}
            </span>
            <span className="text-xs text-charcoal-500 font-mono">{material.unit_of_measure}</span>
          </div>
          <span className="text-[10px] text-charcoal-400 block mt-1">
            Location: {material.stock.warehouse_location || "Standard Bay"}
          </span>
        </div>

        {/* Reserved & Available */}
        <div className="p-4 bg-white border border-gold-300/80 rounded-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500 block">
            Available for Looms
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-emerald-800">
              {Number(material.stock.quantity_available).toFixed(2)}
            </span>
            <span className="text-xs text-charcoal-500 font-mono">{material.unit_of_measure}</span>
          </div>
          <span className="text-[10px] text-charcoal-400 block mt-1">
            Reserved: {Number(material.stock.quantity_reserved).toFixed(2)}
          </span>
        </div>

        {/* Reorder Level */}
        <div className="p-4 bg-white border border-gold-300/80 rounded-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500 block">
            Reorder Threshold
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-charcoal-800">
              {Number(material.reorder_level).toFixed(2)}
            </span>
            <span className="text-xs text-charcoal-500 font-mono">{material.unit_of_measure}</span>
          </div>
          <div className="mt-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                material.stock.stock_status === "IN_STOCK"
                  ? "bg-emerald-100 text-emerald-800"
                  : material.stock.stock_status === "LOW_STOCK"
                  ? "bg-amber-100 text-amber-900 ring-1 ring-amber-400"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {material.stock.stock_status.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Supplier & Cost */}
        <div className="p-4 bg-white border border-gold-300/80 rounded-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500 block">
            Supplier & Cost Rate
          </span>
          <div className="mt-2">
            <span className="font-serif text-lg font-bold text-burgundy-950 block truncate">
              {material.supplier_name || "Unassigned"}
            </span>
            <span className="text-xs font-mono text-charcoal-700 block mt-0.5">
              {material.unit_cost ? `₹${Number(material.unit_cost).toLocaleString("en-IN")} / ${material.unit_of_measure}` : "Rate not set"}
            </span>
          </div>
        </div>
      </div>

      {/* Immutable Stock Movement History */}
      <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gold-200 flex items-center justify-between">
          <h2 className="font-serif text-base font-bold text-burgundy-950 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gold-600" />
            <span>Immutable Movement Audit Ledger</span>
          </h2>
          <span className="text-[11px] text-charcoal-500 font-mono">
            {material.recent_movements.length} logged transactions
          </span>
        </div>

        {material.recent_movements.length === 0 ? (
          <div className="p-8 text-center text-xs text-charcoal-500">
            No movement ledger entries recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-ivory-100 border-b border-gold-200 text-charcoal-600 uppercase tracking-wider text-[10px] font-mono">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4 text-right">Quantity Delta</th>
                  <th className="py-3 px-4">Reference Code</th>
                  <th className="py-3 px-4">Operator / Staff</th>
                  <th className="py-3 px-4">Notes & Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {material.recent_movements.map((mov) => {
                  const isPositive = Number(mov.quantity_delta) > 0;
                  return (
                    <tr key={mov.id} className="hover:bg-ivory-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-charcoal-500">
                        {new Date(mov.created_at).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            movementTypeColors[mov.movement_type] || "bg-charcoal-100 text-charcoal-700"
                          }`}
                        >
                          {mov.movement_type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span
                          className={
                            isPositive
                              ? "text-emerald-700"
                              : "text-amber-700"
                          }
                        >
                          {isPositive ? "+" : ""}
                          {Number(mov.quantity_delta).toFixed(2)} {material.unit_of_measure}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-charcoal-800">
                        {mov.reference_id || "—"}
                      </td>
                      <td className="py-3 px-4 text-charcoal-700">
                        {mov.performed_by_name || "System Automated"}
                      </td>
                      <td className="py-3 px-4 text-charcoal-600 italic">
                        {mov.notes || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-gold-300 rounded-sm w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gold-200 pb-3">
              <h2 className="font-serif text-base font-bold text-burgundy-950">
                Stock Adjustment ({material.material_code})
              </h2>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-charcoal-400 hover:text-charcoal-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-xs text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Movement Type *
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as RawMaterialMovementType)}
                  className="w-full p-2 border border-charcoal-200 rounded-sm bg-white focus:border-burgundy-900 focus:outline-none"
                >
                  <option value="ADJUSTMENT">Physical Audit Correction (ADJUSTMENT)</option>
                  <option value="WASTAGE_DAMAGE">Damaged / Wastage Write-off (WASTAGE_DAMAGE)</option>
                  <option value="RETURN_TO_SUPPLIER">Return to Vendor (RETURN_TO_SUPPLIER)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Quantity Delta (+ or -) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. +10.0 or -2.5"
                  value={adjustDelta || ""}
                  onChange={(e) => setAdjustDelta(Number(e.target.value))}
                  className="w-full p-2 border border-charcoal-200 rounded-sm font-mono text-sm focus:border-burgundy-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Reference Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. AUDIT-2026-08"
                  value={adjustRef}
                  onChange={(e) => setAdjustRef(e.target.value)}
                  className="w-full p-2 border border-charcoal-200 rounded-sm font-mono focus:border-burgundy-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Reason for adjustment..."
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full p-2 border border-charcoal-200 rounded-sm focus:border-burgundy-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gold-200">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 border border-charcoal-300 rounded-sm font-semibold text-charcoal-700 hover:bg-charcoal-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 font-semibold uppercase tracking-wider rounded-sm disabled:opacity-50"
                >
                  {isSubmitting ? "Executing..." : "Commit Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

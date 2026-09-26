"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAdminProducts, createAdminProductionBatch } from "@/lib/api";
import { AdminProductList } from "@/types";
import {
  Factory,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Calendar,
} from "lucide-react";

export default function NewProductionBatchPage() {
  const router = useRouter();

  const [products, setProducts] = useState<AdminProductList[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [batchNumber, setBatchNumber] = useState("");
  const [productId, setProductId] = useState("");
  const [loomIdentifier, setLoomIdentifier] = useState("Master Loom 01");
  const [plannedQuantity, setPlannedQuantity] = useState(15);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await getAdminProducts({ limit: 100, is_active: true });
        setProducts(res.items);
        if (res.items.length > 0) {
          setProductId(res.items[0].id);
        }
      } catch (err) {
        console.error("Failed to load products for batch creation:", err);
      } finally {
        setIsLoadingProducts(false);
      }
    }
    loadProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchNumber.trim() || !productId) {
      setError("Batch Number and Target Saree Product are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await createAdminProductionBatch({
        batch_number: batchNumber.trim().toUpperCase(),
        product_id: productId,
        loom_identifier: loomIdentifier.trim() || undefined,
        planned_quantity: Number(plannedQuantity),
        start_date: startDate || undefined,
        estimated_completion_date: estimatedCompletionDate || undefined,
      });

      router.push("/admin/production");
    } catch (err: any) {
      console.error("Batch creation failure:", err);
      setError(err?.message || "Failed to provision production batch.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/admin/production"
          className="text-xs text-burgundy-900 font-semibold hover:underline inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Master Loom Production</span>
        </Link>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
          Schedule New Weaving Batch
        </h1>
        <p className="text-xs text-charcoal-500 mt-1">
          Provision a dedicated loom weaving run and initialize configurable quality inspection checkpoints.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-sm text-xs text-red-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Batch Details Card */}
        <div className="p-6 bg-white border border-gold-300/80 rounded-sm shadow-sm space-y-5">
          <h2 className="font-serif text-base font-bold text-burgundy-950 flex items-center gap-2 border-b border-gold-200 pb-3">
            <Factory className="w-4 h-4 text-amber-700" />
            <span>Loom Allocation & SKU Assignment</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Batch Number */}
            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                Batch Identifier Number <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. PVS-BATCH-105"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-ivory-50/60 border border-gold-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 uppercase text-charcoal-900"
              />
              <p className="text-[10px] text-charcoal-400 mt-1">
                Unique production run code for loom tracking.
              </p>
            </div>

            {/* Loom Identifier */}
            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                Loom Identifier / Master Weaver Station
              </label>
              <input
                type="text"
                placeholder="e.g. Master Jacquard Loom 04"
                value={loomIdentifier}
                onChange={(e) => setLoomIdentifier(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Target Saree Product */}
            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                Target Saree Model <span className="text-red-600">*</span>
              </label>
              {isLoadingProducts ? (
                <div className="py-2 text-xs text-charcoal-400 font-mono flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-burgundy-900" />
                  <span>Loading active saree catalogue...</span>
                </div>
              ) : (
                <select
                  required
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name} — {p.category_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Planned Quantity */}
            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                Planned Saree Quantity (Pieces) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                required
                value={plannedQuantity}
                onChange={(e) => setPlannedQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-ivory-50/60 border border-gold-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                Weaving Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900 font-mono"
              />
            </div>

            {/* Estimated Completion Date */}
            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                Estimated Completion Date
              </label>
              <input
                type="date"
                value={estimatedCompletionDate}
                onChange={(e) => setEstimatedCompletionDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Quality Stages Template Preview Card */}
        <div className="p-6 bg-white border border-gold-300/80 rounded-sm shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gold-200 pb-3">
            <h2 className="font-serif text-base font-bold text-burgundy-950 flex items-center gap-2">
              <Layers className="w-4 h-4 text-burgundy-800" />
              <span>Configurable Quality Checkpoints Timeline</span>
            </h2>
            <span className="text-[11px] text-charcoal-500 font-mono">5 Checkpoints</span>
          </div>

          <p className="text-xs text-charcoal-500 leading-relaxed">
            The batch will automatically initialize with the standard 5 quality inspection checkpoints. Each checkpoint can be individually updated as the master weaver progresses.
          </p>

          <ol className="space-y-2.5 text-xs text-charcoal-700">
            <li className="p-2.5 bg-ivory-50 border border-gold-200 rounded flex items-center justify-between">
              <span><strong>1.</strong> Raw Mulberry Silk & Pure Zari Testing</span>
              <span className="text-[10px] text-charcoal-500 font-mono">Material QC</span>
            </li>
            <li className="p-2.5 bg-ivory-50 border border-gold-200 rounded flex items-center justify-between">
              <span><strong>2.</strong> Jacquard Loom Card Punching & Setting</span>
              <span className="text-[10px] text-charcoal-500 font-mono">Design Calibration</span>
            </li>
            <li className="p-2.5 bg-ivory-50 border border-gold-200 rounded flex items-center justify-between">
              <span><strong>3.</strong> Warp Preparation & Bobbin Sizing</span>
              <span className="text-[10px] text-charcoal-500 font-mono">Loom Preparation</span>
            </li>
            <li className="p-2.5 bg-ivory-50 border border-gold-200 rounded flex items-center justify-between">
              <span><strong>4.</strong> Master Loom Interlocking Weave (Korvai)</span>
              <span className="text-[10px] text-charcoal-500 font-mono">Handloom Weaving</span>
            </li>
            <li className="p-2.5 bg-ivory-50 border border-gold-200 rounded flex items-center justify-between">
              <span><strong>5.</strong> Quality Control & Traditional Edge Finishing</span>
              <span className="text-[10px] text-charcoal-500 font-mono">Final Hand QC</span>
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/production"
            className="px-5 py-2.5 bg-white border border-gold-300 text-charcoal-700 text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-gold-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm transition-all disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Schedule Weaving Batch</span>
          </button>
        </div>
      </form>
    </div>
  );
}

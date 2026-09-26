"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getAdminProductionBatches } from "@/lib/api";
import { AdminProductionBatchList, BatchStatus } from "@/types";
import {
  Factory,
  Search,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  ArrowRight,
  Calendar,
  Layers,
} from "lucide-react";

export default function AdminProductionPage() {
  const [batches, setBatches] = useState<AdminProductionBatchList[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminProductionBatches({
        page,
        limit: 15,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      });
      setBatches(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      console.error("Failed to load production batches:", err);
      setError(err?.message || "Failed to load production batches.");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const activeBatchesCount = batches.filter(
    (b) => !["COMPLETED", "ABORTED"].includes(b.status)
  ).length;
  const inProgressCount = batches.filter((b) =>
    ["WARPING", "WEAVING_IN_PROGRESS", "FINISHING", "QUALITY_CHECK"].includes(b.status)
  ).length;
  const completedCount = batches.filter((b) => b.status === "COMPLETED").length;
  const totalPlannedSarees = batches.reduce((acc, b) => acc + b.planned_quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
            Master Loom Production Desk
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Track saree weaving runs, quality checkpoints, and seamless stock ledger integration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBatches}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gold-300 hover:bg-gold-50 text-charcoal-700 text-xs font-medium rounded-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gold-600" />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/production/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Schedule New Batch</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-sm text-xs text-red-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gold-300/80 rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-charcoal-500 font-semibold block">
              Active Batches
            </span>
            <span className="font-serif text-2xl font-bold text-burgundy-950">
              {activeBatchesCount}
            </span>
          </div>
          <Factory className="w-5 h-5 text-amber-700" />
        </div>

        <div className="p-4 bg-white border border-gold-300/80 rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-charcoal-500 font-semibold block">
              Batches on Looms
            </span>
            <span className="font-serif text-2xl font-bold text-amber-700">
              {inProgressCount}
            </span>
          </div>
          <Clock className="w-5 h-5 text-amber-600" />
        </div>

        <div className="p-4 bg-white border border-gold-300/80 rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-charcoal-500 font-semibold block">
              Completed Batches
            </span>
            <span className="font-serif text-2xl font-bold text-emerald-800">
              {completedCount}
            </span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>

        <div className="p-4 bg-white border border-gold-300/80 rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-charcoal-500 font-semibold block">
              Planned Sarees
            </span>
            <span className="font-serif text-2xl font-bold text-charcoal-900">
              {totalPlannedSarees} pcs
            </span>
          </div>
          <Layers className="w-5 h-5 text-burgundy-900" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-gold-300/80 rounded-sm shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Batch number, Loom identifier, Saree name, SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900"
            >
              <option value="">All Batch Statuses</option>
              <option value="PLANNED">Planned (Loom Setup)</option>
              <option value="WARPING">Warping & Bobbin Sizing</option>
              <option value="WEAVING_IN_PROGRESS">Weaving in Progress</option>
              <option value="FINISHING">Finishing & Edge Cutting</option>
              <option value="QUALITY_CHECK">Final Quality Inspection</option>
              <option value="COMPLETED">Completed (Stock Credited)</option>
              <option value="ABORTED">Aborted / Canceled</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gold-200/60 text-xs text-charcoal-500">
          <span>
            Showing <strong>{batches.length}</strong> of <strong>{total}</strong> production batches
          </span>
          {(search || statusFilter) && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setPage(1);
              }}
              className="text-xs text-burgundy-900 font-semibold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Production Batches Table */}
      <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-7 h-7 text-burgundy-900 animate-spin" />
            <span className="text-xs font-mono text-charcoal-500">Loading production batches...</span>
          </div>
        ) : batches.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Factory className="w-10 h-10 text-gold-400 mx-auto" />
            <h3 className="font-serif text-base font-bold text-burgundy-950">
              No Production Batches Found
            </h3>
            <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
              No batches match the current filter or search criteria.
            </p>
            <Link
              href="/admin/production/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-burgundy-900 text-gold-200 rounded text-xs font-semibold uppercase tracking-wider"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Schedule First Batch</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-charcoal-700">
              <thead className="bg-ivory-50 text-[10px] uppercase tracking-wider text-charcoal-500 border-b border-gold-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Batch ID</th>
                  <th className="px-4 py-3 font-semibold">Loom</th>
                  <th className="px-4 py-3 font-semibold">Target Saree Model</th>
                  <th className="px-4 py-3 font-semibold text-center">Planned Qty</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Stage Progress</th>
                  <th className="px-4 py-3 font-semibold">Due Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-200/60">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-ivory-50/70 transition-colors">
                    {/* Batch Number */}
                    <td className="px-4 py-3.5 font-mono font-bold text-charcoal-900">
                      {b.batch_number}
                    </td>

                    {/* Loom */}
                    <td className="px-4 py-3.5 text-charcoal-700 font-medium">
                      {b.loom_identifier || "General Loom"}
                    </td>

                    {/* Product */}
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-charcoal-900 max-w-xs truncate">
                        {b.product_name}
                      </div>
                      <div className="text-[10px] text-charcoal-500 font-mono">
                        {b.product_code} &bull; {b.category_name}
                      </div>
                    </td>

                    {/* Planned Qty */}
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-charcoal-900">
                      {b.status === "COMPLETED" ? (
                        <span className="text-emerald-800">
                          {b.completed_quantity} / {b.planned_quantity} pcs
                        </span>
                      ) : (
                        <span>{b.planned_quantity} pcs</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            : b.status === "ABORTED"
                            ? "bg-red-100 text-red-900 border border-red-300"
                            : b.status === "PLANNED"
                            ? "bg-gray-100 text-gray-800 border border-gray-300"
                            : "bg-amber-100 text-amber-900 border border-amber-300"
                        }`}
                      >
                        {b.status.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Progress Bar & Current Stage */}
                    <td className="px-4 py-3.5 min-w-[140px]">
                      <div className="flex items-center justify-between text-[10px] text-charcoal-600 mb-1">
                        <span className="truncate max-w-[100px]">{b.current_stage_name || "Checkpoints"}</span>
                        <span className="font-mono font-bold">{b.progress_percent}%</span>
                      </div>
                      <div className="w-full bg-gold-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            b.status === "COMPLETED"
                              ? "bg-emerald-600"
                              : "bg-amber-600"
                          }`}
                          style={{ width: `${b.progress_percent}%` }}
                        />
                      </div>
                    </td>

                    {/* Estimated Completion Date */}
                    <td className="px-4 py-3.5 text-charcoal-600 font-mono text-[11px] whitespace-nowrap">
                      {b.estimated_completion_date || "-"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/production/${b.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 rounded text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        <span>Manage Loom</span>
                        <ArrowRight className="w-3 h-3" />
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
    </div>
  );
}

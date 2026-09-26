"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getAdminDashboardMetrics } from "@/lib/api";
import { AdminDashboardMetrics } from "@/types";
import {
  Package,
  Layers,
  Sparkles,
  AlertTriangle,
  Store,
  Boxes,
  Factory,
  ArrowRight,
  PlusCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Flame,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminDashboardMetrics();
      setMetrics(data);
    } catch (err: any) {
      console.error("Dashboard metrics error:", err);
      setError(err?.message || "Failed to load live dashboard metrics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-burgundy-900 animate-spin" />
        <p className="text-xs font-semibold text-charcoal-600 font-mono">
          Querying Database Telemetry...
        </p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-sm text-center">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
        <p className="text-sm font-semibold text-red-900 mb-4">{error || "Data unavailable"}</p>
        <button
          onClick={fetchMetrics}
          className="inline-flex items-center gap-2 px-4 py-2 bg-burgundy-900 text-gold-200 text-xs font-semibold rounded-sm uppercase tracking-wider"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Query</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
            Factory & Operations Control Desk
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Live database telemetry across finished saree inventory, master looms, and trade channels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMetrics}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gold-300 hover:bg-gold-50 text-charcoal-700 text-xs font-medium rounded-sm transition-colors"
            title="Refresh database counters"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gold-600" />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/production/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-800 hover:bg-amber-900 text-gold-100 text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm transition-all"
          >
            <Factory className="w-3.5 h-3.5" />
            <span>Schedule Loom</span>
          </Link>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Saree SKU</span>
          </Link>
        </div>
      </div>

      {/* Primary Operations KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Warehouse Inventory Stock Units */}
        <div className="p-5 bg-white border border-gold-300/80 rounded-sm shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
              Warehouse Finished Stock
            </span>
            <Boxes className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-burgundy-950">
              {metrics.total_inventory_units}
            </span>
            <span className="text-[11px] text-charcoal-500 font-mono">units on hand</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gold-200 text-[11px] text-charcoal-600 flex items-center justify-between">
            <span className="flex items-center gap-1">
              {metrics.low_stock_products > 0 ? (
                <span className="text-amber-700 font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-600" />
                  <span>{metrics.low_stock_products} Low Stock Alert(s)</span>
                </span>
              ) : (
                <span>{metrics.in_stock_products} SKUs in optimal stock</span>
              )}
            </span>
            <Link
              href="/admin/inventory"
              className="text-burgundy-900 font-semibold hover:underline inline-flex items-center gap-0.5"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Master Loom Production Batches */}
        <div className="p-5 bg-white border border-gold-300/80 rounded-sm shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
              Master Loom Weaving
            </span>
            <Factory className="w-4 h-4 text-amber-700" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-burgundy-950">
              {metrics.active_production_batches}
            </span>
            <span className="text-[11px] text-charcoal-500 font-mono">active batches</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gold-200 text-[11px] text-charcoal-600 flex items-center justify-between">
            <span>{metrics.in_progress_production_batches} batches on looms</span>
            <Link
              href="/admin/production"
              className="text-burgundy-900 font-semibold hover:underline inline-flex items-center gap-0.5"
            >
              <span>Track</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Saree Catalogue Models */}
        <div className="p-5 bg-white border border-gold-300/80 rounded-sm shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
              Published Saree SKUs
            </span>
            <Package className="w-4 h-4 text-burgundy-900" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-burgundy-950">
              {metrics.total_active_products}
            </span>
            <span className="text-[11px] text-charcoal-500 font-mono">
              ({metrics.total_inactive_products} archived)
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-gold-200 text-[11px] text-charcoal-600 flex items-center justify-between">
            <span>{metrics.total_featured_products} Featured in Spotlight</span>
            <Link
              href="/admin/products"
              className="text-burgundy-900 font-semibold hover:underline inline-flex items-center gap-0.5"
            >
              <span>Catalogue</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Secondary Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Orders */}
        <div className="p-4 bg-white border border-gold-300/80 rounded-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500 block">
              Pending Orders
            </span>
            <span className="font-serif text-2xl font-bold text-burgundy-950">
              {metrics.pending_orders}
            </span>
            <span className="text-[10px] text-charcoal-400 font-mono block mt-0.5">
              ({metrics.confirmed_orders} confirmed)
            </span>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs text-burgundy-900 font-semibold hover:underline"
          >
            Orders &rarr;
          </Link>
        </div>

        {/* Trade Leads CRM */}
        <div className="p-4 bg-white border border-gold-300/80 rounded-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500 block">
              Wholesale Enquiries
            </span>
            <span className="font-serif text-2xl font-bold text-burgundy-950">
              {metrics.new_wholesale_enquiries}
            </span>
            <span className="text-[10px] text-charcoal-400 font-mono block mt-0.5">
              ({metrics.active_crm_negotiations} negotiating)
            </span>
          </div>
          <Link
            href="/admin/wholesale"
            className="text-xs text-burgundy-900 font-semibold hover:underline"
          >
            Pipeline &rarr;
          </Link>
        </div>

        {/* Weave Categories */}
        <div className="p-4 bg-white border border-gold-300/80 rounded-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500 block">
              Weave Categories
            </span>
            <span className="font-serif text-2xl font-bold text-burgundy-950">
              {metrics.total_categories}
            </span>
          </div>
          <Link
            href="/admin/categories"
            className="text-xs text-burgundy-900 font-semibold hover:underline"
          >
            Organize &rarr;
          </Link>
        </div>

        {/* Completed Batches */}
        <div className="p-4 bg-white border border-gold-300/80 rounded-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500 block">
              Completed Batches
            </span>
            <span className="font-serif text-2xl font-bold text-emerald-800">
              {metrics.completed_production_batches}
            </span>
          </div>
          <Link
            href="/admin/production?status=COMPLETED"
            className="text-xs text-emerald-800 font-semibold hover:underline"
          >
            Ledger &rarr;
          </Link>
        </div>
      </div>

      {/* Procurement, Raw Materials & Payments Telemetry (Phase 4C-C) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Raw Materials Inventory */}
        <div className="p-4 bg-white border border-gold-300/80 rounded-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500 block">
              Raw Materials
            </span>
            <span className="font-serif text-2xl font-bold text-burgundy-950">
              {metrics.total_raw_materials ?? 0}
            </span>
            <span className="text-[10px] text-amber-700 font-mono block mt-0.5 font-bold">
              {(metrics.low_stock_raw_materials ?? 0) > 0 ? `${metrics.low_stock_raw_materials} low stock` : "Stock optimal"}
            </span>
          </div>
          <Link
            href="/admin/raw-materials"
            className="text-xs text-burgundy-900 font-semibold hover:underline"
          >
            Materials &rarr;
          </Link>
        </div>

        {/* Verified Suppliers */}
        <div className="p-4 bg-white border border-gold-300/80 rounded-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500 block">
              Verified Suppliers
            </span>
            <span className="font-serif text-2xl font-bold text-burgundy-950">
              {metrics.total_suppliers ?? 0}
            </span>
            <span className="text-[10px] text-charcoal-400 font-mono block mt-0.5">
              Yarn mills & Zari guilds
            </span>
          </div>
          <Link
            href="/admin/suppliers"
            className="text-xs text-burgundy-900 font-semibold hover:underline"
          >
            Suppliers &rarr;
          </Link>
        </div>

        {/* Purchase Orders */}
        <div className="p-4 bg-white border border-gold-300/80 rounded-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500 block">
              Pending POs
            </span>
            <span className="font-serif text-2xl font-bold text-burgundy-950">
              {metrics.pending_purchase_orders ?? 0}
            </span>
            <span className="text-[10px] text-charcoal-400 font-mono block mt-0.5">
              Receiving & drafts
            </span>
          </div>
          <Link
            href="/admin/purchases"
            className="text-xs text-burgundy-900 font-semibold hover:underline"
          >
            Purchases &rarr;
          </Link>
        </div>

        {/* Payment Records */}
        <div className="p-4 bg-white border border-gold-300/80 rounded-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500 block">
              Recorded Payments
            </span>
            <span className="font-serif text-2xl font-bold text-burgundy-950">
              {metrics.recorded_payments_count ?? 0}
            </span>
            <span className="text-[10px] text-charcoal-400 font-mono block mt-0.5">
              Inbound & outbound
            </span>
          </div>
          <Link
            href="/admin/payments"
            className="text-xs text-burgundy-900 font-semibold hover:underline"
          >
            Payments &rarr;
          </Link>
        </div>
      </div>

      {/* Recently Added / Updated Products Table */}
      <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gold-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gold-600" />
            <h2 className="font-serif text-base font-bold text-burgundy-950">
              Recently Modified Saree SKUs
            </h2>
          </div>
          <Link
            href="/admin/products"
            className="text-xs font-semibold text-burgundy-900 hover:text-gold-700 transition-colors inline-flex items-center gap-1"
          >
            <span>View All Sarees</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-charcoal-700">
            <thead className="bg-ivory-50 text-[10px] uppercase tracking-wider text-charcoal-500 border-b border-gold-200">
              <tr>
                <th className="px-5 py-3 font-semibold">SKU Code</th>
                <th className="px-5 py-3 font-semibold">Saree Model</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Catalogue State</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-200/60">
              {metrics.recent_products.map((p) => (
                <tr key={p.id} className="hover:bg-ivory-50/80 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-semibold text-charcoal-900">
                    {p.code}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-charcoal-900">
                    {p.name}
                  </td>
                  <td className="px-5 py-3.5 text-charcoal-600">{p.category_name}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {p.availability_status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {p.is_active ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-charcoal-400">Archived</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="text-xs font-semibold text-burgundy-900 hover:text-gold-700 transition-colors"
                    >
                      Edit SKU
                    </Link>
                  </td>
                </tr>
              ))}
              {metrics.recent_products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-charcoal-400">
                    No recent products in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

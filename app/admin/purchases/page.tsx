"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getAdminPurchases } from "@/lib/api/admin";
import { AdminPurchaseOrderList, PurchaseOrderStatus } from "@/types";
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";

export default function AdminPurchasesPage() {
  const [orders, setOrders] = useState<AdminPurchaseOrderList[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchPurchases = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminPurchases({
        page,
        limit: 15,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      setOrders(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error("Failed to load purchase orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPurchases();
  };

  const statusStyles: Record<string, string> = {
    DRAFT: "bg-charcoal-100 text-charcoal-700",
    ORDERED: "bg-blue-100 text-blue-900 ring-1 ring-blue-400",
    PARTIALLY_RECEIVED: "bg-amber-100 text-amber-900 ring-1 ring-amber-400",
    RECEIVED: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-400",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950 flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-gold-600" />
            <span>Procurement & Purchase Orders</span>
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Issue purchase orders to yarn spinning mills, inspect consignments, and credit raw material inventory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/purchases/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase Order</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gold-300/80 rounded-sm p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by PO number, supplier code, or mill name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-charcoal-200 rounded-sm focus:outline-none focus:border-burgundy-900"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-charcoal-800 text-gold-200 text-xs font-semibold rounded-sm hover:bg-charcoal-900"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-charcoal-200 rounded-sm px-2.5 py-2 bg-white focus:outline-none focus:border-burgundy-900"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ORDERED">Ordered</option>
            <option value="PARTIALLY_RECEIVED">Partially Received</option>
            <option value="RECEIVED">Fully Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            onClick={fetchPurchases}
            className="p-2 border border-gold-300 rounded-sm hover:bg-gold-50 text-charcoal-600"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-burgundy-900 animate-spin" />
            <p className="text-xs font-semibold text-charcoal-500 font-mono">
              Loading Purchase Orders...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-charcoal-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-burgundy-950">No Purchase Orders Found</p>
            <p className="text-xs text-charcoal-500 mt-1 max-w-sm mx-auto">
              No procurement orders match your filter criteria. Click "New Purchase Order" to draft one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-ivory-100 border-b border-gold-200 text-charcoal-600 uppercase tracking-wider text-[10px] font-mono">
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier / Mill</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Expected Delivery</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {orders.map((po) => (
                  <tr key={po.id} className="hover:bg-ivory-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/admin/purchases/${po.id}`}
                        className="font-mono font-bold text-burgundy-900 hover:underline"
                      >
                        {po.po_number}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-charcoal-900">{po.supplier_name}</div>
                      <span className="font-mono text-[10px] text-charcoal-500">{po.supplier_code}</span>
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-600 font-mono text-[11px]">
                      {po.order_date}
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-600 font-mono text-[11px]">
                      {po.expected_delivery_date || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-charcoal-700">
                      {po.item_count}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-charcoal-900">
                      ₹{Number(po.total_amount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          statusStyles[po.status] || "bg-charcoal-100 text-charcoal-700"
                        }`}
                      >
                        {po.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/purchases/${po.id}`}
                        className="inline-flex items-center gap-1 text-burgundy-900 font-semibold hover:underline"
                      >
                        <span>{po.status === "RECEIVED" ? "View" : "Receive"}</span>
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
              Showing page {page} of {totalPages} ({total} purchase orders total)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 border border-charcoal-200 rounded-sm disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 border border-charcoal-200 rounded-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

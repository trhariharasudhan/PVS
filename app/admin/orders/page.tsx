"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getAdminOrders } from "@/lib/api";
import { AdminOrderList, OrderStatus, OrderType, PaymentStatus } from "@/types";
import {
  ShoppingBag,
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
  Truck,
  XCircle,
  Store,
  User,
} from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderList[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminOrders({
        page,
        limit: 15,
        status: statusFilter || undefined,
        order_type: orderTypeFilter || undefined,
        payment_status: paymentFilter || undefined,
        search: search.trim() || undefined,
      });
      setOrders(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      console.error("Failed to load orders:", err);
      setError(err?.message || "Failed to load sales orders.");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, orderTypeFilter, paymentFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const pendingCount = orders.filter((o) => o.order_status === "PENDING").length;
  const confirmedCount = orders.filter((o) =>
    ["CONFIRMED", "PROCESSING", "READY"].includes(o.order_status)
  ).length;
  const fulfilledCount = orders.filter((o) =>
    ["SHIPPED", "DELIVERED"].includes(o.order_status)
  ).length;
  const totalRevenue = orders
    .filter((o) => o.order_status !== "CANCELLED")
    .reduce((acc, o) => acc + Number(o.total_amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
            Sales & Wholesale Orders Desk
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Manage retail purchases, boutique wholesale consignments, and stock reservations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gold-300 hover:bg-gold-50 text-charcoal-700 text-xs font-medium rounded-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gold-600" />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/orders/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Sales Order</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-sm text-xs text-red-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gold-300/80 rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-charcoal-500 font-semibold block">
              Pending Orders
            </span>
            <span className="font-serif text-2xl font-bold text-amber-700">
              {pendingCount}
            </span>
          </div>
          <Clock className="w-5 h-5 text-amber-600" />
        </div>

        <div className="p-4 bg-white border border-gold-300/80 rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-charcoal-500 font-semibold block">
              Confirmed & Reserved
            </span>
            <span className="font-serif text-2xl font-bold text-burgundy-950">
              {confirmedCount}
            </span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-burgundy-900" />
        </div>

        <div className="p-4 bg-white border border-gold-300/80 rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-charcoal-500 font-semibold block">
              Dispatched / Fulfilled
            </span>
            <span className="font-serif text-2xl font-bold text-emerald-800">
              {fulfilledCount}
            </span>
          </div>
          <Truck className="w-5 h-5 text-emerald-600" />
        </div>

        <div className="p-4 bg-white border border-gold-300/80 rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-charcoal-500 font-semibold block">
              Page Order Volume
            </span>
            <span className="font-serif text-xl font-bold text-charcoal-900">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </span>
          </div>
          <ShoppingBag className="w-5 h-5 text-gold-600" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-gold-300/80 rounded-sm shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Order #, customer name, company, phone..."
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
              <option value="">All Order Statuses</option>
              <option value="PENDING">Pending (Stock Reserved)</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="READY">Ready for Dispatch</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered (Stock Deducted)</option>
              <option value="CANCELLED">Cancelled (Stock Released)</option>
            </select>
          </div>

          <div>
            <select
              value={orderTypeFilter}
              onChange={(e) => {
                setOrderTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900"
            >
              <option value="">All Order Types</option>
              <option value="WHOLESALE_BULK">Wholesale Bulk</option>
              <option value="CUSTOM_LOOM_RUN">Custom Loom Run</option>
              <option value="RETAIL_DIRECT">Retail Direct</option>
            </select>
          </div>

          <div>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900"
            >
              <option value="">All Payment States</option>
              <option value="PENDING">Payment Pending</option>
              <option value="ADVANCE_PAID">Advance Received</option>
              <option value="FULLY_PAID">Fully Paid</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gold-200/60 text-xs text-charcoal-500">
          <span>
            Showing <strong>{orders.length}</strong> of <strong>{total}</strong> sales orders
          </span>
          {(search || statusFilter || orderTypeFilter || paymentFilter) && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setOrderTypeFilter("");
                setPaymentFilter("");
                setPage(1);
              }}
              className="text-xs text-burgundy-900 font-semibold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-7 h-7 text-burgundy-900 animate-spin" />
            <span className="text-xs font-mono text-charcoal-500">Loading sales orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-gold-400 mx-auto" />
            <h3 className="font-serif text-base font-bold text-burgundy-950">
              No Sales Orders Found
            </h3>
            <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
              No orders match the current filter or search criteria.
            </p>
            <Link
              href="/admin/orders/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-burgundy-900 text-gold-200 rounded text-xs font-semibold uppercase tracking-wider"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create First Order</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-charcoal-700">
              <thead className="bg-ivory-50 text-[10px] uppercase tracking-wider text-charcoal-500 border-b border-gold-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order #</th>
                  <th className="px-4 py-3 font-semibold">Customer / Buyer</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold text-center">Items</th>
                  <th className="px-4 py-3 font-semibold text-right">Total Amount</th>
                  <th className="px-4 py-3 font-semibold">Payment Status</th>
                  <th className="px-4 py-3 font-semibold">Order Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-200/60">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-ivory-50/70 transition-colors">
                    {/* Order Number */}
                    <td className="px-4 py-3.5 font-mono font-bold text-charcoal-900">
                      {o.order_number}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-charcoal-900">{o.customer_name}</div>
                      {o.customer_company && (
                        <div className="text-[10px] text-charcoal-500">{o.customer_company}</div>
                      )}
                      <div className="text-[10px] text-charcoal-400 font-mono">{o.customer_phone}</div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ivory-100 text-charcoal-800 border border-gold-300">
                        {o.order_type.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Items */}
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-charcoal-800">
                      {o.item_count} pcs
                    </td>

                    {/* Total Amount */}
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-burgundy-950">
                      ₹{Number(o.total_amount).toLocaleString("en-IN")}
                    </td>

                    {/* Payment Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          o.payment_status === "FULLY_PAID"
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            : o.payment_status === "ADVANCE_PAID"
                            ? "bg-blue-100 text-blue-900 border border-blue-300"
                            : "bg-amber-100 text-amber-900 border border-amber-300"
                        }`}
                      >
                        {o.payment_status.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Order Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ["SHIPPED", "DELIVERED"].includes(o.order_status)
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            : o.order_status === "CANCELLED"
                            ? "bg-red-100 text-red-900 border border-red-300"
                            : o.order_status === "CONFIRMED"
                            ? "bg-burgundy-100 text-burgundy-900 border border-burgundy-300"
                            : "bg-amber-100 text-amber-900 border border-amber-300"
                        }`}
                      >
                        {o.order_status.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 rounded text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        <span>View Order</span>
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

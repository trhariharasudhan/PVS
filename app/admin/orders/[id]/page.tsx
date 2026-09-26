"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getAdminOrder,
  confirmAdminOrder,
  cancelAdminOrder,
  fulfillAdminOrder,
  updateAdminOrder,
} from "@/lib/api";
import { AdminOrderDetail, OrderStatus, PaymentStatus } from "@/types";
import {
  ShoppingBag,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Truck,
  XCircle,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Save,
  Package,
} from "lucide-react";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Status updating state
  const [isProcessing, setIsProcessing] = useState(false);

  // Editable fields
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PENDING");
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSavingMeta, setIsSavingMeta] = useState(false);

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminOrder(orderId);
      setOrder(data);
      setPaymentStatus(data.payment_status);
      setTrackingNumber(data.tracking_number || "");
      setNotes(data.notes || "");
    } catch (err: any) {
      console.error("Failed to load order detail:", err);
      setError(err?.message || "Failed to load order.");
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleConfirm = async () => {
    if (!confirm("Confirm this sales order? Stock reservations will remain locked.")) return;
    setIsProcessing(true);
    setError(null);
    try {
      const updated = await confirmAdminOrder(orderId);
      setOrder(updated);
      setSuccessMsg("Order status advanced to CONFIRMED.");
    } catch (err: any) {
      setError(err?.message || "Failed to confirm order.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFulfill = async () => {
    if (
      !confirm(
        "Fulfill and dispatch this order? This will deduct physical stock from inventory and record an immutable SALE ledger movement."
      )
    )
      return;
    setIsProcessing(true);
    setError(null);
    try {
      const updated = await fulfillAdminOrder(orderId);
      setOrder(updated);
      setSuccessMsg("Order fulfilled! Inventory has been deducted and SALE ledger recorded.");
    } catch (err: any) {
      setError(err?.message || "Failed to fulfill order.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (
      !confirm(
        "Cancel this order? Reserved inventory will be immediately released back to available stock."
      )
    )
      return;
    setIsProcessing(true);
    setError(null);
    try {
      const updated = await cancelAdminOrder(orderId);
      setOrder(updated);
      setSuccessMsg("Order cancelled. Reserved inventory successfully restored.");
    } catch (err: any) {
      setError(err?.message || "Failed to cancel order.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMeta(true);
    setError(null);
    try {
      const updated = await updateAdminOrder(orderId, {
        payment_status: paymentStatus,
        tracking_number: trackingNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setOrder(updated);
      setSuccessMsg("Order dispatch and payment details updated.");
    } catch (err: any) {
      setError(err?.message || "Failed to update order details.");
    } finally {
      setIsSavingMeta(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-burgundy-900 animate-spin" />
        <span className="text-xs font-mono text-charcoal-500">Loading order specification...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-16 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="font-serif text-lg font-bold text-burgundy-950">Order Not Found</h3>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-burgundy-900 text-gold-200 rounded text-xs font-semibold uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Orders Desk</span>
        </Link>
      </div>
    );
  }

  const isPending = order.order_status === "PENDING";
  const isConfirmed = ["CONFIRMED", "PROCESSING", "READY"].includes(order.order_status);
  const isDelivered = ["SHIPPED", "DELIVERED"].includes(order.order_status);
  const isCancelled = order.order_status === "CANCELLED";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 text-charcoal-500 hover:text-burgundy-950 hover:bg-gold-50 rounded-sm border border-gold-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-2xl font-bold text-burgundy-950">
                {order.order_number}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                  isDelivered
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    : isCancelled
                    ? "bg-red-100 text-red-900 border border-red-300"
                    : isConfirmed
                    ? "bg-burgundy-100 text-burgundy-900 border border-burgundy-300"
                    : "bg-amber-100 text-amber-900 border border-amber-300"
                }`}
              >
                {order.order_status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Placed on {new Date(order.created_at).toLocaleDateString("en-IN", { dateStyle: "long" })} • Type:{" "}
              <strong>{order.order_type.replace(/_/g, " ")}</strong>
            </p>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2">
          {isPending && (
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm disabled:opacity-50 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm Order</span>
            </button>
          )}

          {isConfirmed && (
            <button
              onClick={handleFulfill}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm disabled:opacity-50 transition-all"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Fulfill & Dispatch Stock</span>
            </button>
          )}

          {!isDelivered && !isCancelled && (
            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-red-300 hover:bg-red-50 text-red-700 text-xs font-semibold rounded-sm disabled:opacity-50 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel Order</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-sm text-xs text-red-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-sm text-xs text-emerald-900 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid: Customer Info & Line Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Line Items & Pricing */}
        <div className="lg:col-span-2 space-y-6">
          {/* Saree Line Items Table */}
          <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm overflow-hidden">
            <div className="p-4 bg-ivory-50/70 border-b border-gold-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-burgundy-900" />
                <h3 className="font-serif text-sm font-bold text-burgundy-950">
                  Ordered Saree Items ({order.items.reduce((a, b) => a + b.quantity, 0)} pcs)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-charcoal-500">
                Snapshot Unit Pricing
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-charcoal-700">
                <thead className="bg-ivory-50/40 text-[10px] uppercase tracking-wider text-charcoal-500 border-b border-gold-200">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Saree Weave</th>
                    <th className="px-4 py-2.5 font-semibold text-center">Qty</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Agreed Unit Price</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold-200/60">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-ivory-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.primary_image_url ? (
                            <div className="w-10 h-10 relative rounded border border-gold-200 overflow-hidden shrink-0">
                              <Image
                                src={item.primary_image_url}
                                alt={item.product_name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-ivory-100 rounded border border-gold-200 flex items-center justify-center text-charcoal-400 shrink-0">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-charcoal-900">{item.product_name}</div>
                            <div className="text-[10px] font-mono text-gold-700">
                              {item.product_code} • {item.category_name}
                            </div>
                            {item.custom_colorway_notes && (
                              <div className="text-[10px] text-charcoal-500 italic mt-0.5">
                                Notes: {item.custom_colorway_notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center font-mono font-bold text-charcoal-900">
                        {item.quantity}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-charcoal-800">
                        ₹{Number(item.unit_price).toLocaleString("en-IN")}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-burgundy-950">
                        ₹{Number(item.line_total).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Breakdown */}
            <div className="p-4 bg-ivory-50/70 border-t border-gold-200 flex justify-end">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-charcoal-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-charcoal-900">
                    ₹{Number(order.subtotal_amount).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-charcoal-600">
                  <span>Tax / GST:</span>
                  <span className="font-mono text-charcoal-900">
                    ₹{Number(order.tax_amount).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-charcoal-600">
                  <span>Freight / Shipping:</span>
                  <span className="font-mono text-charcoal-900">
                    ₹{Number(order.shipping_amount).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="pt-2 border-t border-gold-300 flex justify-between font-bold text-sm text-burgundy-950">
                  <span>Grand Total:</span>
                  <span className="font-mono text-base font-bold">
                    ₹{Number(order.total_amount).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dispatch & Administrative Form */}
          <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gold-200/60">
              <FileText className="w-4 h-4 text-burgundy-900" />
              <h3 className="font-serif text-sm font-bold text-burgundy-950">
                Dispatch Tracking & Payment Settlement
              </h3>
            </div>

            <form onSubmit={handleSaveMeta} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                    Payment Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900"
                  >
                    <option value="PENDING">Pending Settlement</option>
                    <option value="ADVANCE_PAID">Advance Received</option>
                    <option value="FULLY_PAID">Fully Settled</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                    Courier / Waybill Tracking Number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. ST-COURIER-994827"
                    className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                  Internal Administrative Remarks
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions or dispatch logs..."
                  className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingMeta}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-charcoal-800 hover:bg-charcoal-900 text-gold-200 text-xs font-semibold rounded-sm disabled:opacity-50 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingMeta ? "Saving..." : "Update Details"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Customer Card */}
        <div className="space-y-6">
          <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gold-200/60">
              <User className="w-4 h-4 text-burgundy-900" />
              <h3 className="font-serif text-sm font-bold text-burgundy-950">
                Customer & Billing Profile
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-charcoal-400 block text-[10px] uppercase font-semibold">
                  Buyer Name
                </span>
                <span className="font-bold text-charcoal-900 text-sm">
                  {order.customer.full_name}
                </span>
              </div>

              {order.customer.company_name && (
                <div>
                  <span className="text-charcoal-400 block text-[10px] uppercase font-semibold">
                    Company / Showroom
                  </span>
                  <span className="font-semibold text-charcoal-800">
                    {order.customer.company_name}
                  </span>
                </div>
              )}

              <div>
                <span className="text-charcoal-400 block text-[10px] uppercase font-semibold">
                  Customer Type
                </span>
                <span className="px-2 py-0.5 bg-ivory-100 rounded text-[10px] font-bold border border-gold-300">
                  {order.customer.customer_type}
                </span>
              </div>

              <div className="pt-2 border-t border-gold-200/60 space-y-2">
                <div className="flex items-center gap-2 text-charcoal-700">
                  <Phone className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                  <span>{order.customer.phone}</span>
                </div>

                {order.customer.email && (
                  <div className="flex items-center gap-2 text-charcoal-700">
                    <Mail className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                    <span>{order.customer.email}</span>
                  </div>
                )}

                <div className="flex items-start gap-2 text-charcoal-700">
                  <MapPin className="w-3.5 h-3.5 text-gold-600 shrink-0 mt-0.5" />
                  <div>
                    <span>{order.customer.city}, {order.customer.state}</span>
                    {order.customer.shipping_address && (
                      <p className="text-charcoal-500 text-[11px] mt-0.5">
                        {order.customer.shipping_address}
                      </p>
                    )}
                  </div>
                </div>

                {order.customer.gstin && (
                  <div>
                    <span className="text-charcoal-400 block text-[10px] uppercase font-semibold">
                      GSTIN
                    </span>
                    <span className="font-mono text-charcoal-800">{order.customer.gstin}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

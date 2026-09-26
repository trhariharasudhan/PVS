"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAdminPurchase,
  receiveAdminPurchaseItems,
} from "@/lib/api/admin";
import {
  AdminPurchaseOrderDetail,
  PurchaseOrderStatus,
} from "@/types";
import {
  FileText,
  ArrowLeft,
  RefreshCw,
  Truck,
  CheckCircle,
  Clock,
  Boxes,
  AlertTriangle,
  Loader2,
  X,
  CreditCard,
} from "lucide-react";

export default function AdminPurchaseDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [po, setPo] = useState<AdminPurchaseOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Receiving Modal / Inline Desk State
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({});
  const [receiveNotes, setReceiveNotes] = useState("");
  const [warehouseLocation, setWarehouseLocation] = useState("Yarn Bay 1");
  const [isSubmittingReceive, setIsSubmittingReceive] = useState(false);
  const [receiveError, setReceiveError] = useState<string | null>(null);

  const fetchDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminPurchase(id);
      setPo(data);

      // Pre-fill receive quantities with remaining unreceived amounts
      const initialQtys: Record<string, number> = {};
      data.items.forEach((it) => {
        const remaining = Math.max(
          0,
          Number(it.quantity_ordered) - Number(it.quantity_received)
        );
        initialQtys[it.id] = remaining;
      });
      setReceiveQuantities(initialQtys);
    } catch (err: any) {
      setError(err?.message || "Failed to load Purchase Order.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!po) return;

    const receiveItems = Object.entries(receiveQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => ({
        item_id: itemId,
        quantity_to_receive: qty,
      }));

    if (receiveItems.length === 0) {
      setReceiveError("Please specify a quantity greater than zero for at least one item.");
      return;
    }

    setIsSubmittingReceive(true);
    setReceiveError(null);

    try {
      await receiveAdminPurchaseItems(id, {
        items: receiveItems,
        notes: receiveNotes.trim() || undefined,
        warehouse_location: warehouseLocation.trim() || undefined,
      });

      setIsReceiveModalOpen(false);
      fetchDetail();
    } catch (err: any) {
      setReceiveError(err?.message || "Failed to receive materials.");
    } finally {
      setIsSubmittingReceive(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-burgundy-900 animate-spin" />
        <p className="text-xs font-semibold text-charcoal-500 font-mono">
          Querying Purchase Order Consignment...
        </p>
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-sm text-center">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
        <p className="text-sm font-semibold text-red-900 mb-4">{error || "Purchase order not found"}</p>
        <Link
          href="/admin/purchases"
          className="inline-flex items-center gap-2 px-4 py-2 bg-burgundy-900 text-gold-200 text-xs font-semibold rounded-sm uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Purchases</span>
        </Link>
      </div>
    );
  }

  const isFullyReceived = po.status === "RECEIVED";
  const isCancelled = po.status === "CANCELLED";

  const statusStyles: Record<string, string> = {
    DRAFT: "bg-charcoal-100 text-charcoal-700",
    ORDERED: "bg-blue-100 text-blue-900 ring-1 ring-blue-400",
    PARTIALLY_RECEIVED: "bg-amber-100 text-amber-900 ring-1 ring-amber-400",
    RECEIVED: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-400",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/admin/purchases"
            className="inline-flex items-center gap-1.5 text-xs text-burgundy-900 font-semibold hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Purchase Orders</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
              {po.po_number}
            </h1>
            <span
              className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${
                statusStyles[po.status] || "bg-charcoal-100 text-charcoal-700"
              }`}
            >
              {po.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-xs text-charcoal-500 mt-1">
            Supplier: <strong className="text-charcoal-800">{po.supplier.supplier_name}</strong> ({po.supplier.supplier_code}) | Issued on {po.order_date}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isFullyReceived && !isCancelled && (
            <button
              onClick={() => setIsReceiveModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-gold-100 text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm transition-all"
            >
              <Boxes className="w-4 h-4" />
              <span>Receive Consignment</span>
            </button>
          )}

          <Link
            href={`/admin/payments/new?po_id=${po.id}&supplier_id=${po.supplier_id}&amount=${po.total_amount}`}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-charcoal-800 hover:bg-charcoal-900 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm transition-all"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </Link>

          <button
            onClick={fetchDetail}
            className="p-2 border border-gold-300 rounded-sm hover:bg-gold-50 text-charcoal-600"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-gold-300/80 rounded-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500 block">
            Supplier Mill Information
          </span>
          <span className="font-serif text-base font-bold text-burgundy-950 block mt-1">
            {po.supplier.supplier_name}
          </span>
          <span className="text-xs text-charcoal-600 block mt-0.5">
            Contact: {po.supplier.contact_person} ({po.supplier.phone})
          </span>
          <span className="text-[11px] text-charcoal-400 font-mono block mt-1">
            GSTIN: {po.supplier.gstin || "N/A"}
          </span>
        </div>

        <div className="p-4 bg-white border border-gold-300/80 rounded-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500 block">
            Schedule & Delivery
          </span>
          <div className="mt-1 text-xs space-y-1 text-charcoal-700">
            <div>Order Date: <strong className="font-mono">{po.order_date}</strong></div>
            <div>Expected: <strong className="font-mono">{po.expected_delivery_date || "Open"}</strong></div>
            <div>Issued By: <span className="text-charcoal-500">{po.created_by_name || "Operations Desk"}</span></div>
          </div>
        </div>

        <div className="p-4 bg-white border border-gold-300/80 rounded-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500 block">
            Procurement Financials
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-burgundy-950">
              ₹{Number(po.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[10px] text-charcoal-500 block mt-0.5">
            Subtotal: ₹{Number(po.subtotal_amount).toLocaleString("en-IN")} | Taxes: ₹{Number(po.tax_amount).toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gold-200 flex items-center justify-between">
          <h2 className="font-serif text-base font-bold text-burgundy-950 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gold-600" />
            <span>Consignment Item Breakdown</span>
          </h2>
          <span className="text-xs text-charcoal-500 font-mono">
            {po.items.length} items ordered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-ivory-100 border-b border-gold-200 text-charcoal-600 uppercase tracking-wider text-[10px] font-mono">
                <th className="py-3 px-4">Raw Material SKU</th>
                <th className="py-3 px-4 text-right">Quantity Ordered</th>
                <th className="py-3 px-4 text-right">Quantity Received</th>
                <th className="py-3 px-4 text-right">Unit Rate (₹)</th>
                <th className="py-3 px-4 text-right">Line Total</th>
                <th className="py-3 px-4 text-center">Fulfillment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100">
              {po.items.map((item) => {
                const ordered = Number(item.quantity_ordered);
                const received = Number(item.quantity_received);
                const isItemComplete = received >= ordered;

                return (
                  <tr key={item.id} className="hover:bg-ivory-50">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-burgundy-900 text-[11px]">
                        {item.material_code}
                      </div>
                      <div className="text-charcoal-800 font-semibold">{item.material_name}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-charcoal-900">
                      {ordered.toFixed(2)} <span className="text-[10px] text-charcoal-500 font-sans">{item.unit_of_measure}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-800">
                      {received.toFixed(2)} <span className="text-[10px] text-charcoal-500 font-sans">{item.unit_of_measure}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-charcoal-700">
                      ₹{Number(item.unit_cost).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-charcoal-900">
                      ₹{Number(item.line_total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isItemComplete
                            ? "bg-emerald-100 text-emerald-800"
                            : received > 0
                            ? "bg-amber-100 text-amber-900"
                            : "bg-charcoal-100 text-charcoal-600"
                        }`}
                      >
                        {isItemComplete ? "Fully Received" : received > 0 ? "Partial" : "Pending"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes Section */}
      {po.notes && (
        <div className="bg-white border border-gold-300/80 rounded-sm p-4 text-xs">
          <span className="font-semibold text-charcoal-700 block mb-1">Procurement Notes:</span>
          <p className="text-charcoal-600 italic">{po.notes}</p>
        </div>
      )}

      {/* Receive Consignment Modal */}
      {isReceiveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-gold-300 rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gold-200 pb-3">
              <div>
                <h2 className="font-serif text-base font-bold text-burgundy-950 flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-emerald-700" />
                  <span>Receive Materials into Inventory</span>
                </h2>
                <p className="text-[11px] text-charcoal-500 font-mono">
                  PO Number: {po.po_number} ({po.supplier.supplier_name})
                </p>
              </div>
              <button onClick={() => setIsReceiveModalOpen(false)} className="text-charcoal-400 hover:text-charcoal-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {receiveError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-xs text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{receiveError}</span>
              </div>
            )}

            <form onSubmit={handleReceiveSubmit} className="space-y-4 text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-ivory-100 border-b border-gold-200 text-charcoal-600 uppercase tracking-wider text-[10px] font-mono">
                      <th className="py-2.5 px-3">Raw Material</th>
                      <th className="py-2.5 px-3 text-right">Ordered</th>
                      <th className="py-2.5 px-3 text-right">Already Rcvd</th>
                      <th className="py-2.5 px-3 text-right">Qty to Receive Now *</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-charcoal-100">
                    {po.items.map((item) => {
                      const ordered = Number(item.quantity_ordered);
                      const alreadyRcvd = Number(item.quantity_received);
                      const maxRemaining = Math.max(0, ordered - alreadyRcvd);

                      return (
                        <tr key={item.id} className="hover:bg-ivory-50">
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-burgundy-900 text-[11px] block">
                              {item.material_code}
                            </span>
                            <span className="text-charcoal-800">{item.material_name}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-charcoal-700">
                            {ordered.toFixed(2)} {item.unit_of_measure}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-charcoal-700">
                            {alreadyRcvd.toFixed(2)} {item.unit_of_measure}
                          </td>
                          <td className="py-2.5 px-3 text-right w-44">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={maxRemaining}
                              value={receiveQuantities[item.id] || ""}
                              onChange={(e) =>
                                setReceiveQuantities({
                                  ...receiveQuantities,
                                  [item.id]: Number(e.target.value),
                                })
                              }
                              className="w-full p-1.5 border border-charcoal-200 rounded-sm text-right font-mono text-xs focus:border-burgundy-900 focus:outline-none"
                            />
                            <span className="text-[10px] text-charcoal-400 block mt-0.5">
                              Max: {maxRemaining.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Warehouse Location / Bay
                </label>
                <input
                  type="text"
                  placeholder="e.g. Yarn Bay 1 - Bin A"
                  value={warehouseLocation}
                  onChange={(e) => setWarehouseLocation(e.target.value)}
                  className="w-full p-2 border border-charcoal-200 rounded-sm focus:border-burgundy-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Inspection Notes & QA Clearance
                </label>
                <textarea
                  rows={2}
                  placeholder="Checked raw silk filament strength, weigh-in slip verified..."
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  className="w-full p-2 border border-charcoal-200 rounded-sm focus:border-burgundy-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gold-200">
                <button
                  type="button"
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="px-4 py-2 border border-charcoal-300 rounded-sm font-semibold text-charcoal-700 hover:bg-charcoal-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReceive}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-gold-100 font-semibold uppercase tracking-wider rounded-sm disabled:opacity-50"
                >
                  {isSubmittingReceive ? "Crediting Inventory..." : "Confirm & Credit Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

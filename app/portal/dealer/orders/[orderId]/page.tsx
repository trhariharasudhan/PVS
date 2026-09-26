"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getDealerOrderDetail } from "@/lib/api";
import { DealerOrderDetail } from "@/lib/api/dealer";
import {
  Package,
  ArrowLeft,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function DealerOrderDetailPage() {
  const params = useParams();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<DealerOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) return;
      try {
        setIsLoading(true);
        const data = await getDealerOrderDetail(orderId);
        setOrder(data);
      } catch (err: any) {
        console.error("Failed to load order detail:", err);
        setErrorMsg(err.message || "Failed to load order details.");
      } finally {
        setIsLoading(false);
      }
    }
    loadOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-silk-red-600" />
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="text-center py-20 bg-white rounded-[4px] border border-gold-300 p-8 shadow-sm">
        <AlertCircle className="w-10 h-10 text-silk-red-600 mx-auto mb-3" />
        <h2 className="text-lg font-serif font-bold text-heritage-brown-950">Order Not Found</h2>
        <p className="text-xs text-heritage-brown-600 mt-1 font-sans">{errorMsg || "Unable to locate order."}</p>
        <Link href="/portal/dealer/orders" className="mt-4 inline-block text-xs font-semibold text-silk-red-600 underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/portal/dealer/orders"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-heritage-brown-600 hover:text-silk-red-600"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      {/* Header Banner */}
      <div className="bg-white rounded-[4px] p-6 border border-gold-300/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs text-silk-red-700 font-bold bg-silk-red-50 px-2.5 py-0.5 rounded-[4px] border border-silk-red-200">
            {order.order_number}
          </span>
          <h1 className="text-2xl font-serif font-bold text-heritage-brown-950 mt-2">Order Summary</h1>
          <p className="text-xs text-heritage-brown-600 mt-1 font-sans">
            Placed on {order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN") : "-"}
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-[4px] text-xs font-semibold bg-gold-50 text-gold-800 border border-gold-300">
            {order.order_status}
          </span>
          <span className="px-3 py-1 rounded-[4px] text-xs font-semibold bg-ivory-100 text-heritage-brown-950 border border-ivory-200">
            Payment: {order.payment_status}
          </span>
        </div>
      </div>

      {/* Order Line Items Table */}
      <div className="bg-white rounded-[4px] border border-gold-300/60 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gold-200">
          <h2 className="text-base font-serif font-bold text-heritage-brown-950">Ordered Sarees</h2>
        </div>

        <div className="divide-y divide-gold-100 overflow-x-auto">
          <table className="w-full text-left text-sm font-sans">
            <thead className="bg-ivory-50 text-heritage-brown-700 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">Product</th>
                <th className="px-6 py-3.5">SKU</th>
                <th className="px-6 py-3.5">Unit Price (INR)</th>
                <th className="px-6 py-3.5">Quantity</th>
                <th className="px-6 py-3.5 text-right">Line Total (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-100">
              {order.items.map((item) => (
                <tr key={item.id} className="hover:bg-gold-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[4px] bg-ivory-100 flex items-center justify-center flex-shrink-0 border border-gold-200">
                        {item.primary_image_url ? (
                          <img src={item.primary_image_url} alt={item.product_name} className="w-full h-full object-cover rounded-[4px]" />
                        ) : (
                          <Package className="w-5 h-5 text-gold-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-heritage-brown-950 text-xs">{item.product_name}</p>
                        <p className="text-[11px] text-gold-700">{item.category_name || "Pure Silk"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-heritage-brown-600">{item.product_code}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-heritage-brown-950">
                    INR {item.unit_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-heritage-brown-950">{item.quantity}</td>
                  <td className="px-6 py-4 text-xs font-bold text-silk-red-700 text-right">
                    INR {item.line_total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Breakdown */}
        <div className="p-6 bg-ivory-50 border-t border-gold-200 flex justify-end">
          <div className="w-72 space-y-2 text-xs font-sans">
            <div className="flex justify-between text-heritage-brown-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-heritage-brown-950">
                INR {order.subtotal_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-heritage-brown-600">
              <span>5.0% Handloom GST:</span>
              <span className="font-semibold text-heritage-brown-950">
                INR {order.tax_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-heritage-brown-600">
              <span>Shipping:</span>
              <span className="font-semibold text-heritage-brown-950">INR 0.00 (FOB Factory)</span>
            </div>
            <div className="pt-2 border-t border-gold-300 flex justify-between text-sm font-bold text-heritage-brown-950">
              <span>Total Amount:</span>
              <span className="text-silk-red-700 font-serif">
                INR {order.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Linked Invoices Section */}
      {order.invoices && order.invoices.length > 0 && (
        <div className="bg-white rounded-[4px] p-6 border border-gold-300/60 shadow-sm">
          <h2 className="text-base font-serif font-bold text-heritage-brown-950 flex items-center gap-2">
            <FileText className="w-4 h-4 text-silk-red-600" /> Associated Tax Invoices
          </h2>
          <div className="mt-4 divide-y divide-gold-100 font-sans">
            {order.invoices.map((inv) => (
              <div key={inv.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-heritage-brown-950">{inv.invoice_number}</span>
                  <p className="text-[11px] text-heritage-brown-500 mt-0.5">Due: {inv.due_date || "30 Days Net"}</p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-heritage-brown-950">
                    INR {inv.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                  <p className="text-[11px] text-gold-700 font-semibold">{inv.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

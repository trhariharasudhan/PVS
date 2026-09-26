"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getDealerOrders } from "@/lib/api";
import { DealerOrderSummary } from "@/lib/api/dealer";
import { ShoppingBag, Loader2, Eye } from "lucide-react";

export default function DealerOrdersPage() {
  const [orders, setOrders] = useState<DealerOrderSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        setIsLoading(true);
        const data = await getDealerOrders(page, 20);
        setOrders(data.items || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error("Failed to load dealer orders:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, [page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-heritage-brown-950">Wholesale Orders</h1>
          <p className="text-xs sm:text-sm text-heritage-brown-600 mt-0.5 font-sans">
            View status, delivery tracking, and invoice associations for your wholesale orders
          </p>
        </div>
        <Link
          href="/portal/dealer/products"
          className="px-4 py-2 bg-silk-red-600 hover:bg-silk-red-800 text-ivory-50 text-xs font-semibold uppercase tracking-wider rounded-[4px] border border-silk-red-600 shadow-sm"
        >
          New Order
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-silk-red-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-[4px] p-12 text-center border border-gold-300/60 shadow-sm">
          <ShoppingBag className="w-10 h-10 text-gold-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-heritage-brown-950">No orders found.</p>
          <p className="text-xs text-heritage-brown-600 mt-1 font-sans">Start by browsing products in the wholesale catalogue.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[4px] shadow-sm border border-gold-300/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-ivory-50 text-heritage-brown-700 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Order Number</th>
                  <th className="px-6 py-3.5">Order Date</th>
                  <th className="px-6 py-3.5">Quantity</th>
                  <th className="px-6 py-3.5">Order Status</th>
                  <th className="px-6 py-3.5">Payment Status</th>
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gold-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-silk-red-700">{o.order_number}</td>
                    <td className="px-6 py-4 text-heritage-brown-600 text-xs">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString("en-IN") : "-"}
                    </td>
                    <td className="px-6 py-4 text-heritage-brown-950 font-medium">{o.item_count} Sarees</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-[4px] text-xs font-semibold bg-gold-50 text-gold-800 border border-gold-300">
                        {o.order_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-[4px] text-xs font-semibold ${
                          o.payment_status === "PAID"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-ivory-200 text-heritage-brown-700"
                        }`}
                      >
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-heritage-brown-950 font-serif">
                      INR {o.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/portal/dealer/orders/${o.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-silk-red-600 hover:text-silk-red-800 uppercase tracking-wider"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

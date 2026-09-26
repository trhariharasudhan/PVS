"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getDealerProfile, getDealerCredit, getDealerOrders } from "@/lib/api";
import { DealerProfile, DealerCreditSummary, DealerOrderSummary } from "@/lib/api/dealer";
import {
  Package,
  ShoppingBag,
  CreditCard,
  TrendingUp,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function DealerDashboardPage() {
  const [profile, setProfile] = useState<DealerProfile | null>(null);
  const [credit, setCredit] = useState<DealerCreditSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<DealerOrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [profData, credData, ordData] = await Promise.all([
          getDealerProfile(),
          getDealerCredit().catch(() => null),
          getDealerOrders(1, 5).catch(() => ({ items: [], total: 0 })),
        ]);
        setProfile(profData);
        setCredit(credData);
        setRecentOrders(ordData.items || []);
      } catch (err) {
        console.error("Failed to load dealer dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-silk-red-600" />
      </div>
    );
  }

  const creditLimit = credit?.credit_limit || 0;
  const outstanding = credit?.outstanding_balance || 0;
  const availableCredit = credit?.available_credit || 0;
  const creditUsagePct = creditLimit > 0 ? Math.min(100, (outstanding / creditLimit) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Welcome Banner (Silk Red #8B1E2D gradient) */}
      <div className="bg-silk-red-gradient text-ivory-50 rounded-[4px] p-6 md:p-8 shadow-luxury border border-silk-red-600">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-xs font-semibold bg-ivory-50/15 text-gold-200 border border-gold-400/30 uppercase tracking-widest mb-2">
              Verified Wholesale Merchant
            </span>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-ivory-50">
              Welcome, {profile?.company_name || profile?.full_name}
            </h1>
            <p className="text-ivory-200 text-xs sm:text-sm mt-1 font-sans">
              Kanchipuram Silk Saree Master Weaver Bulk Catalogue & Trade Ledger
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/portal/dealer/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px] bg-ivory-50 hover:bg-ivory-100 text-silk-red-700 text-xs font-semibold uppercase tracking-wider shadow-sm transition-colors border border-gold-300"
            >
              <Package className="w-4 h-4" /> Browse Catalogue
            </Link>
          </div>
        </div>
      </div>

      {/* Trade Credit Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Credit */}
        <div className="bg-white rounded-[4px] p-6 shadow-sm border border-gold-300/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider font-semibold text-heritage-brown-500">Available Trade Credit</p>
            <CreditCard className="w-5 h-5 text-emerald-700" />
          </div>
          <p className="text-2xl md:text-3xl font-serif font-bold text-emerald-800 mt-2">
            INR {availableCredit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-4 pt-3 border-t border-ivory-200 flex items-center justify-between text-xs text-heritage-brown-500 font-sans">
            <span>Approved Credit Limit:</span>
            <span className="font-semibold text-heritage-brown-950">INR {creditLimit.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white rounded-[4px] p-6 shadow-sm border border-gold-300/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider font-semibold text-heritage-brown-500">Current Outstanding</p>
            <Clock className="w-5 h-5 text-silk-red-600" />
          </div>
          <p className="text-2xl md:text-3xl font-serif font-bold text-silk-red-600 mt-2">
            INR {outstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-4 pt-3 border-t border-ivory-200 flex items-center justify-between text-xs text-heritage-brown-500 font-sans">
            <span>Unpaid Invoices:</span>
            <span className="font-semibold text-heritage-brown-950">{credit?.unpaid_invoices_count || 0} Invoices</span>
          </div>
        </div>

        {/* Credit Utilization Bar */}
        <div className="bg-white rounded-[4px] p-6 shadow-sm border border-gold-300/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider font-semibold text-heritage-brown-500">Credit Utilization</p>
            <TrendingUp className="w-5 h-5 text-gold-700" />
          </div>
          <p className="text-2xl md:text-3xl font-serif font-bold text-heritage-brown-950 mt-2">
            {creditUsagePct.toFixed(1)}%
          </p>
          <div className="w-full bg-ivory-200 h-2 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full rounded-full ${
                creditUsagePct > 80 ? "bg-rose-600" : creditUsagePct > 50 ? "bg-gold-500" : "bg-emerald-600"
              }`}
              style={{ width: `${creditUsagePct}%` }}
            />
          </div>
          <p className="text-[11px] text-heritage-brown-500 mt-2 text-right font-sans">Credit Term: 30 Days Net</p>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-[4px] shadow-sm border border-gold-300/60 overflow-hidden">
        <div className="p-6 border-b border-gold-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-serif font-bold text-heritage-brown-950">Recent Wholesale Orders</h2>
            <p className="text-xs text-heritage-brown-600 mt-0.5 font-sans">Track your order confirmation, fulfillment, and invoice status</p>
          </div>
          <Link
            href="/portal/dealer/orders"
            className="text-xs font-semibold text-silk-red-600 hover:text-silk-red-800 flex items-center gap-1 uppercase tracking-wider"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-10 h-10 text-gold-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-heritage-brown-950">No wholesale orders placed yet.</p>
            <p className="text-xs text-heritage-brown-600 mt-1 font-sans">Browse our wholesale saree catalogue to place your first bulk order.</p>
            <Link
              href="/portal/dealer/products"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-[4px] bg-silk-red-600 text-ivory-50 text-xs font-semibold uppercase tracking-wider hover:bg-silk-red-800 border border-silk-red-600"
            >
              Browse Catalogue
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gold-100 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-ivory-50 text-heritage-brown-700 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Order Number</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Units</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Total (INR)</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-100">
                {recentOrders.map((o) => (
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
                    <td className="px-6 py-4 font-bold text-heritage-brown-950 font-serif">
                      INR {o.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/portal/dealer/orders/${o.id}`}
                        className="text-xs font-semibold text-silk-red-600 hover:text-silk-red-800 uppercase tracking-wider"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

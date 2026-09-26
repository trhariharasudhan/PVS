"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Receipt,
  Users,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  AlertCircle,
  FileText,
  CreditCard,
  DollarSign,
  PieChart,
} from "lucide-react";
import {
  getAdminFinanceOverview,
  getAdminFinanceReceivables,
  getAdminFinancePayables,
} from "@/lib/api/admin";
import {
  FinanceOverviewKPIs,
  CustomerOutstandingDetail,
  SupplierOutstandingDetail,
} from "@/types";

export default function AdminFinancePage() {
  const [kpis, setKpis] = useState<FinanceOverviewKPIs | null>(null);
  const [receivables, setReceivables] = useState<CustomerOutstandingDetail[]>([]);
  const [payables, setPayables] = useState<SupplierOutstandingDetail[]>([]);
  const [activeTab, setActiveTab] = useState<"receivables" | "payables">("receivables");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFinanceData() {
      setIsLoading(true);
      setError(null);
      try {
        const [kpiData, recData, payData] = await Promise.all([
          getAdminFinanceOverview(),
          getAdminFinanceReceivables(),
          getAdminFinancePayables(),
        ]);
        setKpis(kpiData);
        setReceivables(recData);
        setPayables(payData);
      } catch (err: any) {
        setError(err.message || "Failed to load financial overview and outstandings.");
      } finally {
        setIsLoading(false);
      }
    }
    loadFinanceData();
  }, []);

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gold-500/20 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-burgundy-900/10 text-burgundy-900 rounded-lg border border-burgundy-900/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-burgundy-950">
                Finance & Aging Desk
              </h1>
              <p className="text-sm text-charcoal-600">
                Real-time financial performance, customer receivables aging, supplier payables, and cash flow.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/invoices"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-charcoal-300 bg-white text-charcoal-800 hover:bg-ivory-100 text-sm font-semibold transition"
          >
            <Receipt className="w-4 h-4 text-burgundy-900" />
            View Invoices
          </Link>
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-burgundy-900 text-gold-300 hover:bg-burgundy-950 text-sm font-semibold shadow-sm transition"
          >
            <PieChart className="w-4 h-4" />
            Business Reports
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue MTD */}
          <div className="bg-white p-5 rounded-2xl border border-charcoal-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
                Gross Revenue (MTD)
              </span>
              <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-charcoal-900 mt-2">
              {formatCurrency(kpis.gross_revenue_mtd)}
            </div>
            <div className="text-[11px] text-charcoal-500 mt-1 font-mono">
              YTD: {formatCurrency(kpis.gross_revenue_ytd)}
            </div>
          </div>

          {/* Customer Receivables */}
          <div className="bg-white p-5 rounded-2xl border border-charcoal-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
                Accounts Receivable
              </span>
              <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-blue-900 mt-2">
              {formatCurrency(kpis.total_receivables)}
            </div>
            <div className="text-[11px] text-charcoal-500 mt-1 font-mono">
              {kpis.open_invoices_count} unpaid client invoices
            </div>
          </div>

          {/* Supplier Payables */}
          <div className="bg-white p-5 rounded-2xl border border-charcoal-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
                Accounts Payable
              </span>
              <span className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                <Truck className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-amber-900 mt-2">
              {formatCurrency(kpis.total_payables)}
            </div>
            <div className="text-[11px] text-charcoal-500 mt-1 font-mono">
              {kpis.open_bills_count} open supplier bills
            </div>
          </div>

          {/* Net Cash Flow */}
          <div className="bg-white p-5 rounded-2xl border border-charcoal-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
                Net Operating Cash Flow
              </span>
              <span className="p-2 bg-gold-100 text-burgundy-900 rounded-lg">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <div
              className={`text-2xl font-bold font-mono mt-2 ${
                Number(kpis.net_cash_flow) >= 0 ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {formatCurrency(kpis.net_cash_flow)}
            </div>
            <div className="text-[11px] text-charcoal-500 mt-1 font-mono">
              Net Tax Liability: {formatCurrency(kpis.net_tax_liability)}
            </div>
          </div>
        </div>
      )}

      {/* Aging Overview Banner */}
      {kpis && (
        <div className="bg-ivory-100 p-6 rounded-2xl border border-gold-400/40 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-burgundy-950 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-burgundy-900" />
              Customer Receivables Aging Buckets
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-white p-3 rounded-xl border border-charcoal-200">
                <span className="text-[10px] uppercase font-bold text-charcoal-500 block">0–30 Days</span>
                <span className="text-xs font-mono font-bold text-emerald-700 block mt-1">
                  {formatCurrency(kpis.receivables_aging_summary.current_0_30)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-charcoal-200">
                <span className="text-[10px] uppercase font-bold text-charcoal-500 block">31–60 Days</span>
                <span className="text-xs font-mono font-bold text-blue-700 block mt-1">
                  {formatCurrency(kpis.receivables_aging_summary.days_31_60)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-charcoal-200">
                <span className="text-[10px] uppercase font-bold text-charcoal-500 block">61–90 Days</span>
                <span className="text-xs font-mono font-bold text-amber-700 block mt-1">
                  {formatCurrency(kpis.receivables_aging_summary.days_61_90)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-charcoal-200">
                <span className="text-[10px] uppercase font-bold text-charcoal-500 block">90+ Days</span>
                <span className="text-xs font-mono font-bold text-rose-700 block mt-1">
                  {formatCurrency(kpis.receivables_aging_summary.over_90_days)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-burgundy-950 mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-burgundy-900" />
              Supplier Payables Aging Buckets
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-white p-3 rounded-xl border border-charcoal-200">
                <span className="text-[10px] uppercase font-bold text-charcoal-500 block">0–30 Days</span>
                <span className="text-xs font-mono font-bold text-emerald-700 block mt-1">
                  {formatCurrency(kpis.payables_aging_summary.current_0_30)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-charcoal-200">
                <span className="text-[10px] uppercase font-bold text-charcoal-500 block">31–60 Days</span>
                <span className="text-xs font-mono font-bold text-blue-700 block mt-1">
                  {formatCurrency(kpis.payables_aging_summary.days_31_60)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-charcoal-200">
                <span className="text-[10px] uppercase font-bold text-charcoal-500 block">61–90 Days</span>
                <span className="text-xs font-mono font-bold text-amber-700 block mt-1">
                  {formatCurrency(kpis.payables_aging_summary.days_61_90)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-charcoal-200">
                <span className="text-[10px] uppercase font-bold text-charcoal-500 block">90+ Days</span>
                <span className="text-xs font-mono font-bold text-rose-700 block mt-1">
                  {formatCurrency(kpis.payables_aging_summary.over_90_days)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex border-b border-charcoal-200 gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab("receivables")}
            className={`pb-3 border-b-2 transition ${
              activeTab === "receivables"
                ? "border-burgundy-900 text-burgundy-950 font-bold"
                : "border-transparent text-charcoal-500 hover:text-charcoal-800"
            }`}
          >
            Customer Receivables Ledger ({receivables.length})
          </button>
          <button
            onClick={() => setActiveTab("payables")}
            className={`pb-3 border-b-2 transition ${
              activeTab === "payables"
                ? "border-burgundy-900 text-burgundy-950 font-bold"
                : "border-transparent text-charcoal-500 hover:text-charcoal-800"
            }`}
          >
            Supplier Payables Ledger ({payables.length})
          </button>
        </div>

        {/* Tab 1: Receivables */}
        {activeTab === "receivables" && (
          <div className="bg-white rounded-xl border border-charcoal-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-charcoal-800">
                <thead className="bg-ivory-100 text-charcoal-900 font-serif font-bold text-xs uppercase tracking-wider border-b border-charcoal-200">
                  <tr>
                    <th className="px-6 py-3.5">Customer / Organization</th>
                    <th className="px-6 py-3.5">Location</th>
                    <th className="px-6 py-3.5 text-right">Invoiced</th>
                    <th className="px-6 py-3.5 text-right">Paid</th>
                    <th className="px-6 py-3.5 text-right">Balance Due</th>
                    <th className="px-6 py-3.5 text-center">0–30d</th>
                    <th className="px-6 py-3.5 text-center">31–60d</th>
                    <th className="px-6 py-3.5 text-center">61–90d</th>
                    <th className="px-6 py-3.5 text-center">90+d</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100 font-mono text-xs">
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-charcoal-500 font-sans">
                        Loading customer receivables...
                      </td>
                    </tr>
                  ) : receivables.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-charcoal-500 font-sans">
                        No outstanding customer balances currently recorded.
                      </td>
                    </tr>
                  ) : (
                    receivables.map((r) => (
                      <tr key={r.customer_id} className="hover:bg-ivory-50 transition">
                        <td className="px-6 py-4 font-sans font-semibold text-charcoal-900">
                          {r.customer_name}
                          {r.company_name && (
                            <span className="block text-xs font-normal text-charcoal-500 font-sans">
                              {r.company_name}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-sans text-charcoal-600">
                          {r.city}, {r.state}
                        </td>
                        <td className="px-6 py-4 text-right text-charcoal-700">
                          {formatCurrency(r.total_invoiced)}
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-700">
                          {formatCurrency(r.total_paid)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-rose-700">
                          {formatCurrency(r.balance_due)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {Number(r.aging.current_0_30) > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                              {formatCurrency(r.aging.current_0_30)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {Number(r.aging.days_31_60) > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800">
                              {formatCurrency(r.aging.days_31_60)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {Number(r.aging.days_61_90) > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold">
                              {formatCurrency(r.aging.days_61_90)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {Number(r.aging.over_90_days) > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                              {formatCurrency(r.aging.over_90_days)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-sans">
                          <Link
                            href={`/admin/invoices?customer_id=${r.customer_id}`}
                            className="text-xs font-semibold text-burgundy-900 hover:underline"
                          >
                            View Invoices ({r.open_invoices_count})
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Payables */}
        {activeTab === "payables" && (
          <div className="bg-white rounded-xl border border-charcoal-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-charcoal-800">
                <thead className="bg-ivory-100 text-charcoal-900 font-serif font-bold text-xs uppercase tracking-wider border-b border-charcoal-200">
                  <tr>
                    <th className="px-6 py-3.5">Supplier Name</th>
                    <th className="px-6 py-3.5">Code</th>
                    <th className="px-6 py-3.5">Location</th>
                    <th className="px-6 py-3.5 text-right">Billed</th>
                    <th className="px-6 py-3.5 text-right">Disbursed</th>
                    <th className="px-6 py-3.5 text-right">Balance Due</th>
                    <th className="px-6 py-3.5 text-center">0–30d</th>
                    <th className="px-6 py-3.5 text-center">31–60d</th>
                    <th className="px-6 py-3.5 text-center">61–90d</th>
                    <th className="px-6 py-3.5 text-center">90+d</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100 font-mono text-xs">
                  {isLoading ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-charcoal-500 font-sans">
                        Loading supplier payables...
                      </td>
                    </tr>
                  ) : payables.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-charcoal-500 font-sans">
                        No outstanding supplier payables currently recorded.
                      </td>
                    </tr>
                  ) : (
                    payables.map((s) => (
                      <tr key={s.supplier_id} className="hover:bg-ivory-50 transition">
                        <td className="px-6 py-4 font-sans font-semibold text-charcoal-900">
                          {s.supplier_name}
                        </td>
                        <td className="px-6 py-4 text-charcoal-600 font-mono">
                          {s.supplier_code}
                        </td>
                        <td className="px-6 py-4 font-sans text-charcoal-600">
                          {s.location}
                        </td>
                        <td className="px-6 py-4 text-right text-charcoal-700">
                          {formatCurrency(s.total_billed)}
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-700">
                          {formatCurrency(s.total_paid)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-amber-900">
                          {formatCurrency(s.balance_due)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {Number(s.aging.current_0_30) > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                              {formatCurrency(s.aging.current_0_30)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {Number(s.aging.days_31_60) > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800">
                              {formatCurrency(s.aging.days_31_60)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {Number(s.aging.days_61_90) > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold">
                              {formatCurrency(s.aging.days_61_90)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {Number(s.aging.over_90_days) > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                              {formatCurrency(s.aging.over_90_days)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-sans">
                          <Link
                            href={`/admin/payments?supplier_id=${s.supplier_id}`}
                            className="text-xs font-semibold text-burgundy-900 hover:underline"
                          >
                            Pay / View Bills ({s.open_bills_count})
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

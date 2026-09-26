"use client";

import React, { useState, useEffect } from "react";
import { getDealerLedger } from "@/lib/api";
import { DealerLedgerStatement } from "@/lib/api/dealer";
import {
  FileText,
  Loader2,
  Receipt,
} from "lucide-react";

export default function DealerLedgerPage() {
  const [ledger, setLedger] = useState<DealerLedgerStatement | null>(null);
  const [activeTab, setActiveTab] = useState<"invoices" | "payments">("invoices");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLedger() {
      try {
        setIsLoading(true);
        const data = await getDealerLedger();
        setLedger(data);
      } catch (err) {
        console.error("Failed to load dealer ledger:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLedger();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-silk-red-600" />
      </div>
    );
  }

  const credit = ledger?.credit_summary;
  const invoices = ledger?.invoices || [];
  const payments = ledger?.payments || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-heritage-brown-950">Trade Credit & Financial Ledger</h1>
        <p className="text-xs sm:text-sm text-heritage-brown-600 mt-0.5 font-sans">
          Real-time statement of account: approved trade credit limits, tax invoices, and payment receipts
        </p>
      </div>

      {/* Credit Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[4px] p-5 border border-gold-300/60 shadow-sm">
          <p className="text-xs font-semibold text-heritage-brown-500 uppercase tracking-wider font-sans">Approved Credit Limit</p>
          <p className="text-xl font-serif font-bold text-heritage-brown-950 mt-1">
            INR {credit?.credit_limit.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "0.00"}
          </p>
          <p className="text-[11px] text-heritage-brown-500 mt-2 font-sans">Term: {credit?.credit_period_days || 30} Days Net</p>
        </div>

        <div className="bg-white rounded-[4px] p-5 border border-gold-300/60 shadow-sm">
          <p className="text-xs font-semibold text-heritage-brown-500 uppercase tracking-wider font-sans">Available Credit</p>
          <p className="text-xl font-serif font-bold text-emerald-800 mt-1">
            INR {credit?.available_credit.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "0.00"}
          </p>
          <p className="text-[11px] text-emerald-700 mt-2 font-semibold font-sans">Ready for new orders</p>
        </div>

        <div className="bg-white rounded-[4px] p-5 border border-gold-300/60 shadow-sm">
          <p className="text-xs font-semibold text-heritage-brown-500 uppercase tracking-wider font-sans">Current Outstanding</p>
          <p className="text-xl font-serif font-bold text-silk-red-600 mt-1">
            INR {credit?.outstanding_balance.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "0.00"}
          </p>
          <p className="text-[11px] text-silk-red-700 mt-2 font-semibold font-sans">{credit?.unpaid_invoices_count || 0} Open Invoices</p>
        </div>

        <div className="bg-white rounded-[4px] p-5 border border-gold-300/60 shadow-sm">
          <p className="text-xs font-semibold text-heritage-brown-500 uppercase tracking-wider font-sans">Settlement Status</p>
          <p className="text-xl font-serif font-bold text-heritage-brown-950 mt-1">
            {(credit?.outstanding_balance || 0) > 0 ? "Active Account" : "Settled Clean"}
          </p>
          <p className="text-[11px] text-heritage-brown-500 mt-2 font-sans">Remit via NEFT / RTGS</p>
        </div>
      </div>

      {/* Tabs & Ledger Tables */}
      <div className="bg-white rounded-[4px] border border-gold-300/60 shadow-sm overflow-hidden">
        <div className="border-b border-gold-200 px-6 pt-4 flex gap-6 font-sans">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`pb-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "invoices"
                ? "border-silk-red-600 text-silk-red-700 font-bold"
                : "border-transparent text-heritage-brown-500 hover:text-heritage-brown-950"
            }`}
          >
            <FileText className="w-4 h-4" /> Tax Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`pb-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "payments"
                ? "border-silk-red-600 text-silk-red-700 font-bold"
                : "border-transparent text-heritage-brown-500 hover:text-heritage-brown-950"
            }`}
          >
            <Receipt className="w-4 h-4" /> Payment Receipts ({payments.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "invoices" ? (
          invoices.length === 0 ? (
            <div className="p-12 text-center text-heritage-brown-500 text-sm font-sans">No invoices recorded for this account.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-sans">
                <thead className="bg-ivory-50 text-heritage-brown-700 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Invoice Number</th>
                    <th className="px-6 py-3.5">Issue Date</th>
                    <th className="px-6 py-3.5">Due Date</th>
                    <th className="px-6 py-3.5">Total Amount</th>
                    <th className="px-6 py-3.5">Paid</th>
                    <th className="px-6 py-3.5">Balance Due</th>
                    <th className="px-6 py-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gold-50/50">
                      <td className="px-6 py-4 font-mono font-bold text-silk-red-700">{inv.invoice_number}</td>
                      <td className="px-6 py-4 text-xs text-heritage-brown-600">{inv.issue_date || "-"}</td>
                      <td className="px-6 py-4 text-xs text-heritage-brown-600">{inv.due_date || "30 Days"}</td>
                      <td className="px-6 py-4 font-bold text-heritage-brown-950">
                        INR {inv.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-emerald-800 font-semibold text-xs">
                        INR {inv.amount_paid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 font-bold text-silk-red-700 text-xs">
                        INR {inv.balance_due.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-[4px] text-xs font-semibold ${
                            inv.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : inv.status === "PARTIALLY_PAID"
                              ? "bg-gold-50 text-gold-900 border border-gold-300"
                              : "bg-ivory-200 text-heritage-brown-700"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          payments.length === 0 ? (
            <div className="p-12 text-center text-heritage-brown-500 text-sm font-sans">No payment receipts recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-sans">
                <thead className="bg-ivory-50 text-heritage-brown-700 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Receipt / Payment No</th>
                    <th className="px-6 py-3.5">Payment Date</th>
                    <th className="px-6 py-3.5">Method</th>
                    <th className="px-6 py-3.5">Reference / UTR</th>
                    <th className="px-6 py-3.5">Amount (INR)</th>
                    <th className="px-6 py-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gold-50/50">
                      <td className="px-6 py-4 font-mono font-bold text-silk-red-700">{p.payment_number}</td>
                      <td className="px-6 py-4 text-xs text-heritage-brown-600">{p.payment_date || "-"}</td>
                      <td className="px-6 py-4 text-xs text-heritage-brown-950 font-medium">{p.payment_method}</td>
                      <td className="px-6 py-4 font-mono text-xs text-heritage-brown-600">{p.reference_number || "-"}</td>
                      <td className="px-6 py-4 font-bold text-emerald-800">
                        INR {p.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-[4px] text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {p.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}

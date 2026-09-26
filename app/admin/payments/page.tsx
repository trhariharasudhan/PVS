"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  getAdminPayments,
  updateAdminPayment,
} from "@/lib/api/admin";
import {
  AdminPaymentList,
  PaymentType,
  PaymentMethod,
  PaymentRecordStatus,
} from "@/types";
import {
  CreditCard,
  Plus,
  Search,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Building2,
  User as UserIcon,
} from "lucide-react";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPaymentList[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminPayments({
        page,
        limit: 15,
        search: search.trim() || undefined,
        payment_type: typeFilter || undefined,
        payment_status: statusFilter || undefined,
      });
      setPayments(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, typeFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPayments();
  };

  const handleUpdateStatus = async (
    paymentId: string,
    newStatus: PaymentRecordStatus
  ) => {
    try {
      await updateAdminPayment(paymentId, { payment_status: newStatus });
      fetchPayments();
    } catch (err) {
      console.error("Failed to update payment status:", err);
    }
  };

  const statusStyles: Record<string, string> = {
    RECORDED: "bg-amber-100 text-amber-900 ring-1 ring-amber-400",
    CLEARED: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-400",
    BOUNCED_FAILED: "bg-red-100 text-red-900 ring-1 ring-red-400",
    VOID: "bg-charcoal-100 text-charcoal-500",
  };

  const methodLabels: Record<string, string> = {
    BANK_TRANSFER_NEFT_RTGS: "NEFT / RTGS",
    UPI: "UPI Transfer",
    CHEQUE: "Bank Cheque",
    CASH: "Cash Voucher",
    TRADE_CREDIT: "Trade Credit",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950 flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-gold-600" />
            <span>Payments & Financial Ledger</span>
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Tracking inbound client remittances and outbound supplier disbursements with audit references.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/payments/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
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
              placeholder="Search by payment number, UTR reference, customer, or mill..."
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
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-charcoal-200 rounded-sm px-2.5 py-2 bg-white focus:outline-none focus:border-burgundy-900"
          >
            <option value="">All Payment Types</option>
            <option value="INBOUND_CUSTOMER_PAYMENT">Inbound Receipts (Customers)</option>
            <option value="OUTBOUND_SUPPLIER_PAYMENT">Outbound Disbursements (Suppliers)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-charcoal-200 rounded-sm px-2.5 py-2 bg-white focus:outline-none focus:border-burgundy-900"
          >
            <option value="">All Statuses</option>
            <option value="RECORDED">Recorded</option>
            <option value="CLEARED">Cleared</option>
            <option value="BOUNCED_FAILED">Bounced / Failed</option>
            <option value="VOID">Void</option>
          </select>

          <button
            onClick={fetchPayments}
            className="p-2 border border-gold-300 rounded-sm hover:bg-gold-50 text-charcoal-600"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-burgundy-900 animate-spin" />
            <p className="text-xs font-semibold text-charcoal-500 font-mono">
              Loading Financial Transactions...
            </p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="w-12 h-12 text-charcoal-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-burgundy-950">No Payment Records Found</p>
            <p className="text-xs text-charcoal-500 mt-1 max-w-sm mx-auto">
              No payment transactions match your filters. Click "Record Payment" to record a customer remittance or supplier payment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-ivory-100 border-b border-gold-200 text-charcoal-600 uppercase tracking-wider text-[10px] font-mono">
                  <th className="py-3 px-4">Payment #</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Party & Linkage</th>
                  <th className="py-3 px-4">Method & Reference</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {payments.map((p) => {
                  const isInbound = p.payment_type === "INBOUND_CUSTOMER_PAYMENT";

                  return (
                    <tr key={p.id} className="hover:bg-ivory-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-burgundy-900 text-[11px]">
                        {p.payment_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isInbound
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {isInbound ? (
                            <>
                              <ArrowDownLeft className="w-3 h-3 text-emerald-700" />
                              <span>Receipt (Inbound)</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3 h-3 text-amber-700" />
                              <span>Disbursement (Outbound)</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-charcoal-900">{p.party_name}</div>
                        <div className="text-[10px] text-charcoal-500 font-mono">
                          {p.order_id && <span>Linked to Order</span>}
                          {p.purchase_order_id && <span>Linked to PO</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-charcoal-800">
                          {methodLabels[p.payment_method] || p.payment_method}
                        </div>
                        <span className="font-mono text-[10px] text-charcoal-500 block">
                          Ref: {p.reference_transaction_id || "Direct Transfer"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-charcoal-600">
                        {p.payment_date}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm">
                        <span className={isInbound ? "text-emerald-800" : "text-charcoal-900"}>
                          {isInbound ? "+" : "-"}₹{Number(p.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            statusStyles[p.payment_status] || "bg-charcoal-100 text-charcoal-700"
                          }`}
                        >
                          {p.payment_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {p.payment_status === "RECORDED" ? (
                          <button
                            onClick={() => handleUpdateStatus(p.id, "CLEARED")}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded text-[11px] border border-emerald-300"
                          >
                            Mark Cleared
                          </button>
                        ) : (
                          <span className="text-[11px] text-charcoal-400 font-mono">Settled</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gold-200 flex items-center justify-between text-xs">
            <span className="text-charcoal-500">
              Showing page {page} of {totalPages} ({total} transactions total)
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

"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Receipt,
  ArrowLeft,
  FileDown,
  CreditCard,
  Building2,
  Calendar,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  Ban,
  ShieldCheck,
  Printer,
} from "lucide-react";
import {
  getAdminInvoice,
  getAdminInvoicePdfDownloadUrl,
  recordAdminInvoicePayment,
  updateAdminInvoiceStatus,
} from "@/lib/api/admin";
import { siteConfig } from "@/config/site";
import {
  AdminInvoiceDetail,
  InvoiceStatus,
  PaymentMethod,
} from "@/types";

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminInvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [invoice, setInvoice] = useState<AdminInvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment Recording Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("BANK_TRANSFER_NEFT_RTGS");
  const [payReference, setPayReference] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payNotes, setPayNotes] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const loadInvoice = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminInvoice(id);
      setInvoice(data);
      setPayAmount(Number(data.balance_due) || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load invoice details.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) {
      setPaymentError("Payment amount must be greater than zero.");
      return;
    }

    setIsSubmittingPayment(true);
    setPaymentError(null);

    try {
      await recordAdminInvoicePayment(id, {
        amount: payAmount,
        payment_method: payMethod,
        reference_transaction_id: payReference || undefined,
        payment_date: payDate,
        notes: payNotes || undefined,
      });
      setIsPaymentModalOpen(false);
      loadInvoice();
    } catch (err: any) {
      setPaymentError(err.message || "Failed to record payment.");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleStatusChange = async (newStatus: InvoiceStatus) => {
    if (!confirm(`Are you sure you want to mark this invoice as ${newStatus}?`)) return;
    try {
      await updateAdminInvoiceStatus(id, { status: newStatus });
      loadInvoice();
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
    }
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-4 h-4" /> Paid & Cleared
          </span>
        );
      case "PARTIALLY_PAID":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-4 h-4" /> Partially Settled
          </span>
        );
      case "ISSUED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Receipt className="w-4 h-4" /> Issued & Unpaid
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-4 h-4" /> Overdue
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-charcoal-100 text-charcoal-700 border border-charcoal-300">
            <Ban className="w-4 h-4" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300">
            Draft
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center text-charcoal-600">
        Loading invoice details...
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error || "Invoice not found."}</span>
        </div>
        <Link
          href="/admin/invoices"
          className="inline-flex items-center gap-2 text-sm font-semibold text-burgundy-900"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Invoices
        </Link>
      </div>
    );
  }

  const pdfUrl = getAdminInvoicePdfDownloadUrl(invoice.id);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-charcoal-200 pb-4">
        <Link
          href="/admin/invoices"
          className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal-600 hover:text-burgundy-950 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 text-sm font-semibold shadow-sm transition"
            >
              <CreditCard className="w-4 h-4" />
              Record Payment
            </button>
          )}

          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-burgundy-900 text-gold-300 hover:bg-burgundy-950 text-sm font-semibold shadow-sm transition"
          >
            <FileDown className="w-4 h-4" />
            Download Official PDF
          </a>

          {invoice.status !== "CANCELLED" && invoice.status !== "PAID" && (
            <button
              onClick={() => handleStatusChange("CANCELLED")}
              className="px-3 py-2 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition"
            >
              Cancel Invoice
            </button>
          )}
        </div>
      </div>

      {/* Invoice Document Box */}
      <div className="bg-white rounded-2xl border border-charcoal-200 shadow-md p-8 space-y-8 print:border-none print:shadow-none">
        {/* Header Branding */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-gold-500/30 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gold-600 block">
              {siteConfig.tagline}
            </span>
            <h1 className="font-serif text-3xl font-bold text-burgundy-950">
              {siteConfig.business.name.toUpperCase()}
            </h1>
            <p className="text-xs text-charcoal-600 mt-1 max-w-sm">
              {siteConfig.business.category}
              <br />
              {siteConfig.business.address.full}
            </p>
            <div className="text-xs font-mono text-charcoal-700 mt-2 space-y-0.5">
              <div>
                <strong>GSTIN:</strong> {siteConfig.business.gstinPlaceholder}
              </div>
              <div>
                <strong>State:</strong> {siteConfig.business.address.state} (Code: 33)
              </div>
            </div>
          </div>

          <div className="text-left md:text-right space-y-2">
            <div className="inline-block">{getStatusBadge(invoice.status)}</div>
            <div className="text-xl font-bold font-mono text-burgundy-900">
              {invoice.invoice_number}
            </div>
            <div className="text-xs text-charcoal-600 space-y-1">
              <div>
                <strong>Document:</strong> {invoice.invoice_type.replace(/_/g, " ")}
              </div>
              <div>
                <strong>Date:</strong> {new Date(invoice.invoice_date).toLocaleDateString("en-IN")}
              </div>
              {invoice.due_date && (
                <div>
                  <strong>Due Date:</strong>{" "}
                  {new Date(invoice.due_date).toLocaleDateString("en-IN")}
                </div>
              )}
              {invoice.order_number && (
                <div>
                  <strong>Order Ref:</strong> {invoice.order_number}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bill To & Dispatch Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-ivory-50 p-6 rounded-xl border border-charcoal-200">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-burgundy-900 mb-2">
              Billed To (Client / Consignee)
            </h3>
            <div className="text-sm font-semibold text-charcoal-900">
              {invoice.customer_name || invoice.party_name}
            </div>
            {invoice.customer_address && (
              <p className="text-xs text-charcoal-600 mt-1">{invoice.customer_address}</p>
            )}
            {invoice.customer_phone && (
              <p className="text-xs text-charcoal-600 mt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {invoice.customer_phone}
              </p>
            )}
            {invoice.customer_gstin && (
              <p className="text-xs font-mono font-semibold text-burgundy-900 mt-2">
                GSTIN: {invoice.customer_gstin}
              </p>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-burgundy-900 mb-2">
              Supply & Tax Details
            </h3>
            <div className="text-xs text-charcoal-700 space-y-1.5">
              <div>
                <strong>Place of Supply:</strong> {invoice.place_of_supply}
              </div>
              <div>
                <strong>Tax Structure:</strong>{" "}
                {invoice.is_inter_state ? "Inter-State (IGST 5%)" : "Intra-State (CGST 2.5% + SGST 2.5%)"}
              </div>
              {invoice.notes && (
                <div className="pt-1">
                  <strong>Notes:</strong> {invoice.notes}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-charcoal-800">
            <thead className="bg-ivory-100 text-charcoal-900 font-serif font-bold text-xs uppercase tracking-wider border-b border-charcoal-200">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Item Description</th>
                <th className="px-4 py-3">HSN/SAC</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-right">Unit Rate</th>
                <th className="px-4 py-3 text-right">Taxable</th>
                <th className="px-4 py-3 text-right">GST</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100">
              {invoice.items.map((it, idx) => (
                <tr key={it.id || idx}>
                  <td className="px-4 py-3 font-mono text-xs text-charcoal-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-charcoal-900">{it.item_description}</td>
                  <td className="px-4 py-3 font-mono text-xs text-charcoal-600">{it.hsn_sac_code}</td>
                  <td className="px-4 py-3 text-center font-mono text-xs">
                    {Number(it.quantity)} {it.unit_of_measure}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {formatCurrency(it.unit_price)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {formatCurrency(it.taxable_amount)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {Number(it.gst_rate)}% ({formatCurrency(it.tax_amount)})
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-charcoal-900">
                    {formatCurrency(it.total_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Totals & Tax Calculation Breakdown */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-t border-charcoal-200 pt-6">
          <div className="max-w-sm text-xs text-charcoal-600 space-y-2">
            <h4 className="font-bold text-burgundy-900 uppercase tracking-wider">
              Terms & Bank Remittance Instructions
            </h4>
            <p className="whitespace-pre-line">{invoice.terms_and_conditions}</p>
            <div className="p-3 bg-ivory-100 rounded-lg border border-gold-400/40 text-[11px] font-mono mt-3">
              <div><strong>Bank:</strong> {siteConfig.bank.name} ({siteConfig.bank.branch})</div>
              <div><strong>A/C Name:</strong> {siteConfig.bank.accountName}</div>
              <div><strong>A/C No:</strong> {siteConfig.bank.accountNumber}</div>
              <div><strong>IFSC:</strong> {siteConfig.bank.ifsc}</div>
              <div><strong>UPI:</strong> {siteConfig.bank.upiId}</div>
            </div>
          </div>

          <div className="w-full md:w-80 bg-ivory-50 p-5 rounded-xl border border-charcoal-200 space-y-2.5 font-mono text-sm">
            <div className="flex justify-between text-charcoal-700">
              <span>Subtotal (Taxable):</span>
              <span>{formatCurrency(invoice.subtotal_amount)}</span>
            </div>

            {invoice.is_inter_state ? (
              <div className="flex justify-between text-charcoal-600 text-xs">
                <span>IGST ({Number(invoice.igst_rate)}%):</span>
                <span>{formatCurrency(invoice.igst_amount)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-charcoal-600 text-xs">
                  <span>CGST ({Number(invoice.cgst_rate)}%):</span>
                  <span>{formatCurrency(invoice.cgst_amount)}</span>
                </div>
                <div className="flex justify-between text-charcoal-600 text-xs">
                  <span>SGST ({Number(invoice.sgst_rate)}%):</span>
                  <span>{formatCurrency(invoice.sgst_amount)}</span>
                </div>
              </>
            )}

            <div className="flex justify-between font-bold text-base text-charcoal-900 border-t border-charcoal-200 pt-2">
              <span>Invoice Total:</span>
              <span className="text-burgundy-950">{formatCurrency(invoice.total_amount)}</span>
            </div>

            <div className="flex justify-between text-emerald-700 text-xs pt-1">
              <span>Amount Paid:</span>
              <span>{formatCurrency(invoice.paid_amount)}</span>
            </div>

            <div className="flex justify-between font-bold text-sm border-t border-charcoal-200 pt-2">
              <span className={Number(invoice.balance_due) > 0 ? "text-rose-700" : "text-emerald-700"}>
                Balance Due:
              </span>
              <span className={Number(invoice.balance_due) > 0 ? "text-rose-700" : "text-emerald-700"}>
                {formatCurrency(invoice.balance_due)}
              </span>
            </div>
          </div>
        </div>

        {/* Payments Ledger */}
        <div className="border-t border-charcoal-200 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-burgundy-950 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-burgundy-900" />
              Remittance & Settlement History
            </h3>
            {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                + Record New Payment
              </button>
            )}
          </div>

          {invoice.payments && invoice.payments.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-charcoal-200">
              <table className="w-full text-left text-xs text-charcoal-800">
                <thead className="bg-ivory-100 font-bold uppercase tracking-wider text-charcoal-700">
                  <tr>
                    <th className="px-4 py-2.5">Payment #</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Method</th>
                    <th className="px-4 py-2.5">UTR / Txn Ref</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100 font-mono">
                  {invoice.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-ivory-50">
                      <td className="px-4 py-2.5 font-bold text-burgundy-900">{p.payment_number}</td>
                      <td className="px-4 py-2.5">{new Date(p.payment_date).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-2.5 font-sans">{p.payment_method.replace(/_/g, " ")}</td>
                      <td className="px-4 py-2.5 text-charcoal-600">{p.reference_transaction_id || "—"}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-emerald-700">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-charcoal-500 italic">
              No payments recorded against this invoice yet.
            </p>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gold-500/30">
            <div className="flex items-center justify-between border-b border-charcoal-100 pb-3 mb-4">
              <h3 className="font-serif text-lg font-bold text-burgundy-950">
                Record Invoice Payment
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-600 font-bold"
              >
                ✕
              </button>
            </div>

            {paymentError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={Number(invoice.balance_due)}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  required
                  className="w-full py-2 px-3 text-sm font-mono border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-900/20"
                />
                <p className="text-[11px] text-charcoal-500 mt-1 font-mono">
                  Remaining balance due: {formatCurrency(invoice.balance_due)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Payment Method *
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full py-2 px-3 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-900/20"
                >
                  <option value="BANK_TRANSFER_NEFT_RTGS">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="UPI">UPI / QR Payment</option>
                  <option value="CHEQUE">Cheque / Demand Draft</option>
                  <option value="CASH">Cash Remittance</option>
                  <option value="TRADE_CREDIT">Trade Credit Settlement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Bank UTR / Transaction ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-2026-990182"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="w-full py-2 px-3 text-sm font-mono border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-900/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  required
                  className="w-full py-2 px-3 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-900/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Advance remittance received"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full py-2 px-3 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-900/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-charcoal-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold border border-charcoal-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-5 py-2 text-sm font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-50"
                >
                  {isSubmittingPayment ? "Recording..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

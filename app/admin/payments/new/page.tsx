"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getAdminCustomers,
  getAdminSuppliers,
  createAdminPayment,
} from "@/lib/api/admin";
import {
  AdminCustomerList,
  AdminSupplierList,
  PaymentType,
  PaymentMethod,
  PaymentRecordStatus,
} from "@/types";
import {
  CreditCard,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  Building2,
  User as UserIcon,
} from "lucide-react";

function PaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [paymentType, setPaymentType] = useState<PaymentType>(
    (searchParams.get("supplier_id")
      ? "OUTBOUND_SUPPLIER_PAYMENT"
      : "INBOUND_CUSTOMER_PAYMENT") as PaymentType
  );

  const [customers, setCustomers] = useState<AdminCustomerList[]>([]);
  const [suppliers, setSuppliers] = useState<AdminSupplierList[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form Fields
  const [customerId, setCustomerId] = useState(searchParams.get("customer_id") || "");
  const [supplierId, setSupplierId] = useState(searchParams.get("supplier_id") || "");
  const [orderId, setOrderId] = useState(searchParams.get("order_id") || "");
  const [purchaseOrderId, setPurchaseOrderId] = useState(searchParams.get("po_id") || "");
  const [amount, setAmount] = useState<number>(Number(searchParams.get("amount")) || 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BANK_TRANSFER_NEFT_RTGS");
  const [paymentStatus, setPaymentStatus] = useState<PaymentRecordStatus>("RECORDED");
  const [referenceTransactionId, setReferenceTransactionId] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadParties() {
      setIsLoadingData(true);
      try {
        const [custRes, supRes] = await Promise.all([
          getAdminCustomers({ limit: 100 }),
          getAdminSuppliers({ limit: 100, is_active: true }),
        ]);
        setCustomers(custRes.items);
        setSuppliers(supRes.items);
      } catch (err) {
        console.error("Failed to load customer/supplier list:", err);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadParties();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError("Payment amount must be greater than zero.");
      return;
    }

    if (paymentType === "INBOUND_CUSTOMER_PAYMENT" && !customerId) {
      setError("Please select a customer for this inbound remittance.");
      return;
    }

    if (paymentType === "OUTBOUND_SUPPLIER_PAYMENT" && !supplierId) {
      setError("Please select a supplier for this outbound disbursement.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createAdminPayment({
        payment_type: paymentType,
        customer_id: paymentType === "INBOUND_CUSTOMER_PAYMENT" ? customerId || undefined : undefined,
        supplier_id: paymentType === "OUTBOUND_SUPPLIER_PAYMENT" ? supplierId || undefined : undefined,
        order_id: orderId || undefined,
        purchase_order_id: purchaseOrderId || undefined,
        amount: Number(amount),
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        reference_transaction_id: referenceTransactionId.trim() || undefined,
        payment_date: paymentDate,
        notes: notes.trim() || undefined,
      });

      router.push("/admin/payments");
    } catch (err: any) {
      setError(err?.message || "Failed to record payment transaction.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back Button */}
      <div>
        <Link
          href="/admin/payments"
          className="inline-flex items-center gap-1.5 text-xs text-burgundy-900 font-semibold hover:underline mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Payments Ledger</span>
        </Link>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950 flex items-center gap-2.5">
          <CreditCard className="w-7 h-7 text-gold-600" />
          <span>Record Payment Transaction</span>
        </h1>
        <p className="text-xs text-charcoal-500 mt-1">
          Log NEFT/RTGS, UPI, or cheque payment vouchers against wholesale orders and mill consignments.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-sm text-xs text-red-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoadingData ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-burgundy-900 animate-spin" />
          <p className="text-xs font-semibold text-charcoal-500 font-mono">
            Loading Customer & Supplier Directory...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-gold-300/80 rounded-sm p-6 shadow-sm space-y-5 text-xs">
          {/* Payment Type Selection */}
          <div>
            <label className="block font-semibold text-charcoal-700 mb-1.5">
              Payment Direction / Flow *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentType("INBOUND_CUSTOMER_PAYMENT")}
                className={`p-3 rounded-sm border text-left flex flex-col justify-between transition-all ${
                  paymentType === "INBOUND_CUSTOMER_PAYMENT"
                    ? "bg-emerald-50/70 border-emerald-600 ring-1 ring-emerald-600"
                    : "bg-white border-charcoal-200 hover:border-gold-300"
                }`}
              >
                <span className="font-bold text-emerald-950 text-xs">Inbound Client Receipt</span>
                <span className="text-[11px] text-charcoal-500 mt-1">
                  Customer advance or order invoice settlement
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType("OUTBOUND_SUPPLIER_PAYMENT")}
                className={`p-3 rounded-sm border text-left flex flex-col justify-between transition-all ${
                  paymentType === "OUTBOUND_SUPPLIER_PAYMENT"
                    ? "bg-amber-50/70 border-amber-600 ring-1 ring-amber-600"
                    : "bg-white border-charcoal-200 hover:border-gold-300"
                }`}
              >
                <span className="font-bold text-amber-950 text-xs">Outbound Supplier Payment</span>
                <span className="text-[11px] text-charcoal-500 mt-1">
                  Yarn mill, zari guild, or supplier disbursement
                </span>
              </button>
            </div>
          </div>

          {/* Party Selection */}
          {paymentType === "INBOUND_CUSTOMER_PAYMENT" ? (
            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">
                Target Customer *
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full p-2.5 border border-charcoal-200 rounded-sm bg-white focus:border-burgundy-900 focus:outline-none"
              >
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} {c.company_name ? `(${c.company_name})` : ""} — {c.city}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">
                Target Supplier / Mill *
              </label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full p-2.5 border border-charcoal-200 rounded-sm bg-white focus:border-burgundy-900 focus:outline-none"
              >
                <option value="">Select Verified Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.supplier_name} ({s.supplier_code}) — {s.location}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount & Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">
                Transaction Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="e.g. 50000.00"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-2.5 border border-charcoal-200 rounded-sm font-mono text-sm font-bold focus:border-burgundy-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full p-2.5 border border-charcoal-200 rounded-sm bg-white focus:border-burgundy-900 focus:outline-none"
              >
                <option value="BANK_TRANSFER_NEFT_RTGS">Bank Transfer (NEFT / RTGS)</option>
                <option value="UPI">UPI Direct Remittance</option>
                <option value="CHEQUE">Bank Cheque / DD</option>
                <option value="CASH">Cash Voucher</option>
                <option value="TRADE_CREDIT">Trade Credit Ledger</option>
              </select>
            </div>
          </div>

          {/* Reference ID & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">
                Reference UTR / Cheque #
              </label>
              <input
                type="text"
                placeholder="e.g. UTR-AXIS-2026-99482 or CHQ-004821"
                value={referenceTransactionId}
                onChange={(e) => setReferenceTransactionId(e.target.value)}
                className="w-full p-2.5 border border-charcoal-200 rounded-sm font-mono focus:border-burgundy-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full p-2.5 border border-charcoal-200 rounded-sm focus:border-burgundy-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Clearance Status */}
          <div>
            <label className="block font-semibold text-charcoal-700 mb-1">
              Initial Clearance Status *
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentRecordStatus)}
              className="w-full p-2.5 border border-charcoal-200 rounded-sm bg-white focus:border-burgundy-900 focus:outline-none"
            >
              <option value="RECORDED">RECORDED (Pending Bank Statement Reconciliation)</option>
              <option value="CLEARED">CLEARED (Verified in Bank Account)</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-charcoal-700 mb-1">
              Transaction Notes & Internal Memo
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Advance payment 30% for Diwali wholesale order consignment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 border border-charcoal-200 rounded-sm focus:border-burgundy-900 focus:outline-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gold-200">
            <Link
              href="/admin/payments"
              className="px-4 py-2 border border-charcoal-300 rounded-sm font-semibold text-charcoal-700 hover:bg-charcoal-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 font-semibold uppercase tracking-wider rounded-sm disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? "Recording Transaction..." : "Save Payment Record"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function NewPaymentPage() {
  return (
    <Suspense fallback={
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-burgundy-900 animate-spin" />
        <p className="text-xs font-semibold text-charcoal-500 font-mono">Loading Payment Form...</p>
      </div>
    }>
      <PaymentForm />
    </Suspense>
  );
}

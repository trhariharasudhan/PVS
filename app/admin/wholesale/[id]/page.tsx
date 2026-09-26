"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAdminWholesaleEnquiry,
  updateAdminWholesaleEnquiry,
  convertAdminWholesaleToOrder,
  getAdminProducts,
} from "@/lib/api";
import {
  AdminWholesaleEnquiryDetail,
  CRMEnquiryStatus,
  AdminProductList,
  AdminOrderItemCreatePayload,
} from "@/types";
import {
  Store,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Save,
  ShoppingBag,
  PlusCircle,
  Trash2,
  ArrowRight,
} from "lucide-react";

export default function AdminWholesaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const enquiryId = params.id as string;

  const [enquiry, setEnquiry] = useState<AdminWholesaleEnquiryDetail | null>(null);
  const [products, setProducts] = useState<AdminProductList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // CRM status edit
  const [status, setStatus] = useState<CRMEnquiryStatus>("NEW");
  const [messageNotes, setMessageNotes] = useState<string>("");
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  // Convert to Order Modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertItems, setConvertItems] = useState<AdminOrderItemCreatePayload[]>([
    { product_id: "", quantity: 10, unit_price: 0, custom_colorway_notes: "" },
  ]);
  const [convertNotes, setConvertNotes] = useState<string>("");
  const [isConverting, setIsConverting] = useState(false);

  const fetchEnquiry = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [enqData, prodData] = await Promise.all([
        getAdminWholesaleEnquiry(enquiryId),
        getAdminProducts({ limit: 100, is_active: true }),
      ]);
      setEnquiry(enqData);
      setStatus(enqData.status);
      setMessageNotes(enqData.message || "");
      setProducts(prodData.items);
    } catch (err: any) {
      console.error("Failed to load enquiry:", err);
      setError(err?.message || "Failed to load wholesale lead detail.");
    } finally {
      setIsLoading(false);
    }
  }, [enquiryId]);

  useEffect(() => {
    fetchEnquiry();
  }, [fetchEnquiry]);

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStatus(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const updated = await updateAdminWholesaleEnquiry(enquiryId, {
        status,
        message: messageNotes.trim() || undefined,
      });
      setEnquiry(updated);
      setSuccessMsg("Wholesale CRM pipeline status updated.");
    } catch (err: any) {
      setError(err?.message || "Failed to update CRM status.");
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleAddConvertItem = () => {
    setConvertItems([
      ...convertItems,
      { product_id: "", quantity: 10, unit_price: 0, custom_colorway_notes: "" },
    ]);
  };

  const handleRemoveConvertItem = (idx: number) => {
    if (convertItems.length <= 1) return;
    setConvertItems(convertItems.filter((_, i) => i !== idx));
  };

  const handleConvertProductChange = (idx: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    const updated = [...convertItems];
    updated[idx] = {
      ...updated[idx],
      product_id: prodId,
      unit_price: prod && prod.price ? Number(prod.price) : 0,
    };
    setConvertItems(updated);
  };

  const handleConvertOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const invalid = convertItems.find((it) => !it.product_id || it.quantity < 1);
    if (invalid) {
      setError("Please select a valid saree product and quantity for each line item.");
      return;
    }

    setIsConverting(true);
    try {
      const order = await convertAdminWholesaleToOrder(enquiryId, {
        items: convertItems.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          unit_price: it.unit_price,
          custom_colorway_notes: it.custom_colorway_notes?.trim() || undefined,
        })),
        order_type: "WHOLESALE_BULK",
        notes: convertNotes.trim() || undefined,
      });

      setShowConvertModal(false);
      router.push(`/admin/orders/${order.id}`);
    } catch (err: any) {
      console.error("Conversion failed:", err);
      setError(err?.message || "Failed to convert wholesale lead to sales order.");
      setIsConverting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-burgundy-900 animate-spin" />
        <span className="text-xs font-mono text-charcoal-500">Loading wholesale lead...</span>
      </div>
    );
  }

  if (!enquiry) {
    return (
      <div className="py-16 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="font-serif text-lg font-bold text-burgundy-950">
          Wholesale Lead Not Found
        </h3>
        <Link
          href="/admin/wholesale"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-burgundy-900 text-gold-200 rounded text-xs font-semibold uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Wholesale CRM</span>
        </Link>
      </div>
    );
  }

  const isConverted = enquiry.status === "CONVERTED_TO_ORDER";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/wholesale"
            className="p-2 text-charcoal-500 hover:text-burgundy-950 hover:bg-gold-50 rounded-sm border border-gold-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-burgundy-950">
                {enquiry.business_name}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                  isConverted
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    : enquiry.status === "REJECTED"
                    ? "bg-charcoal-100 text-charcoal-600 border border-charcoal-300"
                    : enquiry.status === "NEW"
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : "bg-blue-100 text-blue-900 border border-blue-300"
                }`}
              >
                {enquiry.status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Contact: <strong>{enquiry.contact_person}</strong> ({enquiry.phone}) • Received on{" "}
              {new Date(enquiry.created_at).toLocaleDateString("en-IN", { dateStyle: "long" })}
            </p>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2">
          {!isConverted ? (
            <button
              onClick={() => setShowConvertModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Convert to Wholesale Order</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded text-xs font-semibold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Converted to Order</span>
            </div>
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

      {/* Grid: Trade Lead Profile & CRM Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Lead Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gold-200/60">
              <Building className="w-4 h-4 text-burgundy-900" />
              <h3 className="font-serif text-sm font-bold text-burgundy-950">
                Showroom & Business Requirements
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-charcoal-400 block text-[10px] uppercase font-semibold">
                  Business Entity
                </span>
                <span className="font-bold text-charcoal-900 text-sm">
                  {enquiry.business_name}
                </span>
              </div>

              <div>
                <span className="text-charcoal-400 block text-[10px] uppercase font-semibold">
                  Business Model
                </span>
                <span className="px-2 py-0.5 bg-ivory-100 rounded text-[10px] font-bold border border-gold-300">
                  {enquiry.business_type}
                </span>
              </div>

              <div>
                <span className="text-charcoal-400 block text-[10px] uppercase font-semibold">
                  Estimated Monthly Volume
                </span>
                <span className="font-mono font-bold text-burgundy-950 text-sm">
                  {enquiry.expected_quantity || "Unspecified"}
                </span>
              </div>

              <div>
                <span className="text-charcoal-400 block text-[10px] uppercase font-semibold">
                  Number of Retail Stores
                </span>
                <span className="font-semibold text-charcoal-800">
                  {enquiry.number_of_stores || "1 store"}
                </span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-charcoal-400 block text-[10px] uppercase font-semibold">
                  Interested Saree Collection
                </span>
                <span className="font-medium text-charcoal-900">
                  {enquiry.interested_collection || "All Handloom Kanchipuram Collections"}
                </span>
              </div>

              {enquiry.message && (
                <div className="sm:col-span-2 pt-2 border-t border-gold-200/60">
                  <span className="text-charcoal-400 block text-[10px] uppercase font-semibold mb-1">
                    Inbound Enquiry Message
                  </span>
                  <div className="p-3 bg-ivory-50/70 border border-gold-200 rounded text-charcoal-800 whitespace-pre-wrap leading-relaxed">
                    {enquiry.message}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CRM Stage & Pipeline Actions */}
          <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gold-200/60">
              <FileText className="w-4 h-4 text-burgundy-900" />
              <h3 className="font-serif text-sm font-bold text-burgundy-950">
                Pipeline Progression & Negotiation Notes
              </h3>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                  Current CRM Stage
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CRMEnquiryStatus)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900"
                >
                  <option value="NEW">New Trade Lead</option>
                  <option value="CONTACTED">Contacted / Call Scheduled</option>
                  <option value="CATALOGUE_SENT">Lookbook / Catalogue Sent</option>
                  <option value="NEGOTIATING">Price & MOQ Negotiating</option>
                  <option value="CONVERTED_TO_ORDER">Converted to Sales Order</option>
                  <option value="REJECTED">Declined / Closed</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                  Internal Negotiation Remarks / Call Logs
                </label>
                <textarea
                  rows={3}
                  value={messageNotes}
                  onChange={(e) => setMessageNotes(e.target.value)}
                  placeholder="Record discussions on wholesale MOQ, discount percentages, or colorway customization..."
                  className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingStatus}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-charcoal-800 hover:bg-charcoal-900 text-gold-200 text-xs font-semibold rounded-sm disabled:opacity-50 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingStatus ? "Saving..." : "Update CRM Stage"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Contact Profile */}
        <div className="space-y-6">
          <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gold-200/60">
              <User className="w-4 h-4 text-burgundy-900" />
              <h3 className="font-serif text-sm font-bold text-burgundy-950">
                Contact Person Details
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-charcoal-400 block text-[10px] uppercase font-semibold">
                  Contact Name
                </span>
                <span className="font-bold text-charcoal-900 text-sm">
                  {enquiry.contact_person}
                </span>
              </div>

              <div className="space-y-2 pt-2 border-t border-gold-200/60">
                <div className="flex items-center gap-2 text-charcoal-700">
                  <Phone className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                  <span className="font-mono font-medium">{enquiry.phone}</span>
                </div>

                {enquiry.email && (
                  <div className="flex items-center gap-2 text-charcoal-700">
                    <Mail className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                    <span>{enquiry.email}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-charcoal-700">
                  <MapPin className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                  <span>{enquiry.city}, Tamil Nadu</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Convert to Wholesale Order Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-charcoal-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gold-300 rounded-sm shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gold-200">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-burgundy-900" />
                <h3 className="font-serif text-lg font-bold text-burgundy-950">
                  Convert Wholesale Lead to Order
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConvertModal(false)}
                className="text-charcoal-400 hover:text-charcoal-800 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-charcoal-600">
              This will automatically provision a Customer record for <strong>{enquiry.business_name}</strong>,
              generate a Wholesale Bulk Order, snapshot agreed unit prices, and lock inventory stock.
            </p>

            <form onSubmit={handleConvertOrderSubmit} className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-charcoal-700">
                    Wholesale Line Items
                  </span>
                  <button
                    type="button"
                    onClick={handleAddConvertItem}
                    className="inline-flex items-center gap-1 text-xs text-burgundy-900 font-semibold hover:underline"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {convertItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-ivory-50/80 border border-gold-200 rounded grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                  >
                    <div className="sm:col-span-6">
                      <label className="text-[10px] font-semibold text-charcoal-600 block mb-0.5">
                        Saree Product SKU *
                      </label>
                      <select
                        value={item.product_id}
                        onChange={(e) => handleConvertProductChange(idx, e.target.value)}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-gold-200 rounded"
                        required
                      >
                        <option value="">-- Choose Saree --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.code}] {p.name} — ₹{Number(p.price || 0).toLocaleString("en-IN")}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-semibold text-charcoal-600 block mb-0.5">
                        Qty (pcs) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const u = [...convertItems];
                          u[idx].quantity = parseInt(e.target.value) || 1;
                          setConvertItems(u);
                        }}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-gold-200 rounded text-center font-mono font-bold"
                        required
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-semibold text-charcoal-600 block mb-0.5">
                        Agreed Wholesale Price (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => {
                          const u = [...convertItems];
                          u[idx].unit_price = parseFloat(e.target.value) || 0;
                          setConvertItems(u);
                        }}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-gold-200 rounded font-mono font-bold"
                        required
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveConvertItem(idx)}
                        disabled={convertItems.length <= 1}
                        className="p-1.5 text-charcoal-400 hover:text-red-700 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                  Wholesale Order Notes
                </label>
                <textarea
                  rows={2}
                  value={convertNotes}
                  onChange={(e) => setConvertNotes(e.target.value)}
                  placeholder="Wholesale terms, GST billing particulars, or sample approvals..."
                  className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded"
                />
              </div>

              <div className="pt-3 border-t border-gold-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="px-4 py-2 bg-white border border-gold-300 text-charcoal-700 text-xs font-semibold rounded"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isConverting}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded shadow-sm disabled:opacity-50"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Provisioning Order & Locking Stock...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Create Wholesale Order</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

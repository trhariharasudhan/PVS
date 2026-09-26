"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAdminCustomers,
  getAdminProducts,
  createAdminOrder,
} from "@/lib/api";
import {
  AdminCustomerList,
  AdminProductList,
  AdminOrderItemCreatePayload,
  CustomerType,
  OrderType,
  PaymentStatus,
} from "@/types";
import {
  ShoppingBag,
  ArrowLeft,
  PlusCircle,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  UserPlus,
  UserCheck,
  Building,
} from "lucide-react";

export default function NewOrderPage() {
  const router = useRouter();

  // Reference data
  const [customers, setCustomers] = useState<AdminCustomerList[]>([]);
  const [products, setProducts] = useState<AdminProductList[]>([]);
  const [isLoadingRefData, setIsLoadingRefData] = useState(true);

  // Customer Mode: "EXISTING" | "NEW"
  const [customerMode, setCustomerMode] = useState<"EXISTING" | "NEW">("EXISTING");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  // Inline New Customer form
  const [newCustomer, setNewCustomer] = useState({
    full_name: "",
    company_name: "",
    customer_type: "RETAIL" as CustomerType,
    phone: "",
    whatsapp_number: "",
    email: "",
    gstin: "",
    city: "",
    state: "Tamil Nadu",
    shipping_address: "",
  });

  // Order Details
  const [orderType, setOrderType] = useState<OrderType>("RETAIL_DIRECT");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PENDING");
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [shippingAmount, setShippingAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  // Line items
  const [items, setItems] = useState<AdminOrderItemCreatePayload[]>([
    { product_id: "", quantity: 1, unit_price: 0, custom_colorway_notes: "" },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [custRes, prodRes] = await Promise.all([
          getAdminCustomers({ limit: 100 }),
          getAdminProducts({ limit: 100, is_active: true }),
        ]);
        setCustomers(custRes.items);
        setProducts(prodRes.items);
        if (custRes.items.length > 0) {
          setSelectedCustomerId(custRes.items[0].id);
        }
      } catch (err: any) {
        console.error("Failed to load reference data:", err);
        setError("Failed to load customer or product master data.");
      } finally {
        setIsLoadingRefData(false);
      }
    }
    loadData();
  }, []);

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      product_id: productId,
      unit_price: prod && prod.price ? Number(prod.price) : 0,
    };
    setItems(updated);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, qty);
    setItems(updated);
  };

  const handleUnitPriceChange = (index: number, price: number) => {
    const updated = [...items];
    updated[index].unit_price = Math.max(0, price);
    setItems(updated);
  };

  const handleNotesChange = (index: number, val: string) => {
    const updated = [...items];
    updated[index].custom_colorway_notes = val;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { product_id: "", quantity: 1, unit_price: 0, custom_colorway_notes: "" },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce(
    (acc, it) => acc + (it.quantity || 0) * (it.unit_price || 0),
    0
  );
  const totalAmount = subtotal + Number(taxAmount || 0) + Number(shippingAmount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const invalidItem = items.find((it) => !it.product_id || it.quantity < 1);
    if (invalidItem) {
      setError("Please select a valid saree product and quantity for each line item.");
      return;
    }

    if (customerMode === "EXISTING" && !selectedCustomerId) {
      setError("Please select a customer profile.");
      return;
    }

    if (customerMode === "NEW" && (!newCustomer.full_name || !newCustomer.phone || !newCustomer.city)) {
      setError("Please provide at least full name, phone number, and city for the new customer.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        order_type: orderType,
        payment_status: paymentStatus,
        items: items.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          unit_price: it.unit_price,
          custom_colorway_notes: it.custom_colorway_notes?.trim() || undefined,
        })),
        tax_amount: Number(taxAmount || 0),
        shipping_amount: Number(shippingAmount || 0),
        notes: notes.trim() || undefined,
      };

      if (customerMode === "EXISTING") {
        payload.customer_id = selectedCustomerId;
      } else {
        payload.new_customer = {
          full_name: newCustomer.full_name.trim(),
          company_name: newCustomer.company_name.trim() || undefined,
          customer_type: newCustomer.customer_type,
          phone: newCustomer.phone.trim(),
          whatsapp_number: newCustomer.whatsapp_number.trim() || undefined,
          email: newCustomer.email.trim().toLowerCase() || undefined,
          gstin: newCustomer.gstin.trim().toUpperCase() || undefined,
          city: newCustomer.city.trim(),
          state: newCustomer.state.trim(),
          shipping_address: newCustomer.shipping_address.trim() || undefined,
        };
      }

      const created = await createAdminOrder(payload);
      router.push(`/admin/orders/${created.id}`);
    } catch (err: any) {
      console.error("Order creation failed:", err);
      setError(err?.message || "Failed to create order. Please check available stock.");
      setIsSubmitting(false);
    }
  };

  if (isLoadingRefData) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-burgundy-900 animate-spin" />
        <span className="text-xs font-mono text-charcoal-500">
          Loading master catalogue and client profiles...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 text-charcoal-500 hover:text-burgundy-950 hover:bg-gold-50 rounded-sm border border-gold-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold text-burgundy-950">
              Create Sales Order
            </h1>
            <p className="text-xs text-charcoal-500">
              Snapshot wholesale pricing and reserve silk saree inventory.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-sm text-xs text-red-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Customer Profile */}
        <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gold-200/60">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-burgundy-900" />
              <h2 className="font-serif text-base font-bold text-burgundy-950">
                1. Customer & Buyer Selection
              </h2>
            </div>

            <div className="flex items-center bg-ivory-100 p-0.5 rounded border border-gold-200 text-xs">
              <button
                type="button"
                onClick={() => setCustomerMode("EXISTING")}
                className={`px-3 py-1 font-semibold rounded-sm transition-all ${
                  customerMode === "EXISTING"
                    ? "bg-burgundy-900 text-gold-200 shadow-xs"
                    : "text-charcoal-600 hover:text-charcoal-900"
                }`}
              >
                Existing Profile
              </button>
              <button
                type="button"
                onClick={() => setCustomerMode("NEW")}
                className={`px-3 py-1 font-semibold rounded-sm transition-all ${
                  customerMode === "NEW"
                    ? "bg-burgundy-900 text-gold-200 shadow-xs"
                    : "text-charcoal-600 hover:text-charcoal-900"
                }`}
              >
                + New Customer
              </button>
            </div>
          </div>

          {customerMode === "EXISTING" ? (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-charcoal-700 block">
                Select Registered Customer / Merchant *
              </label>
              {customers.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
                  No existing customers found. Switch to "+ New Customer" above.
                </div>
              ) : (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900"
                  required
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} {c.company_name ? `(${c.company_name})` : ""} — {c.phone} [{c.city}, {c.customer_type}]
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                  Full Name / Contact Person *
                </label>
                <input
                  type="text"
                  value={newCustomer.full_name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, full_name: e.target.value })}
                  placeholder="e.g. S. Meenakshi"
                  className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                  Company / Showroom Name
                </label>
                <input
                  type="text"
                  value={newCustomer.company_name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, company_name: e.target.value })}
                  placeholder="e.g. Meenakshi Silks"
                  className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                  Customer Type *
                </label>
                <select
                  value={newCustomer.customer_type}
                  onChange={(e) => setNewCustomer({ ...newCustomer, customer_type: e.target.value as CustomerType })}
                  className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900"
                >
                  <option value="RETAIL">Retail Direct</option>
                  <option value="BOUTIQUE">Boutique Owner</option>
                  <option value="WHOLESALE_MERCHANT">Wholesale Merchant</option>
                  <option value="EXPORTER">Exporter</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                  placeholder="e.g. Kanchipuram"
                  className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                  GSTIN
                </label>
                <input
                  type="text"
                  value={newCustomer.gstin}
                  onChange={(e) => setNewCustomer({ ...newCustomer, gstin: e.target.value })}
                  placeholder="e.g. 33AAAAA0000A1Z5"
                  className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Order Metadata */}
        <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gold-200/60">
            <ShoppingBag className="w-4 h-4 text-burgundy-900" />
            <h2 className="font-serif text-base font-bold text-burgundy-950">
              2. Order Classification & Terms
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                Order Type *
              </label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as OrderType)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900"
              >
                <option value="RETAIL_DIRECT">Retail Direct</option>
                <option value="WHOLESALE_BULK">Wholesale Bulk Trade</option>
                <option value="CUSTOM_LOOM_RUN">Custom Loom Run</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                Initial Payment State
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900"
              >
                <option value="PENDING">Pending Payment</option>
                <option value="ADVANCE_PAID">Advance Received</option>
                <option value="FULLY_PAID">Fully Settled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Line Items */}
        <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gold-200/60">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-burgundy-900" />
              <h2 className="font-serif text-base font-bold text-burgundy-950">
                3. Saree Products & Agreed Unit Prices
              </h2>
            </div>
            <button
              type="button"
              onClick={addItemRow}
              className="inline-flex items-center gap-1 px-3 py-1 bg-ivory-100 hover:bg-ivory-200 text-burgundy-900 text-xs font-semibold rounded border border-gold-300 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-ivory-50/70 border border-gold-200/80 rounded-sm grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
              >
                {/* Saree Product */}
                <div className="sm:col-span-5">
                  <label className="text-[11px] font-semibold text-charcoal-600 block mb-1">
                    Saree SKU / Weave *
                  </label>
                  <select
                    value={item.product_id}
                    onChange={(e) => handleProductChange(idx, e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900"
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

                {/* Quantity */}
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-charcoal-600 block mb-1">
                    Qty (pcs) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 1)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gold-200 rounded-sm text-center font-mono font-bold text-charcoal-900"
                    required
                  />
                </div>

                {/* Unit Price */}
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-charcoal-600 block mb-1">
                    Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={item.unit_price}
                    onChange={(e) => handleUnitPriceChange(idx, parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gold-200 rounded-sm font-mono font-bold text-charcoal-900"
                    required
                  />
                </div>

                {/* Line Total */}
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-charcoal-600 block mb-1">
                    Line Total
                  </label>
                  <div className="py-1.5 text-xs font-mono font-bold text-burgundy-950">
                    ₹{((item.quantity || 0) * (item.unit_price || 0)).toLocaleString("en-IN")}
                  </div>
                </div>

                {/* Delete button */}
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    disabled={items.length <= 1}
                    className="p-1.5 text-charcoal-400 hover:text-red-700 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Notes */}
                <div className="sm:col-span-12">
                  <input
                    type="text"
                    placeholder="Custom colorway or pallu specifications (optional)..."
                    value={item.custom_colorway_notes || ""}
                    onChange={(e) => handleNotesChange(idx, e.target.value)}
                    className="w-full px-2.5 py-1 text-[11px] bg-white border border-gold-200 rounded-sm text-charcoal-700"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Financial Summary */}
          <div className="pt-4 border-t border-gold-200 flex flex-col sm:flex-row justify-between gap-4 items-end">
            <div className="w-full sm:w-1/2 space-y-3">
              <div>
                <label className="text-xs font-semibold text-charcoal-700 block mb-1">
                  Order & Dispatch Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special packaging, freight details, or customer requirements..."
                  className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm text-charcoal-900"
                />
              </div>
            </div>

            <div className="w-full sm:w-72 bg-ivory-50 p-4 border border-gold-200 rounded-sm space-y-2 text-xs">
              <div className="flex justify-between text-charcoal-600">
                <span>Subtotal ({items.reduce((a, b) => a + (b.quantity || 0), 0)} pcs):</span>
                <span className="font-mono font-bold text-charcoal-900">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between items-center text-charcoal-600">
                <span>Tax / GST (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 bg-white border border-gold-200 rounded text-right font-mono text-xs"
                />
              </div>

              <div className="flex justify-between items-center text-charcoal-600">
                <span>Freight / Shipping (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={shippingAmount}
                  onChange={(e) => setShippingAmount(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 bg-white border border-gold-200 rounded text-right font-mono text-xs"
                />
              </div>

              <div className="pt-2 border-t border-gold-300 flex justify-between font-bold text-sm text-burgundy-950">
                <span>Total Amount:</span>
                <span className="font-mono text-base font-bold">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/orders"
            className="px-4 py-2 bg-white border border-gold-300 hover:bg-gold-50 text-charcoal-700 text-xs font-semibold rounded-sm transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Reserving Stock & Creating Order...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Order & Lock Stock</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

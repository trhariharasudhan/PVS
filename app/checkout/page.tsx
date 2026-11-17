"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { siteConfig } from "@/config/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  ShieldCheck,
  CheckCircle2,
  Building2,
  ShoppingBag,
  ArrowRight,
  MessageCircle,
  Truck,
  CreditCard,
  AlertCircle,
} from "lucide-react";

export default function CheckoutPage() {
  const { items, itemCount, subtotal, shipping, total, clearCart } = useCart();

  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    email: "",
    address: "",
    city: "",
    state: "Tamil Nadu",
    pincode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<"whatsapp" | "bank" | "cod">("whatsapp");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState<null | {
    orderNumber: string;
    date: string;
  }>(null);
  const [formError, setFormError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formError) setFormError("");
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.fullName.trim() || !formData.mobile.trim() || !formData.address.trim() || !formData.pincode.trim()) {
      setFormError("Please fill in your name, mobile number, delivery address, and pincode.");
      return;
    }

    setIsSubmitting(true);

    // Generate random order ID
    const randomCode = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `PVS-ORD-${randomCode}`;
    const date = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    setTimeout(() => {
      setOrderConfirmed({ orderNumber, date });
      setIsSubmitting(false);

      // If WhatsApp method selected, open WhatsApp with order details
      if (paymentMethod === "whatsapp") {
        const itemSummary = items.map((i) => `${i.name} (${i.code}) x ${i.quantity}`).join(", ");
        const text = `Hi PVS, I would like to place an order!%0A%0A*Order Number:* ${orderNumber}%0A*Name:* ${formData.fullName}%0A*Phone:* ${formData.mobile}%0A*Address:* ${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}%0A%0A*Items:* ${itemSummary}%0A*Total Amount:* ₹${total.toLocaleString("en-IN")}%0A%0APlease confirm availability and dispatch timeline.`;
        window.open(`https://wa.me/${siteConfig.business.whatsapp}?text=${text}`, "_blank");
      }

      clearCart();
    }, 600);
  };

  if (orderConfirmed) {
    return (
      <div className="min-h-screen bg-ivory-50 py-16 sm:py-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-2 border-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="text-xs uppercase font-mono tracking-widest text-emerald-700 font-bold block">
            ORDER INQUIRY LOGGED SUCCESSFULLY
          </span>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-heritage-brown-950">
            Thank You, {formData.fullName}!
          </h1>

          <div className="p-6 bg-white border border-gold-300 rounded-[4px] shadow-sm text-left space-y-3 font-sans text-xs sm:text-sm text-heritage-brown-800">
            <div className="flex justify-between border-b border-gold-200 pb-2">
              <span className="text-heritage-brown-600">Order Reference:</span>
              <span className="font-mono font-bold text-silk-red-700">{orderConfirmed.orderNumber}</span>
            </div>
            <div className="flex justify-between border-b border-gold-200 pb-2">
              <span className="text-heritage-brown-600">Order Date:</span>
              <span>{orderConfirmed.date}</span>
            </div>
            <div className="flex justify-between border-b border-gold-200 pb-2">
              <span className="text-heritage-brown-600">Delivery Address:</span>
              <span className="text-right font-medium max-w-xs">
                {formData.address}, {formData.city}, {formData.state} - {formData.pincode}
              </span>
            </div>
            <div className="flex justify-between pt-1 font-bold text-base text-heritage-brown-950">
              <span>Total Payable:</span>
              <span className="text-silk-red-700 font-serif">₹{total.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="p-4 bg-gold-50 border border-gold-300 rounded-[4px] text-xs text-heritage-brown-800 text-left space-y-1">
            <p className="font-bold text-heritage-brown-950">What Happens Next?</p>
            <p className="leading-relaxed">
              Sathish Kumar and our weaving dispatch team will review your order details, confirm loom availability, and contact you via phone or WhatsApp at <strong>{formData.mobile}</strong>.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`https://wa.me/${siteConfig.business.whatsapp}?text=${encodeURIComponent(
                `Hi PVS, following up on my order reference ${orderConfirmed.orderNumber} for ₹${total.toLocaleString("en-IN")}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-6 py-3.5 rounded-[4px] uppercase tracking-wider"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat on WhatsApp</span>
            </a>

            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 bg-heritage-brown-900 hover:bg-heritage-brown-950 text-ivory-50 text-xs font-semibold px-6 py-3.5 rounded-[4px] uppercase tracking-wider"
            >
              <span>Return to Shop</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory-50 pb-24">
      {/* Header */}
      <section className="bg-silk-cream-100/60 py-10 border-b border-gold-300/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs uppercase font-mono tracking-widest text-silk-red-700 font-bold">
            PVS SECURE CHECKOUT
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-heritage-brown-950 mt-1">
            Complete Your Pattu Saree Order
          </h1>
          <p className="text-xs sm:text-sm text-heritage-brown-700 mt-1.5 font-sans">
            Direct dispatch from our manufacturing unit in Panjakalipatti, Kalipatti, Salem.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {items.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gold-300 rounded-[4px] p-8 max-w-md mx-auto space-y-4">
            <ShoppingBag className="w-12 h-12 text-gold-600 mx-auto opacity-60" />
            <h2 className="font-serif text-xl font-bold text-heritage-brown-950">
              Your cart is empty
            </h2>
            <p className="text-xs text-heritage-brown-600">
              Please add sarees to your cart before proceeding to checkout.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-silk-red-700 text-ivory-50 text-xs font-semibold px-6 py-3 rounded-[4px] uppercase tracking-wider"
            >
              <span>Explore Shop</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
            {/* Left Column: Customer & Delivery Details */}
            <div className="lg:col-span-7 space-y-6">
              {/* Customer Details Box */}
              <div className="bg-white border border-gold-300 rounded-[4px] p-6 shadow-sm space-y-4">
                <h2 className="font-serif text-lg font-bold text-heritage-brown-950 border-b border-gold-200 pb-3 flex items-center gap-2">
                  <span>1. Contact & Customer Details</span>
                </h2>

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-[4px] text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-heritage-brown-900 block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Ananya Raman"
                      className="w-full text-xs p-3 bg-ivory-50/60 border border-gold-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-heritage-brown-900 block mb-1">
                      Mobile Number (for order & dispatch updates) *
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      required
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="+91 98427 xxxxx"
                      className="w-full text-xs p-3 bg-ivory-50/60 border border-gold-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-heritage-brown-900 block mb-1">
                    Email Address (Optional for invoice)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full text-xs p-3 bg-ivory-50/60 border border-gold-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
              </div>

              {/* Delivery Address Box */}
              <div className="bg-white border border-gold-300 rounded-[4px] p-6 shadow-sm space-y-4">
                <h2 className="font-serif text-lg font-bold text-heritage-brown-950 border-b border-gold-200 pb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-silk-red-700" />
                  <span>2. Delivery Address (All India Insured Shipping)</span>
                </h2>

                <div>
                  <label className="text-xs font-semibold text-heritage-brown-900 block mb-1">
                    Door No., Street / Landmark *
                  </label>
                  <textarea
                    name="address"
                    rows={2}
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Flat / House No., Building Name, Street"
                    className="w-full text-xs p-3 bg-ivory-50/60 border border-gold-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-gold-500 font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-heritage-brown-900 block mb-1">
                      City / Town *
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Salem / Chennai / Bengaluru"
                      className="w-full text-xs p-3 bg-ivory-50/60 border border-gold-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-heritage-brown-900 block mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full text-xs p-3 bg-ivory-50/60 border border-gold-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-heritage-brown-900 block mb-1">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      required
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="636455"
                      className="w-full text-xs p-3 bg-ivory-50/60 border border-gold-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-gold-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Architecture Box */}
              <div className="bg-white border border-gold-300 rounded-[4px] p-6 shadow-sm space-y-4">
                <h2 className="font-serif text-lg font-bold text-heritage-brown-950 border-b border-gold-200 pb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-silk-red-700" />
                  <span>3. Payment Method</span>
                </h2>

                <p className="text-xs text-heritage-brown-600 font-sans">
                  Select your preferred settlement method. Online payment gateways (Razorpay / Stripe) can be integrated directly into this workflow.
                </p>

                <div className="space-y-3">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-[4px] border cursor-pointer transition-all ${
                      paymentMethod === "whatsapp"
                        ? "border-emerald-600 bg-emerald-50/40"
                        : "border-gold-300 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="whatsapp"
                      checked={paymentMethod === "whatsapp"}
                      onChange={() => setPaymentMethod("whatsapp")}
                      className="mt-1 text-emerald-700 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-serif text-sm font-bold text-heritage-brown-950 flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-emerald-700" />
                        <span>Direct WhatsApp Order Confirmation (Fastest)</span>
                      </span>
                      <p className="text-xs text-heritage-brown-600 mt-0.5">
                        Transfers your cart directly to Sathish Kumar (+91 99651 76136) on WhatsApp for immediate verification and invoice dispatch.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-[4px] border cursor-pointer transition-all ${
                      paymentMethod === "bank"
                        ? "border-silk-red-700 bg-silk-red-50/30"
                        : "border-gold-300 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={paymentMethod === "bank"}
                      onChange={() => setPaymentMethod("bank")}
                      className="mt-1 text-silk-red-700 focus:ring-silk-red-500"
                    />
                    <div>
                      <span className="font-serif text-sm font-bold text-heritage-brown-950 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-silk-red-700" />
                        <span>Direct Bank Wire Transfer / UPI (State Bank of India)</span>
                      </span>
                      <p className="text-xs text-heritage-brown-600 mt-0.5">
                        Official invoice with IFSC & bank account will be generated for remittance.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-[4px] border cursor-pointer transition-all ${
                      paymentMethod === "cod"
                        ? "border-gold-600 bg-gold-50/40"
                        : "border-gold-300 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="mt-1 text-gold-700 focus:ring-gold-500"
                    />
                    <div>
                      <span className="font-serif text-sm font-bold text-heritage-brown-950 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-gold-700" />
                        <span>Pay on Delivery / Inspection (Eligible PIN codes)</span>
                      </span>
                      <p className="text-xs text-heritage-brown-600 mt-0.5">
                        Pay upon receiving and verifying your saree parcel via registered courier.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Place Order */}
            <div className="lg:col-span-5 bg-white border border-gold-300 rounded-[4px] p-6 shadow-sm space-y-6">
              <h2 className="font-serif text-lg font-bold text-heritage-brown-950 border-b border-gold-200 pb-3">
                Order Items ({itemCount})
              </h2>

              <div className="divide-y divide-gold-200 max-h-80 overflow-y-auto pr-2">
                {items.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-14 bg-gold-50 rounded-[3px] overflow-hidden relative flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-serif font-bold text-heritage-brown-950 line-clamp-1">{item.name}</p>
                        <p className="text-[10px] text-heritage-brown-500 font-mono">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-heritage-brown-900 font-mono">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-3 border-t border-gold-200 text-xs text-heritage-brown-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-heritage-brown-950">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Insured Handloom Shipping</span>
                  <span className="text-emerald-700 font-semibold">Free (All India)</span>
                </div>
                <div className="flex justify-between text-base font-bold text-heritage-brown-950 pt-2 border-t border-gold-200">
                  <span>Total Amount</span>
                  <span className="text-silk-red-700 font-serif text-xl">₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 bg-silk-red-700 hover:bg-deep-maroon-800 disabled:opacity-60 text-ivory-50 text-xs sm:text-sm font-semibold py-4 rounded-[4px] uppercase tracking-wider shadow-luxury transition-all"
              >
                {isSubmitting ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <span>Place Saree Order</span>
                    <ArrowRight className="w-4 h-4 text-gold-300" />
                  </>
                )}
              </button>

              <div className="pt-2 text-[11px] text-heritage-brown-600 space-y-1.5 border-t border-gold-200">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  <span>Direct Loom Weave Guarantee</span>
                </div>
                <p>
                  Manufactured at Raaja Veedhi, Panjakalipatti, Kalipatti, Salem, Tamil Nadu 636455.
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

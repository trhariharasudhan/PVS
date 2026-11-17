"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { siteConfig } from "@/config/site";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft, ShieldCheck, MessageCircle } from "lucide-react";

export default function CartPage() {
  const { items, itemCount, subtotal, shipping, total, updateQuantity, removeItem, clearCart } =
    useCart();

  return (
    <div className="min-h-screen bg-ivory-50 pb-24">
      {/* Header */}
      <section className="bg-silk-cream-100/60 py-12 border-b border-gold-300/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs uppercase font-mono tracking-widest text-silk-red-700 font-bold">
            PVS SHOPPING CART
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-heritage-brown-950 mt-1">
            Review Your Order ({itemCount} {itemCount === 1 ? "Saree" : "Sarees"})
          </h1>
          <p className="text-xs sm:text-sm text-heritage-brown-700 mt-2 font-sans">
            Direct loom dispatch from Raaja Veedhi, Panjakalipatti, Kalipatti, Tamil Nadu.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {items.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gold-300 rounded-[4px] p-8 max-w-lg mx-auto shadow-sm space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-600">
              <ShoppingBag className="w-8 h-8 opacity-60" />
            </div>
            <h2 className="font-serif text-xl font-bold text-heritage-brown-950">
              Your Cart is Currently Empty
            </h2>
            <p className="text-xs text-heritage-brown-600 font-sans max-w-xs mx-auto">
              Explore our manufactured pattu sarees and discover traditional handloom elegance.
            </p>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-silk-red-700 hover:bg-deep-maroon-800 text-ivory-50 text-xs font-semibold px-6 py-3 rounded-[4px] uppercase tracking-wider shadow-sm transition-all"
              >
                <span>Continue Shopping</span>
                <ArrowRight className="w-4 h-4 text-gold-300" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Cart Items Table */}
            <div className="lg:col-span-8 bg-white border border-gold-300/80 rounded-[4px] shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gold-200 flex items-center justify-between bg-gold-50/50">
                <span className="font-serif text-sm font-bold text-heritage-brown-950">
                  Item Details
                </span>
                <button
                  onClick={clearCart}
                  className="text-xs text-silk-red-700 hover:underline font-semibold"
                >
                  Clear Cart
                </button>
              </div>

              <div className="divide-y divide-gold-200">
                {items.map((item) => (
                  <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                    <div className="flex gap-4 items-center">
                      <div className="relative w-20 h-24 rounded-[3px] overflow-hidden bg-gold-50 border border-gold-200 flex-shrink-0">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="space-y-1">
                        <span className="font-mono text-[10px] font-bold text-gold-800 bg-gold-100 px-2 py-0.5 rounded">
                          {item.code}
                        </span>
                        <h3 className="font-serif text-sm sm:text-base font-bold text-heritage-brown-950">
                          {item.name}
                        </h3>
                        <p className="text-xs text-heritage-brown-600 font-sans">
                          {item.fabric} • {item.color}
                        </p>
                        <p className="text-xs font-bold text-silk-red-700 font-serif">
                          {item.priceDisplay}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0">
                      {/* Quantity adjuster */}
                      <div className="flex items-center border border-gold-300 rounded-[4px] bg-ivory-50">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2.5 py-1 text-heritage-brown-700 hover:bg-gold-100"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-xs font-bold font-mono text-heritage-brown-950">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2.5 py-1 text-heritage-brown-700 hover:bg-gold-100"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Total */}
                      <span className="font-serif text-sm font-bold text-heritage-brown-950 min-w-[70px] text-right">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-heritage-brown-400 hover:text-silk-red-700 p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action row */}
              <div className="p-4 sm:p-5 bg-ivory-50 border-t border-gold-200 flex flex-wrap items-center justify-between gap-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-heritage-brown-800 hover:text-silk-red-700 uppercase tracking-wider"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Continue Shopping</span>
                </Link>

                <div className="text-xs text-heritage-brown-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>100% Genuine Handloom Quality Assurance</span>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-4 bg-white border border-gold-300 rounded-[4px] p-6 shadow-sm space-y-6">
              <h2 className="font-serif text-lg font-bold text-heritage-brown-950 border-b border-gold-200 pb-3">
                Order Summary
              </h2>

              <div className="space-y-3 text-xs text-heritage-brown-700 font-sans">
                <div className="flex justify-between">
                  <span>Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})</span>
                  <span className="font-semibold text-heritage-brown-950">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Insured Handloom Shipping</span>
                  <span className="text-emerald-700 font-semibold">Free (All India)</span>
                </div>

                <div className="flex justify-between text-base font-bold text-heritage-brown-950 pt-3 border-t border-gold-200">
                  <span>Total Amount</span>
                  <span className="text-silk-red-700 font-serif text-xl">
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  href="/checkout"
                  className="w-full inline-flex items-center justify-center gap-2 bg-silk-red-700 hover:bg-deep-maroon-800 text-ivory-50 text-xs sm:text-sm font-semibold py-4 rounded-[4px] uppercase tracking-wider shadow-luxury transition-all"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 text-gold-300" />
                </Link>

                <a
                  href={`https://wa.me/${siteConfig.business.whatsapp}?text=${encodeURIComponent(
                    `Hi PVS, I would like to finalize my order for ${itemCount} sarees (Total: ₹${total.toLocaleString(
                      "en-IN"
                    )}). Please advise on payment & dispatch.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold py-3 rounded-[4px] uppercase tracking-wider shadow-sm transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Confirm on WhatsApp</span>
                </a>
              </div>

              <div className="p-3 bg-silk-cream-100/70 border border-gold-200 rounded-[3px] text-[11px] text-heritage-brown-700 space-y-1">
                <p className="font-bold text-heritage-brown-950">Wholesale or Boutique Buyers?</p>
                <p>
                  Bulk quantity orders qualify for volume manufacturing rates. Inquire via our{" "}
                  <Link href="/wholesale" className="text-silk-red-700 font-bold underline">
                    Wholesale Form
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { siteConfig } from "@/config/site";

export function CartDrawer() {
  const { items, itemCount, subtotal, shipping, total, isOpen, closeCart, updateQuantity, removeItem } =
    useCart();

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeCart]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-heritage-brown-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-ivory-50 text-heritage-brown-950 shadow-2xl flex flex-col border-l border-gold-400/40">
          {/* Header */}
          <div className="p-5 border-b border-gold-300/40 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-silk-red-700" />
              <h2 className="font-serif text-lg font-bold text-heritage-brown-950">
                Your Shopping Cart ({itemCount})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-2 text-heritage-brown-600 hover:text-silk-red-700 hover:bg-gold-50 rounded-[4px] transition-colors"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-600">
                  <ShoppingBag className="w-8 h-8 opacity-60" />
                </div>
                <h3 className="font-serif text-base font-bold text-heritage-brown-900">
                  Your cart is currently empty
                </h3>
                <p className="text-xs text-heritage-brown-600 max-w-xs mx-auto">
                  Explore our pure pattu saree collections directly from our master weavers.
                </p>
                <Link
                  href="/shop"
                  onClick={closeCart}
                  className="inline-flex items-center gap-2 bg-silk-red-700 hover:bg-deep-maroon-800 text-ivory-50 text-xs font-semibold px-6 py-3 rounded-[4px] uppercase tracking-wider shadow-sm transition-all"
                >
                  <span>Explore Shop</span>
                  <ArrowRight className="w-4 h-4 text-gold-300" />
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 bg-white border border-gold-300/50 rounded-[4px] shadow-sm"
                >
                  <div className="relative w-20 h-24 bg-gold-50 rounded-[4px] overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-serif text-xs sm:text-sm font-bold text-heritage-brown-950 truncate">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-heritage-brown-400 hover:text-silk-red-700 p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-gold-800 font-mono font-medium">
                        Code: {item.code}
                      </p>
                      <p className="text-[11px] font-bold text-silk-red-700 mt-0.5">
                        {item.priceDisplay}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-gold-300 rounded-[4px]">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-heritage-brown-600 hover:bg-gold-50"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-heritage-brown-900 font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-heritage-brown-600 hover:bg-gold-50"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-heritage-brown-900">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {items.length > 0 && (
            <div className="p-5 border-t border-gold-300/40 bg-white space-y-4">
              <div className="space-y-1.5 text-xs text-heritage-brown-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-heritage-brown-900">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Insured Handloom Shipping</span>
                  <span className="text-emerald-700 font-semibold">Free (All India)</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-heritage-brown-950 pt-2 border-t border-gold-200">
                  <span>Total Amount</span>
                  <span className="text-silk-red-700 text-base">
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full inline-flex items-center justify-center gap-2 bg-silk-red-700 hover:bg-deep-maroon-800 text-ivory-50 text-xs sm:text-sm font-semibold py-3.5 rounded-[4px] uppercase tracking-wider shadow-luxury transition-all"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 text-gold-300" />
                </Link>

                <div className="flex gap-2">
                  <Link
                    href="/cart"
                    onClick={closeCart}
                    className="flex-1 inline-flex items-center justify-center text-xs font-semibold py-2.5 bg-ivory-100 hover:bg-gold-50 text-heritage-brown-900 rounded-[4px] border border-gold-300 transition-colors"
                  >
                    View Full Cart
                  </Link>

                  <a
                    href={`https://wa.me/${siteConfig.business.whatsapp}?text=${encodeURIComponent(
                      `Hi PVS, I have ${itemCount} sarees in my cart (Total: ₹${total.toLocaleString(
                        "en-IN"
                      )}). Could you assist me with this order?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-[4px] transition-colors"
                  >
                    WhatsApp Assist
                  </a>
                </div>
              </div>

              <p className="text-[10px] text-center text-heritage-brown-500">
                Direct Loom Dispatch from Panjakalipatti, Kalipatti, Tamil Nadu.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

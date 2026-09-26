"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getDealerProductDetail,
  calculateDealerQuote,
  createDealerOrder,
  getDealerCredit,
} from "@/lib/api";
import {
  DealerProductDetail,
  QuoteResponse,
  DealerCreditSummary,
} from "@/lib/api/dealer";
import {
  Package,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Loader2,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";

export default function DealerProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.productId as string;

  const [product, setProduct] = useState<DealerProductDetail | null>(null);
  const [credit, setCredit] = useState<DealerCreditSummary | null>(null);
  const [quantity, setQuantity] = useState<number>(5);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetail() {
      if (!productId) return;
      try {
        setIsLoading(true);
        const [prodData, credData] = await Promise.all([
          getDealerProductDetail(productId),
          getDealerCredit().catch(() => null),
        ]);
        setProduct(prodData);
        setCredit(credData);
      } catch (err) {
        console.error("Failed to load product detail:", err);
        setErrorMsg("Failed to load product details.");
      } finally {
        setIsLoading(false);
      }
    }
    loadDetail();
  }, [productId]);

  // Recalculate Quote on Quantity Change
  useEffect(() => {
    async function fetchQuote() {
      if (!productId || quantity < 1) return;
      try {
        setIsQuoting(true);
        const q = await calculateDealerQuote({ product_id: productId, quantity });
        setQuote(q);
        setErrorMsg(null);
      } catch (err: any) {
        console.error("Quote calculation error:", err);
        setErrorMsg(err.message || "Failed to calculate quote.");
      } finally {
        setIsQuoting(false);
      }
    }

    const timeout = setTimeout(fetchQuote, 250);
    return () => clearTimeout(timeout);
  }, [productId, quantity]);

  const handlePlaceOrder = async () => {
    if (!productId || quantity < 1) return;
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const res = await createDealerOrder({
        items: [{ product_id: productId, quantity }],
        notes: notes || undefined,
      });
      setSuccessMsg(`Order ${res.order_number} successfully placed! Total: INR ${res.total_amount.toLocaleString("en-IN")}`);
      setTimeout(() => {
        router.push("/portal/dealer/orders");
      }, 2000);
    } catch (err: any) {
      console.error("Order creation failed:", err);
      setErrorMsg(err.message || "Failed to create wholesale order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-silk-red-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 bg-white rounded-[4px] border border-gold-300 p-8 shadow-sm">
        <AlertCircle className="w-10 h-10 text-silk-red-600 mx-auto mb-3" />
        <h2 className="text-lg font-serif font-bold text-heritage-brown-950">Product Not Found</h2>
        <Link href="/portal/dealer/products" className="mt-4 inline-block text-xs font-semibold text-silk-red-600 underline">
          Return to Catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/portal/dealer/products"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-heritage-brown-600 hover:text-silk-red-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Catalogue
      </Link>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Images & Textile Specs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[4px] p-6 border border-gold-300/60 shadow-sm overflow-hidden">
            <div className="aspect-[4/3] bg-ivory-100 rounded-[4px] overflow-hidden flex items-center justify-center border border-gold-200">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0].image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-8">
                  <Package className="w-16 h-16 text-gold-400 mx-auto mb-2" />
                  <p className="text-xs text-heritage-brown-500 font-sans">Authentic Pure Silk Saree</p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <span className="font-mono text-xs text-silk-red-700 font-bold bg-silk-red-50 px-2 py-0.5 rounded-[4px] border border-silk-red-200">
                {product.code}
              </span>
              <h1 className="text-2xl font-serif font-bold text-heritage-brown-950 mt-2">{product.name}</h1>
              <p className="text-xs sm:text-sm text-heritage-brown-700 mt-2 font-sans leading-relaxed">{product.description}</p>
            </div>

            {/* Textile Attributes Matrix */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-ivory-200 text-xs font-sans">
              <div>
                <p className="text-heritage-brown-500">Fabric</p>
                <p className="font-semibold text-heritage-brown-950 mt-0.5">{product.fabric}</p>
              </div>
              <div>
                <p className="text-heritage-brown-500">Color</p>
                <p className="font-semibold text-heritage-brown-950 mt-0.5">{product.color}</p>
              </div>
              <div>
                <p className="text-heritage-brown-500">Weave Type</p>
                <p className="font-semibold text-heritage-brown-950 mt-0.5">{product.weave_type}</p>
              </div>
              <div>
                <p className="text-heritage-brown-500">Border</p>
                <p className="font-semibold text-heritage-brown-950 mt-0.5">{product.border}</p>
              </div>
              <div>
                <p className="text-heritage-brown-500">Length</p>
                <p className="font-semibold text-heritage-brown-950 mt-0.5">{product.saree_length_meters}m + Blouse</p>
              </div>
              <div>
                <p className="text-heritage-brown-500">Live Inventory</p>
                <p className="font-semibold text-emerald-800 mt-0.5">{product.available_stock} Units Available</p>
              </div>
            </div>
          </div>

          {/* Tier Pricing Table */}
          <div className="bg-white rounded-[4px] p-6 border border-gold-300/60 shadow-sm">
            <h3 className="text-sm font-serif font-bold text-heritage-brown-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-600" /> Wholesale Volume Pricing Tiers
            </h3>
            <p className="text-xs text-heritage-brown-600 mt-0.5 font-sans">Discounts are automatically calculated server-side based on order quantity</p>

            <div className="mt-4 divide-y divide-gold-100 border border-gold-200 rounded-[4px] overflow-hidden">
              <div className="grid grid-cols-3 p-3 bg-ivory-50 text-xs font-semibold text-heritage-brown-700 uppercase">
                <span>Tier Name</span>
                <span className="text-center">Min Quantity</span>
                <span className="text-right">Unit Price (INR)</span>
              </div>
              <div className="grid grid-cols-3 p-3 text-xs bg-white">
                <span className="font-medium text-heritage-brown-800">Base Retail MSRP</span>
                <span className="text-center text-heritage-brown-600">1 Unit</span>
                <span className="text-right font-semibold text-heritage-brown-950">
                  {product.base_retail_price?.toLocaleString("en-IN") || "-"}
                </span>
              </div>
              {product.pricing_tiers.map((t) => (
                <div key={t.id} className="grid grid-cols-3 p-3 text-xs bg-gold-50/50">
                  <span className="font-medium text-heritage-brown-950">{t.tier_name}</span>
                  <span className="text-center text-gold-800 font-semibold">{t.min_quantity}+ Units</span>
                  <span className="text-right font-bold text-silk-red-700 font-serif">
                    INR {t.tier_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Interactive Order & Quote Calculator */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[4px] p-6 border border-gold-300/60 shadow-luxury sticky top-6">
            <h2 className="text-base font-serif font-bold text-heritage-brown-950">Configure Wholesale Order</h2>
            <p className="text-xs text-heritage-brown-600 mt-0.5 font-sans">Select quantity to see real-time volume discounts</p>

            {errorMsg && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-[4px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-[4px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Quantity Input */}
            <div className="mt-5 space-y-2">
              <label className="block text-xs font-semibold text-heritage-brown-900 uppercase tracking-wider">
                Order Quantity (Sarees)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max={product.available_stock || 100}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-28 p-2.5 text-sm font-semibold border border-gold-300 rounded-[4px] focus:ring-1 focus:ring-silk-red-600 focus:border-silk-red-600 text-center text-heritage-brown-950 bg-ivory-50/60"
                />
                <span className="text-xs text-heritage-brown-600 font-sans">
                  {product.available_stock} in stock
                </span>
              </div>
            </div>

            {/* Quote Summary Box */}
            <div className="mt-6 p-4 bg-ivory-50 rounded-[4px] border border-gold-200 space-y-3 text-xs">
              <div className="flex justify-between text-heritage-brown-700 font-sans">
                <span>Applied Tier:</span>
                <span className="font-semibold text-silk-red-700">
                  {quote?.applied_tier_name || "Base Wholesale Price"}
                </span>
              </div>
              <div className="flex justify-between text-heritage-brown-700 font-sans">
                <span>Effective Unit Price:</span>
                <span className="font-semibold text-heritage-brown-950">
                  INR {quote?.effective_unit_price.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "-"}
                </span>
              </div>
              {quote && quote.total_savings > 0 && (
                <div className="flex justify-between text-emerald-800 font-semibold font-sans">
                  <span>Volume Discount Savings:</span>
                  <span>- INR {quote.total_savings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="pt-3 border-t border-gold-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-heritage-brown-950 font-sans">Subtotal:</span>
                <span className="text-lg font-bold text-silk-red-700 font-serif">
                  INR {quote?.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "-"}
                </span>
              </div>
              <p className="text-[11px] text-heritage-brown-500 text-right font-sans">+ 5.0% Handloom GST applied at checkout</p>
            </div>

            {/* Special Instructions Notes */}
            <div className="mt-4 space-y-1">
              <label className="block text-xs font-semibold text-heritage-brown-900 uppercase tracking-wider">
                Special Instructions / Colorway Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional custom border / packaging requests..."
                className="w-full p-2.5 text-xs border border-gold-300 rounded-[4px] focus:ring-1 focus:ring-silk-red-600 focus:border-silk-red-600 bg-ivory-50/60 text-heritage-brown-950"
              />
            </div>

            {/* Submit Order Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting || !quote || product.available_stock < quantity}
              className="w-full mt-6 py-3.5 px-4 bg-silk-red-600 hover:bg-silk-red-800 disabled:bg-charcoal-300 text-ivory-50 text-xs font-semibold uppercase tracking-widest rounded-[4px] border border-silk-red-600 shadow-luxury transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting Wholesale Order...
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-gold-300" /> Place Wholesale Order (Trade Credit)
                </>
              )}
            </button>
            <p className="text-[11px] text-heritage-brown-500 text-center mt-2 font-sans">
              Order will be placed against approved trade credit limit
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

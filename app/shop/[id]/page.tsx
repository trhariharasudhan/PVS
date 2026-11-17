"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { sampleProducts, ProductItem } from "@/data/products";
import { siteConfig } from "@/config/site";
import { useCart } from "@/context/CartContext";
import { ProductCard } from "@/components/products/ProductCard";
import { GoldDivider } from "@/components/ui/GoldDivider";
import {
  ShoppingBag,
  MessageCircle,
  ShieldCheck,
  Check,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  Truck,
  Building2,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();

  const productId = params?.id as string;
  const product: ProductItem | undefined =
    sampleProducts.find((p) => p.id === productId || p.code.toLowerCase() === productId.toLowerCase()) ||
    sampleProducts[0];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const images = product?.images || [];
  const currentImage = images[activeImageIndex] || images[0];

  const whatsappMessage = siteConfig.whatsappTemplates.product(product.name, product.code);
  const whatsappUrl = `https://wa.me/${siteConfig.business.whatsapp}?text=${encodeURIComponent(whatsappMessage)}`;

  const handleAddToCart = () => {
    addItem(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    router.push("/checkout");
  };

  // Related products
  const relatedProducts = sampleProducts
    .filter((p) => p.id !== product.id && p.categorySlug === product.categorySlug)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-ivory-50 pb-24">
      {/* Breadcrumb Header */}
      <div className="bg-silk-cream-100/50 py-3.5 border-b border-gold-300/40 font-sans text-xs text-heritage-brown-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2">
          <Link href="/" className="hover:text-silk-red-700 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-silk-red-700 transition-colors">
            Shop
          </Link>
          <span>/</span>
          <span className="text-heritage-brown-950 font-semibold truncate max-w-xs sm:max-w-md">
            {product.name}
          </span>
        </div>
      </div>

      {/* Main Product Showcase */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: Gallery */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Stage Image */}
            <div className="relative aspect-[3/4] w-full rounded-[4px] overflow-hidden bg-gold-50 border border-gold-300 shadow-luxury">
              <Image
                src={currentImage?.src || "/placeholder.jpg"}
                alt={currentImage?.alt || product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover object-center transition-all duration-300"
              />
              {product.isSample && (
                <div className="absolute top-4 left-4 bg-heritage-brown-950/90 text-ivory-100 text-[10px] uppercase font-mono px-3 py-1 rounded-[3px] border border-gold-400/50">
                  Sample Catalogue Specimen
                </div>
              )}
            </div>

            {/* Thumbnail Navigation Row */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 sm:w-24 aspect-[3/4] rounded-[4px] overflow-hidden border-2 flex-shrink-0 transition-all ${
                      idx === activeImageIndex
                        ? "border-silk-red-700 ring-2 ring-gold-400/50 scale-102"
                        : "border-gold-300 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image src={img.src} alt={img.alt} fill sizes="96px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Information, Specs & Actions */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs font-bold text-silk-red-700 bg-silk-red-50 border border-silk-red-200 px-2.5 py-0.5 rounded-[3px]">
                  {product.code}
                </span>
                <span className="text-xs font-semibold text-gold-700 uppercase tracking-widest font-mono">
                  {product.category} Collection
                </span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-heritage-brown-950 leading-tight">
                {product.name}
              </h1>

              <div className="mt-3 flex items-baseline gap-3">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-silk-red-700">
                  {product.priceDisplay}
                </span>
                <span className="text-xs text-heritage-brown-600 font-sans">
                  Direct Loom Price (All India Insured Shipping)
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-heritage-brown-700 font-sans leading-relaxed">
              {product.description}
            </p>

            {/* Comprehensive Specifications Table */}
            <div className="border border-gold-300/80 rounded-[4px] bg-white divide-y divide-gold-200/80 text-xs font-sans">
              <div className="p-3 grid grid-cols-3">
                <span className="font-semibold text-heritage-brown-900">Fabric</span>
                <span className="col-span-2 text-heritage-brown-700">{product.fabric}</span>
              </div>
              <div className="p-3 grid grid-cols-3">
                <span className="font-semibold text-heritage-brown-900">Colour</span>
                <span className="col-span-2 text-heritage-brown-700">{product.color}</span>
              </div>
              <div className="p-3 grid grid-cols-3">
                <span className="font-semibold text-heritage-brown-900">Border</span>
                <span className="col-span-2 text-heritage-brown-700">{product.border}</span>
              </div>
              <div className="p-3 grid grid-cols-3">
                <span className="font-semibold text-heritage-brown-900">Pallu</span>
                <span className="col-span-2 text-heritage-brown-700">{product.pallu}</span>
              </div>
              <div className="p-3 grid grid-cols-3">
                <span className="font-semibold text-heritage-brown-900">Length</span>
                <span className="col-span-2 text-heritage-brown-700">{product.length}</span>
              </div>
              <div className="p-3 grid grid-cols-3">
                <span className="font-semibold text-heritage-brown-900">Blouse Piece</span>
                <span className="col-span-2 text-heritage-brown-700">{product.blousePiece}</span>
              </div>
              <div className="p-3 grid grid-cols-3">
                <span className="font-semibold text-heritage-brown-900">Weave</span>
                <span className="col-span-2 text-heritage-brown-700">{product.weaveType}</span>
              </div>
              <div className="p-3 grid grid-cols-3">
                <span className="font-semibold text-heritage-brown-900">Weight (Approx)</span>
                <span className="col-span-2 text-heritage-brown-700">{product.weightApprox}</span>
              </div>
            </div>

            {/* Quantity Selector & Primary Actions */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-heritage-brown-900 uppercase tracking-wider">
                  Quantity:
                </span>
                <div className="flex items-center border border-gold-300 rounded-[4px] bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 text-heritage-brown-600 hover:bg-gold-50"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 text-sm font-bold font-mono text-heritage-brown-950">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 text-heritage-brown-600 hover:bg-gold-50"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {product.availability}
                </span>
              </div>

              {/* Action Buttons: Add to Cart, Buy Now, WhatsApp Enquiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  className={`w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-[4px] text-xs uppercase font-semibold tracking-wider transition-all shadow-sm ${
                    isAdded
                      ? "bg-emerald-700 text-white"
                      : "bg-silk-red-700 hover:bg-deep-maroon-800 text-ivory-50 border border-silk-red-700"
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Cart</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-gold-300" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleBuyNow}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-[4px] text-xs uppercase font-semibold tracking-wider bg-heritage-brown-950 hover:bg-black text-ivory-50 border border-gold-400 shadow-sm transition-all"
                >
                  <span>Buy Now</span>
                  <ArrowRight className="w-4 h-4 text-gold-400" />
                </button>
              </div>

              {/* Direct WhatsApp Enquiry */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-[4px] text-xs uppercase font-semibold tracking-wider bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-all text-center"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enquire about this Saree on WhatsApp</span>
              </a>
            </div>

            {/* Wholesale CTA Box */}
            <div className="p-5 bg-gold-50/90 border border-gold-300 rounded-[4px] space-y-3">
              <div className="flex items-center gap-2 text-silk-red-700 font-serif font-bold text-sm">
                <Building2 className="w-4 h-4" />
                <span>Wholesale & Bulk Inquiries</span>
              </div>
              <p className="text-xs text-heritage-brown-800 font-sans leading-relaxed">
                Interested in bulk quantities? Contact PVS for wholesale pricing and availability.
              </p>
              <Link
                href={`/wholesale?product=${encodeURIComponent(product.name)}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-silk-red-700 hover:text-silk-red-900"
              >
                <span>Wholesale Enquiry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Care Instructions Accordion */}
            <div className="p-4 bg-white border border-gold-300/70 rounded-[4px] space-y-2">
              <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-heritage-brown-950">
                Care Instructions
              </h4>
              <ul className="space-y-1 text-xs text-heritage-brown-700 font-sans list-disc list-inside">
                {product.careInstructions.map((inst, idx) => (
                  <li key={idx}>{inst}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-12 border-t border-gold-300/60">
            <div className="text-center mb-10">
              <span className="text-xs uppercase font-mono tracking-widest text-gold-700 font-bold">
                SIMILAR CRAFTSMANSHIP
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-brown-950 mt-1">
                More from {product.category} Collection
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { siteConfig } from "@/config/site";
import { useCart } from "@/context/CartContext";
import { ShoppingBag, MessageCircle, Eye, Check, X, ArrowRight } from "lucide-react";
import { ProductItem } from "@/data/products";
import { displayPrice } from "@/lib/pricing";

interface ProductCardProps {
  product: ProductItem | any;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addItem } = useCart();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const images = product.images || [];
  const primaryImage = images[0] || {
    src: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop",
    alt: product.name,
  };
  const secondaryImage = images[1] || primaryImage;

  // Normalized product code & price
  const code = product.code || "PVS-SAMPLE";
  const name = product.name || "Traditional Pattu Saree";
  const fabric = product.fabric || "Pure Mulberry Silk";
  const color = product.color || "Rich Traditional Hue";
  const priceDisplay = displayPrice(product.priceDisplay);
  const availability = product.availability || "In Stock";
  const isSample = product.isSample !== false; // Sample policy flag

  const whatsappMessage = siteConfig.whatsappTemplates.product(name, code);
  const whatsappUrl = `https://wa.me/${siteConfig.business.whatsapp}?text=${encodeURIComponent(whatsappMessage)}`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <>
      <div className="group relative flex flex-col bg-white border border-gold-300/80 rounded-[4px] overflow-hidden shadow-sm hover:shadow-luxury hover:border-gold-400 transition-all duration-300">
        {/* Product Image Area with Hover Zoom */}
        <Link
          href={`/shop/${product.id}`}
          className="relative aspect-[3/4] overflow-hidden bg-ivory-100 block"
        >
          <Image
            src={primaryImage.src}
            alt={primaryImage.alt || name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          />

          {/* Secondary Image Crossfade on Hover (if available) */}
          {images.length > 1 && (
            <Image
              src={secondaryImage.src}
              alt={secondaryImage.alt || name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out"
            />
          )}

          {/* Top Left Badges: Code & Sample Indicator */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            <span className="bg-heritage-brown-950/90 text-ivory-100 font-mono text-[10px] font-bold px-2 py-0.5 rounded-[3px] border border-gold-400/40">
              {code}
            </span>
            {isSample && (
              <span className="bg-silk-red-700/90 text-white font-sans text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-[3px]">
                Sample Demo
              </span>
            )}
          </div>

          {/* Availability Badge Top Right */}
          <div className="absolute top-3 right-3 z-10">
            <Badge
              variant={availability === "In Stock" ? "emerald" : "ivory"}
              className="backdrop-blur-sm shadow-sm"
            >
              {availability}
            </Badge>
          </div>

          {/* Quick View Button on Hover */}
          <div className="absolute inset-x-0 bottom-3 px-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsQuickViewOpen(true);
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-heritage-brown-950/90 hover:bg-silk-red-700 text-ivory-100 px-3 py-2 text-xs font-semibold tracking-wider uppercase rounded-[4px] shadow-md border border-gold-400/50 backdrop-blur-sm transition-all"
            >
              <Eye className="w-3.5 h-3.5 text-gold-300" />
              <span>Quick View</span>
            </button>
          </div>
        </Link>

        {/* Product Content Details */}
        <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between bg-white border-t border-ivory-200">
          <div>
            {/* Category & Fabric */}
            <div className="text-[11px] uppercase tracking-widest text-gold-700 font-semibold mb-1 line-clamp-1">
              {product.category || "Pattu Saree"} • {fabric}
            </div>

            {/* Product Title */}
            <Link href={`/shop/${product.id}`} className="block group-hover:text-silk-red-700 transition-colors">
              <h3 className="font-serif text-base sm:text-lg font-bold text-heritage-brown-950 line-clamp-1">
                {name}
              </h3>
            </Link>

            {/* Color Details */}
            <p className="text-xs text-heritage-brown-600 mt-1 line-clamp-1 font-sans">
              <span className="font-medium text-heritage-brown-800">Colour:</span> {color}
            </p>
          </div>

          {/* Price & Actions Row */}
          <div className="mt-4 pt-3 border-t border-gold-200/80">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <span className="text-base sm:text-lg font-bold text-silk-red-700 font-serif">
                  {priceDisplay}
                </span>
                <span className="text-[10px] text-heritage-brown-500 font-sans block">
                  Wholesale & Retail
                </span>
              </div>

              {/* WhatsApp Enquiry Link */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 border border-emerald-300 px-2 py-1 rounded-[3px] bg-emerald-50 hover:bg-emerald-100 transition-colors"
                title="Enquire on WhatsApp"
              >
                <MessageCircle className="w-3 h-3" />
                <span>Enquire</span>
              </a>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs uppercase font-semibold tracking-wider rounded-[4px] transition-all ${
                isAdded
                  ? "bg-emerald-700 text-white"
                  : "bg-silk-red-700 hover:bg-deep-maroon-800 text-ivory-50 shadow-sm"
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added to Cart</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5 text-gold-300" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {isQuickViewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-heritage-brown-950/70 backdrop-blur-sm animate-fade-in-subtle">
          <div className="relative w-full max-w-2xl bg-ivory-50 rounded-[4px] shadow-2xl border border-gold-400 overflow-hidden flex flex-col md:flex-row">
            {/* Modal Close Button */}
            <button
              onClick={() => setIsQuickViewOpen(false)}
              className="absolute top-3 right-3 z-30 p-1.5 bg-white text-heritage-brown-900 rounded-full shadow border border-gold-300 hover:text-silk-red-700"
              aria-label="Close Quick View"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Image */}
            <div className="relative w-full md:w-1/2 aspect-[3/4] bg-gold-50">
              <Image
                src={primaryImage.src}
                alt={name}
                fill
                className="object-cover"
              />
            </div>

            {/* Modal Details */}
            <div className="p-6 md:w-1/2 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="font-mono text-xs font-bold text-gold-800 bg-gold-100 px-2 py-0.5 rounded">
                  {code}
                </span>
                <h3 className="font-serif text-xl font-bold text-heritage-brown-950">
                  {name}
                </h3>
                <p className="text-sm font-serif font-bold text-silk-red-700">
                  {priceDisplay}
                </p>

                <div className="space-y-1 text-xs text-heritage-brown-700 pt-2 border-t border-gold-200">
                  <p><span className="font-semibold text-heritage-brown-950">Fabric:</span> {fabric}</p>
                  <p><span className="font-semibold text-heritage-brown-950">Colour:</span> {color}</p>
                  {product.border && (
                    <p><span className="font-semibold text-heritage-brown-950">Border:</span> {product.border}</p>
                  )}
                  {product.length && (
                    <p><span className="font-semibold text-heritage-brown-950">Dimensions:</span> {product.length} (Blouse: {product.blousePiece || "Included"})</p>
                  )}
                </div>

                {isSample && (
                  <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded">
                    * Sample Catalogue Specimen for PVS Manufacturing Demonstration.
                  </p>
                )}
              </div>

              <div className="space-y-2 pt-4 border-t border-gold-200">
                <button
                  onClick={handleAddToCart}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-silk-red-700 hover:bg-deep-maroon-800 text-ivory-50 text-xs font-semibold uppercase tracking-wider rounded-[4px] shadow-sm"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-gold-300" />
                  <span>Add to Cart</span>
                </button>

                <Link
                  href={`/shop/${product.id}`}
                  onClick={() => setIsQuickViewOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-white text-heritage-brown-900 border border-gold-400 text-xs font-semibold uppercase tracking-wider rounded-[4px] hover:bg-gold-50"
                >
                  <span>Full Saree Details</span>
                  <ArrowRight className="w-3 h-3 text-gold-600" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

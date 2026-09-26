"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { siteConfig } from "@/config/site";
import { ArrowUpRight, Sparkles } from "lucide-react";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const primaryImage = product.images[0] || {
    src: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop",
    alt: product.name,
  };
  const secondaryImage = product.images[1] || primaryImage;

  const whatsappMessage = siteConfig.whatsappTemplates.product(
    product.code,
    product.name
  );

  return (
    <div className="group relative flex flex-col bg-white border border-gold-300/80 rounded-[4px] overflow-hidden shadow-sm hover:shadow-luxury hover:border-gold-400 transition-all duration-300">
      {/* Product Image Area with Subtle Hover Zoom */}
      <Link
        href={`/collections/${product.id}`}
        className="relative aspect-[3/4] overflow-hidden bg-ivory-100 block"
      >
        <Image
          src={primaryImage.src}
          alt={primaryImage.alt || product.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Secondary Image Crossfade on Hover (if available) */}
        {product.images.length > 1 && (
          <Image
            src={secondaryImage.src}
            alt={secondaryImage.alt || product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out"
          />
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <Badge variant="burgundy" className="backdrop-blur-sm shadow-sm">
            {product.code}
          </Badge>
          {product.isNewArrival && (
            <Badge variant="gold" className="backdrop-blur-sm shadow-sm">
              <Sparkles className="w-2.5 h-2.5 mr-1 inline text-gold-700" /> New Loom
            </Badge>
          )}
        </div>

        {/* Availability Badge Top Right */}
        <div className="absolute top-3 right-3 z-10">
          <Badge
            variant={product.availability === "In Stock" ? "emerald" : "ivory"}
            className="backdrop-blur-sm shadow-sm"
          >
            {product.availability}
          </Badge>
        </div>

        {/* Quick View Overlay on Hover */}
        <div className="absolute inset-0 bg-heritage-brown-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
          <span className="inline-flex items-center gap-1.5 bg-ivory-50 text-heritage-brown-900 px-4 py-2 text-xs font-semibold tracking-wider uppercase rounded-[4px] shadow-md border border-gold-400/50 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            View Saree <ArrowUpRight className="w-3.5 h-3.5 text-gold-600" />
          </span>
        </div>
      </Link>

      {/* Product Content Details */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between bg-white border-t border-ivory-200">
        <div>
          {/* Category & Fabric */}
          <div className="text-[11px] uppercase tracking-widest text-gold-700 font-semibold mb-1 line-clamp-1">
            {product.category} • {product.fabric}
          </div>

          {/* Product Title */}
          <Link href={`/collections/${product.id}`} className="block group-hover:text-silk-red-700 transition-colors">
            <h3 className="font-serif text-base sm:text-lg font-bold text-heritage-brown-950 line-clamp-1">
              {product.name}
            </h3>
          </Link>

          {/* Color & Border Spec */}
          <p className="text-xs text-heritage-brown-600 mt-1 line-clamp-1">
            <span className="font-medium text-heritage-brown-800">Color:</span> {product.color}
          </p>
          <p className="text-xs text-heritage-brown-600 mt-0.5 line-clamp-1">
            <span className="font-medium text-heritage-brown-800">Border:</span> {product.border}
          </p>
        </div>

        {/* Price / Enquiry & WhatsApp Action Button */}
        <div className="mt-4 pt-3 border-t border-gold-200/80 flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-bold text-silk-red-700 tracking-wide font-serif">
              {product.priceDisplay}
            </div>
            <div className="text-[10px] text-heritage-brown-500 font-sans">
              Direct Loom Rate
            </div>
          </div>

          <WhatsAppButton
            size="sm"
            variant="primary"
            label="Enquire"
            message={whatsappMessage}
          />
        </div>
      </div>
    </div>
  );
}

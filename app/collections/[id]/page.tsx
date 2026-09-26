"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getProductByIdOrCode, adaptApiProductDetailToProduct } from "@/lib/api";
import { Product } from "@/types";
import { siteConfig } from "@/config/site";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { Badge } from "@/components/ui/Badge";
import { ProductCard } from "@/components/products/ProductCard";
import {
  Share2,
  Check,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Maximize2,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const idOrCode = decodeURIComponent(rawId as string);

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!idOrCode) return;
      setIsLoading(true);
      setError(null);
      try {
        const apiData = await getProductByIdOrCode(idOrCode);
        const adapted = adaptApiProductDetailToProduct(apiData);
        setProduct(adapted);
        setSelectedImageIndex(0);
      } catch (err) {
        console.error("Failed to load product:", err);
        setError("Saree not found or failed to retrieve specifications.");
      } finally {
        setIsLoading(false);
      }
    }
    loadProduct();
  }, [idOrCode]);

  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory-50 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-white border border-gold-300 rounded-[4px] shadow-sm">
            <Loader2 className="w-6 h-6 text-silk-red-600 animate-spin mr-3" />
            <span className="font-serif text-sm font-semibold text-heritage-brown-950">
              Retrieving Silk Saree Archive...
            </span>
          </div>
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 animate-pulse">
            <div className="lg:col-span-7 aspect-[4/5] bg-gold-100/50 rounded-[4px]" />
            <div className="lg:col-span-5 space-y-4 text-left">
              <div className="h-6 bg-gold-100 rounded w-1/3" />
              <div className="h-10 bg-gold-100 rounded w-3/4" />
              <div className="h-6 bg-gold-50 rounded w-1/4" />
              <div className="h-28 bg-gold-50 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not Found / Error State
  if (error || !product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 bg-ivory-50">
        <AlertCircle className="w-12 h-12 text-silk-red-600 mb-3" />
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-brown-950">
          Saree Not Found
        </h2>
        <p className="text-sm text-heritage-brown-700 mt-2 max-w-md font-sans">
          {error || "The requested saree code or archive entry does not exist or has been rotated off the loom."}
        </p>
        <Link
          href="/collections"
          className="mt-6 inline-flex items-center gap-2 bg-silk-red-600 text-ivory-50 px-6 py-3 text-xs uppercase tracking-widest font-semibold rounded-[4px] hover:bg-silk-red-800 transition-colors border border-silk-red-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Collections
        </Link>
      </div>
    );
  }

  const activeImage = product.images[selectedImageIndex] || product.images[0];
  const whatsappMessage = siteConfig.whatsappTemplates.product(
    product.code,
    product.name
  );

  return (
    <div className="min-h-screen bg-ivory-50 pb-24">
      {/* Breadcrumb Navigation Bar */}
      <div className="bg-ivory-100/80 border-b border-ivory-200 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center text-xs text-heritage-brown-600 gap-2 font-sans">
          <Link href="/" className="hover:text-silk-red-600">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-gold-600" />
          <Link href="/collections" className="hover:text-silk-red-600">
            Collections
          </Link>
          <ChevronRight className="w-3 h-3 text-gold-600" />
          <span className="text-silk-red-600 font-bold truncate">
            {product.code} — {product.name}
          </span>
        </div>
      </div>

      {/* Main Product Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* LEFT: Multi-Angle Image Gallery */}
          <div className="lg:col-span-7 space-y-4">
            {/* Primary Large Image View */}
            <div className="relative aspect-[3/4] sm:aspect-[4/5] bg-white border border-gold-300/60 rounded-[4px] overflow-hidden shadow-luxury group">
              <Image
                src={activeImage.src}
                alt={activeImage.alt || product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover object-center"
              />

              {/* In-Picture Angle Tag */}
              {activeImage.tag && (
                <div className="absolute top-4 left-4 z-10">
                  <Badge variant="burgundy" className="backdrop-blur-sm">
                    {activeImage.tag}
                  </Badge>
                </div>
              )}

              {/* Fullscreen Zoom Trigger */}
              <button
                type="button"
                onClick={() => setIsZoomOpen(true)}
                className="absolute bottom-4 right-4 p-2.5 bg-heritage-brown-950/85 text-gold-300 hover:text-white rounded-[4px] border border-gold-500/40 backdrop-blur-sm transition-colors"
                aria-label="Zoom image"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail Row */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative aspect-[3/4] rounded-[4px] overflow-hidden bg-white border transition-all ${
                      selectedImageIndex === idx
                        ? "border-silk-red-600 ring-2 ring-gold-400"
                        : "border-gold-200 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="15vw"
                      className="object-cover object-center"
                    />
                    {img.tag && (
                      <span className="absolute bottom-0 inset-x-0 bg-heritage-brown-950/85 text-gold-300 text-[9px] py-0.5 text-center truncate">
                        {img.tag}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="p-4 bg-gold-50/70 border border-gold-200 rounded-[4px] text-xs text-heritage-brown-700 flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold text-heritage-brown-950">
                <Sparkles className="w-4 h-4 text-gold-600" />
                Direct Manufacturing Guarantee
              </span>
              <span className="text-[11px] text-gold-700 font-bold">100% Tested Pure Mulberry Silk</span>
            </div>
          </div>

          {/* RIGHT: Product Specifications & Enquiry Actions */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              {/* Product Code & Availability */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono font-bold tracking-widest text-silk-red-700 bg-silk-red-50 px-2.5 py-1 border border-silk-red-200 rounded-[4px]">
                  CODE: {product.code}
                </span>
                <Badge variant={product.availability === "In Stock" ? "emerald" : "gold"}>
                  {product.availability}
                </Badge>
              </div>

              {/* Product Title */}
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-heritage-brown-950 tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Price / Enquiry Note */}
              <div className="mt-3 flex items-baseline gap-3">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-silk-red-600">
                  {product.priceDisplay}
                </span>
                <span className="text-xs text-heritage-brown-600 font-sans">
                  Direct Loom Price / WhatsApp Quotation
                </span>
              </div>
              {product.priceNote && (
                <p className="text-xs text-gold-700 font-semibold mt-1">
                  {product.priceNote}
                </p>
              )}
            </div>

            {/* Conversion CTA Group */}
            <div className="space-y-3 pt-2">
              <WhatsAppButton
                size="lg"
                variant="primary"
                label="Enquire on WhatsApp"
                message={whatsappMessage}
                className="w-full justify-center shadow-luxury"
              />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-gold-50 text-heritage-brown-800 border border-gold-300 rounded-[4px] text-xs font-semibold uppercase tracking-wider transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-700" />
                      <span className="text-emerald-800 font-bold">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-silk-red-600" />
                      <span>Share Saree</span>
                    </>
                  )}
                </button>

                <Link
                  href="/wholesale"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 bg-heritage-brown-900 hover:bg-heritage-brown-950 text-ivory-50 border border-gold-500/40 rounded-[4px] text-xs font-semibold uppercase tracking-wider transition-all"
                >
                  <span>Wholesale Inquiry</span>
                </Link>
              </div>
            </div>

            {/* Editorial Description */}
            <div className="border-t border-ivory-200 pt-5">
              <h3 className="font-serif text-sm font-bold uppercase tracking-widest text-heritage-brown-950 mb-2">
                Weaving Narrative
              </h3>
              <p className="text-xs sm:text-sm text-heritage-brown-700 leading-relaxed font-sans">
                {product.description}
              </p>
              {product.detailedStory && (
                <p className="text-xs sm:text-sm text-heritage-brown-700 leading-relaxed font-sans mt-2 italic border-l-2 border-gold-400 pl-3">
                  {product.detailedStory}
                </p>
              )}
            </div>

            {/* Technical Specifications Table */}
            <div className="border-t border-ivory-200 pt-5">
              <h3 className="font-serif text-sm font-bold uppercase tracking-widest text-heritage-brown-950 mb-3">
                Fabric Specifications
              </h3>
              <div className="bg-white border border-gold-200/80 rounded-[4px] overflow-hidden text-xs">
                <div className="grid grid-cols-3 p-2.5 border-b border-ivory-200 bg-ivory-50/60">
                  <span className="font-semibold text-heritage-brown-700">Fabric</span>
                  <span className="col-span-2 text-heritage-brown-950 font-medium">{product.fabric}</span>
                </div>
                <div className="grid grid-cols-3 p-2.5 border-b border-ivory-200">
                  <span className="font-semibold text-heritage-brown-700">Colorway</span>
                  <span className="col-span-2 text-heritage-brown-950 font-medium">{product.color}</span>
                </div>
                <div className="grid grid-cols-3 p-2.5 border-b border-ivory-200 bg-ivory-50/60">
                  <span className="font-semibold text-heritage-brown-700">Weave Style</span>
                  <span className="col-span-2 text-heritage-brown-950 font-medium">{product.weaveType}</span>
                </div>
                <div className="grid grid-cols-3 p-2.5 border-b border-ivory-200">
                  <span className="font-semibold text-heritage-brown-700">Border Detail</span>
                  <span className="col-span-2 text-heritage-brown-950 font-medium">{product.border}</span>
                </div>
                <div className="grid grid-cols-3 p-2.5 border-b border-ivory-200 bg-ivory-50/60">
                  <span className="font-semibold text-heritage-brown-700">Pallu Pattern</span>
                  <span className="col-span-2 text-heritage-brown-950 font-medium">{product.pallu}</span>
                </div>
                {product.dimensions && (
                  <>
                    <div className="grid grid-cols-3 p-2.5 border-b border-ivory-200">
                      <span className="font-semibold text-heritage-brown-700">Dimensions</span>
                      <span className="col-span-2 text-heritage-brown-950 font-medium">
                        {product.dimensions.sareeLength} Saree + {product.dimensions.blousePiece}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 p-2.5 bg-ivory-50/60">
                      <span className="font-semibold text-heritage-brown-700">Approx. Weight</span>
                      <span className="col-span-2 text-heritage-brown-950 font-medium">{product.dimensions.weightApprox}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Care Instructions Accordion / Card */}
            <div className="border-t border-ivory-200 pt-5">
              <h3 className="font-serif text-sm font-bold uppercase tracking-widest text-heritage-brown-950 mb-2">
                Silk Care & Longevity
              </h3>
              <ul className="space-y-1.5 text-xs text-heritage-brown-700">
                {product.careInstructions.map((instruction, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-gold-600 font-bold">•</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Zoom Lightbox Modal */}
        {isZoomOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="High-resolution Saree Zoom View"
            className="fixed inset-0 z-50 bg-heritage-brown-950/95 flex items-center justify-center p-4"
            onClick={() => setIsZoomOpen(false)}
          >
            <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center">
              <div className="relative w-full h-[80vh]">
                <Image
                  src={activeImage.src}
                  alt={activeImage.alt}
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-xs text-gold-300 mt-3 font-sans">
                {product.name} — Click anywhere to close inspection
              </p>
            </div>
          </div>
        )}

        {/* Related Saree Collections */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <div className="mt-20 pt-12 border-t border-gold-300/40">
            <div className="flex justify-between items-end mb-8">
              <div>
                <span className="text-xs uppercase tracking-widest text-gold-700 font-semibold">
                  From The Same Category
                </span>
                <h3 className="font-serif text-2xl font-bold text-heritage-brown-950 mt-1">
                  RELATED SILK WEAVES
                </h3>
              </div>
              <Link
                href="/collections"
                className="text-xs uppercase tracking-widest font-semibold text-silk-red-600 hover:underline"
              >
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {product.relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GoldDivider } from "@/components/ui/GoldDivider";
import {
  ShieldCheck,
  Building2,
  MapPin,
  Phone,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "About PVS & Sathish Kumar | Pattu Saree Manufacturer",
  description:
    "The story behind PVS, a Tamil Nadu pattu saree manufacturing business led by Sathish Kumar in Panjakalipatti, Kalipatti, Salem. Wholesale and retail available.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-ivory-50 pb-24">
      {/* Header Banner */}
      <section className="bg-silk-cream-100/70 text-heritage-brown-950 py-16 sm:py-24 border-b border-gold-300/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-textile-weave opacity-40 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-3">
          <span className="text-xs font-semibold tracking-widest uppercase text-silk-red-700 font-mono">
            PVS BRAND & LEADERSHIP
          </span>
          <GoldDivider variant="motif" theme="light" className="!my-2" />
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-heritage-brown-950">
            The Story Behind PVS
          </h1>
          <p className="mt-3 text-base sm:text-lg text-heritage-brown-700 max-w-2xl mx-auto font-sans leading-relaxed">
            Pattu saree manufacturing founded on direct loom craftsmanship, authentic silk, and
            unbroken South Indian tradition in Salem, Tamil Nadu.
          </p>
        </div>
      </section>

      {/* Main Narrative Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Visual */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative aspect-[4/5] rounded-[4px] overflow-hidden bg-heritage-brown-950 border-2 border-gold-400/60 shadow-luxury">
              <Image
                src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop"
                alt="PVS Pattu Saree Manufacturing - Sathish Kumar"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-heritage-brown-950/90 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 bg-heritage-brown-950/90 text-ivory-100 p-4 rounded-[4px] border border-gold-400/40 text-xs space-y-1">
                <p className="font-serif font-bold text-gold-300 text-sm">
                  PVS — Sathish Kumar
                </p>
                <p className="text-[11px] text-ivory-300 font-sans">
                  Pattu Saree Manufacturer • Raaja Veedhi, Panjakalipatti, Kalipatti, Salem, Tamil Nadu 636455
                </p>
              </div>
            </div>
            <p className="text-[11px] text-heritage-brown-600 text-center font-sans">
              Wholesale Supply & Retail Availability directly from our weaving unit.
            </p>
          </div>

          {/* Right Column: Factual Introduction */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-silk-red-700 bg-silk-red-50 border border-silk-red-200 px-3 py-1 rounded-[3px]">
              <MapPin className="w-3.5 h-3.5" />
              <span>Salem District, Tamil Nadu</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-heritage-brown-950 leading-snug">
              Authentic Pattu Saree Manufacturing by Sathish Kumar
            </h2>

            <div className="space-y-4 text-sm sm:text-base text-heritage-brown-700 font-sans leading-relaxed">
              <p>
                PVS is a dedicated pattu saree manufacturing business owned and managed by{" "}
                <strong className="text-heritage-brown-950">Sathish Kumar</strong>, located in{" "}
                <strong className="text-heritage-brown-950">Raaja Veedhi, Panjakalipatti, Kalipatti, Salem, Tamil Nadu 636455</strong>.
              </p>
              <p>
                As a manufacturer at the source, PVS focuses on weaving genuine pattu sarees
                distinguished by traditional elegance, distinctive colors, and structural durability.
                By managing production directly on our looms, we serve both commercial wholesale
                distributors and individual retail buyers without unnecessary intermediaries.
              </p>
            </div>

            {/* Approved Brand Meanings */}
            <div className="space-y-4 pt-2">
              <div className="p-5 bg-white border border-gold-300 rounded-[4px] shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-silk-red-700 font-mono text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-gold-600" />
                  <span>Brand Interpretation 01</span>
                </div>
                <h3 className="font-serif text-lg font-bold text-heritage-brown-950">
                  PVS — Pattu • Vasthiram • Saree
                </h3>
                <p className="text-xs sm:text-sm text-heritage-brown-700 font-sans leading-relaxed">
                  Honoring the sacred purity of authentic silk (<span className="italic font-medium">Pattu</span>),
                  the timeless elegance of ceremonial attire (<span className="italic font-medium">Vasthiram</span>),
                  and the quintessential Indian drape (<span className="italic font-medium">Saree</span>).
                </p>
              </div>

              <div className="p-5 bg-white border border-gold-300 rounded-[4px] shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-silk-red-700 font-mono text-xs font-bold uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-gold-600" />
                  <span>Brand Interpretation 02</span>
                </div>
                <h3 className="font-serif text-lg font-bold text-heritage-brown-950">
                  PVS — Parampariyam • Vannam • Silk
                </h3>
                <p className="text-xs sm:text-sm text-heritage-brown-700 font-sans leading-relaxed">
                  Celebrating our ancestral heritage (<span className="italic font-medium">Parampariyam</span>),
                  the vibrant artistry of distinctive colors (<span className="italic font-medium">Vannam</span>),
                  and the uncompromised luster of natural mulberry silk (<span className="italic font-medium">Silk</span>).
                </p>
              </div>
            </div>

            {/* Business Pillars */}
            <div className="grid grid-cols-2 gap-4 pt-2 font-sans text-xs">
              <div className="p-4 bg-gold-50/70 border border-gold-300 rounded-[4px]">
                <p className="font-bold text-heritage-brown-950 uppercase tracking-wider">
                  Wholesale Supply
                </p>
                <p className="text-heritage-brown-700 mt-1">
                  Retailer, boutique, and reseller bulk orders with direct factory pricing.
                </p>
              </div>

              <div className="p-4 bg-gold-50/70 border border-gold-300 rounded-[4px]">
                <p className="font-bold text-heritage-brown-950 uppercase tracking-wider">
                  Retail Availability
                </p>
                <p className="text-heritage-brown-700 mt-1">
                  Individual retail customers can purchase authentic pattu sarees online and in-store.
                </p>
              </div>
            </div>

            {/* Direct Contact CTAs */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <a
                href={`https://wa.me/${siteConfig.business.whatsapp}?text=${encodeURIComponent(
                  siteConfig.whatsappTemplates.general()
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-6 py-3.5 rounded-[4px] text-xs uppercase tracking-wider shadow-sm transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat with Sathish Kumar</span>
              </a>

              <a
                href={`tel:${siteConfig.business.phoneNumeric}`}
                className="inline-flex items-center gap-2 bg-heritage-brown-900 hover:bg-heritage-brown-950 text-ivory-50 font-semibold px-6 py-3.5 rounded-[4px] text-xs uppercase tracking-wider shadow-sm transition-all"
              >
                <Phone className="w-4 h-4 text-gold-400" />
                <span>Call +91 99651 76136</span>
              </a>

              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-silk-red-700 hover:underline"
              >
                <span>Showroom Directions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

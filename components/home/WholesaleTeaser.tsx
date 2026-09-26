import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { Building2, ArrowRight, ShieldCheck, Truck, RefreshCw } from "lucide-react";

export function WholesaleTeaser() {
  return (
    <section className="py-20 bg-heritage-brown-900 text-ivory-100 relative overflow-hidden border-b border-gold-500/30">
      <div className="absolute inset-0 bg-zari-pattern opacity-15 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-heritage-brown-950/90 border border-gold-500/40 rounded-[4px] p-8 sm:p-12 lg:p-16 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Heading & Value Proposition */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-gold-400">
                <Building2 className="w-4 h-4 text-gold-400" />
                <span>B2B & Trade Partnership</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-ivory-50 leading-tight">
                For Those Who Carry the Tradition Forward
              </h2>

              <p className="text-sm sm:text-base text-ivory-300 font-sans leading-relaxed max-w-xl">
                Partner with PVS SILK S for authentic South Indian handloom collections, direct
                loom pricing, bespoke wedding runs, and dedicated wholesale support in Tamil Nadu.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs font-sans">
                <div className="flex items-center gap-2 text-ivory-200">
                  <ShieldCheck className="w-4 h-4 text-gold-400 flex-shrink-0" />
                  <span>Direct Loom Rates</span>
                </div>
                <div className="flex items-center gap-2 text-ivory-200">
                  <RefreshCw className="w-4 h-4 text-gold-400 flex-shrink-0" />
                  <span>Custom Weave Runs</span>
                </div>
                <div className="flex items-center gap-2 text-ivory-200">
                  <Truck className="w-4 h-4 text-gold-400 flex-shrink-0" />
                  <span>Pan-India Logistics</span>
                </div>
              </div>
            </div>

            {/* Right Column: Actions */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-4 justify-center items-stretch lg:items-end">
              <Link
                href="/wholesale"
                className="inline-flex items-center justify-center gap-2 bg-silk-red-700 hover:bg-deep-maroon-800 text-ivory-50 font-semibold px-8 py-4 text-xs sm:text-sm tracking-widest uppercase rounded-[4px] border border-silk-red-700 shadow-luxury transition-all group"
              >
                <span>Wholesale Enquiry</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-gold-300" />
              </Link>

              <WhatsAppButton
                size="lg"
                variant="secondary"
                label="Wholesale WhatsApp"
                message={siteConfig.whatsappTemplates.wholesale()}
                className="w-full sm:w-auto text-ivory-100 border-gold-400 hover:bg-gold-500 hover:text-heritage-brown-950"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import React from "react";
import { siteConfig } from "@/config/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { WholesaleForm } from "@/components/wholesale/WholesaleForm";
import {
  Building2,
  Package,
  Truck,
  CheckCircle2,
  Sliders,
} from "lucide-react";

export const metadata = {
  title: "Wholesale & B2B Silk Saree Manufacturing",
  description:
    "Partner with PVS Silk S for direct-from-loom silk saree wholesale supply, custom boutique weaving runs, and bulk bridal collections in Tamil Nadu, India.",
};

export default function WholesalePage() {
  const processSteps = [
    {
      step: "01",
      title: "Sample & Catalogue Review",
      desc: "Review high-res digital catalogues or request sample sarees to inspect silk denier, zari sheen, and drape.",
    },
    {
      step: "02",
      title: "Order Finalization & Custom Weaves",
      desc: "Select colorways, confirm quantities, or request custom Jacquard motifs for your brand's unique line.",
    },
    {
      step: "03",
      title: "Loom Scheduling & Weaving",
      desc: "Production is slotted directly onto our high-tension Jacquard or traditional shuttle looms in Tamil Nadu.",
    },
    {
      step: "04",
      title: "Double-Gate Quality Inspection",
      desc: "100% backlit table inspection for pick consistency, correct dimensions (5.5m + blouse), and zero snags.",
    },
    {
      step: "05",
      title: "Moisture-Shield Packaging & Dispatch",
      desc: "Protected in acid-free paper, securely boxed, and dispatched via insured express road or air cargo.",
    },
  ];

  return (
    <div className="min-h-screen bg-ivory-50 pb-24">
      {/* Header Banner */}
      <section className="bg-ivory-100 text-heritage-brown-950 py-20 relative overflow-hidden border-b border-gold-300/40">
        <div className="absolute inset-0 bg-textile-weave opacity-50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-xs font-semibold tracking-widest uppercase text-silk-red-600">
            B2B Trade & Retailer Partnership
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mt-2 text-heritage-brown-950">
            PARTNER WITH PVS SILK S
          </h1>
          <p className="mt-4 text-sm sm:text-base text-heritage-brown-700 max-w-3xl mx-auto font-sans leading-relaxed">
            For retailers, boutiques, saree stores and textile businesses looking for direct silk
            saree manufacturing, consistent loom quality, and wholesale pricing.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        {/* Wholesale Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="p-6 bg-white border border-gold-300/60 rounded-[4px] shadow-sm">
            <div className="w-10 h-10 rounded-[4px] bg-silk-red-50 border border-silk-red-100 flex items-center justify-center text-silk-red-600 mb-4">
              <Package className="w-5 h-5" />
            </div>
            <div className="text-[11px] font-mono text-gold-700 font-bold uppercase">
              Minimum Order
            </div>
            <h3 className="font-serif text-lg font-bold text-heritage-brown-950 mt-1">
              [MOQ: 10 Sarees]
            </h3>
            <p className="text-xs text-heritage-brown-600 mt-1 font-sans">
              Low-threshold entry for luxury boutiques and multi-store retailers.
            </p>
          </div>

          <div className="p-6 bg-white border border-gold-300/60 rounded-[4px] shadow-sm">
            <div className="w-10 h-10 rounded-[4px] bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-700 mb-4">
              <Sliders className="w-5 h-5" />
            </div>
            <div className="text-[11px] font-mono text-gold-700 font-bold uppercase">
              Customization
            </div>
            <h3 className="font-serif text-lg font-bold text-heritage-brown-950 mt-1">
              [Custom Weaves]
            </h3>
            <p className="text-xs text-heritage-brown-600 mt-1 font-sans">
              Custom colorways, specific zari tones, and exclusive CAD motifs available.
            </p>
          </div>

          <div className="p-6 bg-white border border-gold-300/60 rounded-[4px] shadow-sm">
            <div className="w-10 h-10 rounded-[4px] bg-silk-red-50 border border-silk-red-100 flex items-center justify-center text-silk-red-600 mb-4">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="text-[11px] font-mono text-gold-700 font-bold uppercase">
              Loom Hub
            </div>
            <h3 className="font-serif text-lg font-bold text-heritage-brown-950 mt-1">
              {siteConfig.business.location}
            </h3>
            <p className="text-xs text-heritage-brown-600 mt-1 font-sans">
              Direct manufacturing facility with complete quality ownership.
            </p>
          </div>

          <div className="p-6 bg-white border border-gold-300/60 rounded-[4px] shadow-sm">
            <div className="w-10 h-10 rounded-[4px] bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-700 mb-4">
              <Truck className="w-5 h-5" />
            </div>
            <div className="text-[11px] font-mono text-gold-700 font-bold uppercase">
              Logistics
            </div>
            <h3 className="font-serif text-lg font-bold text-heritage-brown-950 mt-1">
              [Pan-India & Global]
            </h3>
            <p className="text-xs text-heritage-brown-600 mt-1 font-sans">
              Reliable logistics with tamper-evident, moisture-shielded packaging.
            </p>
          </div>
        </div>

        {/* Two-Column: Form & Value Proposition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Form */}
          <div className="lg:col-span-7">
            <WholesaleForm />
          </div>

          {/* Right Column: Wholesale Benefits & Direct WhatsApp Action */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-heritage-brown-900 text-ivory-100 p-6 sm:p-8 rounded-[4px] border border-gold-500/40 shadow-xl space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold-400">
                Direct Trade Desk
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-ivory-50">
                Prefer an Instant WhatsApp Trade Chat?
              </h3>
              <p className="text-xs text-ivory-300 leading-relaxed font-sans">
                Connect directly with our manufacturing desk to request instant bulk pricing sheets,
                video catalog previews, or discuss custom loom runs.
              </p>

              <div className="pt-2">
                <WhatsAppButton
                  size="lg"
                  variant="gold"
                  label="Chat with Wholesale Desk"
                  message={siteConfig.whatsappTemplates.wholesale()}
                  className="w-full justify-center"
                />
              </div>

              <div className="pt-3 border-t border-heritage-brown-800 text-[11px] text-ivory-300 space-y-1 font-sans">
                <p>• GST billing & formal commercial invoices provided</p>
                <p>• Video call live stock inspection available</p>
                <p>• Trade response within 2-4 business hours</p>
              </div>
            </div>

            {/* Why Source from PVS Silk S */}
            <div className="bg-white p-6 sm:p-8 rounded-[4px] border border-gold-300/60 shadow-sm space-y-4">
              <h4 className="font-serif text-base font-bold text-heritage-brown-950 uppercase tracking-wide">
                Why Retailers Source From Us:
              </h4>

              <ul className="space-y-3 text-xs text-heritage-brown-700 font-sans">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-heritage-brown-950">Zero Middleman Markup:</strong> Buy at
                    direct factory rates to maximize your retail showroom margins.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-heritage-brown-950">Consistent Weave Density:</strong> Our
                    calibrated looms ensure every saree matches sample weight and dimensions.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-heritage-brown-950">Exclusive Boutique Batches:</strong> Reserve
                    limited color runs so your local competitors don't carry identical pieces.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 5-Step Wholesale Ordering Sequence */}
        <div className="mt-20 pt-16 border-t border-gold-300/40">
          <SectionHeading
            subtitle="Trade Workflow"
            title="THE WHOLESALE ORDERING PROCESS"
            description="A seamless, structured sequence from initial inquiry to final doorstep dispatch."
            align="center"
            className="mb-12"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {processSteps.map((step) => (
              <div
                key={step.step}
                className="p-5 bg-white border border-gold-200 rounded-[4px] shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="font-serif text-2xl font-bold text-silk-red-600">
                    {step.step}
                  </div>
                  <h4 className="font-serif text-sm font-bold text-heritage-brown-950 mt-2">
                    {step.title}
                  </h4>
                  <p className="text-xs text-heritage-brown-600 mt-1 leading-relaxed font-sans">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

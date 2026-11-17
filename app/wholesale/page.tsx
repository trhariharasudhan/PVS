import React from "react";
import { siteConfig } from "@/config/site";
import { WholesaleForm } from "@/components/wholesale/WholesaleForm";
import {
  Building2,
  Package,
  Layers,
  CheckCircle2,
  PhoneCall,
  MessageCircle,
  Truck,
} from "lucide-react";

export const metadata = {
  title: "Wholesale Pattu Sarees, Direct from PVS | Salem Manufacturer",
  description:
    "Supplying sarees for retailers, boutiques, resellers and bulk buyers directly from our manufacturing looms in Salem, Tamil Nadu.",
};

export default function WholesalePage() {
  const whyWholesalePoints = [
    {
      title: "Manufacturer Supply",
      desc: "Direct procurement from our Salem looms eliminates intermediary margins, providing authentic wholesale pricing.",
      icon: <Building2 className="w-5 h-5 text-silk-red-700" />,
    },
    {
      title: "Bulk Availability",
      desc: "Steady production capacity supporting recurring boutique restocks, festival volumes, and wedding party runs.",
      icon: <Package className="w-5 h-5 text-gold-700" />,
    },
    {
      title: "Multiple Collections",
      desc: "Comprehensive selection across Bridal, Wedding, Traditional Korvai, Designer, Silk, and New Arrival colorways.",
      icon: <Layers className="w-5 h-5 text-silk-red-700" />,
    },
    {
      title: "Consistent Quality",
      desc: "Rigorous quality inspection ensuring uniform silk denier, zari luster, and dimensional integrity across every bale.",
      icon: <CheckCircle2 className="w-5 h-5 text-gold-700" />,
    },
    {
      title: "Direct Enquiry",
      desc: "Direct communication with business owner Sathish Kumar and our manufacturing desk for tailored quotes.",
      icon: <PhoneCall className="w-5 h-5 text-silk-red-700" />,
    },
  ];

  return (
    <div className="min-h-screen bg-ivory-50 pb-24">
      {/* Header Banner */}
      <section className="bg-silk-cream-100/70 text-heritage-brown-950 py-16 sm:py-24 border-b border-gold-300/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-textile-weave opacity-40 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-3">
          <span className="text-xs font-semibold tracking-widest uppercase text-silk-red-700 font-mono">
            B2B & WHOLESALE TRADE SUPPLY
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-heritage-brown-950">
            Wholesale Pattu Sarees, Direct from PVS
          </h1>
          <p className="mt-4 text-base sm:text-lg text-heritage-brown-700 max-w-2xl mx-auto font-sans leading-relaxed">
            Supplying sarees for retailers, boutiques, resellers and bulk buyers.
          </p>
          <div className="pt-2">
            <span className="inline-block bg-white border border-gold-300 text-gold-800 text-xs font-mono font-semibold px-4 py-1.5 rounded-[4px] shadow-sm">
              Raaja Veedhi, Panjakalipatti, Kalipatti, Salem, Tamil Nadu 636455
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
        {/* Why Wholesale with PVS Section */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-mono font-bold tracking-widest text-gold-700 uppercase">
              TRADE BENEFITS
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-brown-950 mt-1">
              Why Wholesale with PVS
            </h2>
            <p className="text-xs sm:text-sm text-heritage-brown-600 mt-2 font-sans">
              Partner directly with an authentic Tamil Nadu handloom and Jacquard manufacturer.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {whyWholesalePoints.map((item) => (
              <div
                key={item.title}
                className="p-5 bg-white border border-gold-300/80 rounded-[4px] shadow-sm flex flex-col justify-between space-y-3 hover:shadow-luxury hover:border-gold-500 transition-all"
              >
                <div>
                  <div className="w-10 h-10 rounded-[4px] bg-gold-50 border border-gold-200 flex items-center justify-center mb-3">
                    {item.icon}
                  </div>
                  <h3 className="font-serif text-base font-bold text-heritage-brown-950">
                    {item.title}
                  </h3>
                  <p className="text-xs text-heritage-brown-700 mt-2 leading-relaxed font-sans">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wholesale Form & Direct WhatsApp Contact */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-14 items-start">
          {/* Left Column: Form */}
          <div className="lg:col-span-7">
            <WholesaleForm />
          </div>

          {/* Right Column: Direct WhatsApp Desk & Business Information */}
          <div className="lg:col-span-5 space-y-6">
            {/* WhatsApp CTA Card */}
            <div className="bg-heritage-brown-950 text-ivory-100 p-6 sm:p-8 rounded-[4px] border border-gold-500/40 shadow-xl space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold-400 font-bold">
                DIRECT TRADE DESK
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                Instant Wholesale Consultation
              </h3>
              <p className="text-xs text-ivory-300 leading-relaxed font-sans">
                Prefer immediate communication? Connect directly with our wholesale coordinator on WhatsApp for catalog PDFs, color cards, and volume price lists.
              </p>

              <div className="pt-2">
                <a
                  href={`https://wa.me/${siteConfig.business.whatsapp}?text=${encodeURIComponent(
                    siteConfig.whatsappTemplates.wholesale()
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-4 px-6 rounded-[4px] text-xs sm:text-sm uppercase tracking-wider shadow-md transition-all text-center"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Wholesale Team</span>
                </a>
              </div>

              <div className="pt-4 border-t border-heritage-brown-800 text-[11px] text-ivory-300 space-y-1.5 font-sans">
                <p>• Commercial GST invoicing available</p>
                <p>• Doorstep insured cargo dispatch across India</p>
                <p>• Phone: +91 99651 76136 (Sathish Kumar)</p>
              </div>
            </div>

            {/* Location & Visiting Card */}
            <div className="bg-white border border-gold-300 rounded-[4px] p-6 shadow-sm space-y-3 font-sans text-xs text-heritage-brown-800">
              <h4 className="font-serif text-sm font-bold text-heritage-brown-950 uppercase tracking-wide">
                Showroom & Loom Location
              </h4>
              <p className="leading-relaxed">
                Raaja Veedhi, Panjakalipatti, Kalipatti, Salem District, Tamil Nadu 636455, India.
              </p>
              <p className="text-gold-800 font-medium">
                Store merchants visiting Salem are welcome to visit our looms with prior appointment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

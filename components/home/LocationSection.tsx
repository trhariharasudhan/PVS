import React from "react";
import { siteConfig } from "@/config/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { MapPin, Phone, MessageCircle, Navigation, Clock, ShieldCheck } from "lucide-react";

export function LocationSection() {
  const address = siteConfig.business.address;

  return (
    <section className="py-20 sm:py-28 bg-silk-cream-100/50 text-heritage-brown-950 border-b border-gold-400/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          subtitle="MANUFACTURING UNIT & SHOWROOM"
          title="Visit Our Manufacturing Unit"
          description="We welcome wholesale buyers, retailers, boutique owners, and retail patrons to visit our manufacturing unit in Tamil Nadu."
          align="center"
          className="mb-14"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Address Details Card */}
          <div className="lg:col-span-6 bg-white border border-gold-300 rounded-[4px] p-8 sm:p-10 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-silk-red-700 bg-silk-red-50 border border-silk-red-200 px-3 py-1 rounded-[3px]">
                <MapPin className="w-3.5 h-3.5" />
                <span>Salem District, Tamil Nadu</span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-brown-950">
                PVS Weaving Unit
              </h3>

              <div className="text-sm sm:text-base text-heritage-brown-800 font-sans leading-relaxed pt-2">
                <p className="font-semibold text-heritage-brown-950">{address.street}</p>
                <p>{address.village}, {address.post}</p>
                <p>{address.district} District, {address.state} {address.pincode}</p>
                <p className="text-heritage-brown-600 text-xs mt-1">{address.country}</p>
              </div>

              <div className="pt-4 border-t border-gold-200 space-y-2 text-xs text-heritage-brown-700">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gold-600 flex-shrink-0" />
                  <span>Working Hours: {siteConfig.business.businessHours}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gold-600 flex-shrink-0" />
                  <span>Wholesale consultations & retail showroom browsing available</span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Get Directions, Call PVS, WhatsApp PVS */}
            <div className="pt-4 flex flex-wrap gap-3">
              <a
                href={address.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-silk-red-700 hover:bg-deep-maroon-800 text-ivory-50 text-xs sm:text-sm font-semibold px-6 py-3.5 rounded-[4px] uppercase tracking-wider shadow-sm transition-all"
              >
                <Navigation className="w-4 h-4 text-gold-300" />
                <span>Get Directions</span>
              </a>

              <a
                href={`tel:${siteConfig.business.phoneNumeric}`}
                className="inline-flex items-center gap-2 bg-heritage-brown-900 hover:bg-heritage-brown-950 text-ivory-50 text-xs sm:text-sm font-semibold px-6 py-3.5 rounded-[4px] uppercase tracking-wider shadow-sm transition-all"
              >
                <Phone className="w-4 h-4 text-gold-400" />
                <span>Call PVS</span>
              </a>

              <a
                href={`https://wa.me/${siteConfig.business.whatsapp}?text=${encodeURIComponent(
                  siteConfig.whatsappTemplates.general()
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold px-6 py-3.5 rounded-[4px] uppercase tracking-wider shadow-sm transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp PVS</span>
              </a>
            </div>
          </div>

          {/* Interactive Map / Direction Visual Card */}
          <div className="lg:col-span-6 bg-heritage-brown-950 text-ivory-100 rounded-[4px] border border-gold-500/40 p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-zari-pattern opacity-10 pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold-400 font-bold">
                CONNECT DIRECTLY WITH THE MANUFACTURER
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight">
                Authentic Pattu Sarees Directly from the Loom
              </h3>
              <p className="text-xs sm:text-sm text-ivory-300 leading-relaxed font-sans">
                Whether you are seeking 50 sarees for an upcoming boutique festival season, bespoke wedding
                colorways, or an individual pure silk saree, we assist you directly at our loom unit.
              </p>
            </div>

            <div className="relative z-10 p-5 bg-heritage-brown-900/90 border border-gold-500/30 rounded-[4px] space-y-2 mt-6">
              <div className="text-xs font-semibold text-gold-300 uppercase tracking-wider">
                Direct Contact Person
              </div>
              <p className="font-serif text-lg font-bold text-white">
                Sathish Kumar
              </p>
              <p className="text-xs text-ivory-200">
                PVS — Pattu Saree Manufacturer
              </p>
              <p className="text-xs text-gold-400 font-mono font-semibold pt-1">
                +91 99651 76136
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

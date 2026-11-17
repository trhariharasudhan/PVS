import React from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowRight, UserCheck, ShieldCheck, MapPin } from "lucide-react";

export function AboutPreview() {
  return (
    <section className="py-20 sm:py-28 bg-ivory-50 text-heritage-brown-950 border-b border-gold-400/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Visual: Authentic Textile Photography */}
          <div className="lg:col-span-5 relative aspect-[4/5] rounded-[4px] overflow-hidden bg-heritage-brown-950 border-2 border-gold-400/60 shadow-luxury">
            <Image
              src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop"
              alt="PVS Pattu Saree Manufacturing - Salem, Tamil Nadu"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-heritage-brown-950/85 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 bg-heritage-brown-950/90 text-ivory-100 p-3.5 rounded-[4px] border border-gold-400/40 text-xs">
              <p className="font-serif font-bold text-gold-300">
                PVS — Sathish Kumar
              </p>
              <p className="text-[11px] text-ivory-300 font-sans mt-0.5">
                Raaja Veedhi, Panjakalipatti, Kalipatti, Tamil Nadu 636455
              </p>
            </div>
          </div>

          {/* Right Column: Factual Introduction */}
          <div className="lg:col-span-7 space-y-6">
            <SectionHeading
              subtitle="MANUFACTURING LEADERSHIP"
              title="The Story Behind PVS"
              align="left"
              className="mb-2"
            />

            <p className="font-serif text-xl sm:text-2xl text-silk-red-700 leading-snug">
              Led by Sathish Kumar, PVS is dedicated to authentic pattu saree manufacturing
              rooted in the textile heartland of Salem, Tamil Nadu.
            </p>

            <div className="space-y-4 text-sm sm:text-base text-heritage-brown-700 font-sans leading-relaxed">
              <p>
                PVS operates with a simple, transparent principle: craft authentic traditional
                pattu sarees directly on looms, maintaining uncompromised quality in pure silk yarns
                and tested zari, while making collections accessible for both wholesale merchants
                and individual retail shoppers.
              </p>
              <p>
                From our manufacturing unit in Panjakalipatti, Kalipatti, we supply silk sarees
                designed with traditional South Indian elegance, vibrant colors, and durable weave integrity.
              </p>
            </div>

            {/* Approved Brand Meanings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-white border border-gold-300/80 rounded-[4px] shadow-sm">
                <span className="text-[10px] font-mono tracking-widest uppercase text-gold-700 font-bold block mb-1">
                  Brand Interpretation 01
                </span>
                <h4 className="font-serif text-sm font-bold text-heritage-brown-950">
                  Pattu • Vasthiram • Saree
                </h4>
                <p className="text-xs text-heritage-brown-600 mt-1">
                  Celebrating pure silk fiber, graceful attire, and timeless Indian drapery.
                </p>
              </div>

              <div className="p-4 bg-white border border-gold-300/80 rounded-[4px] shadow-sm">
                <span className="text-[10px] font-mono tracking-widest uppercase text-gold-700 font-bold block mb-1">
                  Brand Interpretation 02
                </span>
                <h4 className="font-serif text-sm font-bold text-heritage-brown-950">
                  Parampariyam • Vannam • Silk
                </h4>
                <p className="text-xs text-heritage-brown-600 mt-1">
                  Honoring ancestral tradition, auspicious color shades, and natural silk luster.
                </p>
              </div>
            </div>

            {/* CTA Button: Discover Our Story */}
            <div className="pt-2">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 bg-silk-red-700 hover:bg-deep-maroon-800 text-ivory-50 font-semibold px-8 py-3.5 text-xs sm:text-sm tracking-widest uppercase rounded-[4px] border border-silk-red-700 shadow-sm transition-all group"
              >
                <span>Discover Our Story</span>
                <ArrowRight className="w-4 h-4 text-gold-300 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

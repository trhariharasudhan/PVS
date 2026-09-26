import React from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ShieldCheck, Heart, Sparkles, Building2, MapPin } from "lucide-react";

export const metadata = {
  title: "About Us & Brand Story",
  description:
    "Learn about PVS Silk S, an authentic silk saree manufacturing business from Tamil Nadu dedicated to precision weaving, pure mulberry silk, and honest craftsmanship.",
};

function BrandValues() {
  const values = [
    {
      title: "Direct Weaving Integrity",
      desc: "We stand by authentic manufacturing. Every saree in our catalogue originates directly from our own calibrated looms in Tamil Nadu.",
      icon: <Building2 className="w-5 h-5 text-gold-700" />,
    },
    {
      title: "Tested Pure Silk & Zari",
      desc: "We source certified Grade-A pure mulberry silk and electroplated metallic/silver zari, ensuring zero compromise on longevity and sheen.",
      icon: <Sparkles className="w-5 h-5 text-gold-700" />,
    },
    {
      title: "Transparent Provenance",
      desc: "Clear business terms, direct manufacturer pricing without inflated retail margins, and genuine batch traceability.",
      icon: <ShieldCheck className="w-5 h-5 text-gold-700" />,
    },
    {
      title: "Weaver's Welfare & Respect",
      desc: "Our master weavers and loom operators are the heart of PVS Silk S. We maintain safe, dignified, and ethical workshop conditions.",
      icon: <Heart className="w-5 h-5 text-gold-700" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
      {values.map((v, idx) => (
        <div
          key={idx}
          className="p-6 bg-white border border-gold-300/60 rounded-[4px] shadow-sm hover:shadow-luxury hover:border-gold-400 transition-all"
        >
          <div className="w-10 h-10 rounded-[4px] bg-gold-50 border border-gold-200 flex items-center justify-center mb-4">
            {v.icon}
          </div>
          <h4 className="font-serif text-base font-bold text-heritage-brown-950">
            {v.title}
          </h4>
          <p className="text-xs text-heritage-brown-700 mt-2 leading-relaxed font-sans">
            {v.desc}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-ivory-50 pb-24">
      {/* Header Banner */}
      <section className="bg-ivory-100 text-heritage-brown-950 py-20 relative overflow-hidden border-b border-gold-300/40">
        <div className="absolute inset-0 bg-textile-weave opacity-50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-xs font-semibold tracking-widest uppercase text-silk-red-600">
            Our Heritage & Philosophy
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mt-2 text-heritage-brown-950">
            FROM WEAVING TO BRAND
          </h1>
          <p className="mt-4 text-sm sm:text-base text-heritage-brown-700 max-w-2xl mx-auto font-sans leading-relaxed">
            PVS Silk S is built upon the foundation of genuine textile manufacturing, precision
            looms, and an unyielding commitment to authentic silk sarees.
          </p>
        </div>
      </section>

      {/* Main Narrative Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Factory & Weaving Image */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-[4/5] rounded-[4px] overflow-hidden bg-heritage-brown-950 border-2 border-gold-400/60 shadow-luxury">
              <Image
                src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop"
                alt="PVS Silk S Master Weaving Loom"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-heritage-brown-950/90 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 bg-heritage-brown-950/90 text-ivory-100 p-3.5 rounded-[4px] border border-gold-400/40 text-xs">
                <p className="font-serif font-bold text-gold-300">PVS Silk S Weaving Unit</p>
                <p className="text-[11px] text-ivory-300 font-sans">
                  {siteConfig.business.location} — Direct Manufacturing Looms
                </p>
              </div>
            </div>
            <p className="text-[11px] text-heritage-brown-500 italic text-center font-sans">
              * Dedicated business & workshop photography from our manufacturing unit in Tamil Nadu.
            </p>
          </div>

          {/* Right Column: Editorial Narrative & Factual Placeholders */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-silk-red-600">
              <MapPin className="w-4 h-4 text-gold-600" />
              <span>Tamil Nadu Textile Heritage</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-heritage-brown-950 leading-snug">
              Authentic Silk Manufacturing Rooted in Precision
            </h2>

            <p className="text-sm sm:text-base text-heritage-brown-700 font-sans leading-relaxed">
              PVS Silk S was established with a singular focus: to manufacture silk sarees of
              uncompromising quality directly at source. In a market often saturated by middlemen
              and diluted silk blends, we maintain direct control over our yarn selection,
              dyeing, Jacquard punch-card coding, and loom weaving.
            </p>

            {/* Factual Editable Placeholders Box */}
            <div className="bg-gold-50/80 border border-gold-300/80 rounded-[4px] p-5 space-y-3">
              <div className="text-[11px] font-mono uppercase tracking-widest text-silk-red-700 font-bold border-b border-gold-200 pb-1">
                Editable Business Background Information:
              </div>
              <div className="space-y-2 text-xs text-heritage-brown-800 font-sans">
                <p>
                  <span className="font-semibold text-heritage-brown-950">Founding Story:</span> [ADD
                  BUSINESS FOUNDING STORY & INSPIRATION]
                </p>
                <p>
                  <span className="font-semibold text-heritage-brown-950">Manufacturing Scale:</span>{" "}
                  {siteConfig.business.manufacturingCapacityPlaceholder} across modern electronic
                  Jacquard looms.
                </p>
                <p>
                  <span className="font-semibold text-heritage-brown-950">Geographic Hub:</span>{" "}
                  {siteConfig.business.location} — {siteConfig.business.address.city}, Tamil Nadu.
                </p>
                <p>
                  <span className="font-semibold text-heritage-brown-950">Product Speciality:</span> Pure
                  Kanchipuram Silk, Bridal Zari Brocades, Traditional Korvai, and Soft Silk
                  Collections.
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-heritage-brown-700 leading-relaxed font-sans">
              Every design is developed with deep reverence for traditional South Indian motifs—the
              sacred Peacock (Mayil), the temple spire (Gopuram), the auspicious Rudraksham, and
              the timeless Annapakshi bird—woven with modern tension-balanced machinery for unmatched
              structural consistency.
            </p>

            <div className="pt-2 flex items-center gap-4">
              <WhatsAppButton
                size="md"
                variant="primary"
                label="Connect with Founder / Team"
                message="Hello PVS Silk S, I would like to know more about your brand and manufacturing operations."
              />
              <Link
                href="/manufacturing"
                className="text-xs uppercase tracking-widest font-semibold text-silk-red-600 hover:text-silk-red-800 underline"
              >
                Tour Our Process →
              </Link>
            </div>
          </div>
        </div>

        {/* Brand Values & Ethics */}
        <div className="mt-20 pt-16 border-t border-gold-300/40">
          <SectionHeading
            subtitle="Core Philosophy"
            title="THE VALUES THAT GUIDE OUR LOOMS"
            description="Our non-negotiable principles for quality, transparency, and weaver craftsmanship."
            align="center"
          />
          <BrandValues />
        </div>
      </section>
    </div>
  );
}

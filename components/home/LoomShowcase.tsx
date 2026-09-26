import React from "react";
import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { Cpu, ArrowRight, CheckCircle2 } from "lucide-react";

export function LoomShowcase() {
  const narrativePillars = [
    {
      step: "01",
      title: "Mulberry Silk Filaments",
      desc: "High-twist mulberry silk threads degummed and hank-dyed with natural eco-friendly pigments for rich, deep colorfastness.",
    },
    {
      step: "02",
      title: "Precision CAD Jacquard Coding",
      desc: "Intricate Dravidian temple spires and floral vines mapped into electronic punch commands for flawless motif execution.",
    },
    {
      step: "03",
      title: "High-Tension Loom Weaving",
      desc: "Uniform warp beam tension eliminates loose picks, ensuring consistent fabric thickness throughout all 5.5 meters.",
    },
    {
      step: "04",
      title: "Artisanal Zari Interlacing",
      desc: "Master weavers lock tested gold and copper zari into the pallu and borders using centuries-old Korvai precision.",
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-heritage-brown-900 text-ivory-100 relative overflow-hidden border-b border-gold-500/30">
      {/* Background Subtle Zari Pattern Accent */}
      <div className="absolute inset-0 bg-zari-pattern opacity-15 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Cinematic Visual & Machine Badge */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-[16/10] rounded-[4px] overflow-hidden border-2 border-gold-500/40 shadow-2xl group">
              <Image
                src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1400&auto=format&fit=crop"
                alt="High-Tension Electronic Jacquard Weaving Loom Machine in Action - PVS Silk S"
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-heritage-brown-950/90 via-transparent to-transparent" />

              {/* In-Picture Technical Tag */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-3 bg-heritage-brown-950/90 backdrop-blur-md rounded-[4px] border border-gold-500/40 text-xs">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-gold-400" />
                  <span className="font-serif text-ivory-100 font-semibold">
                    Electronic Jacquard Loom Unit
                  </span>
                </div>
                <span className="text-[11px] text-gold-300 font-mono tracking-wider">
                  {siteConfig.business.loomCountPlaceholder}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-ivory-300 text-center sm:text-left italic font-sans">
              * Direct manufacturing loom photography from our dedicated weaving unit in Tamil Nadu.
            </p>
          </div>

          {/* Right Column: Narrative Storytelling Flow */}
          <div className="lg:col-span-5 space-y-6">
            <SectionHeading
              subtitle="FROM LOOM TO LEGACY"
              title="WHERE EVERY THREAD BECOMES A STORY"
              theme="dark"
              align="left"
              className="mb-2"
            />

            <p className="text-sm sm:text-base text-ivory-200 font-sans leading-relaxed">
              Unlike commercial traders who curate finished goods, PVS Silk S creates each saree
              from the raw thread up. We combine the rhythmic heritage of master handlooms with
              calibrated electronic Jacquard precision to weave sarees of legendary drape and longevity.
            </p>

            <div className="space-y-3 pt-2">
              {narrativePillars.map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gold-500/20 text-gold-300 border border-gold-400/40 flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0 mt-0.5">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-serif font-bold text-ivory-50 uppercase tracking-wide">
                      {item.title}
                    </h4>
                    <p className="text-xs text-ivory-300 mt-0.5 font-sans leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                href="/manufacturing"
                className="inline-flex items-center gap-2 bg-silk-red-700 hover:bg-deep-maroon-800 text-ivory-50 font-semibold px-6 py-3.5 text-xs tracking-widest uppercase rounded-[4px] border border-silk-red-700 shadow-md transition-all group"
              >
                <span>View Manufacturing Process</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-gold-300" />
              </Link>

              <WhatsAppButton
                size="md"
                variant="outline"
                label="Enquire Loom Production"
                message={siteConfig.whatsappTemplates.customLoom}
                className="text-ivory-200 border-gold-500/60 hover:bg-gold-500/10 hover:text-gold-300"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

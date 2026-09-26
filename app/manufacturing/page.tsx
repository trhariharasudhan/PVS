import React from "react";
import Image from "next/image";
import Link from "next/link";
import { manufacturingStages, loomMachineSpecs } from "@/data/manufacturing";
import { siteConfig } from "@/config/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import {
  Cpu,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Manufacturing Process & Weaving Looms",
  description:
    "Discover how PVS Silk S crafts authentic silk sarees in Tamil Nadu through our 7-stage manufacturing process, electronic Jacquard looms, and rigorous quality benchmarks.",
};

export default function ManufacturingPage() {
  return (
    <div className="min-h-screen bg-ivory-50 pb-24">
      {/* Header Banner */}
      <section className="bg-ivory-100 text-heritage-brown-950 py-20 relative overflow-hidden border-b border-gold-300/40">
        <div className="absolute inset-0 bg-textile-weave opacity-50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-xs font-semibold tracking-widest uppercase text-silk-red-600">
            Manufacturing Provenance • Tamil Nadu
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mt-2 text-heritage-brown-950">
            THE ART OF SILK WEAVING
          </h1>
          <p className="mt-4 text-sm sm:text-base text-heritage-brown-700 max-w-3xl mx-auto font-sans leading-relaxed">
            From unspun pure mulberry silk hanks to the rhythmic precision of electronic Jacquard
            and traditional shuttle looms, explore the meticulous journey behind every PVS Silk S
            saree.
          </p>
        </div>
      </section>

      {/* Loom Machinery Showcase Section */}
      <section className="py-16 sm:py-24 bg-heritage-brown-900 text-ivory-100 border-b border-gold-500/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-semibold tracking-widest uppercase text-gold-400">
              The Weaving Infrastructure
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ivory-50 mt-2">
              WHERE THE SAREE BEGINS
            </h2>
            <p className="text-xs sm:text-sm text-ivory-300 mt-3 font-sans leading-relaxed">
              We operate advanced electronic Jacquard looms and traditional shuttle looms under
              stringent engineering tolerances. This ensures high warp density, zero yarn
              distortion, and microscopic motif definition.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {loomMachineSpecs.map((loom, idx) => (
              <div
                key={idx}
                className="bg-heritage-brown-950/90 border border-gold-500/30 rounded-[4px] overflow-hidden flex flex-col justify-between shadow-2xl"
              >
                <div className="relative aspect-[16/10] bg-heritage-brown-950">
                  <Image
                    src={loom.image}
                    alt={loom.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-heritage-brown-950 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 bg-heritage-brown-900/90 text-gold-300 text-[10px] font-mono px-2.5 py-1 rounded-[4px] border border-gold-500/40">
                    LOOM CONFIG 0{idx + 1}
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-4 flex-grow flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-semibold tracking-widest uppercase text-gold-400">
                      {loom.type}
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-ivory-50 mt-1">
                      {loom.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-ivory-300/90 leading-relaxed mt-2 font-sans">
                      {loom.description}
                    </p>

                    <div className="mt-5 space-y-2 border-t border-heritage-brown-800/80 pt-4 text-xs">
                      <div className="flex items-start gap-2">
                        <Cpu className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-ivory-200">Precision: </span>
                          <span className="text-ivory-400">{loom.precision}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-ivory-200">Speciality: </span>
                          <span className="text-ivory-400">{loom.speciality}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-heritage-brown-800">
                    <WhatsAppButton
                      size="sm"
                      variant="outline"
                      label="Inquire Loom Capacity"
                      message={siteConfig.whatsappTemplates.customLoom}
                      className="w-full text-gold-300 border-gold-500/40 hover:bg-gold-500/10"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7-Stage Manufacturing Process Section */}
      <section className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          subtitle="The Full Sequence"
          title="7 STAGES OF SAREE MANUFACTURING"
          description="Every meter of our silk saree passes through strict artisanal and technical gates."
          align="center"
          className="mb-16"
        />

        <div className="space-y-16 lg:space-y-24">
          {manufacturingStages.map((stage, idx) => {
            const isEven = idx % 2 === 1;
            return (
              <div
                key={stage.id}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center ${
                  isEven ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Visual */}
                <div
                  className={`lg:col-span-6 relative aspect-[16/11] rounded-[4px] overflow-hidden bg-white border border-gold-300/60 shadow-luxury ${
                    isEven ? "lg:order-2" : "lg:order-1"
                  }`}
                >
                  <Image
                    src={stage.image}
                    alt={stage.imageAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover object-center"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-heritage-brown-950/90 text-gold-300 text-xs px-3.5 py-1.5 rounded-[4px] font-mono tracking-widest border border-gold-500/40">
                      STAGE {stage.stageNumber}
                    </span>
                  </div>
                  {stage.durationOrMetric && (
                    <div className="absolute bottom-3 right-3 bg-white/95 text-heritage-brown-950 font-sans text-xs px-3 py-1 rounded-[4px] shadow border border-gold-300 font-semibold">
                      {stage.durationOrMetric}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div
                  className={`lg:col-span-6 space-y-4 ${
                    isEven ? "lg:order-1" : "lg:order-2"
                  }`}
                >
                  <div className="text-xs font-mono font-bold tracking-widest text-silk-red-600 uppercase">
                    {stage.tamilName}
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-brown-950">
                    {stage.title}
                  </h3>
                  <p className="text-xs font-semibold text-gold-700 uppercase tracking-wide">
                    {stage.tagline}
                  </p>
                  <p className="text-sm text-heritage-brown-700 font-sans leading-relaxed">
                    {stage.description}
                  </p>

                  {/* Technical Points */}
                  <div className="pt-3 space-y-2">
                    <div className="text-xs uppercase tracking-wider font-semibold text-heritage-brown-900">
                      Technical Process Controls:
                    </div>
                    {stage.technicalDetails.map((tech, tIdx) => (
                      <div key={tIdx} className="flex items-start gap-2 text-xs text-heritage-brown-700">
                        <CheckCircle2 className="w-4 h-4 text-gold-600 flex-shrink-0 mt-0.5" />
                        <span>{tech}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Manufacturing CTA Banner */}
      <section className="bg-heritage-brown-900 text-ivory-100 py-16 border-t border-gold-500/30">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-ivory-50">
            WANT TO TOUR OUR MANUFACTURING FACILITY?
          </h2>
          <p className="text-xs sm:text-sm text-ivory-300 max-w-xl mx-auto font-sans">
            We welcome wholesale buyers, retail store owners, and boutique curators to schedule a
            loom walkthrough or live WhatsApp video tour of our weaving looms.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <WhatsAppButton
              size="lg"
              variant="gold"
              label="Book Video Tour on WhatsApp"
              message="Hello PVS Silk S, I would like to schedule a live video call or factory visit to view your manufacturing looms."
            />
            <Link
              href="/wholesale"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-ivory-100 hover:text-gold-300 py-3 px-6 border border-gold-500/40 rounded-[4px]"
            >
              <span>Submit Wholesale Request</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

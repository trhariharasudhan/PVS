"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { manufacturingStages } from "@/data/manufacturing";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CheckCircle2, ChevronRight, Sparkles } from "lucide-react";

export function ProcessPreview() {
  const [activeStageId, setActiveStageId] = useState(1);
  const activeStage =
    manufacturingStages.find((s) => s.id === activeStageId) ||
    manufacturingStages[0];

  const craftStages = [
    { num: "01", name: "Pure Silk", sub: "Hank Sorting" },
    { num: "02", name: "Dyeing", sub: "Fast Pigments" },
    { num: "03", name: "Warping", sub: "Beam Tension" },
    { num: "04", name: "Jacquard", sub: "CAD Punching" },
    { num: "05", name: "Weaving", sub: "Loom Run" },
    { num: "06", name: "Zari Work", sub: "Korvai Border" },
    { num: "07", name: "The Saree", sub: "Final Luster" },
  ];

  return (
    <section className="py-20 sm:py-28 bg-ivory-100/70 border-b border-gold-400/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          subtitle="SAREE CRAFT JOURNEY"
          title="FROM RAW SILK TO THE SACRED SAREE"
          description="A transparent look into our 7-stage precision manufacturing sequence in Tamil Nadu."
          align="center"
          className="mb-12"
        />

        {/* 7-Stage Interactive Process Flow Bar with Gold Lines */}
        <div className="overflow-x-auto pb-4 mb-10 scrollbar-none">
          <div className="flex items-center min-w-[760px] justify-between relative">
            {/* Background connecting gold line */}
            <div className="absolute top-5 left-6 right-6 h-[2px] bg-gold-300/80 z-0" />

            {craftStages.map((stage, idx) => {
              const stageId = idx + 1;
              const isActive = stageId === activeStageId;
              return (
                <button
                  key={stage.num}
                  type="button"
                  onClick={() => setActiveStageId(stageId)}
                  className={`relative z-10 flex flex-col items-center group focus:outline-none transition-all duration-300 ${
                    isActive ? "scale-105" : "opacity-85 hover:opacity-100"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-serif text-xs font-bold transition-all shadow-sm ${
                      isActive
                        ? "bg-silk-red-700 text-ivory-50 ring-4 ring-gold-400/40 border border-silk-red-700"
                        : "bg-white text-heritage-brown-700 border border-gold-300 group-hover:border-gold-500"
                    }`}
                  >
                    {stage.num}
                  </div>
                  <span
                    className={`text-[11px] font-semibold tracking-wider uppercase mt-2 text-center max-w-[90px] transition-colors ${
                      isActive
                        ? "text-silk-red-700 font-bold"
                        : "text-heritage-brown-700 group-hover:text-silk-red-700"
                    }`}
                  >
                    {stage.name}
                  </span>
                  <span className="text-[9px] text-gold-700 font-sans">{stage.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Stage Detail Panel */}
        <div className="bg-white rounded-[4px] border border-gold-300/80 shadow-luxury overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Stage Visual */}
          <div className="lg:col-span-6 relative min-h-[300px] sm:min-h-[400px] bg-heritage-brown-950">
            <Image
              src={activeStage.image}
              alt={activeStage.imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center transition-all duration-500"
            />
            <div className="absolute top-4 left-4">
              <span className="bg-heritage-brown-950/90 text-gold-300 text-xs px-3 py-1.5 rounded-[4px] font-mono tracking-widest border border-gold-500/40">
                STAGE {activeStage.stageNumber} OF 07
              </span>
            </div>
            {activeStage.durationOrMetric && (
              <div className="absolute bottom-4 left-4 right-4 bg-heritage-brown-950/90 backdrop-blur-sm text-ivory-100 p-2.5 rounded-[4px] text-xs border border-gold-400/30 text-center font-medium font-sans">
                Standard: {activeStage.durationOrMetric}
              </div>
            )}
          </div>

          {/* Stage Content */}
          <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between space-y-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-silk-red-700 font-bold mb-1">
                {activeStage.tamilName || "Manufacturing Stage"}
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-brown-950">
                {activeStage.title}
              </h3>
              <p className="text-xs text-gold-700 font-semibold tracking-wide mt-1">
                {activeStage.tagline}
              </p>

              <p className="text-sm text-heritage-brown-700 font-sans leading-relaxed mt-4">
                {activeStage.description}
              </p>

              {/* Technical Points */}
              <div className="mt-6 space-y-2 border-t border-ivory-200 pt-4">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-heritage-brown-900">
                  Precision Standard:
                </div>
                {activeStage.technicalDetails.map((tech, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-heritage-brown-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold-600 flex-shrink-0" />
                    <span>{tech}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage Navigation & Page Link */}
            <div className="flex items-center justify-between pt-4 border-t border-ivory-200">
              <div className="flex items-center gap-2">
                {manufacturingStages.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveStageId(s.id)}
                    aria-label={`Jump to stage ${s.stageNumber}`}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      s.id === activeStageId
                        ? "bg-silk-red-700 w-6"
                        : "bg-gold-300 hover:bg-gold-400"
                    }`}
                  />
                ))}
              </div>

              <Link
                href="/manufacturing"
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-silk-red-700 hover:text-silk-red-900"
              >
                <span>Full Process Guide</span>
                <ChevronRight className="w-4 h-4 text-gold-600" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

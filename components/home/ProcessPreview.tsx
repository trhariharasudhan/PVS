"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CheckCircle2, ChevronRight, ArrowRight } from "lucide-react";

export function ProcessPreview() {
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  const manufacturingSteps = [
    {
      step: "01",
      title: "Raw Material",
      tagline: "Grade-A Mulberry Silk & Pure Zari",
      desc: "Careful selection of pure mulberry silk yarns and certified electroplated zari reels. Yarns are tested for tensile strength, luster, and denier uniformity before entering preparation.",
      details: [
        "Certified pure mulberry silk yarn",
        "Tested metallic and electroplated gold zari",
        "Denier calibration for uniform drape thickness",
      ],
      image: "https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=1200&auto=format&fit=crop",
      badge: "Pure Raw Silk",
    },
    {
      step: "02",
      title: "Preparation",
      tagline: "Degumming, Hank Dyeing & Winding",
      desc: "Silk hanks undergo thorough degumming to reveal natural biological sheen, followed by precise color formulation dyeing to achieve rich, long-lasting color depths.",
      details: [
        "Hot bath degumming for natural sheen",
        "Azo-free eco-friendly color formulation",
        "Sectional drum warp winding",
      ],
      image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
      badge: "Hank Dyeing",
    },
    {
      step: "03",
      title: "Loom Setup",
      tagline: "Warp Beaming & Heddle Drawing",
      desc: "Thousands of individual warp ends are drawn through heddles and reeds on our high-precision looms under uniform tension to ensure flawless fabric density.",
      details: [
        "4,800 to 7,200 individual warp yarn ends",
        "Electronic Jacquard harness card integration",
        "Controlled warp let-off tension",
      ],
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
      badge: "Loom Calibration",
    },
    {
      step: "04",
      title: "Weaving",
      tagline: "Rhythmic Warp and Weft Insertion",
      desc: "Master weavers operate shuttles and tension beams with rhythmic precision, coordinating weft insertion and temple width regulators.",
      details: [
        "Interlocking shuttle weft insertion",
        "Three-shuttle synchronization for border junctions",
        "Calibrated beat-up for dense drape structure",
      ],
      image: "https://images.unsplash.com/photo-1610030469668-93530c17b58f?q=80&w=1200&auto=format&fit=crop",
      badge: "Loom Weaving",
    },
    {
      step: "05",
      title: "Design & Details",
      tagline: "Jacquard Motifs & Korvai Borders",
      desc: "Electronic Jacquards translate intricate CAD punch patterns into the saree body, creating sharp temple spires, peacock crests, and floral brocades with sub-millimeter precision.",
      details: [
        "Traditional temple spires (Gopuram) & Mayil motifs",
        "Zari float length control to prevent snagging",
        "Crisp contrast border definition",
      ],
      image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop",
      badge: "Jacquard Precision",
    },
    {
      step: "06",
      title: "Finishing",
      tagline: "Steam Pressing & Selvage Trimming",
      desc: "Freshly unwoven sarees undergo surface shearing of loose float threads, edge alignment, and gentle non-chemical steam pressing for smooth, fluid pleating.",
      details: [
        "Reverse float thread micro-shearing",
        "Non-chemical steam calendering for natural softness",
        "Edge selvage alignment",
      ],
      image: "https://images.unsplash.com/photo-1610030469668-93530c17b58f?q=80&w=1200&auto=format&fit=crop",
      badge: "Steam Finishing",
    },
    {
      step: "07",
      title: "Quality Check",
      tagline: "Backlit Table Inspection",
      desc: "Every single meter of saree fabric is manually inspected on backlit tables by experienced quality masters, checking weaving uniformity, color continuity, and dimensions.",
      details: [
        "18-point manual scrutiny for broken picks",
        "Zari continuity and joint verification",
        "Standard length (5.5m) and width (48 inches) confirmation",
      ],
      image: "https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=1200&auto=format&fit=crop",
      badge: "Zero Defect Check",
    },
    {
      step: "08",
      title: "Final Saree",
      tagline: "Folding & Safe Packaging",
      desc: "The finished saree is folded with protective acid-free paper to shield delicate zari threads, labeled with its product code, and prepared for wholesale or retail dispatch.",
      details: [
        "Acid-free barrier paper to prevent zari oxidation",
        "Traditional folding with minimal crease stress",
        "Ready for wholesale bales or boutique gift boxes",
      ],
      image: "https://images.unsplash.com/photo-1610030469854-41125208f237?q=80&w=1200&auto=format&fit=crop",
      badge: "Finished Saree",
    },
  ];

  const current = manufacturingSteps[activeStageIndex];

  return (
    <section className="py-20 sm:py-28 bg-ivory-100/70 border-b border-gold-400/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          subtitle="MANUFACTURING JOURNEY"
          title="From Thread to Saree"
          description="A transparent look into the sequential craftsmanship involved in manufacturing an authentic pattu saree."
          align="center"
          className="mb-12"
        />

        {/* 8-Stage Interactive Process Step Bar */}
        <div className="overflow-x-auto pb-4 mb-10 scrollbar-none">
          <div className="flex items-center min-w-[840px] justify-between relative">
            {/* Background connecting gold line */}
            <div className="absolute top-5 left-6 right-6 h-[2px] bg-gold-300/80 z-0" />

            {manufacturingSteps.map((s, idx) => {
              const isActive = idx === activeStageIndex;
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setActiveStageIndex(idx)}
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
                    {s.step}
                  </div>
                  <span
                    className={`text-[11px] font-semibold tracking-wider uppercase mt-2 text-center max-w-[90px] transition-colors ${
                      isActive
                        ? "text-silk-red-700 font-bold"
                        : "text-heritage-brown-700 group-hover:text-silk-red-700"
                    }`}
                  >
                    {s.title}
                  </span>
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
              src={current.image}
              alt={current.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center transition-all duration-500"
            />
            <div className="absolute top-4 left-4">
              <span className="bg-heritage-brown-950/90 text-gold-300 text-xs px-3 py-1.5 rounded-[4px] font-mono tracking-widest border border-gold-500/40">
                STAGE {current.step} OF 08
              </span>
            </div>
            <div className="absolute bottom-4 left-4 right-4 bg-heritage-brown-950/90 backdrop-blur-sm text-ivory-100 p-2.5 rounded-[4px] text-xs border border-gold-400/30 text-center font-medium font-sans">
              Process Standard: {current.badge}
            </div>
          </div>

          {/* Stage Content */}
          <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between space-y-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-silk-red-700 font-bold mb-1">
                PVS Craft Sequence • Step {current.step}
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-brown-950">
                {current.title}
              </h3>
              <p className="text-xs text-gold-700 font-semibold tracking-wide mt-1">
                {current.tagline}
              </p>

              <p className="text-sm text-heritage-brown-700 font-sans leading-relaxed mt-4">
                {current.desc}
              </p>

              {/* Technical Points */}
              <div className="mt-6 space-y-2 border-t border-ivory-200 pt-4">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-heritage-brown-900">
                  Key Steps:
                </div>
                {current.details.map((point, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-heritage-brown-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold-600 flex-shrink-0" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage Navigation & Link */}
            <div className="flex items-center justify-between pt-4 border-t border-ivory-200">
              <div className="flex items-center gap-2">
                {manufacturingSteps.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveStageIndex(idx)}
                    aria-label={`Jump to stage ${idx + 1}`}
                    className={`h-2.5 rounded-full transition-all ${
                      idx === activeStageIndex
                        ? "bg-silk-red-700 w-6"
                        : "bg-gold-300 hover:bg-gold-400 w-2.5"
                    }`}
                  />
                ))}
              </div>

              <Link
                href="/our-craft"
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-silk-red-700 hover:text-silk-red-900"
              >
                <span>Explore Our Craft</span>
                <ChevronRight className="w-4 h-4 text-gold-600" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

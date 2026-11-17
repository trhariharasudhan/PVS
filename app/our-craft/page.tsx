"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GoldDivider } from "@/components/ui/GoldDivider";
import {
  Sparkles,
  Layers,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Maximize2,
  Sliders,
  Play,
  RotateCcw,
} from "lucide-react";

export default function OurCraftPage() {
  // 7 Verified Manufacturing Stages
  const craftStages = [
    {
      number: "01",
      title: "The Foundation",
      subtitle: "Mulberry Silk Yarns & Authentic Zari Selection",
      description:
        "The journey begins with high-grade mulberry silk filaments and certified electroplated zari threads. Yarns are tested for tensile strength, denier consistency, and uniform luster before entering the dye baths.",
      details: [
        "100% natural mulberry silk hanks",
        "Tested metallic & pure zari thread reels",
        "Degumming bath to reveal natural biological sheen",
      ],
      image: "https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=1200&auto=format&fit=crop",
    },
    {
      number: "02",
      title: "Preparing the Loom",
      subtitle: "Warp Beaming & Heddle Threading",
      description:
        "Thousands of individual warp ends (up to 7,200 continuous filaments) are painstakingly wound onto the warp beam under calibrated tension and drawn through heddle eyes and the reed comb.",
      details: [
        "Sectional warping for millimeter thread alignment",
        "Heddle harness threading by master weavers",
        "High-tension let-off beam calibration",
      ],
      image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
    },
    {
      number: "03",
      title: "The Weave Begins",
      subtitle: "Rhythmic Shedding & Shuttle Synchronization",
      description:
        "The weaver initiates the shedding mechanism, opening the warp sheet while the wooden boat shuttle glides across the raceboard carrying pure zari and silk weft picks.",
      details: [
        "Traditional handloom & electronic Jacquard synchronization",
        "Three-shuttle Korvai interlocking technique",
        "Continuous edge width maintenance via brass temples",
      ],
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
    },
    {
      number: "04",
      title: "Creating the Design",
      subtitle: "Intricate Jacquard Motifs & Temple Borders",
      description:
        "Electronic Jacquards lift individual warp ends with solenoid precision, weaving traditional Tamil Nadu motifs such as Mayil (Peacock), Rudraksham, and sacred temple spires directly into the body and pallu.",
      details: [
        "Digital CAD punch card coordination",
        "Complex multi-colored weft brocading",
        "Crisp body-to-border Korvai junction lines",
      ],
      image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop",
    },
    {
      number: "05",
      title: "Finishing",
      subtitle: "Float Trimming & Non-Chemical Steam Press",
      description:
        "Once cut from the loom, the saree undergoes manual inspection where reverse float threads are carefully trimmed. Gentle steam calendering softens the drape without harsh chemicals.",
      details: [
        "Manual float thread micro-shearing",
        "Steam pressing for supple pleating memory",
        "Selvage edge straightening",
      ],
      image: "https://images.unsplash.com/photo-1610030469668-93530c17b58f?q=80&w=1200&auto=format&fit=crop",
    },
    {
      number: "06",
      title: "Quality Check",
      subtitle: "Backlit Table Scrutiny & Dimensional Audit",
      description:
        "Every saree is stretched across backlit inspection tables. Master examiners verify pick density, color uniformity, zari joint integrity, and ensure exact 5.5-meter length plus 0.8-meter blouse dimensions.",
      details: [
        "18-point visual lighting inspection",
        "Zero-snag and unbroken zari pick verification",
        "Dimensional & weight compliance audit",
      ],
      image: "https://images.unsplash.com/photo-1610030469854-41125208f237?q=80&w=1200&auto=format&fit=crop",
    },
    {
      number: "07",
      title: "The Final Saree",
      subtitle: "Protective Acid-Free Packaging & Dispatch",
      description:
        "The completed pattu saree is folded with acid-free barrier paper to prevent zari oxidation. Packed securely for wholesale merchant consignments or direct customer delivery.",
      details: [
        "Acid-free wrapping protecting pure zari threads",
        "Product code tag & weave documentation",
        "Ready for wholesale cartons or luxury boutique boxes",
      ],
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
    },
  ];

  // Interactive Exploded Loom Simulation State (Mock / Extensible Container)
  const [assemblyProgress, setAssemblyProgress] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(false);

  // Play animation loop
  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      let p = 0;
      const interval = setInterval(() => {
        p += 0.05;
        if (p >= 1) {
          p = 1;
          clearInterval(interval);
          setIsPlaying(false);
        }
        setAssemblyProgress(Number(p.toFixed(2)));
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-ivory-50 pb-24">
      {/* Hero Opening */}
      <section className="bg-silk-cream-100/70 py-16 sm:py-24 border-b border-gold-300/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-textile-weave opacity-40 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-4">
          <span className="text-xs uppercase font-mono tracking-widest text-silk-red-700 font-bold">
            PVS TEXTILE HERITAGE & MANUFACTURING
          </span>

          <GoldDivider variant="motif" theme="light" className="!my-2" />

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-heritage-brown-950 uppercase">
            From Thread to Tradition
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-heritage-brown-700 max-w-2xl mx-auto font-sans leading-relaxed">
            Discover the disciplined sequence of authentic pattu saree manufacturing at PVS in
            Salem, Tamil Nadu. A synergy of generational handloom mastery and precision electronic Jacquards.
          </p>
        </div>
      </section>

      {/* 3D / Exploded-Loom Architectural Container Section */}
      <section className="py-16 sm:py-20 bg-heritage-brown-950 text-ivory-100 border-b border-gold-500/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-zari-pattern opacity-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
            <span className="text-xs uppercase font-mono tracking-widest text-gold-400 font-bold">
              THE CINEMATIC LOOM ARCHITECTURE
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white">
              The Exploded-View Loom Experience
            </h2>
            <p className="text-xs sm:text-sm text-ivory-300 font-sans leading-relaxed">
              This interactive stage models the mechanical anatomy of an authentic South Indian handloom.
              As the visitor scrolls, separated components converge into an operational weaving machine.
            </p>
          </div>

          {/* Loom Interactive Canvas / Future 3D Viewport Placeholder Container */}
          <div
            id="loom-3d-stage"
            className="relative w-full max-w-5xl mx-auto aspect-[16/9] sm:aspect-[21/9] bg-heritage-brown-900 border-2 border-gold-500/50 rounded-[4px] shadow-2xl overflow-hidden flex flex-col justify-between p-6 sm:p-8"
          >
            {/* Visual Canvas Representation */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Central Frame Anchor */}
              <div
                className="relative w-64 sm:w-80 h-44 sm:h-56 border-2 border-gold-400/60 rounded flex items-center justify-center transition-all duration-300"
                style={{
                  transform: `scale(${0.9 + assemblyProgress * 0.1})`,
                }}
              >
                <span className="text-[10px] font-mono uppercase text-gold-300 tracking-wider">
                  [01: Teakwood Loom Frame]
                </span>

                {/* Exploded Parts simulated with CSS translation based on progress */}
                {/* Top Jacquard */}
                <div
                  className="absolute -top-12 sm:-top-16 inset-x-8 h-10 border border-gold-300 bg-gold-900/60 flex items-center justify-center text-[9px] font-mono text-gold-200 transition-all duration-300"
                  style={{
                    transform: `translateY(${-40 * (1 - assemblyProgress)}px)`,
                    opacity: 0.6 + assemblyProgress * 0.4,
                  }}
                >
                  [02: Electronic Jacquard Head & Harness]
                </div>

                {/* Left Warp Beam */}
                <div
                  className="absolute -left-16 sm:-left-20 inset-y-6 w-12 border border-gold-300 bg-silk-red-950/60 flex items-center justify-center text-[8px] font-mono text-gold-200 transition-all duration-300 text-center"
                  style={{
                    transform: `translateX(${-30 * (1 - assemblyProgress)}px)`,
                    opacity: 0.6 + assemblyProgress * 0.4,
                  }}
                >
                  [03: Warp Beam]
                </div>

                {/* Right Cloth Roller */}
                <div
                  className="absolute -right-16 sm:-right-20 inset-y-6 w-12 border border-gold-300 bg-gold-950/60 flex items-center justify-center text-[8px] font-mono text-gold-200 transition-all duration-300 text-center"
                  style={{
                    transform: `translateX(${30 * (1 - assemblyProgress)}px)`,
                    opacity: 0.6 + assemblyProgress * 0.4,
                  }}
                >
                  [04: Cloth Roller]
                </div>

                {/* Center Shuttle */}
                <div
                  className="absolute inset-x-12 h-6 border border-emerald-400/80 bg-emerald-950/70 flex items-center justify-center text-[9px] font-mono text-emerald-300 transition-all duration-300"
                  style={{
                    transform: `translate(${Math.sin(assemblyProgress * 10) * 15}px, 0)`,
                  }}
                >
                  [05: Korvai Shuttles & Zari Weft]
                </div>

                {/* Bottom Pedals */}
                <div
                  className="absolute -bottom-10 sm:-bottom-12 inset-x-16 h-8 border border-gold-300 bg-black/60 flex items-center justify-center text-[8px] font-mono text-gold-300 transition-all duration-300"
                  style={{
                    transform: `translateY(${25 * (1 - assemblyProgress)}px)`,
                    opacity: 0.6 + assemblyProgress * 0.4,
                  }}
                >
                  [06: Foot Treadles]
                </div>
              </div>
            </div>

            {/* Top Stage Badges */}
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-gold-400 bg-black/50 px-2.5 py-1 rounded border border-gold-500/30">
                  Interactive Simulator
                </span>
                <p className="text-xs text-ivory-300 mt-1 font-mono">
                  State: {assemblyProgress === 1 ? "100% Fully Assembled & Active Weaving" : `Assembly Progress: ${(assemblyProgress * 100).toFixed(0)}%`}
                </p>
              </div>

              <div className="text-right text-[10px] font-mono text-gold-400">
                PVS Loom Spec: 2,688 Electronic Hooks • Korvai Triple Shuttle
              </div>
            </div>

            {/* Bottom Scrubber & Simulation Controls */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/60 backdrop-blur-sm p-3.5 rounded-[4px] border border-gold-500/30">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handlePlayToggle}
                  className="inline-flex items-center gap-1.5 bg-silk-red-700 hover:bg-silk-red-800 text-white text-xs font-semibold px-4 py-2 rounded-[3px] uppercase tracking-wider"
                >
                  {isPlaying ? (
                    <span>Pause</span>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Assemble Loom</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setAssemblyProgress(0)}
                  className="p-2 text-ivory-300 hover:text-white border border-gold-500/30 rounded-[3px]"
                  title="Reset to Exploded View"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Range Scrubber */}
              <div className="flex items-center gap-3 w-full sm:w-72">
                <span className="text-[10px] font-mono text-gold-300">Exploded</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={assemblyProgress}
                  onChange={(e) => setAssemblyProgress(parseFloat(e.target.value))}
                  className="w-full accent-gold-500 cursor-pointer"
                />
                <span className="text-[10px] font-mono text-gold-300">Assembled</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-center text-ivory-400 font-mono mt-4">
            * Future-ready architectural viewport: Connects directly with Three.js / R3F / GSAP ScrollTrigger without page redesign.
          </p>
        </div>
      </section>

      {/* 7 Verified Sequential Manufacturing Stages */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          subtitle="PRODUCTION LIFECYCLE"
          title="The 7 Stages of Weaving"
          description="Every PVS pattu saree follows this authentic, unbroken sequence from raw fiber to finished heirloom."
          align="center"
          className="mb-16"
        />

        <div className="space-y-12">
          {craftStages.map((stage, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <div
                key={stage.number}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center bg-white border border-gold-300/80 rounded-[4px] p-6 sm:p-10 shadow-sm hover:shadow-luxury transition-all`}
              >
                {/* Visual */}
                <div
                  className={`lg:col-span-6 relative aspect-[4/3] rounded-[4px] overflow-hidden bg-gold-50 border border-gold-300 ${
                    isEven ? "lg:order-1" : "lg:order-2"
                  }`}
                >
                  <Image
                    src={stage.image}
                    alt={stage.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover object-center"
                  />
                  <div className="absolute top-4 left-4 bg-heritage-brown-950/90 text-gold-300 font-mono text-xs px-3 py-1 rounded-[3px] border border-gold-400/40">
                    STAGE {stage.number}
                  </div>
                </div>

                {/* Content */}
                <div className={`lg:col-span-6 space-y-4 ${isEven ? "lg:order-2" : "lg:order-1"}`}>
                  <span className="text-xs uppercase font-mono tracking-widest text-silk-red-700 font-bold block">
                    Phase {stage.number}
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-brown-950">
                    {stage.title}
                  </h3>
                  <p className="text-xs font-semibold text-gold-700 font-sans tracking-wide">
                    {stage.subtitle}
                  </p>
                  <p className="text-xs sm:text-sm text-heritage-brown-700 font-sans leading-relaxed">
                    {stage.description}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-gold-200">
                    {stage.details.map((d, dIdx) => (
                      <div key={dIdx} className="flex items-center gap-2 text-xs text-heritage-brown-800 font-sans">
                        <CheckCircle2 className="w-3.5 h-3.5 text-gold-600 flex-shrink-0" />
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA to Shop & Wholesale */}
        <div className="mt-16 text-center space-y-4 bg-silk-cream-100/60 p-10 rounded-[4px] border border-gold-300">
          <h3 className="font-serif text-2xl font-bold text-heritage-brown-950">
            Witness the Craftsmanship in Person
          </h3>
          <p className="text-xs sm:text-sm text-heritage-brown-700 max-w-xl mx-auto font-sans leading-relaxed">
            Wholesale merchants, boutique curators, and retail patrons are welcome to visit our looms in
            Raaja Veedhi, Panjakalipatti, Kalipatti, Salem.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 justify-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-silk-red-700 hover:bg-deep-maroon-800 text-ivory-50 text-xs uppercase font-semibold px-6 py-3.5 rounded-[4px] tracking-wider shadow-sm"
            >
              <span>Explore Finished Sarees</span>
              <ArrowRight className="w-4 h-4 text-gold-300" />
            </Link>

            <Link
              href="/wholesale"
              className="inline-flex items-center gap-2 bg-heritage-brown-900 hover:bg-black text-ivory-50 text-xs uppercase font-semibold px-6 py-3.5 rounded-[4px] tracking-wider shadow-sm"
            >
              <span>Wholesale Loom Inquiries</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

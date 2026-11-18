"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckCircle2, Palette, PenTool, Scissors, Truck } from "lucide-react";
import { ORDER_TERMS, visible } from "@/data/business";
import { DraftBadge } from "@/components/ui/DraftBadge";

const STEPS = [
  {
    icon: PenTool,
    title: "Share your idea",
    body: "Upload a photo or sketch, describe it, or bring it to the workshop. Tamil or English — whatever is easiest.",
  },
  {
    icon: Palette,
    title: "Choose silk, zari & colours",
    body: "Pick body, border and pallu colours, the silk type and silk percentage, and the zari grade that fits your budget.",
  },
  {
    icon: CheckCircle2,
    title: "Approve before weaving",
    body: "We confirm what can be woven, the materials and the price in writing. Weaving starts only after you approve.",
  },
  {
    icon: Scissors,
    title: "Woven on our looms",
    body: "Your warp is prepared, the design is set on the loom and your saree is woven pick by pick.",
  },
  {
    icon: Truck,
    title: "Delivered to you",
    body: "Inspected, folded and packed — collected from the workshop or delivered to your door or store.",
  },
];

/** Vertical timeline; a gold "thread" draws itself as you scroll. */
export function OrderingJourney() {
  const root = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        line.current,
        { scaleY: 0 },
        { scaleY: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 70%", end: "bottom 70%", scrub: 0.6 } },
      );
      el.querySelectorAll<HTMLElement>("[data-step]").forEach((s) => {
        gsap.from(s, { autoAlpha: 0.15, x: 24, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: s, start: "top 75%", toggleActions: "play none none reverse" } });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="relative">
      <div className="absolute left-[27px] top-2 bottom-2 w-px bg-heritage-brown-200" aria-hidden="true" />
      <div ref={line} className="absolute left-[27px] top-2 bottom-2 w-[2px] -translate-x-[0.5px] origin-top bg-gradient-to-b from-gold-500 via-silk-red-700 to-gold-500" aria-hidden="true" />
      <ol className="space-y-12">
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <li key={title} data-step className="relative flex gap-6 sm:gap-8">
            <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ivory-50 border border-gold-400 text-silk-red-700">
              <Icon className="w-5 h-5" aria-hidden="true" />
            </span>
            <div className="pt-1">
              <p className="text-[11px] font-semibold tracking-[0.3em] text-gold-700">STEP {String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-1 font-serif text-2xl sm:text-3xl text-heritage-brown-950">{title}</h3>
              <p className="mt-2 max-w-xl text-heritage-brown-700 leading-relaxed">{body}</p>
              {i === 3 && visible(ORDER_TERMS.leadTime) && (
                <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-gold-50 border border-gold-200 px-3 py-1 text-xs text-heritage-brown-800">
                  Typical time: {ORDER_TERMS.leadTime.value}
                  <DraftBadge fact={ORDER_TERMS.leadTime} />
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export interface ProcessStep {
  no: string;
  title: string;
  tamil?: string;
  body: string;
}

/**
 * Desktop: the section pins and the steps slide horizontally as you scroll (scrubbed, reversible).
 * Mobile / reduced motion: a normal vertical list. Content is always real text in the DOM.
 */
export function HorizontalProcess({ steps, eyebrow, title, label }: { steps: ProcessStep[]; eyebrow: string; title: string; label: string }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = section.current;
    const tr = track.current;
    if (!el || !tr) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      const distance = () => tr.scrollWidth - window.innerWidth + 96;
      gsap.to(tr, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });
      gsap.fromTo(
        el.querySelector("[data-progress]"),
        { scaleX: 0 },
        { scaleX: 1, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: () => `+=${distance()}`, scrub: true } },
      );
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={section} className="relative bg-heritage-brown-950 text-ivory-50 overflow-hidden lg:h-screen" aria-label={label}>
      <div className="lg:h-full flex flex-col justify-center py-20 lg:py-0">
        <div className="px-4 sm:px-6 lg:px-12 max-w-7xl lg:max-w-none">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-gold-400">{eyebrow}</p>
          <h2 className="mt-4 font-serif text-4xl sm:text-6xl leading-[1.02] max-w-3xl">{title}</h2>
        </div>
        <ol ref={track} className="mt-12 flex flex-col lg:flex-row gap-5 px-4 sm:px-6 lg:px-12 lg:w-max">
          {steps.map((s) => (
            <li key={s.no} className="relative lg:w-[420px] shrink-0 rounded-[2rem] border border-ivory-200/10 bg-white/[0.03] p-8 lg:p-10">
              <p className="font-serif text-7xl text-gold-500/30 leading-none">{s.no}</p>
              <h3 className="mt-6 font-serif text-3xl">{s.title}</h3>
              {s.tamil && s.tamil !== s.title && (
                <p className="mt-1 font-tamil text-sm text-gold-300" lang="ta">
                  {s.tamil}
                </p>
              )}
              <p className="mt-4 text-ivory-300 leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="hidden lg:block mx-12 mt-12 h-px bg-ivory-200/10">
          <div data-progress className="h-full origin-left bg-gold-400" />
        </div>
      </div>
    </section>
  );
}

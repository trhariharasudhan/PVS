"use client";

import { useEffect, useLayoutEffect, useRef, type ElementType, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Variant = "up" | "fade" | "stagger" | "words" | "scale" | "left" | "right";

interface Props {
  children: ReactNode;
  as?: ElementType;
  variant?: Variant;
  delay?: number;
  className?: string;
  id?: string;
}

/**
 * Scroll-triggered reveal.
 *  - "up" / "fade" / "scale" / "left" / "right": the element itself
 *  - "stagger": every child marked [data-reveal-item]
 *  - "words": headline words rise from a mask (text stays real, selectable text)
 *
 * Safety: only elements BELOW the fold at mount are hidden, so there is no flash of
 * hidden content, nothing is hidden without JS, and reduced-motion users see everything.
 */
export function Reveal({ children, as: Tag = "div", variant = "up", delay = 0, className, id }: Props) {
  const ref = useRef<HTMLElement>(null);

  useIso(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return; // already visible

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const st = { trigger: el, start: "top 85%", once: true };
      const ease = "power3.out";
      if (variant === "stagger") {
        const items = el.querySelectorAll("[data-reveal-item]");
        // fromTo (not from): explicit end state, so a re-run can never "animate" to hidden
        gsap.fromTo(items, { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease, stagger: 0.09, delay, scrollTrigger: st });
      } else if (variant === "words") {
        const words = el.querySelectorAll("[data-word] > span");
        gsap.fromTo(words, { yPercent: 110 }, { yPercent: 0, duration: 1, ease: "power4.out", stagger: 0.045, delay, scrollTrigger: st });
      } else {
        const from: gsap.TweenVars = { autoAlpha: 0 };
        const to: gsap.TweenVars = { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 1, ease, delay, scrollTrigger: st };
        if (variant === "up") from.y = 48;
        if (variant === "scale") Object.assign(from, { scale: 0.94, y: 20 });
        if (variant === "left") from.x = -60;
        if (variant === "right") from.x = 60;
        gsap.fromTo(el, from, to);
      }
    }, el);
    return () => ctx.revert();
  }, [variant, delay]);

  return (
    <Tag ref={ref} className={className} id={id}>
      {children}
    </Tag>
  );
}

/** Headline split into masked words for the "words" reveal. Keeps a single accessible text node per word. */
export function SplitWords({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {text.split(" ").map((w, i) => (
        <span key={i} data-word className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]">
          <span className="inline-block">{w}</span>
          {i < text.split(" ").length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

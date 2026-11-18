"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Site-wide smooth (inertial) scrolling with Lenis, driven by GSAP's ticker so
 * ScrollTrigger animations (incl. the 3D hero) stay perfectly in sync.
 * Disabled for prefers-reduced-motion and on touch devices (native scroll is better there).
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      anchors: { offset: -80 },
    });

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onReduce = () => {
      if (reduce.matches) lenis.destroy();
    };
    reduce.addEventListener("change", onReduce);

    return () => {
      reduce.removeEventListener("change", onReduce);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return null;
}

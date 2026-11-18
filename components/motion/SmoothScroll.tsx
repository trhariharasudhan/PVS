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
  // Keep every ScrollTrigger's start/end in sync with the real layout. Page height changes
  // after first paint (web fonts — Tamil glyphs are much taller — canvases, the 3D hero);
  // without this, reveal triggers computed too early can sit at the wrong scroll position.
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => ScrollTrigger.refresh(), 200);
    };
    document.fonts?.ready.then(refresh).catch(() => {});
    window.addEventListener("load", refresh);
    let lastH = document.body.scrollHeight;
    const ro = new ResizeObserver(() => {
      const h = document.body.scrollHeight;
      if (Math.abs(h - lastH) > 40) {
        lastH = h;
        refresh();
      }
    });
    ro.observe(document.body);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("load", refresh);
      ro.disconnect();
    };
  }, []);

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

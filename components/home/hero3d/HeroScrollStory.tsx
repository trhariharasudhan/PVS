"use client";

import { Component, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { ChevronDown } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SCENES, type QualitySettings, type SceneId } from "./sceneConfig";
import type { ProgressStore } from "./math";
import { useI18n } from "@/i18n/I18nProvider";
import { HeroCtas } from "./HeroCtas";
import { FoldSteps } from "./FoldSteps";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// three.js + R3F are only downloaded when the 3D story is actually shown.
const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false, loading: () => null });

class CanvasErrorBoundary extends Component<{ onError: (r: string) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("[PVS hero] 3D scene failed, using static hero.", error);
    this.props.onError("render-error");
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const ORDER: SceneId[] = ["loom", "threads", "weaving", "saree", "brand", "packaging", "final"];

interface Props {
  quality: QualitySettings;
  onFatal: (reason: string) => void;
}

/**
 * Pinned (CSS sticky) scroll story. One GSAP ScrollTrigger master timeline maps
 * scroll → progress (0..1). The 3D scene reads progress from a ref every frame;
 * overlay text is tweened by the same timeline, so everything stays in sync and
 * reverses naturally when scrolling up.
 */
export function HeroScrollStory({ quality, onFatal }: Props) {
  const { t } = useI18n();
  const section = useRef<HTMLElement>(null);
  const progress = useRef<ProgressStore>({ value: 0 }).current;
  const [active, setActive] = useState(true);
  const [ready, setReady] = useState(false);
  const [framing, setFraming] = useState(0);

  // Master timeline
  useIsoLayoutEffect(() => {
    const el = section.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 1.1 },
      });
      tl.to(progress, { value: 1, duration: 1 }, 0);
      tl.fromTo("[data-hero-progress]", { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);
      tl.fromTo("[data-hero-hint]", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.03 }, 0.004);

      ORDER.forEach((id, i) => {
        const [a, b] = SCENES[id];
        const sel = `[data-scene="${id}"]`;
        if (i > 0) {
          tl.fromTo(sel, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.028, ease: "power2.out" }, a + 0.012);
        }
        if (i < ORDER.length - 1) {
          tl.fromTo(sel, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -28, duration: 0.028, ease: "power2.in", immediateRender: false }, b - 0.034);
        }
      });
    }, el);
    return () => ctx.revert();
  }, [progress]);

  // Only render WebGL while the hero is on screen.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "100px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Desktop: push the subject right of the text column. Mobile: keep centred.
  useEffect(() => {
    const update = () => setFraming(window.innerWidth >= 1024 ? -6 : 0);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const onReady = useCallback(() => {
    setReady(true);
    ScrollTrigger.refresh();
  }, []);

  return (
    <section
      ref={section}
      data-hero-story
      className="hero-3d relative bg-[#140c0a] h-[500vh] md:h-[640vh] xl:h-[760vh]"
      aria-label={t.hero.storyLabel}
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* 3D canvas */}
        <div className="absolute inset-0">
          <CanvasErrorBoundary onError={onFatal}>
            <HeroCanvas progress={progress} quality={quality} active={active} framing={framing} onReady={onReady} onFatal={onFatal} />
          </CanvasErrorBoundary>
        </div>

        {/* Legibility gradient for the text column */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#140c0a] via-[#140c0a]/35 to-transparent lg:bg-gradient-to-r lg:from-[#140c0a]/85 lg:via-[#140c0a]/25 lg:to-transparent" />

        {/* Loading state */}
        <div
          className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}
          aria-hidden={ready}
        >
          <div className="flex flex-col items-center gap-3 text-gold-300">
            <span className="h-8 w-8 rounded-full border-2 border-gold-500/30 border-t-gold-300 animate-spin" />
            <span className="text-[11px] tracking-widest uppercase">{t.hero.loading}</span>
          </div>
        </div>

        {/* Text overlay */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="relative h-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
            {ORDER.map((id, i) => {
              const c = t.hero.scenes[id];
              const isFinal = id === "final";
              const isBrand = id === "brand";
              const Heading = i === 0 ? "h1" : "h2";
              return (
                <div
                  key={id}
                  data-scene={id}
                  className={`absolute left-5 right-5 sm:left-8 sm:right-8 ${
                    isBrand
                      ? "bottom-[9svh] text-center" // caption under the woven 3D mark, never over it
                      : "lg:left-10 lg:right-auto lg:max-w-xl bottom-[9svh] lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2"
                  } ${
                    i === 0 ? "" : "invisible opacity-0"
                  } ${isFinal ? "pointer-events-auto" : ""}`}
                >
                  {c.eyebrow && <p className="text-[11px] sm:text-xs font-semibold tracking-widest uppercase text-gold-300">{c.eyebrow}</p>}
                  <Heading
                    className={`mt-3 font-serif font-bold leading-[1.05] text-ivory-50 drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] ${
                      // the woven 3D mark is the visual; keep the DOM title for screen readers only
                      isBrand ? "sr-only" : "hero-title text-4xl sm:text-5xl lg:text-6xl"
                    }`}
                  >
                    {c.title}
                  </Heading>
                  {c.body && (
                    <p
                      className={`mt-4 text-base sm:text-lg leading-relaxed text-ivory-200/90 ${
                        isBrand ? "tracking-[0.25em] uppercase text-xs sm:text-sm text-gold-200" : ""
                      }`}
                    >
                      {c.body}
                    </p>
                  )}
                  {id === "packaging" && <FoldSteps progress={progress} labels={t.hero.foldSteps} />}
                  {isFinal && <HeroCtas className="mt-6 sm:mt-7" compactOnMobile />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll hint */}
        <div data-hero-hint className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden lg:flex flex-col items-center gap-1 text-gold-300/90">
          <span className="text-[10px] tracking-widest uppercase">{t.hero.scrollHint}</span>
          <ChevronDown className="w-4 h-4 animate-bounce" aria-hidden="true" />
        </div>

        {/* Progress + skip */}
        <div className="absolute bottom-0 left-0 right-0 z-10 h-[2px] bg-gold-500/15">
          <div data-hero-progress className="h-full origin-left bg-gold-400" style={{ transform: "scaleX(0)" }} />
        </div>
        <a
          href="#after-hero"
          className="absolute z-20 top-24 right-4 sm:right-6 text-[10px] sm:text-[11px] tracking-widest uppercase text-ivory-200/80 hover:text-gold-200 border border-ivory-200/25 hover:border-gold-300/60 rounded-[4px] px-3 py-1.5 backdrop-blur-sm bg-black/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-200"
        >
          {t.hero.skip}
        </a>
      </div>
    </section>
  );
}

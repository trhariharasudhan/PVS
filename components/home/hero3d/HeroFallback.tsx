"use client";

import { HeroCtas } from "./HeroCtas";
import { HERO_SAREE_DESIGN } from "@/lib/saree/presets";
import { SareeFlat } from "@/components/saree/SareeFlat";
import { KovilBorder } from "@/components/ui/Ornament";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Static, non-3D hero. Used when:
 *  - JavaScript is unavailable (it is server-rendered),
 *  - the visitor prefers reduced motion,
 *  - WebGL is missing / fails / the device is low-end or in data-saver mode.
 * Same message and CTAs as the 3D story. The saree is drawn in code by the same
 * renderer as the 3D hero — no stock photos.
 */
export function HeroFallback() {
  const { t } = useI18n();
  const c = t.hero.scenes.final;
  return (
    <section
      className="hero-fallback relative min-h-[88svh] flex items-center overflow-hidden bg-heritage-brown-950 bg-weave-dark text-ivory-50"
      aria-labelledby="hero-fallback-title"
    >
      <div className="pointer-events-none absolute -right-24 sm:right-0 top-1/2 -translate-y-1/2 w-[85vw] sm:w-[60vw] lg:w-[46vw] rotate-[-8deg] opacity-40 sm:opacity-70" aria-hidden="true">
        <SareeFlat design={HERO_SAREE_DESIGN} variant="fold" className="aspect-[4/5]" label="" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-heritage-brown-950 via-heritage-brown-950/85 to-heritage-brown-950/10" />
      <KovilBorder className="absolute bottom-0 inset-x-0 w-full h-3 text-gold-500/40" count={80} />
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-xl">
          <p className="text-xs font-semibold tracking-widest uppercase text-gold-300">{t.hero.scenes.loom.eyebrow}</p>
          <h1 id="hero-fallback-title" className="hero-title mt-4 font-serif text-4xl sm:text-6xl font-bold leading-[1.05] text-ivory-50">
            {c.title}
          </h1>
          <p className="mt-5 text-base sm:text-lg text-ivory-200/90 leading-relaxed">{c.body}</p>
          <HeroCtas className="mt-8" />
        </div>
      </div>
    </section>
  );
}

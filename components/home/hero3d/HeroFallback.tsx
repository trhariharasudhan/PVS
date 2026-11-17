import Image from "next/image";
import { HERO_COPY } from "./heroCopy";
import { HeroCtas } from "./HeroCtas";

/**
 * Static, non-3D hero. Used when:
 *  - JavaScript is unavailable (it is server-rendered),
 *  - the visitor prefers reduced motion,
 *  - WebGL is missing / fails / the device is low-end or in data-saver mode.
 * It carries the same message and the same B2B CTAs as the 3D story.
 */
export function HeroFallback() {
  const c = HERO_COPY.final;
  return (
    <section
      className="hero-fallback relative min-h-[88svh] flex items-center overflow-hidden bg-heritage-brown-950 text-ivory-50"
      aria-labelledby="hero-fallback-title"
    >
      <Image
        src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=2000&auto=format&fit=crop"
        alt="Red silk saree with gold zari border, woven on a traditional loom"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-45"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-heritage-brown-950 via-heritage-brown-950/85 to-heritage-brown-950/30" />
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-xl">
          <p className="text-xs font-semibold tracking-widest uppercase text-gold-300">{HERO_COPY.loom.eyebrow}</p>
          <h1 id="hero-fallback-title" className="mt-4 font-serif text-4xl sm:text-6xl font-bold leading-[1.05] text-ivory-50">
            {c.title}
          </h1>
          <p className="mt-5 text-base sm:text-lg text-ivory-200/90 leading-relaxed">{c.body}</p>
          <HeroCtas className="mt-8" />
        </div>
      </div>
    </section>
  );
}

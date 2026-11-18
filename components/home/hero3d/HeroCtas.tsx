"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { HERO_CTAS } from "./heroCopy";
import { useI18n } from "@/i18n/I18nProvider";

/** Value points + B2B CTAs. Shared by the 3D final scene and the static fallback. */
export function HeroCtas({ className = "", compactOnMobile = false }: { className?: string; compactOnMobile?: boolean }) {
  const { t } = useI18n();
  const h = t.hero;
  return (
    <div className={className}>
      <ul className={`${compactOnMobile ? "hidden sm:block" : ""} space-y-2 text-sm text-ivory-200/90 font-sans`}>
        {h.valuePoints.map((v) => (
          <li key={v} className="flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 text-gold-300 shrink-0" aria-hidden="true" />
            <span>{v}</span>
          </li>
        ))}
      </ul>
      <div className="mt-7 flex flex-col sm:flex-row gap-3">
        <Link
          href={HERO_CTAS.primary}
          className="group inline-flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-400 text-heritage-brown-950 font-semibold px-6 py-3.5 text-xs sm:text-sm tracking-widest uppercase rounded-[4px] shadow-luxury transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-200 focus-visible:ring-offset-2 focus-visible:ring-offset-heritage-brown-950"
        >
          <span>{h.ctaPrimary}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
        <Link
          href={HERO_CTAS.secondary}
          className="inline-flex items-center justify-center gap-2 border border-gold-400/70 hover:border-gold-300 hover:bg-white/5 text-ivory-50 font-semibold px-6 py-3.5 text-xs sm:text-sm tracking-widest uppercase rounded-[4px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-200"
        >
          {h.ctaSecondary}
        </Link>
      </div>
      <Link
        href={HERO_CTAS.tertiary}
        className="mt-4 inline-block text-xs tracking-widest uppercase text-gold-300 hover:text-gold-200 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-200 rounded-sm"
      >
        {h.ctaTertiary} →
      </Link>
    </div>
  );
}

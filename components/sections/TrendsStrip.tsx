"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PRESETS, PRESET_IDS } from "@/lib/saree/presets";
import { SareeFlat } from "@/components/saree/SareeFlat";
import { Reveal } from "@/components/motion/Reveal";
import { useI18n } from "@/i18n/I18nProvider";

/** Trending design starting points; each opens the designer with that preset loaded. */
export function TrendsStrip() {
  const { t } = useI18n();
  return (
    <Reveal variant="stagger" className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {PRESET_IDS.map((id) => (
        <Link
          key={id}
          href={`/custom-order?preset=${id}`}
          data-reveal-item
          className="group block rounded-3xl border border-heritage-brown-100 bg-[#f4ecdd] p-3 sm:p-4 transition-all hover:-translate-y-1 hover:border-gold-400 hover:shadow-[0_20px_40px_-24px_rgba(43,24,18,0.5)]"
        >
          <SareeFlat design={PRESETS[id]} variant="fold" className="h-44 sm:h-56" label={`${t.presets[id].name} — ${t.common.illustration}`} />
          <p className="mt-3 font-serif text-lg sm:text-xl text-heritage-brown-950">{t.presets[id].name}</p>
          <p className="mt-1 text-xs sm:text-sm text-heritage-brown-700 leading-relaxed">{t.presets[id].note}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold tracking-widest uppercase text-silk-red-700">
            {t.home.trendsCta} <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </span>
        </Link>
      ))}
    </Reveal>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SareeFlat } from "@/components/saree/SareeFlat";
import { MotifIcon } from "@/components/saree/MotifIcon";
import { Reveal, SplitWords } from "@/components/motion/Reveal";
import { DiamondRule } from "@/components/ui/Ornament";
import { MOTIF_IDS } from "@/lib/saree/motifs";
import { PRESETS } from "@/lib/saree/presets";
import type { SareeDesign } from "@/lib/saree/render";
import { getI18n } from "@/i18n/server";

export function generateMetadata(): Metadata {
  const { t } = getI18n();
  return { title: t.meta.weave.title, description: t.meta.weave.description, alternates: { canonical: "/what-we-weave" } };
}

/** Woven-style illustration for each kind of saree (drawn in code, not photos). */
const KIND_DESIGNS: Record<string, SareeDesign> = {
  wedding: PRESETS.templeBride,
  traditional: PRESETS.kattam,
  soft: PRESETS.vairaoosi,
  silkCotton: {
    body: "#F2E8D5",
    border: "#0F4D3A",
    pallu: "#0F4D3A",
    zari: "none",
    borderStyle: "minimal",
    borderMotif: null,
    bodyPattern: "buttas",
    bodyMotif: "rudraksha",
    palluStyle: "stripes",
    palluMotif: null,
    sheen: 0.35,
  },
  festive: { ...PRESETS.gangaJamuna, bodyMotif: "elephant" },
  group: { ...PRESETS.midnightJaal, body: "#23338F", bodyPattern: "buttas", bodyMotif: "lotus", palluStyle: "motifRows", palluMotif: "lotus" },
};

export default function WhatWeWeavePage() {
  const { t } = getI18n();
  const w = t.weave;
  return (
    <div className="bg-ivory-50 bg-weave">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-16">
        <p className="text-xs font-semibold tracking-[0.3em] uppercase text-silk-red-700">{w.eyebrow}</p>
        <h1 className="mt-4 max-w-4xl font-serif text-5xl sm:text-7xl font-medium leading-[0.98] text-heritage-brown-950 text-balance">
          {w.titleA} <span className="italic text-silk-red-700">{w.titleB}</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-heritage-brown-700 leading-relaxed">{w.intro}</p>
        <p className="mt-3 text-xs text-heritage-brown-500">{w.note}</p>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <Reveal variant="stagger" className="grid md:grid-cols-2 gap-6">
          {w.kinds.map((k) => (
            <article key={k.id} data-reveal-item className="group rounded-[2rem] bg-white border border-heritage-brown-100 overflow-hidden">
              <div className="bg-[#f4ecdd] p-4 sm:p-6">
                <SareeFlat design={KIND_DESIGNS[k.id] ?? PRESETS.templeBride} variant="full" className="h-40 sm:h-48" label={`${k.title} — ${t.common.illustration}`} />
              </div>
              <div className="p-7 sm:p-9">
                <h2 className="font-serif text-3xl text-heritage-brown-950">{k.title}</h2>
                <p className="mt-3 text-heritage-brown-700 leading-relaxed">{k.body}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {k.options.map((o) => (
                    <li key={o} className="rounded-full bg-ivory-100 border border-heritage-brown-100 px-3 py-1 text-xs text-heritage-brown-800">
                      {o}
                    </li>
                  ))}
                </ul>
                <Link href={`/custom-order?type=${k.id}`} className="mt-7 inline-flex items-center gap-2 text-sm font-semibold tracking-widest uppercase text-silk-red-700">
                  {w.customise} <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </Reveal>
      </section>

      <section className="bg-heritage-brown-950 text-ivory-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-gold-400">{w.motifsEyebrow}</p>
            <Reveal variant="words" as="h2" className="mt-5 font-serif text-4xl sm:text-5xl leading-[1.05]">
              <SplitWords text={w.motifsTitle} />
            </Reveal>
            <p className="mt-6 text-ivory-300 leading-relaxed">{w.motifsBody}</p>
          </div>
          <div className="lg:col-span-7">
            <Reveal variant="stagger" as="ul" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {MOTIF_IDS.map((m) => (
                <li key={m} data-reveal-item className="flex flex-col items-center gap-3 rounded-2xl border border-gold-400/25 bg-white/[0.03] p-4">
                  <MotifIcon id={m} size={88} ground="#5c1020" />
                  <span className="font-serif text-lg text-ivory-100">{t.options.motifs[m]}</span>
                </li>
              ))}
            </Reveal>
            <DiamondRule className="my-10 text-gold-500/50" />
            <Link
              href="/custom-order"
              className="inline-flex items-center gap-2 rounded-full bg-gold-500 hover:bg-gold-400 text-heritage-brown-950 px-7 py-4 text-sm font-semibold tracking-widest uppercase transition-colors"
            >
              {w.upload} <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

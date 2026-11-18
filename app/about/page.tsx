import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Eye, HandHeart, Scale } from "lucide-react";
import { siteConfig } from "@/config/site";
import { FOUNDER, SHOW_DRAFT_CONTENT, WORKSHOP_FACTS, visible } from "@/data/business";
import { Reveal, SplitWords } from "@/components/motion/Reveal";
import { DraftBadge } from "@/components/ui/DraftBadge";
import { Kolam, KovilBorder } from "@/components/ui/Ornament";
import { WaysToOrder } from "@/components/sections/WaysToOrder";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/fmt";

export function generateMetadata(): Metadata {
  const { t } = getI18n();
  return { title: t.meta.about.title, description: t.meta.about.description, alternates: { canonical: "/about" } };
}

const VALUE_ICONS = [Scale, Eye, HandHeart];

export default function AboutPage() {
  const { t } = getI18n();
  const a = t.about;
  const facts = WORKSHOP_FACTS.map((f, i) => ({ ...f, label: a.workshopFacts[i] ?? f.label })).filter((f) => visible(f.fact));
  const name = FOUNDER.name.value;

  return (
    <div className="bg-ivory-50">
      {/* Hero */}
      <section className="relative bg-weave overflow-hidden">
        <Kolam className="pointer-events-none absolute -left-24 bottom-0 w-96 text-gold-400/20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-24 grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-8">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-silk-red-700">{a.eyebrow}</p>
            <h1 className="mt-4 font-serif text-5xl sm:text-7xl font-medium leading-[0.98] text-heritage-brown-950 text-balance">
              {a.titleA} <span className="italic text-silk-red-700">{a.titleB}</span> {a.titleC}
            </h1>
          </div>
          <div className="lg:col-span-4">
            <p className="font-tamil text-xl text-gold-700" lang="ta">
              பாரம்பரியம் • வண்ணம் • பட்டு
            </p>
            <p className="mt-2 text-sm text-heritage-brown-600">{a.tamilMotto}</p>
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          {/* No stock photo of a stranger: an ornament until real workshop photos are provided */}
          <div className="relative aspect-[4/5] rounded-[2rem] bg-heritage-brown-950 overflow-hidden flex items-center justify-center">
            <Kolam className="w-2/3 text-gold-400/70" />
            <KovilBorder className="absolute bottom-0 left-0 w-full h-4 text-gold-500/40" count={20} />
            <p className="absolute top-6 left-6 font-serif text-ivory-50 text-2xl">{FOUNDER.name.value}</p>
            <p className="absolute top-14 left-6 text-xs tracking-widest uppercase text-gold-300">{a.founderRole}</p>
            {SHOW_DRAFT_CONTENT && (
              <p className="absolute bottom-8 inset-x-6 text-center text-[11px] text-amber-200">{a.draftPhoto}</p>
            )}
          </div>
        </div>
        <div className="lg:col-span-7 lg:pt-6">
          <Reveal variant="words" as="h2" className="font-serif text-4xl sm:text-5xl leading-[1.05] text-heritage-brown-950">
            <SplitWords text={fmt(a.founderHeading, { name })} />
          </Reveal>
          <div className="mt-8 space-y-5 text-lg text-heritage-brown-700 leading-relaxed">
            {visible(FOUNDER.learnedFrom) && (
              <p>
                {a.learnedFrom} <DraftBadge fact={FOUNDER.learnedFrom} />
              </p>
            )}
            <p>{a.p1}</p>
            <p>{a.p2}</p>
          </div>

          {facts.length > 0 && (
            <dl className="mt-12 grid grid-cols-3 gap-4">
              {facts.map(({ label, fact }) => (
                <div key={label} className="rounded-2xl border border-heritage-brown-100 bg-white p-5">
                  <dd className="font-serif text-4xl text-silk-red-700">{fact.value}</dd>
                  <dt className="mt-1 text-xs text-heritage-brown-600">{label}</dt>
                  <DraftBadge fact={fact} />
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-heritage-brown-950 text-ivory-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-gold-400">{a.journeyEyebrow}</p>
          <h2 className="mt-5 font-serif text-4xl sm:text-6xl leading-[1.02]">{a.journeyTitle}</h2>
          <p className="mt-5 inline-flex items-center gap-3 rounded-full border border-gold-400/40 px-5 py-2 text-sm text-gold-200">
            <span className="font-serif text-2xl text-gold-300">20+</span> {a.yearsBadge}
          </p>
          <Reveal variant="stagger" as="ol" className="mt-16 relative border-l border-gold-500/30 ml-3 space-y-14">
            {a.milestones.map((m, i) => (
              <li key={m.title} data-reveal-item className="relative pl-10">
                <span className="absolute -left-[7px] top-2 h-3.5 w-3.5 rotate-45 bg-gold-400" aria-hidden="true" />
                <p className="font-serif text-4xl text-gold-300">{i === a.milestones.length - 1 ? a.today : String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 font-serif text-2xl">{m.title}</h3>
                <p className="mt-2 max-w-2xl text-ivory-300 leading-relaxed">{m.body}</p>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <p className="text-xs font-semibold tracking-[0.3em] uppercase text-silk-red-700">{a.valuesEyebrow}</p>
        <Reveal variant="stagger" className="mt-10 grid md:grid-cols-3 gap-5">
          {a.values.map(({ title, body }, i) => {
            const Icon = VALUE_ICONS[i] ?? Scale;
            return (
            <div key={title} data-reveal-item className="rounded-[2rem] bg-white border border-heritage-brown-100 p-8">
              <Icon className="w-7 h-7 text-silk-red-700" aria-hidden="true" />
              <h3 className="mt-6 font-serif text-2xl text-heritage-brown-950">{title}</h3>
              <p className="mt-3 text-heritage-brown-700 leading-relaxed">{body}</p>
            </div>
            );
          })}
        </Reveal>
      </section>

      {/* Visit */}
      <section className="bg-ivory-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.3em] uppercase text-silk-red-700">{a.visitEyebrow}</p>
              <h2 className="mt-4 font-serif text-4xl sm:text-5xl text-heritage-brown-950">{fmt(a.visitTitle, { village: t.common.village })}</h2>
            </div>
            <Link href="/custom-order" className="inline-flex items-center gap-2 text-sm font-semibold tracking-widest uppercase text-silk-red-700">
              {a.orOnline} <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-10">
            <WaysToOrder showDesignCard={false} />
          </div>
        </div>
      </section>
    </div>
  );
}

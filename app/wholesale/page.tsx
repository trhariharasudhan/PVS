import type { Metadata } from "next";
import { CalendarRange, Factory, Palette, Repeat } from "lucide-react";
import { ORDER_TERMS, visible } from "@/data/business";
import { WholesaleForm } from "@/components/wholesale/WholesaleForm";
import { WaysToOrder } from "@/components/sections/WaysToOrder";
import { Reveal, SplitWords } from "@/components/motion/Reveal";
import { DraftBadge } from "@/components/ui/DraftBadge";
import { Kolam, KovilBorder } from "@/components/ui/Ornament";
import { getI18n } from "@/i18n/server";

export function generateMetadata(): Metadata {
  const { t } = getI18n();
  return { title: t.meta.wholesale.title, description: t.meta.wholesale.description, alternates: { canonical: "/wholesale" } };
}

const WHY_ICONS = [Factory, Palette, Repeat, CalendarRange];

export default function WholesalePage() {
  const { t } = getI18n();
  const w = t.wholesale;
  return (
    <div className="bg-ivory-50">
      <section className="relative bg-weave overflow-hidden">
        <Kolam className="pointer-events-none absolute -right-16 top-8 w-80 text-gold-400/20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-20">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-silk-red-700">{w.eyebrow}</p>
          <h1 className="mt-4 max-w-4xl font-serif text-5xl sm:text-7xl font-medium leading-[0.98] text-heritage-brown-950 text-balance">
            {w.titleA} <span className="italic text-silk-red-700">{w.titleB}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-heritage-brown-700 leading-relaxed">{w.intro}</p>
          {visible(ORDER_TERMS.wholesaleMinimum) && (
            <p className="mt-4 text-sm text-heritage-brown-800">
              MOQ: <strong>{ORDER_TERMS.wholesaleMinimum.value}</strong> <DraftBadge fact={ORDER_TERMS.wholesaleMinimum} />
            </p>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <h2 className="font-serif text-3xl sm:text-4xl text-heritage-brown-950">{w.whyTitle}</h2>
        <Reveal variant="stagger" className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {w.why.map(({ title, body }, i) => {
            const Icon = WHY_ICONS[i] ?? Factory;
            return (
              <div key={title} data-reveal-item className="rounded-3xl bg-white border border-heritage-brown-100 p-6">
                <Icon className="w-6 h-6 text-silk-red-700" aria-hidden="true" />
                <h3 className="mt-5 font-serif text-xl text-heritage-brown-950">{title}</h3>
                <p className="mt-2 text-sm text-heritage-brown-700 leading-relaxed">{body}</p>
              </div>
            );
          })}
        </Reveal>
      </section>

      <section className="bg-heritage-brown-950 text-ivory-50">
        <KovilBorder className="w-full h-3 text-gold-500/40" count={80} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <Reveal variant="words" as="h2" className="font-serif text-4xl sm:text-5xl leading-[1.05]">
              <SplitWords text={w.howTitle} />
            </Reveal>
            <ol className="mt-10 space-y-6">
              {w.how.map((step, i) => (
                <li key={i} className="flex gap-5">
                  <span className="font-serif text-3xl text-gold-400 leading-none w-8 shrink-0">{i + 1}</span>
                  <p className="text-ivory-200 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
            <p className="mt-10 rounded-2xl border border-gold-400/30 bg-white/[0.03] p-5 text-sm text-ivory-300 leading-relaxed">{w.sendList}</p>
          </div>
          <div id="enquiry" className="lg:col-span-7 scroll-mt-28 rounded-[2rem] bg-ivory-50 text-heritage-brown-950 p-6 sm:p-10">
            <h2 className="font-serif text-3xl">{w.formTitle}</h2>
            <p className="mt-2 text-sm text-heritage-brown-600">{w.formIntro}</p>
            <div className="mt-8">
              <WholesaleForm />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <WaysToOrder showDesignCard={false} />
      </section>
    </div>
  );
}

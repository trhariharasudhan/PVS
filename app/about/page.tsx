import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Eye, HandHeart, Scale } from "lucide-react";
import { siteConfig } from "@/config/site";
import { FOUNDER, MILESTONES, SHOW_DRAFT_CONTENT, WORKSHOP_FACTS, visible } from "@/data/business";
import { Reveal, SplitWords } from "@/components/motion/Reveal";
import { DraftBadge } from "@/components/ui/DraftBadge";
import { Kolam, KovilBorder } from "@/components/ui/Ornament";
import { WaysToOrder } from "@/components/sections/WaysToOrder";

export const metadata: Metadata = {
  title: `Our Story — ${FOUNDER.name.value} & PVS`,
  description:
    "How PVS grew from one weaver at one loom in Panjakalipatti, Salem district, into a silk saree manufacturer weaving for retailers and families.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  { icon: Scale, title: "Honest materials", body: "Silk type, silk % and zari grade are written down before weaving. No vague “silk-like” promises." },
  { icon: Eye, title: "You see it first", body: "Design and colours are approved by you before the warp goes on the loom." },
  { icon: HandHeart, title: "Weaver to wearer", body: "You deal directly with the people who weave your saree — no showroom in between." },
];

export default function AboutPage() {
  const facts = WORKSHOP_FACTS.filter((f) => visible(f.fact));
  const milestones = MILESTONES.filter((m) => visible(m.body));

  return (
    <div className="bg-ivory-50">
      {/* Hero */}
      <section className="relative bg-weave overflow-hidden">
        <Kolam className="pointer-events-none absolute -left-24 bottom-0 w-96 text-gold-400/20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-24 grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-8">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-silk-red-700">Our story</p>
            <h1 className="mt-4 font-serif text-5xl sm:text-7xl font-medium leading-[0.98] text-heritage-brown-950 text-balance">
              It began with <span className="italic text-silk-red-700">one weaver</span> and one loom.
            </h1>
          </div>
          <div className="lg:col-span-4">
            <p className="font-tamil text-xl text-gold-700" lang="ta">
              பாரம்பரியம் • வண்ணம் • பட்டு
            </p>
            <p className="mt-2 text-sm text-heritage-brown-600">Parampariyam · Vannam · Silk — heritage, colour, silk.</p>
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
            <p className="absolute top-14 left-6 text-xs tracking-widest uppercase text-gold-300">Founder, PVS</p>
            {SHOW_DRAFT_CONTENT && (
              <p className="absolute bottom-8 inset-x-6 text-center text-[11px] text-amber-200">DRAFT: replace with a real photo of Sathish Kumar at the loom</p>
            )}
          </div>
        </div>
        <div className="lg:col-span-7 lg:pt-6">
          <Reveal variant="words" as="h2" className="font-serif text-4xl sm:text-5xl leading-[1.05] text-heritage-brown-950">
            <SplitWords text={`${FOUNDER.name.value} learned the craft the long way — at the loom.`} />
          </Reveal>
          <div className="mt-8 space-y-5 text-lg text-heritage-brown-700 leading-relaxed">
            {visible(FOUNDER.learnedFrom) && (
              <p>
                {FOUNDER.learnedFrom.value} <DraftBadge fact={FOUNDER.learnedFrom} />
              </p>
            )}
            <p>
              There were no shortcuts: understanding silk, setting a warp, keeping colours true and weaving a border cleanly all came from years of
              practice. Little by little, the workshop grew — more looms, more skilled hands, and saree shops that came back season after season.
            </p>
            <p>
              Today PVS weaves for boutiques and wholesale buyers, and now opens its looms directly to families who want a saree made exactly the way
              they imagine it.
            </p>
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
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-gold-400">The journey</p>
          <h2 className="mt-5 font-serif text-4xl sm:text-6xl leading-[1.02]">Thread by thread</h2>
          <Reveal variant="stagger" as="ol" className="mt-16 relative border-l border-gold-500/30 ml-3 space-y-14">
            {milestones.map((m) => (
              <li key={m.title} data-reveal-item className="relative pl-10">
                <span className="absolute -left-[7px] top-2 h-3.5 w-3.5 rotate-45 bg-gold-400" aria-hidden="true" />
                {visible(m.year) && (
                  <p className="font-serif text-4xl text-gold-300">
                    {m.year.value} <DraftBadge fact={m.year} />
                  </p>
                )}
                <h3 className="mt-2 font-serif text-2xl">{m.title}</h3>
                <p className="mt-2 max-w-2xl text-ivory-300 leading-relaxed">
                  {m.body.value} <DraftBadge fact={m.body} />
                </p>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <p className="text-xs font-semibold tracking-[0.3em] uppercase text-silk-red-700">What we stand for</p>
        <Reveal variant="stagger" className="mt-10 grid md:grid-cols-3 gap-5">
          {VALUES.map(({ icon: Icon, title, body }) => (
            <div key={title} data-reveal-item className="rounded-[2rem] bg-white border border-heritage-brown-100 p-8">
              <Icon className="w-7 h-7 text-silk-red-700" aria-hidden="true" />
              <h3 className="mt-6 font-serif text-2xl text-heritage-brown-950">{title}</h3>
              <p className="mt-3 text-heritage-brown-700 leading-relaxed">{body}</p>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Visit */}
      <section className="bg-ivory-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.3em] uppercase text-silk-red-700">Come and see the looms</p>
              <h2 className="mt-4 font-serif text-4xl sm:text-5xl text-heritage-brown-950">{siteConfig.business.address.village}, Salem district</h2>
            </div>
            <Link href="/custom-order" className="inline-flex items-center gap-2 text-sm font-semibold tracking-widest uppercase text-silk-red-700">
              Or start online <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
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

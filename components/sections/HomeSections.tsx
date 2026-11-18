import Link from "next/link";
import { ArrowUpRight, Store, Users } from "lucide-react";
import { FOUNDER, MILESTONES, ORDER_TERMS, visible } from "@/data/business";
import { Reveal, SplitWords } from "@/components/motion/Reveal";
import { DiamondRule, Kolam, KovilBorder } from "@/components/ui/Ornament";
import { DraftBadge } from "@/components/ui/DraftBadge";
import { WaysToOrder } from "./WaysToOrder";
import { OrderingJourney } from "./OrderingJourney";
import { TrendsStrip } from "./TrendsStrip";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/fmt";

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return <p className={`text-xs font-semibold tracking-[0.3em] uppercase ${dark ? "text-gold-400" : "text-silk-red-700"}`}>{children}</p>;
}

/* 1 ─ Who we are + how to order */
export function IntroSection() {
  const { t } = getI18n();
  const h = t.home;
  return (
    <section className="relative bg-ivory-50 bg-weave overflow-hidden">
      <Kolam className="pointer-events-none absolute -right-16 -top-10 w-72 text-gold-400/25" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <Eyebrow>{h.introEyebrow}</Eyebrow>
        <Reveal variant="words" as="h2" className="mt-6 max-w-5xl font-serif text-4xl sm:text-6xl lg:text-7xl font-medium leading-[1.02] text-heritage-brown-950 text-balance">
          <SplitWords text={h.introA} />{" "}
          <span className="italic text-silk-red-700">
            <SplitWords text={h.introB} />
          </span>{" "}
          <SplitWords text={h.introC} />
        </Reveal>
        <Reveal className="mt-8 max-w-2xl text-lg text-heritage-brown-700 leading-relaxed">
          <p>{h.introBody}</p>
        </Reveal>
        <div className="mt-14">
          <WaysToOrder />
        </div>
      </div>
    </section>
  );
}

/* 2 ─ Marquee ribbon */
export function CraftMarquee() {
  const { t, locale } = getI18n();
  const words = locale === "ta" ? [...t.home.marquee] : [...t.home.marquee.slice(0, 5), "பட்டு", ...t.home.marquee.slice(5)];
  const row = [...words, ...words];
  return (
    <div className="bg-silk-red-800 text-ivory-50 py-5 overflow-hidden border-y border-gold-500/40" aria-hidden="true">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {row.map((w, i) => (
          <span key={i} className={`flex items-center gap-10 text-2xl sm:text-3xl ${w === "பட்டு" || locale === "ta" ? "font-tamil" : "font-serif italic"}`}>
            {w}
            <span className="h-2 w-2 rotate-45 bg-gold-400" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* 3 ─ How ordering works */
export function JourneySection() {
  const { t } = getI18n();
  const h = t.home;
  return (
    <section className="bg-ivory-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 lg:sticky lg:top-32 self-start">
          <Eyebrow>{h.journeyEyebrow}</Eyebrow>
          <Reveal variant="words" as="h2" className="mt-5 font-serif text-4xl sm:text-5xl font-medium leading-[1.05] text-heritage-brown-950">
            <SplitWords text={h.journeyTitle} />
          </Reveal>
          <p className="mt-6 text-heritage-brown-700 leading-relaxed">
            {h.journeyBody}
          </p>
          {visible(ORDER_TERMS.retailMinimum) && (
            <p className="mt-4 text-sm text-heritage-brown-800">
              {h.minimumFamilies} <strong>{ORDER_TERMS.retailMinimum.value}</strong> <DraftBadge fact={ORDER_TERMS.retailMinimum} />
            </p>
          )}
          <Link
            href="/custom-order"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-heritage-brown-950 hover:bg-silk-red-700 text-ivory-50 px-6 py-3.5 text-sm font-semibold tracking-wide transition-colors"
          >
            {h.startOrder} <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </Link>
        </div>
        <div className="lg:col-span-7">
          <OrderingJourney />
        </div>
      </div>
    </section>
  );
}

/* 4 ─ Customer problems → our answers */
export function ProblemsSection() {
  const { t } = getI18n();
  const h = t.home;
  return (
    <section className="relative bg-heritage-brown-950 bg-weave-dark text-ivory-50 overflow-hidden">
      <KovilBorder className="w-full h-3 text-gold-500/40" count={80} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="max-w-3xl">
          <Eyebrow dark>{h.problemsEyebrow}</Eyebrow>
          <Reveal variant="words" as="h2" className="mt-5 font-serif text-4xl sm:text-6xl font-medium leading-[1.02]">
            <SplitWords text={h.problemsA} />{" "}
            <span className="italic text-gold-300">
              <SplitWords text={h.problemsB} />
            </span>
          </Reveal>
        </div>
        <Reveal variant="stagger" className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-ivory-200/10 rounded-3xl overflow-hidden">
          {t.problems.map(({ problem, solution }) => (
            <div key={problem} data-reveal-item className="bg-heritage-brown-950 p-8 hover:bg-white/[0.03] transition-colors">
              <p className="font-serif text-2xl text-gold-300 leading-snug">{problem}</p>
              <DiamondRule className="my-5 text-gold-500/60 w-16" />
              <p className="text-ivory-300 leading-relaxed">{solution}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* 5 ─ Families vs retailers */
export function AudienceSection() {
  const { t } = getI18n();
  const h = t.home;
  const cards = [
    { icon: Users, ...h.families, href: "/custom-order", dark: false },
    { icon: Store, ...h.retailers, href: "/wholesale", dark: true },
  ];
  return (
    <section className="bg-ivory-50 bg-weave">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <Eyebrow>{h.audienceEyebrow}</Eyebrow>
        <Reveal variant="stagger" className="mt-10 grid lg:grid-cols-2 gap-5">
          {cards.map(({ icon: Icon, tag, title, points, href, cta, dark }) => (
            <Link
              key={tag}
              href={href}
              data-reveal-item
              className={`group relative block rounded-[2rem] p-8 sm:p-12 overflow-hidden transition-transform duration-500 hover:-translate-y-1 ${
                dark ? "bg-silk-red-800 text-ivory-50" : "bg-white border border-heritage-brown-100 text-heritage-brown-950"
              }`}
            >
              <Kolam className={`absolute -right-10 -bottom-10 w-56 transition-transform duration-700 group-hover:rotate-45 ${dark ? "text-gold-400/20" : "text-gold-400/30"}`} />
              <Icon className={`w-7 h-7 ${dark ? "text-gold-300" : "text-silk-red-700"}`} aria-hidden="true" />
              <p className={`mt-6 text-xs font-semibold tracking-[0.3em] uppercase ${dark ? "text-gold-300" : "text-silk-red-700"}`}>{tag}</p>
              <h3 className="mt-3 font-serif text-3xl sm:text-4xl leading-tight max-w-md">{title}</h3>
              <ul className={`mt-8 space-y-2.5 ${dark ? "text-ivory-200" : "text-heritage-brown-700"}`}>
                {points.map((p) => (
                  <li key={p} className="flex gap-3">
                    <span className={`mt-2 h-1.5 w-1.5 rotate-45 shrink-0 ${dark ? "bg-gold-400" : "bg-silk-red-700"}`} aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
              <span className={`mt-10 inline-flex items-center gap-2 text-sm font-semibold tracking-widest uppercase ${dark ? "text-gold-300" : "text-silk-red-700"}`}>
                {cta} <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* 6 ─ Founder teaser */
export function FounderTeaser() {
  const { t } = getI18n();
  const h = t.home;
  const shown = MILESTONES.map((m, i) => ({ ...m, text: t.about.milestones[i] })).filter((m) => visible(m.body));
  return (
    <section className="bg-ivory-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 grid lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-5">
          <Eyebrow>{h.founderEyebrow}</Eyebrow>
          <Reveal variant="words" as="h2" className="mt-5 font-serif text-4xl sm:text-5xl font-medium leading-[1.05] text-heritage-brown-950">
            <SplitWords text={h.founderA} />{" "}
            <span className="italic text-silk-red-700">
              <SplitWords text={h.founderB} />
            </span>
          </Reveal>
          <p className="mt-6 text-heritage-brown-700 leading-relaxed">
            {fmt(h.founderBody, { name: FOUNDER.name.value })}
          </p>
          <Link href="/about" className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold tracking-widest uppercase text-silk-red-700">
            {h.founderMore} <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </Link>
        </div>
        <Reveal variant="stagger" as="ol" className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
          {shown.map((m) => (
            <li key={m.text.title} data-reveal-item className="rounded-3xl bg-white border border-heritage-brown-100 p-6">
              {visible(m.year) && (
                <p className="font-serif text-3xl text-gold-700">
                  {m.year.value} <DraftBadge fact={m.year} />
                </p>
              )}
              <p className="mt-2 font-semibold text-heritage-brown-950">{m.text.title}</p>
              <p className="mt-2 text-sm text-heritage-brown-700 leading-relaxed">
                {m.text.body} <DraftBadge fact={m.body} />
              </p>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* 7 ─ Trending designs (code-drawn illustrations, open the designer with a preset) */
export function TrendsSection() {
  const { t } = getI18n();
  const h = t.home;
  return (
    <section className="bg-ivory-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="grid lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-7">
            <Eyebrow>{h.trendsEyebrow}</Eyebrow>
            <Reveal variant="words" as="h2" className="mt-5 font-serif text-4xl sm:text-5xl font-medium leading-[1.05] text-heritage-brown-950">
              <SplitWords text={h.trendsTitle} />
            </Reveal>
          </div>
          <p className="lg:col-span-5 text-heritage-brown-700 leading-relaxed">{h.trendsBody}</p>
        </div>
        <div className="mt-12">
          <TrendsStrip />
        </div>
        <p className="mt-4 text-xs text-heritage-brown-600">{t.common.illustration}</p>
      </div>
    </section>
  );
}

/* 8 ─ FAQ teaser */
export function FaqTeaser() {
  const { t } = getI18n();
  const h = t.home;
  const items = t.faq.groups.flatMap((g) => g.items).filter((_, i) => [0, 1, 3, 4, 7].includes(i));
  return (
    <section className="bg-ivory-100/60">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28">
        <Eyebrow>{h.faqEyebrow}</Eyebrow>
        <h2 className="mt-5 font-serif text-4xl sm:text-5xl font-medium leading-[1.05] text-heritage-brown-950">{h.faqTitle}</h2>
        <div className="mt-10 divide-y divide-heritage-brown-100 rounded-3xl border border-heritage-brown-100 bg-white">
          {items.map((q) => (
            <details key={q.q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-heritage-brown-950">
                {q.q}
                <span className="h-6 w-6 shrink-0 rounded-full border border-gold-400 text-gold-700 flex items-center justify-center transition-transform group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-3 text-heritage-brown-700 leading-relaxed">{q.a}</p>
            </details>
          ))}
        </div>
        <Link href="/faq" className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold tracking-widest uppercase text-silk-red-700">
          {h.faqMore} <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

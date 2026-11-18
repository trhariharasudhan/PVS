import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Droplets, ShieldCheck } from "lucide-react";
import { HorizontalProcess, type ProcessStep } from "@/components/sections/HorizontalProcess";
import { Reveal, SplitWords } from "@/components/motion/Reveal";
import { DiamondRule, Kolam } from "@/components/ui/Ornament";
import { getI18n } from "@/i18n/server";

export function generateMetadata(): Metadata {
  const { t } = getI18n();
  return { title: t.meta.craft.title, description: t.meta.craft.description, alternates: { canonical: "/our-craft" } };
}

export default function OurCraftPage() {
  const { t } = getI18n();
  const c = t.craft;
  const steps: ProcessStep[] = c.steps.map((st, i) => ({ no: String(i + 1).padStart(2, "0"), title: st.title, tamil: st.tamil || undefined, body: st.body }));
  return (
    <div className="bg-ivory-50">
      <section className="relative bg-weave overflow-hidden">
        <Kolam className="pointer-events-none absolute -right-20 top-10 w-96 text-gold-400/20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-24">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-silk-red-700">{c.eyebrow}</p>
          <h1 className="mt-4 max-w-4xl font-serif text-5xl sm:text-7xl font-medium leading-[0.98] text-heritage-brown-950 text-balance">
            {c.titleA} <span className="italic text-silk-red-700">{c.titleB}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-heritage-brown-700 leading-relaxed">
            {c.intro}
          </p>
        </div>
      </section>

      <HorizontalProcess steps={steps} eyebrow={c.processEyebrow} title={c.processTitle} label={c.processLabel} />

      {/* The three motions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <p className="text-xs font-semibold tracking-[0.3em] uppercase text-silk-red-700">{c.motionsEyebrow}</p>
        <Reveal variant="words" as="h2" className="mt-5 max-w-3xl font-serif text-4xl sm:text-5xl leading-[1.05] text-heritage-brown-950">
          <SplitWords text={c.motionsTitle} />
        </Reveal>
        <Reveal variant="stagger" className="mt-14 grid md:grid-cols-3 gap-5">
          {c.motions.map((m, i) => (
            <div key={m.title} data-reveal-item className="rounded-[2rem] bg-white border border-heritage-brown-100 p-8">
              <p className="font-serif text-6xl text-gold-500/40">{i + 1}</p>
              <h3 className="mt-4 font-serif text-3xl text-heritage-brown-950">{m.title}</h3>
              <p className="mt-3 text-heritage-brown-700 leading-relaxed">{m.body}</p>
            </div>
          ))}
        </Reveal>
        <p className="mt-8 text-sm text-heritage-brown-600">
          <Link href="/" className="underline text-silk-red-700">
            {c.watch}
          </Link>
        </p>
      </section>

      {/* Silk & zari guide */}
      <section id="guide" className="scroll-mt-28 bg-heritage-brown-950 text-ivory-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-gold-400">{c.guideEyebrow}</p>
          <Reveal variant="words" as="h2" className="mt-5 max-w-3xl font-serif text-4xl sm:text-6xl leading-[1.02]">
            <SplitWords text={c.guideA} /> <span className="italic text-gold-300"><SplitWords text={c.guideB} /></span>
          </Reveal>

          <h3 className="mt-16 font-serif text-3xl">{c.silkTypes}</h3>
          <div className="mt-6 overflow-x-auto rounded-3xl border border-ivory-200/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-white/[0.04] text-gold-300 text-xs tracking-widest uppercase">
                <tr>
                  {c.silkCols.map((h) => (
                    <th key={h} scope="col" className="px-6 py-4 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200/10">
                {c.silkRows.map((r) => (
                  <tr key={r[0]}>
                    <th scope="row" className="px-6 py-5 font-serif text-lg font-normal text-ivory-50">
                      {r[0]}
                    </th>
                    {r.slice(1).map((c) => (
                      <td key={c} className="px-6 py-5 text-ivory-300">
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-16 font-serif text-3xl">{c.zariGrades}</h3>
          <Reveal variant="stagger" className="mt-6 grid md:grid-cols-3 gap-5">
            {c.zariRows.map(([name, what, note], i) => (
              <div key={name} data-reveal-item className="rounded-[2rem] border border-ivory-200/10 bg-white/[0.03] p-8">
                <span
                  className="block h-2 w-16 rounded-full"
                  style={{ background: ["linear-gradient(90deg,#8E6923,#E3CD94,#B08A3C)", "linear-gradient(90deg,#B08A3C,#F1E5C4,#C29D4F)", "linear-gradient(90deg,#9a9a9a,#eee,#b5b5b5)"][i] }}
                  aria-hidden="true"
                />
                <h4 className="mt-6 font-serif text-2xl">{name}</h4>
                <p className="mt-3 text-ivory-300 text-sm leading-relaxed">{what}</p>
                <DiamondRule className="my-5 w-12 text-gold-500/50" />
                <p className="text-ivory-200 text-sm leading-relaxed">{note}</p>
              </div>
            ))}
          </Reveal>

          <h3 className="mt-16 font-serif text-3xl">{c.designsTitle}</h3>
          <dl className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-px rounded-3xl overflow-hidden bg-ivory-200/10">
            {c.designWords.map(([term, meaning]) => (
              <div key={term} className="bg-heritage-brown-950 p-6">
                <dt className="font-serif text-xl text-gold-300">{term}</dt>
                <dd className="mt-2 text-sm text-ivory-300 leading-relaxed">{meaning}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-16 rounded-[2rem] bg-gold-500 text-heritage-brown-950 p-8 sm:p-12 grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.3em] uppercase">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" /> {c.promiseEyebrow}
              </p>
              <p className="mt-4 font-serif text-3xl sm:text-4xl leading-tight">
                {c.promise}
              </p>
              <p className="mt-4 text-sm text-heritage-brown-800">
                {c.promiseNote}
              </p>
            </div>
            <div className="lg:col-span-4 lg:text-right">
              <Link
                href="/custom-order"
                className="inline-flex items-center gap-2 rounded-full bg-heritage-brown-950 text-ivory-50 px-7 py-4 text-sm font-semibold tracking-widest uppercase"
              >
                {c.startOrder} <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Saree care */}
      <section id="care" className="scroll-mt-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.3em] uppercase text-silk-red-700">
          <Droplets className="w-4 h-4" aria-hidden="true" /> {c.careTitle}
        </p>
        <Reveal variant="stagger" as="ol" className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {c.care.map((tip, i) => (
            <li key={i} data-reveal-item className="rounded-3xl bg-white border border-heritage-brown-100 p-6 flex gap-4">
              <span className="font-serif text-3xl text-gold-600 leading-none">{i + 1}</span>
              <p className="text-heritage-brown-800 leading-relaxed">{tip}</p>
            </li>
          ))}
        </Reveal>
      </section>
    </div>
  );
}

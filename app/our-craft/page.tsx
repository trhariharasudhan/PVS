import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { HorizontalProcess, type ProcessStep } from "@/components/sections/HorizontalProcess";
import { Reveal, SplitWords } from "@/components/motion/Reveal";
import { DiamondRule, Kolam } from "@/components/ui/Ornament";

export const metadata: Metadata = {
  title: "How We Weave — Silk Saree Making & Silk/Zari Guide",
  description:
    "How a silk saree is made, step by step — design, dyeing, warping, setting the loom, weaving and finishing — plus a plain-language guide to silk types and zari grades.",
  alternates: { canonical: "/our-craft" },
};

const STEPS: ProcessStep[] = [
  {
    no: "01",
    title: "Design",
    body: "Your idea becomes a design plan: motifs, border, pallu and where the zari goes. For woven patterns, every row of the design is worked out before weaving.",
  },
  {
    no: "02",
    title: "Silk yarn & dyeing",
    tamil: "சாயம்",
    body: "Raw silk is degummed so it becomes soft and lustrous, then dyed to the colours you approved. Colour is checked against your swatch.",
  },
  {
    no: "03",
    title: "Warping",
    tamil: "பாவு",
    body: "Thousands of lengthwise warp threads are measured, laid out in order and wound onto the warp beam under even tension.",
  },
  {
    no: "04",
    title: "Setting the loom",
    body: "Each warp thread is drawn through the heddles and the reed. The design is set on the loom — a dobby for simpler borders, a jacquard for intricate motifs.",
  },
  {
    no: "05",
    title: "Weaving",
    tamil: "நெசவு",
    body: "Pick by pick: the warp opens, the shuttle carries the weft across, the reed beats it in. Zari is woven into the border and pallu as the saree grows.",
  },
  {
    no: "06",
    title: "Finishing & checking",
    body: "The saree comes off the loom, loose threads are trimmed, and it is checked for weave faults, colour and measurements before folding.",
  },
  {
    no: "07",
    title: "Packing & dispatch",
    body: "Folded, wrapped and packed for safe travel — collected from the workshop or sent to your home or store.",
  },
];

const MOTIONS = [
  {
    title: "Shedding",
    body: "Heddles (or a jacquard, for complex designs) lift some warp threads and lower others, opening a gap called the shed.",
  },
  {
    title: "Picking",
    body: "The shuttle flies through the shed, laying one weft thread — a ‘pick’ — across the full width of the saree.",
  },
  {
    title: "Beating",
    body: "The reed swings forward and packs the new pick tightly against the woven cloth. Then the shed changes and it repeats.",
  },
];

const SILK_GUIDE = [
  ["Pure mulberry silk", "100% silk in warp and weft", "Weddings, heirloom sarees", "Richest lustre, weight and drape"],
  ["Soft silk", "Silk, lighter construction", "Long functions, daily silk", "Lighter and easier to carry"],
  ["Silk cotton", "Silk blended with cotton", "Office, summer, festivals", "Breathable; price depends on silk %"],
  ["Art silk / blends", "Silk-look fibres or blends", "Budget & bulk orders", "Affordable; not pure silk"],
];

const ZARI_GUIDE = [
  ["Pure zari", "Silver thread coated with gold, on a silk core", "Highest value; precious-metal content gives resale value"],
  ["Tested / half-fine zari", "Copper wire with silver & gold electroplating", "Durable and bright at a much lower price"],
  ["Imitation / metallic zari", "Polyester or metallised film", "Lowest cost; can dull or peel over time"],
];

export default function OurCraftPage() {
  return (
    <div className="bg-ivory-50">
      <section className="relative bg-weave overflow-hidden">
        <Kolam className="pointer-events-none absolute -right-20 top-10 w-96 text-gold-400/20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-24">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-silk-red-700">How we weave</p>
          <h1 className="mt-4 max-w-4xl font-serif text-5xl sm:text-7xl font-medium leading-[0.98] text-heritage-brown-950 text-balance">
            Slow craft, <span className="italic text-silk-red-700">explained plainly.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-heritage-brown-700 leading-relaxed">
            Knowing how a saree is made helps you choose well. Here&apos;s what happens between your order and your saree — and what silk and zari
            terms really mean.
          </p>
        </div>
      </section>

      <HorizontalProcess steps={STEPS} />

      {/* The three motions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <p className="text-xs font-semibold tracking-[0.3em] uppercase text-silk-red-700">Inside the loom</p>
        <Reveal variant="words" as="h2" className="mt-5 max-w-3xl font-serif text-4xl sm:text-5xl leading-[1.05] text-heritage-brown-950">
          <SplitWords text="Every row of your saree is three movements, repeated thousands of times." />
        </Reveal>
        <Reveal variant="stagger" className="mt-14 grid md:grid-cols-3 gap-5">
          {MOTIONS.map((m, i) => (
            <div key={m.title} data-reveal-item className="rounded-[2rem] bg-white border border-heritage-brown-100 p-8">
              <p className="font-serif text-6xl text-gold-500/40">{i + 1}</p>
              <h3 className="mt-4 font-serif text-3xl text-heritage-brown-950">{m.title}</h3>
              <p className="mt-3 text-heritage-brown-700 leading-relaxed">{m.body}</p>
            </div>
          ))}
        </Reveal>
        <p className="mt-8 text-sm text-heritage-brown-600">
          Watch all three in our{" "}
          <Link href="/" className="underline text-silk-red-700">
            3D loom on the home page
          </Link>
          .
        </p>
      </section>

      {/* Silk & zari guide */}
      <section id="guide" className="scroll-mt-28 bg-heritage-brown-950 text-ivory-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-gold-400">Buyer&apos;s guide</p>
          <Reveal variant="words" as="h2" className="mt-5 max-w-3xl font-serif text-4xl sm:text-6xl leading-[1.02]">
            <SplitWords text="Silk & zari," /> <span className="italic text-gold-300"><SplitWords text="without the confusion." /></span>
          </Reveal>

          <h3 className="mt-16 font-serif text-3xl">Silk types</h3>
          <div className="mt-6 overflow-x-auto rounded-3xl border border-ivory-200/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-white/[0.04] text-gold-300 text-xs tracking-widest uppercase">
                <tr>
                  {["Silk", "What it is", "Good for", "Feel & value"].map((h) => (
                    <th key={h} scope="col" className="px-6 py-4 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200/10">
                {SILK_GUIDE.map((r) => (
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

          <h3 className="mt-16 font-serif text-3xl">Zari grades</h3>
          <Reveal variant="stagger" className="mt-6 grid md:grid-cols-3 gap-5">
            {ZARI_GUIDE.map(([name, what, note], i) => (
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

          <div className="mt-16 rounded-[2rem] bg-gold-500 text-heritage-brown-950 p-8 sm:p-12 grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.3em] uppercase">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" /> Our promise
              </p>
              <p className="mt-4 font-serif text-3xl sm:text-4xl leading-tight">
                Before weaving, you get the silk type, silk % and zari grade in writing. What we write is what we weave.
              </p>
              <p className="mt-4 text-sm text-heritage-brown-800">
                Buying pure silk anywhere? Look for the Silk Mark label, and for pure zari ask for a zari test report.
              </p>
            </div>
            <div className="lg:col-span-4 lg:text-right">
              <Link
                href="/custom-order"
                className="inline-flex items-center gap-2 rounded-full bg-heritage-brown-950 text-ivory-50 px-7 py-4 text-sm font-semibold tracking-widest uppercase"
              >
                Start your order <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

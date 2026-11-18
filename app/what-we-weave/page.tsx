import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SareePreview } from "@/components/custom-order/SareePreview";
import { Reveal, SplitWords } from "@/components/motion/Reveal";
import { DiamondRule } from "@/components/ui/Ornament";

export const metadata: Metadata = {
  title: "What We Weave — Made-to-Order Silk Sarees",
  description:
    "Wedding pattu, traditional pattu, soft silk, silk cotton and group orders — woven to order by PVS in your colours, silk and zari.",
  alternates: { canonical: "/what-we-weave" },
};

const KINDS = [
  {
    type: "Wedding / bridal pattu saree",
    title: "Wedding & bridal pattu",
    body: "Rich silk, heavier zari borders and a grand pallu — woven to match the wedding colours you choose.",
    options: ["Pure mulberry silk", "Pure or tested zari", "Temple or contrast borders"],
    palette: { body: "#7A1424", border: "#1F5F5B", pallu: "#7A1424", zari: "#C9A24E", sheen: 1, borderStyle: "Temple (kovil) border" },
  },
  {
    type: "Traditional pattu saree",
    title: "Traditional pattu",
    body: "Classic colour combinations and motifs for functions, temple visits and festivals.",
    options: ["Pure silk", "Tested zari", "Butta body, zari border"],
    palette: { body: "#E3A21A", border: "#7A1424", pallu: "#7A1424", zari: "#D8B25C", sheen: 0.9, borderStyle: "Plain zari border" },
  },
  {
    type: "Soft silk saree",
    title: "Soft silk",
    body: "Lighter and softer to drape, easy to wear for long hours — with or without zari.",
    options: ["Soft silk", "Light zari or thread work", "Minimal borders"],
    palette: { body: "#9B7BB8", border: "#5B2A6E", pallu: "#5B2A6E", zari: "#C8C8CC", sheen: 0.8, borderStyle: "Small butta border" },
  },
  {
    type: "Silk cotton saree",
    title: "Silk cotton",
    body: "Breathable silk-cotton blends — choose the silk percentage that fits comfort and budget.",
    options: ["Silk % of your choice", "Thread or zari motifs", "Everyday & office wear"],
    palette: { body: "#F3E9D2", border: "#0B4D3A", pallu: "#0B4D3A", zari: "", sheen: 0.35, borderStyle: "Plain zari border" },
  },
  {
    type: "Festive / function saree",
    title: "Festive & function",
    body: "Bright, celebratory colours for Deepavali, Pongal, engagements and family functions.",
    options: ["Silk or silk blends", "Contrast pallu", "Coordinated family sets"],
    palette: { body: "#C2185B", border: "#E3A21A", pallu: "#E3A21A", zari: "#D8B25C", sheen: 0.9, borderStyle: "Temple (kovil) border" },
  },
  {
    type: "Uniform / group order",
    title: "Group & uniform orders",
    body: "Same design for a family, a temple, a school function or your staff — consistent from the first saree to the last.",
    options: ["Bulk quantities", "Matching colour lots", "Planned delivery dates"],
    palette: { body: "#0F5E7A", border: "#C6A15B", pallu: "#0F5E7A", zari: "#D8B25C", sheen: 0.7, borderStyle: "Plain zari border" },
  },
];

const ASKED_FOR = ["Peacock (mayil)", "Mango / paisley", "Temple tower (kovil)", "Rudraksha", "Checks (kattam)", "Annam (swan)", "Elephant (yaanai)", "Floral buttas", "Stripes", "Your family name or initials"];

export default function WhatWeWeavePage() {
  return (
    <div className="bg-ivory-50 bg-weave">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-16">
        <p className="text-xs font-semibold tracking-[0.3em] uppercase text-silk-red-700">What we weave</p>
        <h1 className="mt-4 max-w-4xl font-serif text-5xl sm:text-7xl font-medium leading-[0.98] text-heritage-brown-950 text-balance">
          Every saree starts as <span className="italic text-silk-red-700">your idea.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-heritage-brown-700 leading-relaxed">
          We don&apos;t keep a showroom of ready sarees. These are the kinds of sarees we weave to order — pick a starting point and make it yours.
        </p>
        <p className="mt-3 text-xs text-heritage-brown-500">Images on this page are colour illustrations, not photos of finished products.</p>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <Reveal variant="stagger" className="grid md:grid-cols-2 gap-6">
          {KINDS.map((k) => (
            <article key={k.title} data-reveal-item className="group rounded-[2rem] bg-white border border-heritage-brown-100 overflow-hidden">
              <div className="bg-heritage-brown-950 p-6 sm:p-8">
                <SareePreview spec={k.palette} />
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
                <Link
                  href={`/custom-order?type=${encodeURIComponent(k.type)}`}
                  className="mt-7 inline-flex items-center gap-2 text-sm font-semibold tracking-widest uppercase text-silk-red-700"
                >
                  Customise this <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </Reveal>
      </section>

      <section className="bg-heritage-brown-950 text-ivory-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-gold-400">Motifs customers ask for</p>
            <Reveal variant="words" as="h2" className="mt-5 font-serif text-4xl sm:text-5xl leading-[1.05]">
              <SplitWords text="Bring a motif. We'll tell you honestly how it can be woven." />
            </Reveal>
            <p className="mt-6 text-ivory-300 leading-relaxed">
              Some designs suit a dobby, intricate ones need a jacquard, and a few are better simplified. We&apos;ll explain the options and the cost
              before you decide.
            </p>
          </div>
          <div className="lg:col-span-7">
            <Reveal variant="stagger" as="ul" className="flex flex-wrap gap-3">
              {ASKED_FOR.map((m) => (
                <li key={m} data-reveal-item className="rounded-full border border-gold-400/40 px-5 py-2.5 font-serif text-lg text-ivory-100">
                  {m}
                </li>
              ))}
            </Reveal>
            <DiamondRule className="my-10 text-gold-500/50" />
            <Link
              href="/custom-order"
              className="inline-flex items-center gap-2 rounded-full bg-gold-500 hover:bg-gold-400 text-heritage-brown-950 px-7 py-4 text-sm font-semibold tracking-widest uppercase transition-colors"
            >
              Upload your design <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

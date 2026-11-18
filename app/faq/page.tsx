import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, MessageCircle, Phone } from "lucide-react";
import { siteConfig, getWhatsAppLink } from "@/config/site";
import { Kolam } from "@/components/ui/Ornament";
import { getI18n } from "@/i18n/server";

export function generateMetadata(): Metadata {
  const { t } = getI18n();
  return { title: t.meta.faq.title, description: t.meta.faq.description, alternates: { canonical: "/faq" } };
}

export default function FaqPage() {
  const { t } = getI18n();
  const f = t.faq;
  // FAQPage structured data (answers are the same text shown on the page)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: f.groups.flatMap((g) => g.items).map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
  return (
    <div className="bg-ivory-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="relative bg-weave overflow-hidden">
        <Kolam className="pointer-events-none absolute -right-16 top-6 w-80 text-gold-400/20" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-14">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-silk-red-700">{f.eyebrow}</p>
          <h1 className="mt-4 font-serif text-5xl sm:text-6xl font-medium leading-[1] text-heritage-brown-950 text-balance">{f.title}</h1>
          <p className="mt-6 max-w-2xl text-lg text-heritage-brown-700 leading-relaxed">{f.intro}</p>
          <nav aria-label={f.title} className="mt-8 flex flex-wrap gap-2">
            {f.groups.map((g, i) => (
              <a key={g.title} href={`#g${i}`} className="rounded-full border border-heritage-brown-200 bg-white px-4 py-2 text-sm font-medium text-heritage-brown-900 hover:border-gold-500">
                {g.title}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-14">
        {f.groups.map((g, gi) => (
          <div key={g.title} id={`g${gi}`} className="scroll-mt-28">
            <h2 className="font-serif text-3xl text-heritage-brown-950">{g.title}</h2>
            <div className="mt-5 divide-y divide-heritage-brown-100 rounded-3xl border border-heritage-brown-100 bg-white">
              {g.items.map((q, qi) => (
                <details key={q.q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden" open={gi === 0 && qi === 0}>
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
          </div>
        ))}

        <div className="rounded-[2rem] bg-heritage-brown-950 text-ivory-50 p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <p className="font-serif text-2xl sm:text-3xl max-w-md">{f.intro}</p>
          <div className="flex flex-wrap gap-3">
            <a href={`tel:+${siteConfig.business.phoneNumeric}`} className="inline-flex items-center gap-2 rounded-full border border-ivory-200/30 px-5 py-3 text-sm font-semibold">
              <Phone className="w-4 h-4" aria-hidden="true" /> {t.common.call}
            </a>
            <a href={getWhatsAppLink(t.common.whatsappHello)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-gold-500 text-heritage-brown-950 px-5 py-3 text-sm font-semibold">
              <MessageCircle className="w-4 h-4" aria-hidden="true" /> {t.common.whatsapp}
            </a>
            <Link href="/custom-order" className="inline-flex items-center gap-2 rounded-full border border-ivory-200/30 px-5 py-3 text-sm font-semibold">
              {t.common.startCustomOrder} <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

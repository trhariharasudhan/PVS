import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { siteConfig, getWhatsAppLink } from "@/config/site";
import { ContactForm } from "@/components/contact/ContactForm";
import { Kolam, KovilBorder } from "@/components/ui/Ornament";
import { getI18n } from "@/i18n/server";

export function generateMetadata(): Metadata {
  const { t } = getI18n();
  return { title: t.meta.contact.title, description: t.meta.contact.description, alternates: { canonical: "/contact" } };
}

const b = siteConfig.business;
const MAP_EMBED = "https://www.google.com/maps?q=Panjakalipatti,+Kalipatti,+Tamil+Nadu+636455&z=14&output=embed";

export default function ContactPage() {
  const { t } = getI18n();
  const c = t.contact;
  const cards = [
    { icon: Phone, title: c.callTitle, body: b.phoneDisplay, href: `tel:+${b.phoneNumeric}`, external: false },
    { icon: MessageCircle, title: c.whatsappTitle, body: c.whatsappBody, href: getWhatsAppLink(t.common.whatsappHello), external: true },
    { icon: Mail, title: c.emailTitle, body: b.emailDisplay, href: `mailto:${b.email}`, external: false },
    { icon: Clock, title: c.hoursTitle, body: t.common.hours, href: null, external: false },
  ];

  return (
    <div className="bg-ivory-50">
      <section className="relative bg-weave overflow-hidden">
        <Kolam className="pointer-events-none absolute -right-20 top-6 w-80 text-gold-400/20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-16">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-silk-red-700">{c.eyebrow}</p>
          <h1 className="mt-4 max-w-4xl font-serif text-5xl sm:text-7xl font-medium leading-[0.98] text-heritage-brown-950 text-balance">{c.title}</h1>
          <p className="mt-6 max-w-2xl text-lg text-heritage-brown-700 leading-relaxed">{c.intro}</p>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map(({ icon: Icon, title, body, href, external }) => {
              const inner = (
                <>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-silk-red-50 text-silk-red-700">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <p className="mt-5 text-[11px] font-semibold tracking-[0.25em] uppercase text-gold-700">{title}</p>
                  <p className="mt-1 font-medium text-heritage-brown-950 break-words">{body}</p>
                </>
              );
              const cls = "block h-full rounded-3xl border border-heritage-brown-100 bg-white p-6 transition-colors hover:border-gold-400";
              return href ? (
                <a key={title} href={href} className={cls} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  {inner}
                </a>
              ) : (
                <div key={title} className={cls}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 rounded-[2rem] border border-heritage-brown-100 bg-white p-6 sm:p-10">
          <h2 className="font-serif text-3xl text-heritage-brown-950">{c.formTitle}</h2>
          <p className="mt-2 text-sm text-heritage-brown-600">{c.formIntro}</p>
          <div className="mt-8">
            <ContactForm />
          </div>
          <Link href="/custom-order" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-silk-red-700">
            {c.startDesign} <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-[2rem] bg-heritage-brown-950 text-ivory-50 overflow-hidden">
            <KovilBorder className="w-full h-3 text-gold-500/40" count={30} />
            <div className="p-6 sm:p-8">
              <h2 className="font-serif text-3xl">{c.visitTitle}</h2>
              <a href={b.address.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="mt-4 flex gap-3 text-ivory-200 hover:text-gold-300">
                <MapPin className="w-5 h-5 mt-0.5 shrink-0 text-gold-400" aria-hidden="true" />
                <span>{t.common.address}</span>
              </a>
              <ul className="mt-6 space-y-2.5 text-sm text-ivory-300">
                {c.visitTips.map((tip) => (
                  <li key={tip} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rotate-45 bg-gold-400 shrink-0" aria-hidden="true" />
                    {tip}
                  </li>
                ))}
              </ul>
              <a
                href={b.address.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-gold-500 hover:bg-gold-400 text-heritage-brown-950 px-6 py-3 text-sm font-semibold transition-colors"
              >
                {t.common.getDirections} <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="overflow-hidden rounded-[2rem] border border-heritage-brown-100 bg-ivory-100 aspect-[4/3]">
            <iframe title={t.common.mapLabel} src={MAP_EMBED} className="h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        </div>
      </section>
    </div>
  );
}

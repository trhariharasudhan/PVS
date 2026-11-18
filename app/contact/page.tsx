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
          {b.address.mapEmbedUrl ? (
            <div className="overflow-hidden rounded-[2rem] border border-heritage-brown-100 bg-ivory-100 aspect-[4/3]">
              <iframe title={t.common.mapLabel} src={b.address.mapEmbedUrl} className="h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          ) : (
            <a
              href={b.address.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block overflow-hidden rounded-[2rem] border border-heritage-brown-100 bg-[#efe5d3] aspect-[4/3]"
            >
              {/* stylised map tile (no external map request): roads, river and the PVS pin */}
              <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" aria-hidden="true">
                <rect width="400" height="300" fill="#efe5d3" />
                <path d="M-10 210 C 80 180, 160 240, 260 200 S 380 150, 420 170" stroke="#b9d3d8" strokeWidth="14" fill="none" />
                <path d="M40 -10 L 120 310 M -10 90 L 410 140 M 230 -10 L 300 310 M 0 260 L 400 230" stroke="#fff" strokeWidth="9" fill="none" />
                <path d="M40 -10 L 120 310 M -10 90 L 410 140 M 230 -10 L 300 310 M 0 260 L 400 230" stroke="#dccfb6" strokeWidth="1" fill="none" />
                {Array.from({ length: 18 }, (_, i) => (
                  <rect key={i} x={(i * 53) % 380} y={((i * 97) % 260) + 10} width="26" height="18" rx="3" fill="#e2d6bf" />
                ))}
                <g transform="translate(200 128)">
                  <circle r="34" fill="#7A1022" opacity="0.12" />
                  <path d="M0 22 C -16 2, -18 -6, -18 -12 A 18 18 0 1 1 18 -12 C 18 -6, 16 2, 0 22 Z" fill="#7A1022" />
                  <circle cy="-12" r="7" fill="#F3D98B" />
                </g>
              </svg>
              <span className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-2xl bg-heritage-brown-950/90 px-4 py-3 text-sm font-semibold text-ivory-50">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gold-300" aria-hidden="true" /> {c.mapOpen}
                </span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </span>
            </a>
          )}
        </div>
      </section>
    </div>
  );
}

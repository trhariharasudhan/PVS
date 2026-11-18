"use client";

import Link from "next/link";
import { ArrowUpRight, MapPin, MessageCircle, PenTool } from "lucide-react";
import { siteConfig, getWhatsAppLink } from "@/config/site";
import { Reveal } from "@/components/motion/Reveal";
import { fmt, useI18n } from "@/i18n/I18nProvider";

const b = siteConfig.business;

/** The three ways a customer can place an order with PVS. */
export function WaysToOrder({ dark = false, showDesignCard = true }: { dark?: boolean; showDesignCard?: boolean }) {
  const { t } = useI18n();
  const w = t.ways;
  const ways = [
    {
      icon: MapPin,
      title: w.visitTitle,
      body: w.visitBody,
      cta: t.common.getDirections,
      href: b.address.googleMapsUrl,
      external: true,
    },
    {
      icon: MessageCircle,
      title: w.callTitle,
      body: fmt(w.callBody, { phone: b.phoneDisplay }),
      cta: t.common.chatWhatsapp,
      href: getWhatsAppLink(w.whatsappMsg),
      external: true,
    },
    ...(showDesignCard
      ? [
          {
            icon: PenTool,
            title: w.designTitle,
            body: w.designBody,
            cta: t.common.startCustomOrder,
            href: "/custom-order",
            external: false,
          },
        ]
      : []),
  ];

  const card = dark
    ? "bg-white/[0.04] border-ivory-200/10 hover:border-gold-400/50 text-ivory-50"
    : "bg-white border-heritage-brown-100 hover:border-gold-400 text-heritage-brown-950";

  return (
    <Reveal variant="stagger" className={`grid gap-4 ${showDesignCard ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
      {ways.map(({ icon: Icon, title, body, cta, href, external }) => {
        const inner = (
          <>
            <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${dark ? "bg-gold-500/15 text-gold-300" : "bg-silk-red-50 text-silk-red-700"}`}>
              <Icon className="w-5 h-5" aria-hidden="true" />
            </span>
            <h3 className="mt-6 font-serif text-2xl">{title}</h3>
            <p className={`mt-2 text-sm leading-relaxed ${dark ? "text-ivory-300" : "text-heritage-brown-700"}`}>{body}</p>
            <span className={`mt-6 inline-flex items-center gap-1 text-xs font-semibold tracking-widest uppercase ${dark ? "text-gold-300" : "text-silk-red-700"}`}>
              {cta} <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </span>
          </>
        );
        const cls = `group block rounded-3xl border p-7 transition-colors ${card}`;
        return (
          <div key={title} data-reveal-item>
            {external ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                {inner}
              </a>
            ) : (
              <Link href={href} className={cls}>
                {inner}
              </Link>
            )}
          </div>
        );
      })}
    </Reveal>
  );
}

import Link from "next/link";
import { ArrowUpRight, MapPin, MessageCircle, PenTool } from "lucide-react";
import { siteConfig, getWhatsAppLink } from "@/config/site";
import { Reveal } from "@/components/motion/Reveal";

const b = siteConfig.business;

/** The three ways a customer can place an order with PVS. */
export function WaysToOrder({ dark = false, showDesignCard = true }: { dark?: boolean; showDesignCard?: boolean }) {
  const ways = [
    {
      icon: MapPin,
      title: "Visit the workshop",
      body: "See the looms, feel the silk and discuss your saree in person at Panjakalipatti.",
      cta: "Get directions",
      href: b.address.googleMapsUrl,
      external: true,
    },
    {
      icon: MessageCircle,
      title: "Call or WhatsApp",
      body: `Talk to us directly on ${b.phoneDisplay}. Send photos of designs you like.`,
      cta: "Chat on WhatsApp",
      href: getWhatsAppLink("Hello PVS, I'd like to order a silk saree."),
      external: true,
    },
    ...(showDesignCard
      ? [
          {
            icon: PenTool,
            title: "Design it online",
            body: "Upload your design, pick colours, silk and zari, and get a quotation.",
            cta: "Start custom order",
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

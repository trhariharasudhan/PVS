import Link from "next/link";
import { ArrowUpRight, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { siteConfig } from "@/config/site";
import { KovilBorder } from "@/components/ui/Ornament";

const b = siteConfig.business;

const LINKS = [
  {
    title: "Order",
    items: [
      { label: "Start a custom order", href: "/custom-order" },
      { label: "Track your order", href: "/order-status" },
      { label: "Wholesale & retailers", href: "/wholesale" },
    ],
  },
  {
    title: "Learn",
    items: [
      { label: "How we weave", href: "/our-craft" },
      { label: "Silk & zari guide", href: "/our-craft#guide" },
      { label: "What we weave", href: "/what-we-weave" },
    ],
  },
  {
    title: "PVS",
    items: [
      { label: "Our story", href: "/about" },
      { label: "Contact & visit", href: "/contact" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();
  const wa = `https://wa.me/${b.whatsapp}?text=${encodeURIComponent("Hello PVS, I'd like to enquire about a silk saree order.")}`;

  return (
    <footer className="relative bg-heritage-brown-950 text-ivory-200 overflow-hidden">
      <KovilBorder className="w-full h-3 text-gold-500/50" count={80} />

      {/* Closing CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-14 grid lg:grid-cols-12 gap-10 items-end border-b border-ivory-200/10">
        <div className="lg:col-span-8">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-gold-400">Woven to order</p>
          <h2 className="mt-4 font-serif text-4xl sm:text-6xl font-medium leading-[1.02] text-ivory-50 text-balance">
            Your colours. Your design. <span className="italic text-gold-300">Our looms.</span>
          </h2>
        </div>
        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
          <Link
            href="/custom-order"
            className="group inline-flex items-center justify-between gap-3 rounded-full bg-gold-500 hover:bg-gold-400 text-heritage-brown-950 px-6 py-4 text-sm font-semibold tracking-widest uppercase transition-colors"
          >
            Start custom order
            <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </Link>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-between gap-3 rounded-full border border-ivory-200/25 hover:border-gold-300 px-6 py-4 text-sm font-semibold tracking-widest uppercase transition-colors"
          >
            Ask on WhatsApp <MessageCircle className="w-5 h-5" aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-2 lg:grid-cols-12 gap-10">
        <div className="col-span-2 lg:col-span-4 space-y-4">
          <p className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-semibold tracking-[0.08em] text-ivory-50">PVS</span>
            <span className="text-[11px] tracking-[0.32em] text-gold-400">SILKS</span>
          </p>
          <p className="text-sm text-ivory-300 leading-relaxed max-w-sm">
            Silk saree manufacturer in Salem district, Tamil Nadu. We weave to order for families, boutiques and wholesale buyers.
          </p>
          <p className="font-tamil text-sm text-gold-300" lang="ta">
            பாரம்பரியம் • வண்ணம் • பட்டு
          </p>
        </div>

        {LINKS.map((col) => (
          <nav key={col.title} aria-label={col.title} className="lg:col-span-2">
            <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-gold-400">{col.title}</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.items.map((i) => (
                <li key={i.href}>
                  <Link href={i.href} className="text-ivory-300 hover:text-gold-300 transition-colors">
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <address className="col-span-2 lg:col-span-2 not-italic text-sm space-y-3 text-ivory-300">
          <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-gold-400">Visit</p>
          <a href={b.address.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex gap-2 hover:text-gold-300">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gold-400" aria-hidden="true" />
            <span>{b.address.full}</span>
          </a>
          <a href={`tel:+${b.phoneNumeric}`} className="flex gap-2 hover:text-gold-300">
            <Phone className="w-4 h-4 mt-0.5 shrink-0 text-gold-400" aria-hidden="true" />
            {b.phoneDisplay}
          </a>
          <a href={`mailto:${b.email}`} className="flex gap-2 hover:text-gold-300 break-all">
            <Mail className="w-4 h-4 mt-0.5 shrink-0 text-gold-400" aria-hidden="true" />
            {b.emailDisplay}
          </a>
          <p className="flex gap-2">
            <Clock className="w-4 h-4 mt-0.5 shrink-0 text-gold-400" aria-hidden="true" />
            {b.businessHours}
          </p>
        </address>
      </div>

      <div className="border-t border-ivory-200/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between gap-2 text-xs text-ivory-300/70">
          <p>© {year} PVS Silks · {b.owner} · Panjakalipatti, Salem district</p>
          <p>Made-to-order silk sarees · No middlemen</p>
        </div>
      </div>
    </footer>
  );
}

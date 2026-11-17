import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { MapPin, Phone, Mail, Clock, ShieldCheck, ShoppingBag, ArrowRight } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-heritage-brown-950 text-ivory-200 font-sans border-t-2 border-gold-500/40 relative overflow-hidden">
      {/* Subtle Zari Background Pattern */}
      <div className="absolute inset-0 bg-zari-pattern opacity-10 pointer-events-none" />

      {/* Top Banner: Manufacturing & Wholesale Assurance */}
      <div className="border-b border-heritage-brown-900 bg-heritage-brown-900/60 py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div className="w-10 h-10 rounded-[4px] bg-gold-500/15 border border-gold-400/40 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h4 className="font-serif text-ivory-50 text-sm font-semibold tracking-wide">
                Pattu Saree Manufacturer
              </h4>
              <p className="text-xs text-ivory-300 mt-1 font-sans">
                Authentic silk weaving from Panjakalipatti, Kalipatti, Salem, Tamil Nadu.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div className="w-10 h-10 rounded-[4px] bg-gold-500/15 border border-gold-400/40 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h4 className="font-serif text-ivory-50 text-sm font-semibold tracking-wide">
                Wholesale & Retail Available
              </h4>
              <p className="text-xs text-ivory-300 mt-1 font-sans">
                Serving wholesale merchants, boutiques, resellers, and individual retail customers.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div className="w-10 h-10 rounded-[4px] bg-gold-500/15 border border-gold-400/40 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h4 className="font-serif text-ivory-50 text-sm font-semibold tracking-wide">
                Direct Communication
              </h4>
              <p className="text-xs text-ivory-300 mt-1 font-sans">
                Call or WhatsApp Sathish Kumar at +91 99651 76136 for live enquiries.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand Identity & Interpretations */}
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-1">
              <h3 className="font-serif text-3xl font-bold tracking-widest text-gold-400">
                PVS
              </h3>
              <p className="text-[10px] uppercase tracking-widest text-gold-300 font-semibold font-sans">
                Pattu Saree Manufacturer • Salem, Tamil Nadu
              </p>
              <p className="text-xs text-silk-red-400 font-semibold font-serif">
                Owner: {siteConfig.business.owner}
              </p>
            </div>

            <div className="space-y-2 pt-1 text-xs text-ivory-300/90 font-sans leading-relaxed">
              <div className="p-3 bg-heritage-brown-900/80 border border-gold-500/30 rounded-[4px]">
                <p className="font-serif text-gold-300 font-bold">
                  {siteConfig.brandMeanings.option1.phrase}
                </p>
                <p className="text-[11px] text-ivory-300 mt-0.5">
                  {siteConfig.brandMeanings.option1.meaning}
                </p>
              </div>
              <div className="p-3 bg-heritage-brown-900/80 border border-gold-500/30 rounded-[4px]">
                <p className="font-serif text-gold-300 font-bold">
                  {siteConfig.brandMeanings.option2.phrase}
                </p>
                <p className="text-[11px] text-ivory-300 mt-0.5">
                  {siteConfig.brandMeanings.option2.meaning}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Explore Links */}
          <div>
            <h4 className="font-serif text-sm uppercase tracking-widest text-gold-400 font-semibold mb-4 border-b border-heritage-brown-800 pb-2">
              Explore
            </h4>
            <ul className="space-y-2.5 text-xs font-sans">
              <li>
                <Link href="/" className="hover:text-gold-300 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-gold-300 transition-colors">
                  Collections
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-gold-300 transition-colors font-semibold text-gold-300">
                  Shop Sarees (Online Catalog)
                </Link>
              </li>
              <li>
                <Link href="/our-craft" className="hover:text-gold-300 transition-colors">
                  Our Craft (Manufacturing Story)
                </Link>
              </li>
              <li>
                <Link href="/wholesale" className="hover:text-gold-300 transition-colors">
                  Wholesale Supply
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-gold-300 transition-colors">
                  About Sathish Kumar & PVS
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-gold-300 transition-colors">
                  Photo Gallery
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-gold-300 transition-colors">
                  Contact Showroom
                </Link>
              </li>
            </ul>
          </div>

          {/* Collections Direct Links */}
          <div>
            <h4 className="font-serif text-sm uppercase tracking-widest text-gold-400 font-semibold mb-4 border-b border-heritage-brown-800 pb-2">
              Collections
            </h4>
            <ul className="space-y-2.5 text-xs font-sans">
              <li>
                <Link href="/shop?category=bridal" className="hover:text-gold-300 transition-colors">
                  Bridal Collection
                </Link>
              </li>
              <li>
                <Link href="/shop?category=wedding" className="hover:text-gold-300 transition-colors">
                  Wedding Collection
                </Link>
              </li>
              <li>
                <Link href="/shop?category=traditional" className="hover:text-gold-300 transition-colors">
                  Traditional Collection
                </Link>
              </li>
              <li>
                <Link href="/shop?category=designer" className="hover:text-gold-300 transition-colors">
                  Designer Collection
                </Link>
              </li>
              <li>
                <Link href="/shop?category=silk" className="hover:text-gold-300 transition-colors">
                  Silk Collection
                </Link>
              </li>
              <li>
                <Link href="/shop?category=new-arrivals" className="hover:text-gold-300 transition-colors">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>

          {/* Business & Manufacturing Location */}
          <div className="space-y-3 font-sans">
            <h4 className="font-serif text-sm uppercase tracking-widest text-gold-400 font-semibold mb-4 border-b border-heritage-brown-800 pb-2">
              Manufacturing Unit
            </h4>
            <div className="space-y-3 text-xs text-ivory-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
                <address className="not-italic leading-relaxed">
                  {siteConfig.business.address.street},<br />
                  {siteConfig.business.address.village}, {siteConfig.business.address.post},<br />
                  {siteConfig.business.address.district} District,<br />
                  Tamil Nadu {siteConfig.business.address.pincode}, India
                </address>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <Phone className="w-4 h-4 text-gold-400 flex-shrink-0" />
                <a href={`tel:${siteConfig.business.phoneNumeric}`} className="hover:text-gold-300 font-medium">
                  {siteConfig.business.phoneDisplay}
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gold-400 flex-shrink-0" />
                <a href={`mailto:${siteConfig.business.email}`} className="hover:text-gold-300">
                  {siteConfig.business.emailDisplay}
                </a>
              </div>

              <div className="pt-2">
                <a
                  href={siteConfig.business.address.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gold-400 hover:text-white uppercase tracking-wider"
                >
                  <span>Open in Google Maps</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle Gold Motif Divider */}
        <GoldDivider variant="motif" theme="dark" className="!my-8" />

        {/* Bottom Legal & Copyright Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-ivory-400 gap-4 font-sans">
          <div>
            © {currentYear} {siteConfig.business.name} (PVS). Pattu Saree Manufacturer, Panjakalipatti, Kalipatti, Tamil Nadu.
          </div>
          <div className="flex items-center space-x-6 text-[11px]">
            <span className="text-gold-400 font-semibold">Wholesale & Retail Available</span>
            <span className="text-heritage-brown-700">•</span>
            <Link href="/wholesale" className="hover:text-gold-300 transition-colors">
              Wholesale Enquiries
            </Link>
            <span className="text-heritage-brown-700">•</span>
            <Link href="/contact" className="hover:text-gold-300 transition-colors">
              Visit Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

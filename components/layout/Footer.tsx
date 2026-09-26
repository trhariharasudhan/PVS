import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { MapPin, Phone, Mail, Instagram, Clock, ShieldCheck } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-heritage-brown-900 text-ivory-200 font-sans border-t-2 border-gold-500/40 relative overflow-hidden">
      {/* Subtle Zari Background Pattern */}
      <div className="absolute inset-0 bg-zari-pattern opacity-10 pointer-events-none" />

      {/* Top Banner: Manufacturing Assurance */}
      <div className="border-b border-heritage-brown-800 bg-heritage-brown-950/60 py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div className="w-10 h-10 rounded-[4px] bg-gold-500/15 border border-gold-400/40 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h4 className="font-serif text-ivory-50 text-sm font-semibold tracking-wide">
                Direct Loom Manufacturing
              </h4>
              <p className="text-xs text-ivory-300 mt-1 font-sans">
                Authentic silk saree production directly from master weavers in Tamil Nadu.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div className="w-10 h-10 rounded-[4px] bg-gold-500/15 border border-gold-400/40 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h4 className="font-serif text-ivory-50 text-sm font-semibold tracking-wide">
                Wholesale & Boutique Supply
              </h4>
              <p className="text-xs text-ivory-300 mt-1 font-sans">
                Custom weaving runs, bulk orders, and bespoke colorways for retail brands.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div className="w-10 h-10 rounded-[4px] bg-gold-500/15 border border-gold-400/40 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h4 className="font-serif text-ivory-50 text-sm font-semibold tracking-wide">
                Instant WhatsApp Consultation
              </h4>
              <p className="text-xs text-ivory-300 mt-1 font-sans">
                Direct inquiry, live stock video calls, and instant price quotations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand Identity & Summary */}
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-1">
              <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-widest text-gold-400">
                PVS SILK S
              </h3>
              <p className="text-[10px] uppercase tracking-widest text-gold-300 font-semibold font-sans">
                Silk Saree Manufacturer • Tamil Nadu
              </p>
            </div>
            <p className="text-xs sm:text-sm text-ivory-300/90 leading-relaxed max-w-sm font-sans">
              PVS Silk S is an authentic silk saree manufacturing enterprise dedicated to
              preserving the timeless heritage of South Indian handlooms through precision
              weaving, pure mulberry silk, and honest craftsmanship.
            </p>

            <div className="pt-2">
              <WhatsAppButton
                size="sm"
                variant="heritage"
                label="Direct WhatsApp Enquiry"
                message={siteConfig.whatsappTemplates.general}
              />
            </div>
          </div>

          {/* Quick Navigation Links */}
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
                  Saree Collections
                </Link>
              </li>
              <li>
                <Link href="/manufacturing" className="hover:text-gold-300 transition-colors">
                  The Loom & Manufacturing
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-gold-300 transition-colors">
                  About Our Heritage
                </Link>
              </li>
              <li>
                <Link href="/wholesale" className="hover:text-gold-300 transition-colors">
                  Wholesale & B2B Orders
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-gold-300 transition-colors">
                  Contact & Showroom
                </Link>
              </li>
            </ul>
          </div>

          {/* Saree Collections */}
          <div>
            <h4 className="font-serif text-sm uppercase tracking-widest text-gold-400 font-semibold mb-4 border-b border-heritage-brown-800 pb-2">
              Collections
            </h4>
            <ul className="space-y-2.5 text-xs font-sans">
              <li>
                <Link href="/collections?category=pure-silk" className="hover:text-gold-300 transition-colors">
                  Kanchipuram Pure Silk
                </Link>
              </li>
              <li>
                <Link href="/collections?category=bridal" className="hover:text-gold-300 transition-colors">
                  Bridal & Wedding Silk
                </Link>
              </li>
              <li>
                <Link href="/collections?category=traditional" className="hover:text-gold-300 transition-colors">
                  Temple Korvai Weaves
                </Link>
              </li>
              <li>
                <Link href="/collections?category=soft-silk" className="hover:text-gold-300 transition-colors">
                  Lightweight Soft Silk
                </Link>
              </li>
              <li>
                <Link href="/collections?category=new-arrivals" className="hover:text-gold-300 transition-colors">
                  New Loom Releases
                </Link>
              </li>
            </ul>
          </div>

          {/* Business & Manufacturing Hub */}
          <div className="space-y-3 font-sans">
            <h4 className="font-serif text-sm uppercase tracking-widest text-gold-400 font-semibold mb-4 border-b border-heritage-brown-800 pb-2">
              Manufacturing Unit
            </h4>
            <div className="space-y-3 text-xs text-ivory-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
                <span>{siteConfig.business.address.full}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-gold-400 flex-shrink-0" />
                <a href={`tel:${siteConfig.business.phone}`} className="hover:text-gold-300">
                  {siteConfig.business.phoneDisplay}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gold-400 flex-shrink-0" />
                <a href={`mailto:${siteConfig.business.email}`} className="hover:text-gold-300">
                  {siteConfig.business.emailDisplay}
                </a>
              </div>
              <div className="flex items-center gap-2.5 pt-1">
                <Instagram className="w-4 h-4 text-gold-400 flex-shrink-0" />
                <a
                  href={siteConfig.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold-300 text-gold-400 font-medium"
                >
                  {siteConfig.social.instagramHandle}
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
            © {currentYear} {siteConfig.business.name}. All Rights Reserved. Woven with devotion in Tamil Nadu, India.
          </div>
          <div className="flex items-center space-x-6 text-[11px]">
            <Link href="/about" className="hover:text-gold-300 transition-colors">
              Brand Story
            </Link>
            <span className="text-heritage-brown-700">•</span>
            <Link href="/wholesale" className="hover:text-gold-300 transition-colors">
              Wholesale Terms
            </Link>
            <span className="text-heritage-brown-700">•</span>
            <Link href="/contact" className="hover:text-gold-300 transition-colors">
              Showroom Location
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

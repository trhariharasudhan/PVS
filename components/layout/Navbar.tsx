"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { Menu, X, Phone, MapPin, Search, ShieldCheck } from "lucide-react";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Top Heritage Announcement Strip */}
      <header className="bg-heritage-brown-900 text-ivory-100 text-[11px] py-1.5 px-4 border-b border-gold-500/30 hidden sm:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center tracking-wider font-sans">
          <div className="flex items-center gap-3 text-gold-300 font-medium">
            <span>✦ Woven with Tradition</span>
            <span className="text-gold-500/60">|</span>
            <span>Crafted with Devotion</span>
            <span className="text-gold-500/60">|</span>
            <span>Draped with Pride ✦</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-ivory-300 text-[10px] uppercase tracking-widest">
              Direct Loom Showroom: {siteConfig.business.location}
            </span>
            <span className="text-gold-500/60">|</span>
            <Link
              href="/wholesale"
              className="text-gold-300 hover:text-gold-100 font-semibold transition-colors flex items-center gap-1 text-[11px]"
            >
              <span>Wholesale / Dealer Enquiry</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Sticky Navbar (Warm Ivory Background with Heritage Brown Typography & Antique Gold Borders) */}
      <nav
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-ivory-50/98 backdrop-blur-md shadow-luxury border-b border-gold-400/50 py-3.5"
            : "bg-ivory-50 border-b border-gold-300/60 py-4 sm:py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Identity / Logo */}
          <Link href="/" className="group flex flex-col">
            <span className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold tracking-widest text-heritage-brown-950 group-hover:text-silk-red-700 transition-colors">
              PVS SILK S
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase font-sans tracking-widest text-gold-700 font-semibold -mt-0.5">
              Silk Saree Manufacturer • Tamil Nadu
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-8">
            {siteConfig.navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs uppercase tracking-widest font-semibold transition-all relative py-1 ${
                    isActive
                      ? "text-silk-red-700 font-bold"
                      : "text-heritage-brown-800 hover:text-silk-red-700"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Action: Search / WhatsApp / Dealer Access */}
          <div className="flex items-center gap-3">
            <Link
              href="/collections"
              className="hidden md:flex p-2 text-heritage-brown-700 hover:text-silk-red-700 hover:bg-gold-50 rounded-[4px] transition-colors"
              title="Search Saree Archive"
            >
              <Search className="w-4 h-4 text-gold-700" />
            </Link>

            <WhatsAppButton
              size="sm"
              variant="primary"
              label="Enquire on WhatsApp"
              message={siteConfig.whatsappTemplates.general}
              className="hidden sm:inline-flex"
            />

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-heritage-brown-800 hover:text-silk-red-700 hover:bg-gold-50 rounded-[4px] transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500"
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-between bg-ivory-50 text-heritage-brown-900 p-6 overflow-y-auto animate-fade-in-subtle">
          <div>
            {/* Drawer Header */}
            <div className="flex justify-between items-center pb-6 border-b border-gold-200">
              <div>
                <div className="font-serif text-2xl font-bold tracking-widest text-heritage-brown-950">
                  PVS SILK S
                </div>
                <div className="text-[10px] uppercase tracking-widest text-gold-700 font-semibold">
                  Silk Saree Manufacturer • Tamil Nadu
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-heritage-brown-700 hover:text-heritage-brown-950 rounded-full bg-ivory-100 border border-gold-200"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Drawer Links */}
            <div className="flex flex-col space-y-3 py-6">
              {siteConfig.navLinks.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-base font-serif tracking-wider py-2.5 flex items-center justify-between border-b border-ivory-200 ${
                      isActive
                        ? "text-silk-red-700 font-bold pl-2 border-l-2 border-l-silk-red-700"
                        : "text-heritage-brown-800 hover:text-silk-red-700"
                    }`}
                  >
                    <span>{link.label}</span>
                    <span className="text-xs text-gold-600 font-sans">→</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Drawer Footer & Quick Contact */}
          <div className="pt-6 border-t border-gold-200 space-y-4">
            <WhatsAppButton
              size="lg"
              variant="primary"
              label="Enquire on WhatsApp"
              message={siteConfig.whatsappTemplates.general}
              className="w-full justify-center"
            />
            <div className="text-center text-xs text-heritage-brown-600 font-sans space-y-1">
              <p>Direct Manufacturer Showroom & Looms</p>
              <p className="text-gold-700 font-semibold">{siteConfig.business.phoneDisplay}</p>
              <p>{siteConfig.business.location}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

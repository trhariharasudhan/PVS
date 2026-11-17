"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { useCart } from "@/context/CartContext";
import { Menu, X, ShoppingBag, MessageCircle, Phone, MapPin } from "lucide-react";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { itemCount, openCart } = useCart();

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
      {/* Top Announcement Strip */}
      <header className="bg-heritage-brown-950 text-ivory-100 text-[11px] py-1.5 px-4 border-b border-gold-500/30">
        <div className="max-w-7xl mx-auto flex justify-between items-center tracking-wider font-sans">
          <div className="flex items-center gap-2 sm:gap-3 text-gold-300 font-medium">
            <span className="font-semibold text-white tracking-widest uppercase">
              Wholesale & Retail Available
            </span>
            <span className="text-gold-500/60 hidden md:inline">|</span>
            <span className="text-ivory-300 hidden md:inline">
              Raaja Veedhi, Panjakalipatti, Kalipatti, Salem
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <a
              href={`tel:${siteConfig.business.phoneNumeric}`}
              className="text-ivory-300 hover:text-gold-300 transition-colors flex items-center gap-1"
            >
              <Phone className="w-3 h-3 text-gold-400" />
              <span>{siteConfig.business.phoneDisplay}</span>
            </a>
            <span className="text-gold-500/60 hidden sm:inline">|</span>
            <Link
              href="/wholesale"
              className="text-gold-300 hover:text-white font-semibold transition-colors hidden sm:inline"
            >
              Wholesale Enquiry
            </Link>
          </div>
        </div>
      </header>

      {/* Main Sticky Navbar */}
      <nav
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-ivory-50/95 backdrop-blur-md shadow-luxury border-b border-gold-400/50 py-3"
            : "bg-ivory-50 border-b border-gold-300/60 py-3.5 sm:py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Identity / Logo */}
          <Link href="/" className="group flex flex-col">
            <span className="font-serif text-2xl sm:text-3xl font-bold tracking-widest text-heritage-brown-950 group-hover:text-silk-red-700 transition-colors">
              PVS
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase font-sans tracking-widest text-gold-700 font-semibold -mt-0.5">
              Pattu Saree Manufacturer • Salem
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden xl:flex items-center space-x-6 2xl:space-x-8">
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

          {/* Right Action Icons: Cart & WhatsApp */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Button with live Badge */}
            <button
              onClick={openCart}
              className="relative p-2.5 bg-white hover:bg-gold-50 text-heritage-brown-900 border border-gold-300 rounded-[4px] shadow-sm transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-gold-500"
              aria-label={`Shopping cart with ${itemCount} items`}
            >
              <ShoppingBag className="w-4 h-4 text-silk-red-700" />
              <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider">
                Cart
              </span>
              {itemCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-silk-red-700 rounded-full font-mono">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Direct WhatsApp Button */}
            <a
              href={`https://wa.me/${siteConfig.business.whatsapp}?text=${encodeURIComponent(
                siteConfig.whatsappTemplates.general()
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-silk-red-700 hover:bg-deep-maroon-800 text-ivory-50 text-xs font-semibold px-3 sm:px-4 py-2.5 rounded-[4px] border border-silk-red-700 shadow-sm transition-all"
              aria-label="Chat with PVS on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-gold-300" />
              <span className="hidden sm:inline uppercase tracking-wider">WhatsApp</span>
            </a>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 text-heritage-brown-800 hover:text-silk-red-700 hover:bg-gold-50 rounded-[4px] transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500"
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
        <div className="fixed inset-0 z-50 xl:hidden flex flex-col justify-between bg-ivory-50 text-heritage-brown-900 p-6 overflow-y-auto animate-fade-in-subtle">
          <div>
            {/* Drawer Header */}
            <div className="flex justify-between items-center pb-6 border-b border-gold-200">
              <div>
                <div className="font-serif text-3xl font-bold tracking-widest text-heritage-brown-950">
                  PVS
                </div>
                <div className="text-[10px] uppercase tracking-widest text-gold-700 font-semibold">
                  Pattu Saree Manufacturer • Salem
                </div>
                <div className="text-[9px] text-silk-red-700 font-semibold tracking-wider mt-0.5">
                  Wholesale & Retail Available
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
            <div className="flex flex-col space-y-2 py-6">
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
          <div className="pt-6 border-t border-gold-200 space-y-3">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                openCart();
              }}
              className="w-full inline-flex items-center justify-center gap-2 bg-white text-heritage-brown-900 border border-gold-400 py-3 rounded-[4px] font-semibold text-xs uppercase tracking-wider"
            >
              <ShoppingBag className="w-4 h-4 text-silk-red-700" />
              <span>View Shopping Cart ({itemCount})</span>
            </button>

            <a
              href={`https://wa.me/${siteConfig.business.whatsapp}?text=${encodeURIComponent(
                siteConfig.whatsappTemplates.general()
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-silk-red-700 text-ivory-50 py-3 rounded-[4px] font-semibold text-xs uppercase tracking-wider shadow-sm"
            >
              <MessageCircle className="w-4 h-4 text-gold-300" />
              <span>WhatsApp Us: +91 99651 76136</span>
            </a>

            <div className="text-center text-xs text-heritage-brown-600 font-sans space-y-0.5 pt-2">
              <p className="font-semibold text-heritage-brown-900">
                PVS — Owner: {siteConfig.business.owner}
              </p>
              <p className="text-[11px] text-heritage-brown-700">
                Raaja Veedhi, Panjakalipatti, Kalipatti, Tamil Nadu 636455
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

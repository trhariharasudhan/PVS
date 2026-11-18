"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, MessageCircle, Phone, Search, X } from "lucide-react";
import { siteConfig } from "@/config/site";

const WHATSAPP_MSG = "Hello PVS, I'd like to enquire about a custom silk saree order.";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const menuPanel = useRef<HTMLDivElement>(null);

  // Shrink after scrolling; hide while scrolling down, reveal on scroll up.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      setHidden(y > 160 && y > lastY.current + 4);
      if (y < lastY.current - 4) setHidden(false);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  // Closed menu must not be focusable (inert isn't in React 18's types, so set it directly).
  useEffect(() => {
    const el = menuPanel.current;
    if (!el) return;
    if (open) el.removeAttribute("inert");
    else el.setAttribute("inert", "");
  }, [open]);

  // Mobile menu: lock page scroll, close on Escape, return focus to the button.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const btn = menuBtn.current;
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      btn?.focus();
    };
  }, [open]);

  const wa = `https://wa.me/${siteConfig.business.whatsapp}?text=${encodeURIComponent(WHATSAPP_MSG)}`;

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-ivory-50 focus:text-heritage-brown-950 focus:px-4 focus:py-2 focus:rounded"
      >
        Skip to content
      </a>

      <header
        className={`sticky top-0 z-50 transition-transform duration-500 ease-out ${hidden && !open ? "-translate-y-full" : "translate-y-0"}`}
      >
        {/* Utility strip */}
        <div
          className={`bg-heritage-brown-950 text-ivory-200 text-[11px] tracking-wide overflow-hidden transition-[max-height] duration-500 ${
            scrolled ? "max-h-0" : "max-h-10"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between gap-4">
            <p className="truncate">
              <span className="text-gold-300 font-semibold">Woven to order</span>
              <span className="hidden sm:inline text-ivory-300"> · Silk sarees from our looms in Salem district</span>
            </p>
            <div className="flex items-center gap-4 shrink-0">
              <Link href="/order-status" className="hidden sm:inline-flex items-center gap-1 hover:text-gold-300 transition-colors">
                <Search className="w-3 h-3" aria-hidden="true" /> Track your order
              </Link>
              <a href={`tel:+${siteConfig.business.phoneNumeric}`} className="inline-flex items-center gap-1 hover:text-gold-300 transition-colors">
                <Phone className="w-3 h-3 text-gold-400" aria-hidden="true" />
                {siteConfig.business.phoneDisplay}
              </a>
            </div>
          </div>
        </div>

        {/* Main bar */}
        <div className="px-3 sm:px-5 pt-2">
          <nav
            aria-label="Main"
            className={`max-w-7xl mx-auto flex items-center justify-between gap-4 rounded-2xl border transition-all duration-500 ${
              scrolled
                ? "bg-ivory-50/85 backdrop-blur-xl border-gold-400/30 shadow-[0_8px_30px_-12px_rgba(43,24,18,0.35)] px-4 sm:px-5 py-2.5"
                : "bg-ivory-50/95 backdrop-blur border-gold-400/20 px-4 sm:px-6 py-3"
            }`}
          >
            {/* Wordmark */}
            <Link href="/" className="group flex items-baseline gap-2 shrink-0" aria-label="PVS Silks — home">
              <span className="font-serif text-2xl sm:text-[1.7rem] font-semibold tracking-[0.08em] text-heritage-brown-950">PVS</span>
              <span className="flex flex-col leading-none">
                <span className="text-[10px] font-semibold tracking-[0.32em] text-silk-red-700">SILKS</span>
                <span className="font-tamil text-[10px] text-gold-700 mt-0.5" lang="ta">
                  பட்டு
                </span>
              </span>
            </Link>

            {/* Desktop links */}
            <ul className="hidden lg:flex items-center gap-1">
              {siteConfig.navLinks.map((l) => {
                const active = isActive(pathname, l.href);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      aria-current={active ? "page" : undefined}
                      className={`relative px-3 py-2 text-[13px] font-medium tracking-wide transition-colors after:absolute after:left-3 after:right-3 after:-bottom-0.5 after:h-px after:origin-left after:bg-silk-red-700 after:transition-transform after:duration-300 ${
                        active
                          ? "text-silk-red-700 after:scale-x-100"
                          : "text-heritage-brown-800 hover:text-silk-red-700 after:scale-x-0 hover:after:scale-x-100"
                      }`}
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with PVS on WhatsApp"
                className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold-400/40 text-heritage-brown-900 hover:bg-heritage-brown-950 hover:text-gold-300 transition-colors"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
              </a>
              <Link
                href="/custom-order"
                className="group hidden sm:inline-flex items-center gap-2 rounded-full bg-silk-red-700 hover:bg-heritage-brown-950 text-ivory-50 pl-5 pr-4 py-2.5 text-[12px] font-semibold tracking-[0.12em] uppercase transition-colors"
              >
                Start Custom Order
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </Link>
              <button
                ref={menuBtn}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="mobile-menu"
                aria-label={open ? "Close menu" : "Open menu"}
                className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold-400/40 text-heritage-brown-950"
              >
                {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile full-screen menu */}
      <div
        id="mobile-menu"
        ref={menuPanel}
        className={`lg:hidden fixed inset-0 z-40 bg-heritage-brown-950 text-ivory-50 transition-[clip-path] duration-700 ease-[cubic-bezier(0.77,0,0.18,1)] ${
          open ? "[clip-path:circle(150%_at_100%_0)]" : "[clip-path:circle(0%_at_100%_0)] pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div className="h-full overflow-y-auto pt-28 pb-10 px-6 flex flex-col">
          <ul className="space-y-1">
            {siteConfig.navLinks.map((l, i) => (
              <li
                key={l.href}
                style={{ transitionDelay: open ? `${120 + i * 60}ms` : "0ms" }}
                className={`transition-all duration-500 ${open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              >
                <Link
                  href={l.href}
                  aria-current={isActive(pathname, l.href) ? "page" : undefined}
                  className={`block py-2 font-serif text-4xl ${isActive(pathname, l.href) ? "text-gold-300" : "text-ivory-50"}`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className={`transition-all duration-500 delay-500 ${open ? "opacity-100" : "opacity-0"}`}>
              <Link href="/order-status" className="block py-2 text-sm tracking-widest uppercase text-gold-300">
                Track your order →
              </Link>
            </li>
          </ul>
          <div className={`mt-auto pt-10 space-y-3 transition-opacity duration-500 delay-500 ${open ? "opacity-100" : "opacity-0"}`}>
            <Link
              href="/custom-order"
              className="flex items-center justify-center gap-2 rounded-full bg-gold-500 text-heritage-brown-950 py-4 text-sm font-semibold tracking-widest uppercase"
            >
              Start Custom Order <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <div className="grid grid-cols-2 gap-3">
              <a href={`tel:+${siteConfig.business.phoneNumeric}`} className="flex items-center justify-center gap-2 rounded-full border border-ivory-200/30 py-3 text-sm">
                <Phone className="w-4 h-4" aria-hidden="true" /> Call
              </a>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-full border border-ivory-200/30 py-3 text-sm">
                <MessageCircle className="w-4 h-4" aria-hidden="true" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

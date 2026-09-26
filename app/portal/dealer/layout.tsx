"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { getDealerProfile, getDealerCredit, logoutStaff } from "@/lib/api";
import { DealerProfile, DealerCreditSummary } from "@/lib/api/dealer";
import { siteConfig } from "@/config/site";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  CreditCard,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Loader2,
  Building2,
} from "lucide-react";

interface DealerLayoutProps {
  children: React.ReactNode;
}

export default function DealerLayout({ children }: DealerLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<DealerProfile | null>(null);
  const [credit, setCredit] = useState<DealerCreditSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    async function verifyAuth() {
      try {
        const [p, c] = await Promise.all([
          getDealerProfile(),
          getDealerCredit().catch(() => null),
        ]);
        setProfile(p);
        setCredit(c);
      } catch (err) {
        console.warn("Unauthenticated dealer portal access:", err);
        router.push("/admin/login");
      } finally {
        setIsLoading(false);
      }
    }

    verifyAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logoutStaff();
      router.push("/admin/login");
    } catch (err) {
      console.error("Logout failed:", err);
      router.push("/admin/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/portal/dealer", icon: LayoutDashboard },
    { label: "Wholesale Catalogue", href: "/portal/dealer/products", icon: Package },
    { label: "My Orders", href: "/portal/dealer/orders", icon: ShoppingBag },
    { label: "Credit & Ledger", href: "/portal/dealer/ledger", icon: CreditCard },
    { label: "Merchant Profile", href: "/portal/dealer/profile", icon: Building2 },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-[4px] shadow-luxury border border-gold-300">
          <Loader2 className="w-8 h-8 animate-spin text-silk-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-serif font-bold text-heritage-brown-950">Authenticating Dealer Portal</h2>
          <p className="text-xs text-heritage-brown-600 mt-1 font-sans">Verifying merchant credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col md:flex-row">
      {/* Sidebar for Desktop (Heritage Brown #2B1812) */}
      <aside className="hidden md:flex md:w-64 flex-col bg-heritage-brown-900 text-ivory-100 border-r border-gold-500/25">
        <div className="p-6 border-b border-heritage-brown-800">
          <div className="flex items-center gap-2">
            <span className="font-serif text-xl tracking-wider font-bold text-gold-400">
              {siteConfig.name}
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-gold-300 mt-1 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> B2B Trade Desk
          </p>
        </div>

        {/* Dealer Account Header */}
        <div className="p-4 bg-heritage-brown-950/60 border-b border-heritage-brown-800">
          <p className="text-[10px] text-gold-400 uppercase tracking-wider font-semibold">Wholesale Merchant</p>
          <p className="text-sm font-semibold text-ivory-50 truncate mt-0.5">{profile?.company_name || profile?.full_name}</p>
          {credit && (
            <div className="mt-2 pt-2 border-t border-heritage-brown-800 flex items-center justify-between text-xs">
              <span className="text-ivory-400">Available Credit:</span>
              <span className="font-bold text-gold-300">
                INR {credit.available_credit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items (Active: Silk Red #8B1E2D, Indicator: Antique Gold #B08A3C) */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/portal/dealer" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[4px] text-xs font-semibold uppercase tracking-wider transition-colors ${
                  isActive
                    ? "bg-silk-red-600 text-ivory-50 border-l-4 border-gold-400 font-bold shadow-sm"
                    : "text-ivory-300 hover:bg-heritage-brown-800 hover:text-gold-300"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-gold-300" : "text-ivory-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-heritage-brown-800 bg-heritage-brown-950/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-[4px] bg-silk-red-600 flex items-center justify-center text-ivory-50 font-bold text-xs border border-gold-500/40">
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : "D"}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-ivory-100 truncate">{profile?.full_name}</p>
                <p className="text-[10px] text-ivory-400 truncate">{profile?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Sign Out"
              className="p-1.5 text-ivory-400 hover:text-gold-300 hover:bg-heritage-brown-800 rounded transition-colors"
            >
              {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area (Warm Ivory #FBF8F1) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-heritage-brown-900 text-ivory-100 p-4 flex items-center justify-between border-b border-gold-500/20">
          <span className="font-serif text-lg font-bold text-gold-400">{siteConfig.name}</span>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-ivory-300 hover:text-white"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-heritage-brown-900 text-ivory-100 border-b border-heritage-brown-800 p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-[4px] text-xs font-semibold uppercase tracking-wider hover:bg-heritage-brown-800 text-ivory-200"
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-[4px] text-xs font-semibold uppercase tracking-wider text-silk-red-300 hover:bg-heritage-brown-800 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        )}

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

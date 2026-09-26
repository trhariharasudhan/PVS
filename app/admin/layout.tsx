"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentStaff, logoutStaff } from "@/lib/api";
import { UserPublic } from "@/types";
import { siteConfig } from "@/config/site";
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ShoppingBag,
  Store,
  Factory,
  Truck,
  Scissors,
  FileText,
  CreditCard,
  Receipt,
  TrendingUp,
  BarChart3,
  Settings,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Loader2,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setIsLoading(false);
      return;
    }

    async function verifyAuth() {
      try {
        const staff = await getCurrentStaff();
        setCurrentUser(staff);
      } catch (err) {
        console.warn("Unauthenticated admin layout access:", err);
        router.push("/admin/login");
      } finally {
        setIsLoading(false);
      }
    }

    verifyAuth();
  }, [pathname, isLoginPage, router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutStaff();
      router.push("/admin/login");
    } catch {
      router.push("/admin/login");
    }
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-burgundy-900 animate-spin mx-auto" />
          <p className="font-serif text-sm font-semibold text-burgundy-950">
            Verifying Staff Authorization...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      active: pathname === "/admin",
      enabled: true,
    },
    {
      name: "Products",
      href: "/admin/products",
      icon: Package,
      active: pathname.startsWith("/admin/products"),
      enabled: true,
    },
    {
      name: "Categories",
      href: "/admin/categories",
      icon: Layers,
      active: pathname.startsWith("/admin/categories"),
      enabled: true,
    },
    {
      name: "Inventory",
      href: "/admin/inventory",
      icon: Boxes,
      active: pathname.startsWith("/admin/inventory"),
      enabled: true,
    },
    {
      name: "Loom Production",
      href: "/admin/production",
      icon: Factory,
      active: pathname.startsWith("/admin/production"),
      enabled: true,
    },
    {
      name: "Orders",
      href: "/admin/orders",
      icon: ShoppingBag,
      active: pathname.startsWith("/admin/orders"),
      enabled: true,
    },
    {
      name: "Wholesale CRM",
      href: "/admin/wholesale",
      icon: Store,
      active: pathname.startsWith("/admin/wholesale"),
      enabled: true,
    },
    {
      name: "Suppliers",
      href: "/admin/suppliers",
      icon: Truck,
      active: pathname.startsWith("/admin/suppliers"),
      enabled: true,
    },
    {
      name: "Raw Materials",
      href: "/admin/raw-materials",
      icon: Scissors,
      active: pathname.startsWith("/admin/raw-materials"),
      enabled: true,
    },
    {
      name: "Purchasing",
      href: "/admin/purchases",
      icon: FileText,
      active: pathname.startsWith("/admin/purchases"),
      enabled: true,
    },
    {
      name: "Payments",
      href: "/admin/payments",
      icon: CreditCard,
      active: pathname.startsWith("/admin/payments"),
      enabled: true,
    },
    {
      name: "Invoices & Billing",
      href: "/admin/invoices",
      icon: Receipt,
      active: pathname.startsWith("/admin/invoices"),
      enabled: true,
    },
    {
      name: "Finance Desk",
      href: "/admin/finance",
      icon: TrendingUp,
      active: pathname.startsWith("/admin/finance"),
      enabled: true,
    },
    {
      name: "Business Reports",
      href: "/admin/reports",
      icon: BarChart3,
      active: pathname.startsWith("/admin/reports"),
      enabled: true,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      active: pathname.startsWith("/admin/settings"),
      enabled: false,
      badge: "Phase 4D",
    },
  ];

  const roleBadgeStyle: Record<string, string> = {
    SUPER_ADMIN: "bg-burgundy-900 text-gold-300 ring-1 ring-gold-400/50",
    FACTORY_MANAGER: "bg-amber-800 text-amber-100 ring-1 ring-amber-400/50",
    SALES_ADMIN: "bg-emerald-900 text-emerald-100 ring-1 ring-emerald-400/50",
    DEALER: "bg-charcoal-800 text-charcoal-100",
  };

  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col md:flex-row text-charcoal-900">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:w-64 bg-burgundy-950 text-ivory-100 flex-col border-r border-gold-500/30 shrink-0">
        {/* Brand Header */}
        <div className="p-6 border-b border-gold-500/20">
          <Link href="/admin" className="block">
            <span className="font-serif text-xl font-bold tracking-wider text-gold-200 block">
              {siteConfig.name}
            </span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-gold-500 block mt-0.5 font-mono">
              Admin Operations
            </span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (!item.enabled) {
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between px-3 py-2.5 rounded-sm text-xs text-charcoal-400 opacity-60 cursor-not-allowed select-none"
                  title="Coming in Phase 4C"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-charcoal-500" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-burgundy-900/60 text-gold-400/80 rounded font-mono">
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-sm text-xs font-medium transition-all ${
                  item.active
                    ? "bg-gold-500/20 text-gold-200 border-l-2 border-gold-400 font-semibold"
                    : "text-ivory-200 hover:bg-burgundy-900/70 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      item.active ? "text-gold-300" : "text-gold-500/70"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Public Website Link */}
        <div className="p-4 border-t border-gold-500/20">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 bg-burgundy-900/60 hover:bg-burgundy-900 text-gold-300 rounded-sm text-xs transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Storefront</span>
            </span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-gold-300/80 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-charcoal-700 hover:text-burgundy-950 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <span className="font-serif text-sm font-semibold text-burgundy-950 hidden sm:inline">
              Operations Control Desk
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Staff User Identity */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gold-100 border border-gold-300 flex items-center justify-center text-burgundy-950">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-semibold text-charcoal-900 leading-tight">
                  {currentUser.full_name}
                </span>
                <span className="block text-[10px] text-charcoal-500 font-mono">
                  {currentUser.email}
                </span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold uppercase tracking-wider ${
                  roleBadgeStyle[currentUser.role] || "bg-charcoal-700 text-white"
                }`}
              >
                {currentUser.role}
              </span>
            </div>

            {/* Logout Trigger */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ivory-100 hover:bg-red-50 text-charcoal-700 hover:text-red-700 border border-gold-300 rounded-sm text-xs font-medium transition-all disabled:opacity-60"
              title="Sign out of current staff session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isLoggingOut ? "Signing Out..." : "Sign Out"}
              </span>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-burgundy-950 text-ivory-100 px-4 py-6 space-y-2 border-b border-gold-500/30">
            {navItems.map((item) => {
              const Icon = item.icon;
              return item.enabled ? (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-sm text-xs font-medium ${
                    item.active
                      ? "bg-gold-500/20 text-gold-200 border-l-2 border-gold-400"
                      : "text-ivory-200 hover:bg-burgundy-900"
                  }`}
                >
                  <Icon className="w-4 h-4 text-gold-400" />
                  <span>{item.name}</span>
                </Link>
              ) : (
                <div
                  key={item.name}
                  className="flex items-center justify-between px-3 py-2 text-xs text-charcoal-400 opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-burgundy-900 text-gold-400 rounded">
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })}
            <div className="pt-4 border-t border-gold-500/20">
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-2 text-xs text-gold-300 py-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Visit Public Storefront</span>
              </Link>
            </div>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

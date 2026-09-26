"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginStaff } from "@/lib/api";
import { siteConfig } from "@/config/site";
import { Lock, Mail, Loader2, AlertCircle, ShieldCheck, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both your staff email and password.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await loginStaff(email.trim(), password);
      router.push("/admin");
    } catch (err: any) {
      console.error("Login failure:", err);
      setError(err?.message || "Invalid credentials. Please verify your staff email and password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 bg-zari-pattern opacity-10 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="inline-block group">
            <span className="font-serif text-2xl sm:text-3xl font-bold tracking-wider text-burgundy-950 block">
              {siteConfig.name}
            </span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-gold-600 block mt-0.5">
              Internal Staff Portal
            </span>
          </Link>
          <h2 className="mt-6 text-center font-serif text-xl sm:text-2xl font-bold tracking-tight text-charcoal-900">
            Sign In to Admin Workspace
          </h2>
          <p className="mt-1 text-center text-xs text-charcoal-500">
            Authorized personnel only. Access is monitored and logged.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="mt-8 bg-white py-8 px-6 sm:px-10 shadow-luxury border border-gold-300/80 rounded-sm">
          {error && (
            <div className="mb-6 p-3.5 bg-red-50/90 border border-red-200 rounded-sm flex items-start gap-2.5 text-xs text-red-800 animate-fade-in-subtle">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1"
              >
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="admin@pvssilks.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-ivory-50/60 border border-gold-300/80 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 focus:bg-white text-charcoal-900 placeholder:text-charcoal-400"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-ivory-50/60 border border-gold-300/80 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 focus:bg-white text-charcoal-900 placeholder:text-charcoal-400"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-widest py-3.5 rounded-sm shadow transition-all disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating Session...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>AUTHENTICATE & ENTER</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gold-200 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-charcoal-500 hover:text-burgundy-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Homepage</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

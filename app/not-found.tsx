import React from "react";
import Link from "next/link";
import { ArrowLeft, Home, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4 py-20 bg-ivory-50 text-charcoal-900">
      <div className="w-16 h-16 rounded-full bg-gold-100 border border-gold-300/80 flex items-center justify-center text-burgundy-900 mb-6">
        <Sparkles className="w-8 h-8 text-gold-700" />
      </div>

      <span className="text-xs font-mono tracking-widest uppercase text-gold-700 font-bold">
        Error 404
      </span>

      <h1 className="font-serif text-3xl sm:text-5xl font-bold text-burgundy-950 mt-2">
        Page Not Found
      </h1>

      <p className="text-xs sm:text-sm text-charcoal-600 max-w-md mx-auto mt-3 font-sans leading-relaxed">
        The page or saree collection you are looking for has been moved, renamed, or is currently
        being re-woven on our looms.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 px-6 py-3 text-xs uppercase tracking-widest font-semibold rounded-sm shadow transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
        <Link
          href="/collections"
          className="inline-flex items-center gap-2 bg-white hover:bg-gold-50 text-charcoal-800 border border-gold-300 px-6 py-3 text-xs uppercase tracking-widest font-semibold rounded-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>View Saree Collections</span>
        </Link>
      </div>
    </div>
  );
}

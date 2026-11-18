import Link from "next/link";
import { ArrowUpRight, Home } from "lucide-react";
import { Kolam } from "@/components/ui/Ornament";
import { getI18n } from "@/i18n/server";

export default function NotFound() {
  const { t } = getI18n();
  const n = t.notFound;
  return (
    <div className="relative min-h-[75vh] flex flex-col items-center justify-center text-center px-4 py-20 bg-ivory-50 bg-weave overflow-hidden">
      <Kolam className="pointer-events-none absolute -right-16 -top-10 w-72 text-gold-400/25" />
      <p className="font-mono text-xs tracking-widest uppercase text-gold-700 font-bold">404</p>
      <h1 className="mt-3 max-w-2xl font-serif text-4xl sm:text-6xl font-medium text-heritage-brown-950 text-balance">{n.title}</h1>
      <p className="mt-4 max-w-md text-heritage-brown-700 leading-relaxed">{n.body}</p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-heritage-brown-950 hover:bg-silk-red-700 text-ivory-50 px-6 py-3.5 text-sm font-semibold transition-colors">
          <Home className="w-4 h-4" aria-hidden="true" /> {n.home}
        </Link>
        <Link href="/custom-order" className="inline-flex items-center gap-2 rounded-full border border-gold-400 px-6 py-3.5 text-sm font-semibold text-heritage-brown-900 hover:bg-gold-50 transition-colors">
          {n.order} <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

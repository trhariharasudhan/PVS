import { BadgeCheck, CircleDollarSign, Handshake, ShieldCheck, Truck } from "lucide-react";
import { getI18n } from "@/i18n/server";

const ICONS = [CircleDollarSign, ShieldCheck, BadgeCheck, Truck, Handshake];

/** Pricing & payment terms confirmed by PVS: price set by PVS, double confirmation, 50/50, bulk negotiable. */
export function PaymentTerms({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  const { t } = getI18n();
  return (
    <div className={`rounded-[2rem] border p-6 sm:p-8 ${dark ? "border-gold-400/30 bg-white/[0.03] text-ivory-50" : "border-gold-300/70 bg-gold-50 text-heritage-brown-950"} ${className}`}>
      <h2 className="font-serif text-2xl sm:text-3xl">{t.terms.title}</h2>
      <ol className="mt-6 grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {t.terms.items.map((item, i) => {
          const Icon = ICONS[i] ?? BadgeCheck;
          return (
            <li key={i} className="flex lg:flex-col gap-3">
              <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${dark ? "bg-gold-500/15 text-gold-300" : "bg-white text-silk-red-700"}`}>
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <p className={`text-sm leading-relaxed ${dark ? "text-ivory-200" : "text-heritage-brown-800"}`}>{item}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

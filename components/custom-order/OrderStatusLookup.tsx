"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Loader2, MessageCircle } from "lucide-react";
import { getCustomOrderStatus, type CustomOrderStatus } from "@/lib/api/customOrders";
import { getWhatsAppLink } from "@/config/site";
import { fmt, useI18n } from "@/i18n/I18nProvider";

/** Customer-facing order journey (cancelled is shown separately). */
const JOURNEY = ["NEW", "CONTACTED", "DESIGN_REVIEW", "QUOTED", "CONFIRMED", "IN_PRODUCTION", "READY", "DELIVERED"] as const;

export function OrderStatusLookup() {
  const { t, locale } = useI18n();
  const st = t.status;
  const params = useSearchParams();
  const [ref, setRef] = useState(params.get("ref") ?? "");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CustomOrderStatus | null>(null);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setData(null);
    if (!/^PVS-[A-Z0-9]{6}$/i.test(ref.trim())) return setError(st.badRef);
    if (phone.replace(/\D/g, "").length < 10) return setError(st.badPhone);
    setLoading(true);
    try {
      setData(await getCustomOrderStatus(ref, phone));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(/fetch|network/i.test(msg) || !msg ? t.common.serverDown : msg);
    } finally {
      setLoading(false);
    }
  };

  const current = data ? JOURNEY.findIndex((k) => k === data.status) : -1;
  const input =
    "w-full rounded-xl border border-heritage-brown-200 bg-white px-4 py-3 text-sm focus:border-silk-red-600 focus:outline-none focus:ring-2 focus:ring-silk-red-600/20";

  return (
    <div className="mt-10">
      <form onSubmit={lookup} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3" noValidate>
        <label className="block">
          <span className="sr-only">{st.ref}</span>
          <input className={`${input} font-mono uppercase`} placeholder="PVS-XXXXXX" value={ref} onChange={(e) => setRef(e.target.value)} />
        </label>
        <label className="block">
          <span className="sr-only">{st.phone}</span>
          <input className={input} type="tel" inputMode="tel" autoComplete="tel" placeholder={st.phone} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-silk-red-700 hover:bg-heritage-brown-950 text-ivory-50 px-6 py-3 text-sm font-semibold disabled:opacity-60">
          {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />} {st.check}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-4 text-sm text-silk-red-700">
          {error}
        </p>
      )}

      {data && (
        <div className="mt-10 rounded-3xl border border-heritage-brown-100 bg-white p-6 sm:p-8" aria-live="polite">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-mono text-lg tracking-widest">{data.reference_code}</p>
            <p className="text-sm text-heritage-brown-600">
              {data.saree_type} × {data.quantity} ·{" "}
              {fmt(st.updated, { date: new Date(data.updated_at).toLocaleDateString(locale === "ta" ? "ta-IN" : "en-IN", { day: "numeric", month: "short" }) })}
            </p>
          </div>
          <p className="mt-4 font-serif text-3xl text-heritage-brown-950">{st.journey[data.status as keyof typeof st.journey] ?? data.status_label}</p>

          {data.status === "CANCELLED" ? (
            <p className="mt-4 text-sm text-heritage-brown-700">{st.cancelled}</p>
          ) : (
            <ol className="mt-8 space-y-0">
              {JOURNEY.map((key, i) => {
                const label = st.journey[key];
                const done = i <= current;
                return (
                  <li key={key} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < JOURNEY.length - 1 && (
                      <span className={`absolute left-[11px] top-6 bottom-0 w-px ${i < current ? "bg-silk-red-700" : "bg-heritage-brown-200"}`} aria-hidden="true" />
                    )}
                    <span
                      className={`relative z-10 h-6 w-6 shrink-0 rounded-full flex items-center justify-center ${
                        done ? "bg-silk-red-700 text-ivory-50" : "border border-heritage-brown-300 bg-white"
                      } ${i === current ? "ring-4 ring-silk-red-700/15" : ""}`}
                    >
                      {done && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                    </span>
                    <span className={`text-sm ${i === current ? "font-semibold text-heritage-brown-950" : done ? "text-heritage-brown-800" : "text-heritage-brown-400"}`}>{label}</span>
                  </li>
                );
              })}
            </ol>
          )}
          <a
            href={getWhatsAppLink(fmt(st.askPhotoMsg, { ref: data.reference_code }))}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-silk-red-700"
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" /> {st.askPhoto}
          </a>
        </div>
      )}
    </div>
  );
}

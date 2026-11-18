"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, MessageCircle, Send } from "lucide-react";
import { getWhatsAppLink } from "@/config/site";
import { submitWholesale, isNetworkError } from "@/lib/api/contact";
import { en } from "@/i18n/dictionaries/en";
import { useI18n } from "@/i18n/I18nProvider";

const TYPES = ["shop", "boutique", "online", "distributor", "other"] as const;
const QTYS = ["q10", "q25", "q50", "q100"] as const;
const INTERESTS = ["bridal", "traditional", "soft", "silkCotton", "mixed"] as const;

const input =
  "w-full rounded-xl border border-heritage-brown-200 bg-white px-4 py-3 text-sm text-heritage-brown-950 placeholder:text-heritage-brown-400 focus:border-silk-red-600 focus:outline-none focus:ring-2 focus:ring-silk-red-600/20 transition";

/**
 * Wholesale enquiry → saved in the admin wholesale CRM.
 * Success is shown ONLY when the server confirms; otherwise the visitor is told and offered WhatsApp.
 */
export function WholesaleForm() {
  const { t } = useI18n();
  const w = t.wholesale;
  const [f, setF] = useState({
    contact: "",
    business: "",
    phone: "",
    email: "",
    city: "",
    type: "shop" as (typeof TYPES)[number],
    qty: "q10" as (typeof QTYS)[number],
    interest: "bridal" as (typeof INTERESTS)[number],
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const set = (k: keyof typeof f, v: string) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const waText = [
    `PVS — ${w.formTitle}`,
    `• ${w.business}: ${f.business}`,
    `• ${w.contact}: ${f.contact}`,
    `• ${w.city}: ${f.city}`,
    `• ${w.type}: ${w.types[f.type]}`,
    `• ${w.qty}: ${w.qtys[f.qty]}`,
    `• ${w.interest}: ${w.interests[f.interest]}`,
    f.message ? `• ${f.message}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.contact.trim().length < 2) er.contact = w.errRequired;
    if (f.business.trim().length < 2) er.business = w.errRequired;
    if (f.city.trim().length < 2) er.city = w.errRequired;
    const digits = f.phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) er.phone = w.errPhone;
    setErrors(er);
    if (Object.values(er).some(Boolean)) return;
    setSending(true);
    setFailure(null);
    try {
      // Staff read the CRM in English, whatever language the visitor used.
      const res = await submitWholesale({
        contact_person: f.contact.trim(),
        business_name: f.business.trim(),
        phone: f.phone.trim(),
        email: f.email.trim() || undefined,
        city: f.city.trim(),
        business_type: en.wholesale.types[f.type],
        expected_quantity: en.wholesale.qtys[f.qty],
        interested_collection: en.wholesale.interests[f.interest],
        message: f.message.trim() || undefined,
      });
      setDone(res.enquiry_id);
    } catch (err) {
      setFailure(isNetworkError(err) ? t.common.serverDown : err instanceof Error ? err.message : t.common.serverDown);
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div role="status" className="rounded-3xl bg-heritage-brown-950 text-ivory-50 p-8 text-center">
        <CheckCircle2 className="mx-auto w-10 h-10 text-gold-300" aria-hidden="true" />
        <p className="mt-4 font-serif text-2xl">{w.sent}</p>
        <p className="mt-3 text-xs text-ivory-300">
          {w.ref}: <span className="font-mono">{done.slice(0, 8).toUpperCase()}</span>
        </p>
      </div>
    );
  }

  const field = (k: "contact" | "business" | "phone" | "email" | "city", label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="block text-[13px] font-semibold text-heritage-brown-900">{label}</span>
      <input className={`${input} mt-1.5`} value={f[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={!!errors[k]} {...extra} />
      {errors[k] && <span role="alert" className="mt-1 block text-xs text-silk-red-700">{errors[k]}</span>}
    </label>
  );

  const select = <K extends "type" | "qty" | "interest">(k: K, label: string, ids: readonly string[], labels: Record<string, string>) => (
    <label className="block">
      <span className="block text-[13px] font-semibold text-heritage-brown-900">{label}</span>
      <select className={`${input} mt-1.5`} value={f[k]} onChange={(e) => set(k, e.target.value)}>
        {ids.map((id) => (
          <option key={id} value={id}>
            {labels[id]}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        {field("contact", w.contact, { autoComplete: "name" })}
        {field("business", w.business, { autoComplete: "organization" })}
        {field("phone", w.phone, { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "+91" })}
        {field("email", w.email, { type: "email", autoComplete: "email" })}
        {field("city", w.city, { autoComplete: "address-level2" })}
        {select("type", w.type, TYPES, w.types)}
        {select("qty", w.qty, QTYS, w.qtys)}
        {select("interest", w.interest, INTERESTS, w.interests)}
      </div>
      <label className="block">
        <span className="block text-[13px] font-semibold text-heritage-brown-900">{w.message}</span>
        <textarea className={`${input} mt-1.5`} rows={4} maxLength={2000} value={f.message} onChange={(e) => set("message", e.target.value)} />
      </label>

      {failure && (
        <div role="alert" className="rounded-2xl border border-silk-red-200 bg-silk-red-50 p-4 text-sm text-silk-red-800">
          <p>{failure}</p>
          <a href={getWhatsAppLink(waText)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 font-semibold underline">
            <MessageCircle className="w-4 h-4" aria-hidden="true" /> {t.common.sendOnWhatsapp}
          </a>
        </div>
      )}

      <button
        type="submit"
        disabled={sending}
        className="inline-flex items-center gap-2 rounded-full bg-silk-red-700 hover:bg-heritage-brown-950 disabled:opacity-60 text-ivory-50 px-7 py-3.5 text-sm font-semibold transition-colors"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}
        {sending ? t.common.sending : w.send}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { Check, CheckCircle2, Handshake, Loader2, MessageCircle, Send } from "lucide-react";
import { getWhatsAppLink } from "@/config/site";
import { submitWholesale, isNetworkError } from "@/lib/api/contact";
import { en } from "@/i18n/dictionaries/en";
import { useI18n } from "@/i18n/I18nProvider";

const TYPES = ["shop", "boutique", "online", "distributor", "other"] as const;
const QTYS = ["q10", "q25", "q50", "q100"] as const;
const INTERESTS = ["bridal", "traditional", "soft", "silkCotton", "mixed"] as const;
const CONTACT = ["whatsapp", "call", "visit", "email"] as const;

type Interest = (typeof INTERESTS)[number];

const input =
  "w-full rounded-xl border border-heritage-brown-200 bg-white px-4 py-3 text-sm text-heritage-brown-950 placeholder:text-heritage-brown-400 focus:border-silk-red-600 focus:outline-none focus:ring-2 focus:ring-silk-red-600/20 transition";

/**
 * Wholesale enquiry → saved in the admin wholesale CRM (English labels for staff).
 * Two clear sections (your business / what you need), multi-select saree types, and the
 * pricing terms shown up front. Success only when the server confirms; otherwise WhatsApp.
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
    state: w.stateDefault,
    gst: "",
    stores: "1",
    type: "shop" as (typeof TYPES)[number],
    qty: "q10" as (typeof QTYS)[number],
    needBy: "",
    via: "whatsapp" as (typeof CONTACT)[number],
    message: "",
  });
  const [interests, setInterests] = useState<Interest[]>(["bridal"]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const set = (k: keyof typeof f, v: string) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };
  const toggle = (i: Interest) => setInterests((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));

  const waText = [
    `PVS — ${w.formTitle}`,
    `• ${w.business}: ${f.business}`,
    `• ${w.contact}: ${f.contact}`,
    `• ${w.city}: ${f.city}, ${f.state}`,
    `• ${w.type}: ${w.types[f.type]} (${w.stores}: ${f.stores})`,
    `• ${w.qty}: ${w.qtys[f.qty]}`,
    `• ${w.interest}: ${interests.map((i) => w.interests[i]).join(", ")}`,
    f.needBy ? `• ${w.needBy}: ${f.needBy}` : "",
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
    if (Object.values(er).some(Boolean)) {
      document.getElementById(`wf-${Object.keys(er).find((k) => er[k])}`)?.focus();
      return;
    }
    setSending(true);
    setFailure(null);
    try {
      // Staff read the CRM in English, whatever language the visitor used.
      const extra = [
        `State: ${f.state.trim() || "-"}`,
        f.gst.trim() ? `GST: ${f.gst.trim()}` : "",
        f.needBy.trim() ? `Needed by: ${f.needBy.trim()}` : "",
        `Contact via: ${en.options.contactPrefs[f.via]}`,
      ]
        .filter(Boolean)
        .join(" | ");
      const res = await submitWholesale({
        contact_person: f.contact.trim(),
        business_name: f.business.trim(),
        phone: f.phone.trim(),
        email: f.email.trim() || undefined,
        city: f.city.trim(),
        business_type: en.wholesale.types[f.type],
        number_of_stores: f.stores.trim().slice(0, 50) || undefined,
        expected_quantity: en.wholesale.qtys[f.qty],
        interested_collection: interests.map((i) => en.wholesale.interests[i]).join(", ").slice(0, 100) || undefined,
        message: `${extra}${f.message.trim() ? `\n\n${f.message.trim()}` : ""}`.slice(0, 2000),
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

  const field = (
    k: "contact" | "business" | "phone" | "email" | "city" | "state" | "gst" | "stores" | "needBy",
    label: string,
    extra: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <label className="block">
      <span className="block text-[13px] font-semibold text-heritage-brown-900">{label}</span>
      <input id={`wf-${k}`} className={`${input} mt-1.5`} value={f[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={!!errors[k]} {...extra} />
      {errors[k] && (
        <span role="alert" className="mt-1 block text-xs text-silk-red-700">
          {errors[k]}
        </span>
      )}
    </label>
  );

  const select = <K extends "type" | "qty" | "via">(k: K, label: string, ids: readonly string[], labels: Record<string, string>) => (
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

  const legend = (n: number, text: string) => (
    <legend className="flex items-center gap-3 text-sm font-semibold tracking-wide text-heritage-brown-950">
      <span className="h-7 w-7 rounded-full bg-heritage-brown-950 text-gold-300 flex items-center justify-center text-xs">{n}</span>
      {text}
    </legend>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-8">
      <fieldset className="space-y-4">
        {legend(1, w.sectionBiz)}
        <div className="grid sm:grid-cols-2 gap-4">
          {field("business", w.business, { autoComplete: "organization" })}
          {field("contact", w.contact, { autoComplete: "name" })}
          {field("phone", w.phone, { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "+91" })}
          {field("email", w.email, { type: "email", autoComplete: "email" })}
          {field("city", w.city, { autoComplete: "address-level2" })}
          {field("state", w.state, { autoComplete: "address-level1" })}
          {select("type", w.type, TYPES, w.types)}
          {field("stores", w.stores, { type: "number", min: 1, inputMode: "numeric" })}
          <div className="sm:col-span-2">{field("gst", w.gst, { autoComplete: "off", maxLength: 15, placeholder: "33XXXXX0000X1Z5" })}</div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        {legend(2, w.sectionNeed)}
        <div>
          <p className="text-[13px] font-semibold text-heritage-brown-900">{w.typesPick}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {INTERESTS.map((i) => {
              const on = interests.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(i)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors ${
                    on ? "border-silk-red-700 bg-silk-red-50 text-silk-red-800" : "border-heritage-brown-200 bg-white text-heritage-brown-800 hover:border-gold-500"
                  }`}
                >
                  {on && <Check className="w-3.5 h-3.5" aria-hidden="true" />} {w.interests[i]}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {select("qty", w.qty, QTYS, w.qtys)}
          {field("needBy", w.needBy, { placeholder: w.needByPh })}
          {select("via", w.contactVia, CONTACT, t.options.contactPrefs)}
        </div>
        <label className="block">
          <span className="block text-[13px] font-semibold text-heritage-brown-900">{w.message}</span>
          <textarea className={`${input} mt-1.5`} rows={4} maxLength={1800} value={f.message} onChange={(e) => set("message", e.target.value)} />
        </label>
      </fieldset>

      <p className="flex gap-3 rounded-2xl border border-gold-300/70 bg-gold-50 px-4 py-3 text-sm text-heritage-brown-800 leading-relaxed">
        <Handshake className="w-5 h-5 shrink-0 text-gold-700 mt-0.5" aria-hidden="true" />
        {w.pricing}
      </p>

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

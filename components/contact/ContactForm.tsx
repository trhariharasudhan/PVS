"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, MessageCircle, Send } from "lucide-react";
import { getWhatsAppLink } from "@/config/site";
import { submitContact, isNetworkError } from "@/lib/api/contact";
import { en } from "@/i18n/dictionaries/en";
import { useI18n } from "@/i18n/I18nProvider";

const TOPICS = ["custom", "wholesale", "visit", "existing", "other"] as const;
type Topic = (typeof TOPICS)[number];

const input =
  "w-full rounded-xl border border-heritage-brown-200 bg-white px-4 py-3 text-sm text-heritage-brown-950 placeholder:text-heritage-brown-400 focus:border-silk-red-600 focus:outline-none focus:ring-2 focus:ring-silk-red-600/20 transition";

/** Contact form that really sends (stored for PVS staff). On failure it says so and offers WhatsApp. */
export function ContactForm() {
  const { t, locale } = useI18n();
  const c = t.contact;
  const [f, setF] = useState({ name: "", phone: "", email: "", topic: "custom" as Topic, message: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [failure, setFailure] = useState<string | null>(null);

  const set = (k: keyof typeof f, v: string) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const waText = `${t.common.whatsappHello}\n• ${c.topics[f.topic]}\n• ${f.message}\n• ${f.name}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = c.errName;
    const digits = f.phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) er.phone = c.errPhone;
    if (f.message.trim().length < 5) er.message = c.errMessage;
    setErrors(er);
    if (Object.values(er).some(Boolean)) return;
    setState("sending");
    setFailure(null);
    try {
      await submitContact({
        name: f.name.trim(),
        phone: f.phone.trim(),
        email: f.email.trim() || undefined,
        subject: en.contact.topics[f.topic], // staff read one language
        message: f.message.trim(),
        language: locale,
        website: f.website,
      });
      setState("sent");
    } catch (err) {
      setState("idle");
      setFailure(isNetworkError(err) ? t.common.serverDown : err instanceof Error ? err.message : t.common.serverDown);
    }
  };

  if (state === "sent") {
    return (
      <div role="status" className="rounded-3xl bg-heritage-brown-950 text-ivory-50 p-8 text-center">
        <CheckCircle2 className="mx-auto w-10 h-10 text-gold-300" aria-hidden="true" />
        <p className="mt-4 font-serif text-2xl">{c.sent}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website", e.target.value)} />
        </label>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-[13px] font-semibold text-heritage-brown-900">{c.name}</span>
          <input className={`${input} mt-1.5`} autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} />
          {errors.name && <span role="alert" className="mt-1 block text-xs text-silk-red-700">{errors.name}</span>}
        </label>
        <label className="block">
          <span className="block text-[13px] font-semibold text-heritage-brown-900">{c.phone}</span>
          <input className={`${input} mt-1.5`} type="tel" inputMode="tel" autoComplete="tel" placeholder="+91" value={f.phone} onChange={(e) => set("phone", e.target.value)} aria-invalid={!!errors.phone} />
          {errors.phone && <span role="alert" className="mt-1 block text-xs text-silk-red-700">{errors.phone}</span>}
        </label>
        <label className="block">
          <span className="block text-[13px] font-semibold text-heritage-brown-900">{c.email}</span>
          <input className={`${input} mt-1.5`} type="email" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
        </label>
        <label className="block">
          <span className="block text-[13px] font-semibold text-heritage-brown-900">{c.topic}</span>
          <select className={`${input} mt-1.5`} value={f.topic} onChange={(e) => set("topic", e.target.value)}>
            {TOPICS.map((k) => (
              <option key={k} value={k}>
                {c.topics[k]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="block text-[13px] font-semibold text-heritage-brown-900">{c.message}</span>
        <textarea className={`${input} mt-1.5`} rows={5} maxLength={2000} value={f.message} onChange={(e) => set("message", e.target.value)} aria-invalid={!!errors.message} />
        {errors.message && <span role="alert" className="mt-1 block text-xs text-silk-red-700">{errors.message}</span>}
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
        disabled={state === "sending"}
        className="inline-flex items-center gap-2 rounded-full bg-silk-red-700 hover:bg-heritage-brown-950 disabled:opacity-60 text-ivory-50 px-7 py-3.5 text-sm font-semibold transition-colors"
      >
        {state === "sending" ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}
        {state === "sending" ? t.common.sending : c.send}
      </button>
    </form>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  FileText,
  ImagePlus,
  Loader2,
  MessageCircle,
  Phone,
  Store,
  Truck,
  Users,
  X,
} from "lucide-react";
import { siteConfig, getWhatsAppLink } from "@/config/site";
import { BORDER_STYLES, BUDGET_RANGES, OCCASIONS, SAREE_TYPES, SILK_TYPES, ZARI_TYPES } from "@/data/business";
import { submitCustomOrder, type CustomerSegment, type CustomOrderSpec } from "@/lib/api/customOrders";
import { SareePreview } from "./SareePreview";

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf";
const DRAFT_KEY = "pvs-custom-order-draft-v1";

/** Traditional saree colours (Tamil names where commonly used). */
const SWATCHES: { name: string; hex: string }[] = [
  { name: "Arakku (maroon)", hex: "#7A1424" },
  { name: "Kumkumam red", hex: "#B3122E" },
  { name: "Rani pink", hex: "#C2185B" },
  { name: "Onion pink", hex: "#D98A8A" },
  { name: "Manjal (turmeric)", hex: "#E3A21A" },
  { name: "Mustard", hex: "#B8862B" },
  { name: "Kili pachai (parrot green)", hex: "#4C9A2A" },
  { name: "Bottle green", hex: "#0B4D3A" },
  { name: "Mayil kazhuthu (peacock neck)", hex: "#1F5F5B" },
  { name: "Peacock blue", hex: "#0F5E7A" },
  { name: "Royal blue", hex: "#1E3A8A" },
  { name: "Vadamalli (purple)", hex: "#5B2A6E" },
  { name: "Lavender", hex: "#9B7BB8" },
  { name: "Off-white", hex: "#F3E9D2" },
  { name: "Antique gold", hex: "#C6A15B" },
  { name: "Black", hex: "#1A1414" },
];

const SEGMENTS: { id: CustomerSegment; title: string; body: string; icon: typeof Users }[] = [
  { id: "INDIVIDUAL", title: "For my family", body: "Wedding, function or a gift — even a single saree.", icon: Users },
  { id: "RETAILER", title: "For my shop / boutique", body: "Stock woven to your colours and designs.", icon: Store },
  { id: "WHOLESALE", title: "Wholesale / bulk", body: "Larger volumes and repeat production.", icon: Truck },
];

const STEPS = ["About you", "Saree & design", "Colours", "Silk & zari", "Details"] as const;

type Spec = CustomOrderSpec;

const EMPTY: Spec = {
  segment: "INDIVIDUAL",
  contact_name: "",
  phone: "",
  email: "",
  city: "",
  business_name: "",
  preferred_contact: "whatsapp",
  saree_type: "",
  occasion: "",
  body_colour: "#7A1424",
  border_colour: "#1F5F5B",
  pallu_colour: "#7A1424",
  silk_type: SILK_TYPES[0].label,
  silk_percentage: 100,
  zari_type: ZARI_TYPES[1].label,
  border_style: BORDER_STYLES[0],
  design_notes: "",
  quantity: 1,
  needed_by: "",
  budget_range: "",
  consent_to_contact: true,
  website: "",
};

type Errors = Partial<Record<keyof Spec | "files", string>>;

function validate(step: number, s: Spec): Errors {
  const e: Errors = {};
  if (step === 1 && !s.saree_type) e.saree_type = "Choose the type of saree";
  if (step === 4) {
    if (!s.quantity || s.quantity < 1) e.quantity = "Quantity must be at least 1";
    if (s.contact_name.trim().length < 2) e.contact_name = "Please enter your name";
    const digits = s.phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) e.phone = "Enter a valid phone number (10+ digits)";
    if (s.email && !/^\S+@\S+\.\S+$/.test(s.email)) e.email = "Enter a valid email or leave it empty";
    if (s.segment !== "INDIVIDUAL" && !s.business_name?.trim()) e.business_name = "Shop / business name helps us prepare your quote";
    if (s.needed_by && s.needed_by < new Date().toISOString().slice(0, 10)) e.needed_by = "Date cannot be in the past";
  }
  return e;
}

function summaryText(s: Spec, ref?: string) {
  const lines = [
    ref ? `PVS custom order ${ref}` : "PVS custom saree enquiry",
    `• ${s.saree_type || "Saree"} × ${s.quantity}${s.occasion ? ` (${s.occasion})` : ""}`,
    `• Colours: body ${s.body_colour}, border ${s.border_colour}, pallu ${s.pallu_colour}`,
    `• Silk: ${s.silk_type}${s.silk_percentage != null ? ` (${s.silk_percentage}% silk)` : ""}`,
    `• Zari: ${s.zari_type}${s.border_style ? ` · Border: ${s.border_style}` : ""}`,
    s.needed_by ? `• Needed by: ${s.needed_by}` : "",
    s.budget_range ? `• Budget: ${s.budget_range}` : "",
    s.design_notes ? `• Notes: ${s.design_notes}` : "",
    `• Name: ${s.contact_name}${s.city ? `, ${s.city}` : ""}`,
  ];
  return lines.filter(Boolean).join("\n");
}

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-semibold text-heritage-brown-900">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-heritage-brown-600 mt-0.5">
          {hint}
        </p>
      )}
      <div className="mt-1.5">{children}</div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-silk-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-heritage-brown-200 bg-white px-4 py-3 text-sm text-heritage-brown-950 placeholder:text-heritage-brown-400 focus:border-silk-red-600 focus:outline-none focus:ring-2 focus:ring-silk-red-600/20 transition";

function ChoiceCard({ selected, onClick, children, className = "" }: { selected: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`text-left rounded-2xl border p-4 transition-all ${
        selected
          ? "border-silk-red-700 bg-silk-red-50/60 ring-2 ring-silk-red-700/15"
          : "border-heritage-brown-200 bg-white hover:border-gold-500"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function ColourField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = `colour-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const named = SWATCHES.find((s) => s.hex.toLowerCase() === value.toLowerCase());
  return (
    <fieldset>
      <legend className="flex items-center gap-3 text-[13px] font-semibold text-heritage-brown-900">
        <span className="h-5 w-5 rounded-full border border-black/10" style={{ background: value }} aria-hidden="true" />
        {label}
        <span className="font-normal text-heritage-brown-600">{named ? named.name : value.toUpperCase()}</span>
      </legend>
      <div className="mt-3 grid grid-cols-8 gap-2 max-w-sm">
        {SWATCHES.map((s) => (
          <button
            key={s.hex}
            type="button"
            title={s.name}
            aria-label={`${label}: ${s.name}`}
            aria-pressed={s.hex.toLowerCase() === value.toLowerCase()}
            onClick={() => onChange(s.hex)}
            className={`aspect-square rounded-full border transition-transform hover:scale-110 ${
              s.hex.toLowerCase() === value.toLowerCase() ? "ring-2 ring-offset-2 ring-silk-red-700 border-transparent" : "border-black/10"
            }`}
            style={{ background: s.hex }}
          />
        ))}
      </div>
      <label htmlFor={id} className="mt-3 inline-flex items-center gap-2 text-xs text-heritage-brown-700 cursor-pointer">
        <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-heritage-brown-200 bg-white" />
        Pick any exact colour
      </label>
    </fieldset>
  );
}

/* ------------------------------------------------------------------ */
/* Builder                                                             */
/* ------------------------------------------------------------------ */

export function OrderBuilder() {
  const [spec, setSpec] = useState<Spec>(EMPTY);
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ code: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [drag, setDrag] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);
  const params = useSearchParams();

  // Restore / persist draft (files can't be stored; the spec can). ?type= pre-selects a saree type.
  useEffect(() => {
    let next = EMPTY;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) next = { ...EMPTY, ...JSON.parse(raw), website: "" };
    } catch {
      /* storage unavailable */
    }
    const t = params.get("type");
    if (t && SAREE_TYPES.includes(t)) next = { ...next, saree_type: t };
    setSpec(next);
    loaded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!loaded.current || result) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...spec, website: "" }));
    } catch {
      /* ignore */
    }
  }, [spec, result]);

  const previews = useMemo(
    () => files.map((f) => ({ f, url: f.type.startsWith("image/") && !/hei[cf]/.test(f.type) ? URL.createObjectURL(f) : null })),
    [files],
  );
  useEffect(() => () => previews.forEach((p) => p.url && URL.revokeObjectURL(p.url)), [previews]);

  const set = useCallback(<K extends keyof Spec>(k: K, v: Spec[K]) => {
    setSpec((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }, []);

  const silk = SILK_TYPES.find((t) => t.label === spec.silk_type) ?? SILK_TYPES[0];
  const zari = ZARI_TYPES.find((t) => t.label === spec.zari_type) ?? ZARI_TYPES[1];

  const previewSpec = useMemo(
    () => ({
      body: spec.body_colour,
      border: spec.border_colour,
      pallu: spec.pallu_colour,
      zari: zari.tone,
      sheen: silk.fixedPercent ? 1 : Math.max(0.2, (spec.silk_percentage ?? 50) / 100),
      borderStyle: spec.border_style,
    }),
    [spec.body_colour, spec.border_colour, spec.pallu_colour, zari.tone, silk.fixedPercent, spec.silk_percentage, spec.border_style],
  );

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const ok: File[] = [];
    let err = "";
    for (const f of incoming) {
      if (f.size > MAX_BYTES) err = `"${f.name}" is over 10 MB.`;
      else if (!/^(image\/(jpeg|png|webp|heic|heif)|application\/pdf)$/.test(f.type) && !/\.(heic|heif)$/i.test(f.name))
        err = `"${f.name}" is not a JPG, PNG, WEBP, HEIC or PDF.`;
      else ok.push(f);
    }
    const next = [...files, ...ok].slice(0, MAX_FILES);
    if (files.length + ok.length > MAX_FILES) err = `You can attach up to ${MAX_FILES} files.`;
    setFiles(next);
    setErrors((e) => ({ ...e, files: err || undefined }));
  };

  const go = (to: number) => {
    if (to > step) {
      const e = validate(step, spec);
      if (Object.keys(e).length) {
        setErrors(e);
        return;
      }
    }
    setStep(to);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submit = async () => {
    const e = validate(4, spec);
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: Spec = {
        ...spec,
        email: spec.email || undefined,
        city: spec.city || undefined,
        business_name: spec.segment === "INDIVIDUAL" ? undefined : spec.business_name || undefined,
        occasion: spec.occasion || undefined,
        needed_by: spec.needed_by || null,
        budget_range: spec.budget_range || undefined,
        design_notes: spec.design_notes || undefined,
        silk_percentage: silk.id === "not-sure" ? null : silk.fixedPercent ?? spec.silk_percentage ?? null,
      };
      const res = await submitCustomOrder(payload, files);
      setResult({ code: res.reference_code });
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setSubmitError(
        msg && !/fetch|network|failed to/i.test(msg)
          ? msg
          : "We couldn't reach our server right now. Your details are saved on this device — you can send the same request on WhatsApp below.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------- success ---------------------------- */
  if (result) {
    const wa = getWhatsAppLink(`${summaryText(spec, result.code)}\n\n(I'll attach my design photos here as well.)`);
    return (
      <div ref={topRef} className="scroll-mt-28 rounded-3xl bg-heritage-brown-950 text-ivory-50 p-8 sm:p-12 text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-gold-500 text-heritage-brown-950 flex items-center justify-center">
          <Check className="w-7 h-7" aria-hidden="true" />
        </div>
        <h2 className="mt-6 font-serif text-3xl sm:text-4xl">Request received</h2>
        <p className="mt-3 text-ivory-300 max-w-lg mx-auto">
          PVS will contact you {{ whatsapp: "on WhatsApp", call: "by phone", visit: "to plan your workshop visit", email: "by email" }[spec.preferred_contact]} to confirm the design, materials and quotation.
          Nothing is woven until you approve.
        </p>
        <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-gold-400/40 px-6 py-4">
          <span className="text-xs tracking-widest uppercase text-gold-300">Your reference</span>
          <span className="font-mono text-2xl tracking-widest">{result.code}</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(result.code).then(() => setCopied(true));
            }}
            className="ml-1 rounded-full p-2 hover:bg-white/10"
            aria-label="Copy reference code"
          >
            {copied ? <Check className="w-4 h-4 text-gold-300" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-500 text-heritage-brown-950 px-6 py-3.5 text-sm font-semibold">
            <MessageCircle className="w-4 h-4" aria-hidden="true" /> Also send on WhatsApp
          </a>
          <Link href={`/order-status?ref=${result.code}`} className="inline-flex items-center justify-center gap-2 rounded-full border border-ivory-200/30 px-6 py-3.5 text-sm font-semibold">
            Track this order
          </Link>
        </div>
      </div>
    );
  }

  /* ------------------------------ form ----------------------------- */
  const waFallback = getWhatsAppLink(summaryText(spec));

  return (
    <div ref={topRef} className="scroll-mt-28 grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      {/* Steps + form */}
      <div className="lg:col-span-7">
        {/* Stepper */}
        <ol className="flex items-center gap-2 overflow-x-auto pb-2" aria-label="Order steps">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => i < step && go(i)}
                disabled={i > step}
                aria-current={i === step ? "step" : undefined}
                className={`flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1.5 text-xs font-semibold transition-colors ${
                  i === step ? "bg-heritage-brown-950 text-ivory-50" : i < step ? "bg-gold-100 text-heritage-brown-900 hover:bg-gold-200" : "text-heritage-brown-400"
                }`}
              >
                <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] ${i === step ? "bg-gold-500 text-heritage-brown-950" : i < step ? "bg-heritage-brown-950 text-gold-300" : "border border-heritage-brown-300"}`}>
                  {i < step ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : i + 1}
                </span>
                {label}
              </button>
              {i < STEPS.length - 1 && <span className="h-px w-4 bg-heritage-brown-200" aria-hidden="true" />}
            </li>
          ))}
        </ol>
        <div className="mt-2 h-1 rounded-full bg-heritage-brown-100 overflow-hidden" aria-hidden="true">
          <div className="h-full bg-gradient-to-r from-silk-red-700 to-gold-500 transition-all duration-700" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        <form
          className="mt-8"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (step < STEPS.length - 1) go(step + 1);
            else submit();
          }}
        >
          {/* honeypot */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" value={spec.website} onChange={(e) => set("website", e.target.value)} />
            </label>
          </div>

          <div key={step} className="animate-[pvs-step-in_0.5s_ease-out] space-y-6">
            {step === 0 && (
              <>
                <h2 className="font-serif text-3xl text-heritage-brown-950">Who is this saree for?</h2>
                <div className="grid sm:grid-cols-3 gap-3">
                  {SEGMENTS.map(({ id, title, body, icon: Icon }) => (
                    <ChoiceCard key={id} selected={spec.segment === id} onClick={() => set("segment", id)}>
                      <Icon className="w-6 h-6 text-silk-red-700" aria-hidden="true" />
                      <p className="mt-3 font-semibold text-heritage-brown-950">{title}</p>
                      <p className="mt-1 text-xs text-heritage-brown-600 leading-relaxed">{body}</p>
                    </ChoiceCard>
                  ))}
                </div>
                <div className="rounded-2xl bg-gold-50 border border-gold-200 p-4 text-sm text-heritage-brown-800">
                  You&apos;re not committing to anything yet. We&apos;ll review your request and share a quotation before any weaving begins.
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="font-serif text-3xl text-heritage-brown-950">Tell us about the saree</h2>
                <Field id="saree_type" label="Type of saree" error={errors.saree_type}>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {SAREE_TYPES.map((t) => (
                      <ChoiceCard key={t} selected={spec.saree_type === t} onClick={() => set("saree_type", t)} className="py-3 text-sm font-medium text-heritage-brown-900">
                        {t}
                      </ChoiceCard>
                    ))}
                  </div>
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field id="occasion" label="Occasion (optional)">
                    <select id="occasion" className={inputCls} value={spec.occasion} onChange={(e) => set("occasion", e.target.value)}>
                      <option value="">Select…</option>
                      {OCCASIONS.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </Field>
                  <Field id="border_style" label="Border style">
                    <select id="border_style" className={inputCls} value={spec.border_style} onChange={(e) => set("border_style", e.target.value)}>
                      {BORDER_STYLES.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                {/* Design upload */}
                <Field id="files" label="Your design (optional)" hint="Photo of a saree you like, a sketch, a screenshot or a PDF. Up to 5 files, 10 MB each." error={errors.files}>
                  <label
                    htmlFor="files"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDrag(true);
                    }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDrag(false);
                      addFiles(e.dataTransfer.files);
                    }}
                    className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors ${
                      drag ? "border-silk-red-600 bg-silk-red-50/50" : "border-heritage-brown-200 bg-white hover:border-gold-500"
                    }`}
                  >
                    <ImagePlus className="w-7 h-7 text-gold-600" aria-hidden="true" />
                    <span className="text-sm font-semibold text-heritage-brown-900">Drop files here or tap to upload</span>
                    <span className="text-xs text-heritage-brown-600">JPG · PNG · WEBP · HEIC · PDF</span>
                    <input id="files" type="file" multiple accept={ACCEPT} className="sr-only" onChange={(e) => (addFiles(e.target.files), (e.target.value = ""))} />
                  </label>
                  {previews.length > 0 && (
                    <ul className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {previews.map(({ f, url }, i) => (
                        <li key={i} className="relative aspect-square rounded-xl overflow-hidden border border-heritage-brown-200 bg-ivory-100">
                          {url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={url} alt={f.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-[10px] text-heritage-brown-700 text-center break-all">
                              <FileText className="w-5 h-5" aria-hidden="true" />
                              {f.name}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setFiles(files.filter((_, j) => j !== i))}
                            className="absolute top-1 right-1 rounded-full bg-black/60 text-white p-1"
                            aria-label={`Remove ${f.name}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Field>
                <Field id="design_notes" label="Describe what you want (optional)" hint="Motifs, butta size, pallu style, anything special — Tamil or English is fine.">
                  <textarea id="design_notes" rows={4} maxLength={3000} className={inputCls} value={spec.design_notes} onChange={(e) => set("design_notes", e.target.value)} placeholder="Eg: Mayil (peacock) butta in the body, rich pallu like the photo, contrast border…" />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-serif text-3xl text-heritage-brown-950">Choose your colours</h2>
                <p className="text-sm text-heritage-brown-700 -mt-3">The preview updates as you choose. Final colours are matched to a swatch you approve before weaving.</p>
                <ColourField label="Body" value={spec.body_colour} onChange={(v) => set("body_colour", v)} />
                <ColourField label="Border" value={spec.border_colour} onChange={(v) => set("border_colour", v)} />
                <ColourField label="Pallu" value={spec.pallu_colour} onChange={(v) => set("pallu_colour", v)} />
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="font-serif text-3xl text-heritage-brown-950">Silk & zari</h2>
                <fieldset>
                  <legend className="text-[13px] font-semibold text-heritage-brown-900">Silk</legend>
                  <div className="mt-2 grid sm:grid-cols-2 gap-2">
                    {SILK_TYPES.map((t) => (
                      <ChoiceCard
                        key={t.id}
                        selected={spec.silk_type === t.label}
                        onClick={() => {
                          set("silk_type", t.label);
                          set("silk_percentage", t.fixedPercent ?? (t.id === "not-sure" ? null : spec.silk_percentage && spec.silk_percentage < 100 ? spec.silk_percentage : 50));
                        }}
                      >
                        <p className="font-semibold text-sm text-heritage-brown-950">{t.label}</p>
                        <p className="mt-1 text-xs text-heritage-brown-600 leading-relaxed">{t.help}</p>
                      </ChoiceCard>
                    ))}
                  </div>
                </fieldset>
                {!silk.fixedPercent && silk.id !== "not-sure" && (
                  <Field id="silk_percentage" label={`Silk content: ${spec.silk_percentage ?? 50}% silk`} hint="Higher silk % = richer lustre and drape, higher price.">
                    <input
                      id="silk_percentage"
                      type="range"
                      min={10}
                      max={90}
                      step={5}
                      value={spec.silk_percentage ?? 50}
                      onChange={(e) => set("silk_percentage", Number(e.target.value))}
                      className="w-full accent-silk-red-700"
                    />
                  </Field>
                )}
                <fieldset>
                  <legend className="text-[13px] font-semibold text-heritage-brown-900">Zari</legend>
                  <div className="mt-2 grid sm:grid-cols-2 gap-2">
                    {ZARI_TYPES.map((t) => (
                      <ChoiceCard key={t.id} selected={spec.zari_type === t.label} onClick={() => set("zari_type", t.label)}>
                        <p className="flex items-center gap-2 font-semibold text-sm text-heritage-brown-950">
                          <span className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: t.tone || "transparent" }} aria-hidden="true" />
                          {t.label}
                        </p>
                        <p className="mt-1 text-xs text-heritage-brown-600 leading-relaxed">{t.help}</p>
                      </ChoiceCard>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-heritage-brown-600">
                    Not sure? Read our <Link href="/our-craft#guide" className="underline text-silk-red-700">silk & zari guide</Link>.
                  </p>
                </fieldset>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="font-serif text-3xl text-heritage-brown-950">Last details</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field id="quantity" label="Quantity" error={errors.quantity}>
                    <input id="quantity" type="number" min={1} max={10000} inputMode="numeric" className={inputCls} value={spec.quantity} onChange={(e) => set("quantity", Math.max(0, Number(e.target.value)))} />
                  </Field>
                  <Field id="needed_by" label="Needed by (optional)" error={errors.needed_by}>
                    <input id="needed_by" type="date" min={new Date().toISOString().slice(0, 10)} className={inputCls} value={spec.needed_by ?? ""} onChange={(e) => set("needed_by", e.target.value)} />
                  </Field>
                  <Field id="budget_range" label="Budget per saree">
                    <select id="budget_range" className={inputCls} value={spec.budget_range} onChange={(e) => set("budget_range", e.target.value)}>
                      <option value="">Select…</option>
                      {BUDGET_RANGES.map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field id="contact_name" label="Your name" error={errors.contact_name}>
                    <input id="contact_name" autoComplete="name" className={inputCls} value={spec.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
                  </Field>
                  <Field id="phone" label="Phone / WhatsApp" error={errors.phone}>
                    <input id="phone" type="tel" autoComplete="tel" inputMode="tel" className={inputCls} value={spec.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91" />
                  </Field>
                  <Field id="city" label="City / town">
                    <input id="city" autoComplete="address-level2" className={inputCls} value={spec.city} onChange={(e) => set("city", e.target.value)} />
                  </Field>
                  <Field id="email" label="Email (optional)" error={errors.email}>
                    <input id="email" type="email" autoComplete="email" className={inputCls} value={spec.email} onChange={(e) => set("email", e.target.value)} />
                  </Field>
                  {spec.segment !== "INDIVIDUAL" && (
                    <Field id="business_name" label="Shop / business name" error={errors.business_name}>
                      <input id="business_name" autoComplete="organization" className={inputCls} value={spec.business_name} onChange={(e) => set("business_name", e.target.value)} />
                    </Field>
                  )}
                </div>
                <fieldset>
                  <legend className="text-[13px] font-semibold text-heritage-brown-900">How should we reach you?</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(
                      [
                        ["whatsapp", "WhatsApp"],
                        ["call", "Phone call"],
                        ["visit", "I'll visit the workshop"],
                        ["email", "Email"],
                      ] as const
                    ).map(([v, l]) => (
                      <ChoiceCard key={v} selected={spec.preferred_contact === v} onClick={() => set("preferred_contact", v)} className="!rounded-full px-4 py-2 text-sm">
                        {l}
                      </ChoiceCard>
                    ))}
                  </div>
                </fieldset>
                <label className="flex items-start gap-3 text-sm text-heritage-brown-800">
                  <input type="checkbox" className="mt-1 accent-silk-red-700" checked={spec.consent_to_contact} onChange={(e) => set("consent_to_contact", e.target.checked)} />
                  PVS may contact me about this request. My details are used only for this order.
                </label>
              </>
            )}
          </div>

          {submitError && (
            <div role="alert" className="mt-6 rounded-2xl border border-silk-red-200 bg-silk-red-50 p-4 text-sm text-silk-red-800">
              <p>{submitError}</p>
              <a href={waFallback} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 font-semibold underline">
                <MessageCircle className="w-4 h-4" aria-hidden="true" /> Send this request on WhatsApp
              </a>
            </div>
          )}

          <div className="mt-10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => go(step - 1)}
              disabled={step === 0}
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-heritage-brown-800 disabled:opacity-0"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="group inline-flex items-center gap-2 rounded-full bg-silk-red-700 hover:bg-heritage-brown-950 disabled:opacity-60 text-ivory-50 px-7 py-3.5 text-sm font-semibold tracking-wide transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Sending…
                </>
              ) : step < STEPS.length - 1 ? (
                <>
                  Continue <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </>
              ) : (
                <>
                  Send my request <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Live preview + summary */}
      <aside className="lg:col-span-5 lg:sticky lg:top-28 space-y-5" aria-label="Your saree so far">
        <div className="rounded-3xl bg-heritage-brown-950 p-5 sm:p-6">
          <p className="text-[11px] tracking-[0.25em] uppercase text-gold-300">Live preview</p>
          <SareePreview spec={previewSpec} className="mt-4" />
          <p className="mt-3 text-[11px] text-ivory-300/70">Illustration of your colour & zari choices — not a photo of a finished saree.</p>
        </div>
        <dl className="rounded-3xl border border-heritage-brown-200 bg-white p-5 text-sm grid grid-cols-2 gap-x-4 gap-y-3">
          {[
            ["Saree", spec.saree_type || "—"],
            ["Quantity", String(spec.quantity || "—")],
            ["Silk", `${spec.silk_type}${silk.fixedPercent ? "" : spec.silk_percentage != null ? ` · ${spec.silk_percentage}%` : ""}`],
            ["Zari", spec.zari_type],
            ["Border", spec.border_style || "—"],
            ["Designs", files.length ? `${files.length} file${files.length > 1 ? "s" : ""}` : "—"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] uppercase tracking-wider text-heritage-brown-500">{k}</dt>
              <dd className="mt-0.5 font-medium text-heritage-brown-950">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="rounded-3xl border border-gold-300/60 bg-gold-50 p-5 text-sm">
          <p className="font-semibold text-heritage-brown-950">Prefer to talk?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={`tel:+${siteConfig.business.phoneNumeric}`} className="inline-flex items-center gap-2 rounded-full bg-white border border-heritage-brown-200 px-4 py-2 font-medium">
              <Phone className="w-4 h-4" aria-hidden="true" /> Call
            </a>
            <a href={waFallback} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white border border-heritage-brown-200 px-4 py-2 font-medium">
              <MessageCircle className="w-4 h-4" aria-hidden="true" /> WhatsApp
            </a>
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-white border border-heritage-brown-200 px-4 py-2 font-medium">
              Visit us
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}

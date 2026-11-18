"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Copy, FileText, ImagePlus, Loader2, MessageCircle, Phone, Store, Truck, Users, X } from "lucide-react";
import { siteConfig, getWhatsAppLink } from "@/config/site";
import { BUDGET_IDS, OCCASION_IDS, SAREE_TYPE_IDS, SILK_OPTIONS, SWATCHES, ZARI_OPTIONS } from "@/data/business";
import { submitCustomOrder, type CustomerSegment, type CustomOrderSpec } from "@/lib/api/customOrders";
import { MOTIF_IDS, type MotifId } from "@/lib/saree/motifs";
import type { BodyPattern, BorderStyle, PalluStyle, SareeDesign, ZariKind } from "@/lib/saree/render";
import { PRESETS, PRESET_IDS, type PresetId } from "@/lib/saree/presets";
import { en } from "@/i18n/dictionaries/en";
import { fmt, useI18n } from "@/i18n/I18nProvider";
import type { Dict } from "@/i18n/types";
import { SareeFlat } from "@/components/saree/SareeFlat";
import { MotifIcon } from "@/components/saree/MotifIcon";
import { SareePreview } from "./SareePreview";

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf";
const DRAFT_KEY = "pvs-custom-order-draft-v2";

type SareeTypeId = (typeof SAREE_TYPE_IDS)[number];
type OccasionId = (typeof OCCASION_IDS)[number];
type BudgetId = (typeof BUDGET_IDS)[number];
type SilkId = (typeof SILK_OPTIONS)[number]["id"];
type ZariId = (typeof ZARI_OPTIONS)[number]["id"];
type Motif = MotifId | "none";

const BORDER_STYLES: BorderStyle[] = ["temple", "rettaiPettu", "gangaJamuna", "vairaoosi", "kattam", "minimal"];
const BODY_PATTERNS: BodyPattern[] = ["buttas", "checks", "jaal", "vairaoosi", "stripes", "plain"];
const PALLU_STYLES: PalluStyle[] = ["grand", "motifRows", "stripes", "minimal"];
const MOTIFS: Motif[] = [...MOTIF_IDS, "none"];

const SEGMENTS: { id: CustomerSegment; icon: typeof Users }[] = [
  { id: "INDIVIDUAL", icon: Users },
  { id: "RETAILER", icon: Store },
  { id: "WHOLESALE", icon: Truck },
];

const STEP_COUNT = 6;

interface FormState {
  segment: CustomerSegment;
  contact_name: string;
  phone: string;
  email: string;
  city: string;
  business_name: string;
  preferred_contact: "whatsapp" | "call" | "visit" | "email";
  sareeType: SareeTypeId | "";
  occasion: OccasionId | "";
  silk: SilkId;
  silkPct: number;
  zari: ZariId;
  budget: BudgetId | "";
  design: SareeDesign;
  notes: string;
  quantity: number;
  needed_by: string;
  consent: boolean;
  website: string;
}

const EMPTY: FormState = {
  segment: "INDIVIDUAL",
  contact_name: "",
  phone: "",
  email: "",
  city: "",
  business_name: "",
  preferred_contact: "whatsapp",
  sareeType: "",
  occasion: "",
  silk: "pureMulberry",
  silkPct: 50,
  zari: "tested",
  budget: "",
  design: { ...PRESETS.templeBride },
  notes: "",
  quantity: 1,
  needed_by: "",
  consent: true,
  website: "",
};

type ErrKey = "sareeType" | "quantity" | "contact_name" | "phone" | "email" | "business_name" | "needed_by" | "files";
type Errors = Partial<Record<ErrKey, string>>;

function validate(step: number, s: FormState, t: Dict): Errors {
  const e: Errors = {};
  const er = t.order.errors;
  if (step === 1 && !s.sareeType) e.sareeType = er.sareeType;
  if (step === 5) {
    if (!s.quantity || s.quantity < 1) e.quantity = er.quantity;
    if (s.contact_name.trim().length < 2) e.contact_name = er.name;
    const digits = s.phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) e.phone = er.phone;
    if (s.email && !/^\S+@\S+\.\S+$/.test(s.email)) e.email = er.email;
    if (s.segment !== "INDIVIDUAL" && !s.business_name.trim()) e.business_name = er.business;
    if (s.needed_by && s.needed_by < new Date().toISOString().slice(0, 10)) e.needed_by = er.date;
  }
  return e;
}

const silkOf = (id: SilkId) => SILK_OPTIONS.find((o) => o.id === id) ?? SILK_OPTIONS[0];
const fixedPct = (id: SilkId): number | undefined => {
  const o = silkOf(id);
  return "fixedPercent" in o ? o.fixedPercent : undefined;
};
const zariTone = (id: ZariId): ZariKind => (ZARI_OPTIONS.find((o) => o.id === id)?.tone ?? "gold") as ZariKind;
const swatchName = (t: Dict, hex: string) => {
  const s = SWATCHES.find((w) => w.hex.toLowerCase() === hex.toLowerCase());
  return s ? t.options.swatches[s.id] : hex.toUpperCase();
};

/** The design as the preview should draw it (zari tone + silk lustre follow the material choice). */
function previewDesign(s: FormState): SareeDesign {
  const pct = fixedPct(s.silk) ?? (s.silk === "notSure" ? 100 : s.silkPct);
  return { ...s.design, zari: zariTone(s.zari), sheen: Math.max(0.25, pct / 100) };
}

/** Human-readable summary (WhatsApp) in the visitor's language. */
function summaryText(s: FormState, t: Dict, ref?: string) {
  const w = t.order.waSummary;
  const o = t.options;
  const d = s.design;
  const pct = fixedPct(s.silk) ?? s.silkPct;
  const motif = (m?: MotifId | null) => (m ? o.motifs[m] : o.motifs.none);
  const lines = [
    ref ? fmt(w.headerRef, { ref }) : w.header,
    `• ${s.sareeType ? o.sareeTypes[s.sareeType] : "—"} × ${s.quantity}${s.occasion ? ` (${o.occasions[s.occasion]})` : ""}`,
    `• ${w.design}: ${o.borderStyles[d.borderStyle].label} (${motif(d.borderMotif)}) · ${o.bodyPatterns[d.bodyPattern].label} (${motif(d.bodyMotif)}) · ${o.palluStyles[d.palluStyle].label} (${motif(d.palluMotif)})`,
    `• ${w.colours}: ${swatchName(t, d.body)} / ${swatchName(t, d.border)}${d.borderStyle === "gangaJamuna" && d.border2 ? ` + ${swatchName(t, d.border2)}` : ""} / ${swatchName(t, d.pallu)}`,
    `• ${w.silk}: ${o.silkTypes[s.silk].label}${s.silk !== "notSure" ? ` (${pct}%)` : ""}`,
    `• ${w.zari}: ${o.zariTypes[s.zari].label}`,
    s.needed_by ? `• ${w.neededBy}: ${s.needed_by}` : "",
    s.budget ? `• ${w.budget}: ${o.budgets[s.budget]}` : "",
    s.notes ? `• ${w.notes}: ${s.notes}` : "",
    `• ${w.name}: ${s.contact_name}${s.city ? `, ${s.city}` : ""}`,
  ];
  return lines.filter(Boolean).join("\n");
}

/** API payload — labels always in ENGLISH so PVS staff read one language in the admin. */
function toPayload(s: FormState): CustomOrderSpec {
  const o = en.options;
  const d = s.design;
  const pct = fixedPct(s.silk) ?? (s.silk === "notSure" ? null : s.silkPct);
  return {
    segment: s.segment,
    contact_name: s.contact_name.trim(),
    phone: s.phone.trim(),
    email: s.email || undefined,
    city: s.city || undefined,
    business_name: s.segment === "INDIVIDUAL" ? undefined : s.business_name || undefined,
    preferred_contact: s.preferred_contact,
    saree_type: s.sareeType ? o.sareeTypes[s.sareeType] : o.sareeTypes.other,
    occasion: s.occasion ? o.occasions[s.occasion] : undefined,
    body_colour: d.body.toUpperCase(),
    border_colour: d.border.toUpperCase(),
    pallu_colour: d.pallu.toUpperCase(),
    silk_type: o.silkTypes[s.silk].label,
    silk_percentage: pct,
    zari_type: o.zariTypes[s.zari].label,
    border_style: o.borderStyles[d.borderStyle].label,
    design_notes: s.notes || undefined,
    design_options: {
      border_style: d.borderStyle,
      border_motif: d.borderMotif ?? "none",
      body_pattern: d.bodyPattern,
      body_motif: d.bodyMotif ?? "none",
      pallu_style: d.palluStyle,
      pallu_motif: d.palluMotif ?? "none",
      ...(d.borderStyle === "gangaJamuna" && d.border2 ? { second_border_colour: d.border2.toUpperCase() } : {}),
    },
    quantity: s.quantity,
    needed_by: s.needed_by || null,
    budget_range: s.budget ? o.budgets[s.budget] : undefined,
    consent_to_contact: s.consent,
    website: s.website,
  };
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

function ChoiceCard({ selected, onClick, children, className = "", label }: { selected: boolean; onClick: () => void; children: React.ReactNode; className?: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      className={`text-left rounded-2xl border p-4 transition-all ${
        selected ? "border-silk-red-700 bg-silk-red-50/60 ring-2 ring-silk-red-700/15" : "border-heritage-brown-200 bg-white hover:border-gold-500"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-serif text-3xl text-heritage-brown-950">{children}</h2>;
}

function MotifPicker({ legend, value, onChange, ground }: { legend: string; value: MotifId | null | undefined; onChange: (m: MotifId | null) => void; ground: string }) {
  const { t } = useI18n();
  const current: Motif = value ?? "none";
  return (
    <fieldset>
      <legend className="text-[13px] font-semibold text-heritage-brown-900">
        {legend}: <span className="font-normal text-heritage-brown-600">{t.options.motifs[current]}</span>
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {MOTIFS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m === "none" ? null : m)}
            aria-pressed={current === m}
            title={t.options.motifs[m]}
            className={`group flex flex-col items-center gap-1 rounded-xl border p-1.5 transition-all ${
              current === m ? "border-silk-red-700 ring-2 ring-silk-red-700/20 bg-silk-red-50/60" : "border-heritage-brown-200 bg-white hover:border-gold-500"
            }`}
          >
            <MotifIcon id={m} size={44} ground={ground} />
            <span className="text-[10px] font-medium text-heritage-brown-800 max-w-[4.5rem] truncate">{t.options.motifs[m]}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ColourField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  const { t } = useI18n();
  return (
    <fieldset>
      <legend className="flex items-center gap-3 text-[13px] font-semibold text-heritage-brown-900">
        <span className="h-5 w-5 rounded-full border border-black/10" style={{ background: value }} aria-hidden="true" />
        {label}
        <span className="font-normal text-heritage-brown-600">{swatchName(t, value)}</span>
      </legend>
      <div className="mt-3 grid grid-cols-8 gap-2 max-w-sm">
        {SWATCHES.map((s) => {
          const on = s.hex.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={s.id}
              type="button"
              title={t.options.swatches[s.id]}
              aria-label={`${label}: ${t.options.swatches[s.id]}`}
              aria-pressed={on}
              onClick={() => onChange(s.hex)}
              className={`aspect-square rounded-full border transition-transform hover:scale-110 ${on ? "ring-2 ring-offset-2 ring-silk-red-700 border-transparent" : "border-black/10"}`}
              style={{ background: s.hex }}
            />
          );
        })}
      </div>
      <label htmlFor={id} className="mt-3 inline-flex items-center gap-2 text-xs text-heritage-brown-700 cursor-pointer">
        <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-heritage-brown-200 bg-white" />
        {t.order.pickExact}
      </label>
    </fieldset>
  );
}

/* ------------------------------------------------------------------ */
/* Builder                                                             */
/* ------------------------------------------------------------------ */

export function OrderBuilder() {
  const { t } = useI18n();
  const o = t.options;
  const [s, setS] = useState<FormState>(EMPTY);
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

  // Restore / persist the draft (files can't be stored; choices can). ?type= and ?preset= pre-select.
  useEffect(() => {
    let next = EMPTY;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<FormState>;
        next = { ...EMPTY, ...saved, design: { ...EMPTY.design, ...(saved.design ?? {}) }, website: "" };
      }
    } catch {
      /* storage unavailable */
    }
    const type = params.get("type");
    if (type && (SAREE_TYPE_IDS as readonly string[]).includes(type)) next = { ...next, sareeType: type as SareeTypeId };
    const preset = params.get("preset");
    if (preset && (PRESET_IDS as readonly string[]).includes(preset)) next = { ...next, design: { ...PRESETS[preset as PresetId] } };
    setS(next);
    loaded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!loaded.current || result) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...s, website: "" }));
    } catch {
      /* ignore */
    }
  }, [s, result]);

  const previews = useMemo(
    () => files.map((f) => ({ f, url: f.type.startsWith("image/") && !/hei[cf]/.test(f.type) ? URL.createObjectURL(f) : null })),
    [files],
  );
  useEffect(() => () => previews.forEach((p) => p.url && URL.revokeObjectURL(p.url)), [previews]);

  const set = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) => {
    setS((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k as ErrKey]: undefined }));
  }, []);
  const setD = useCallback(<K extends keyof SareeDesign>(k: K, v: SareeDesign[K]) => setS((p) => ({ ...p, design: { ...p.design, [k]: v } })), []);

  const design = useMemo(() => previewDesign(s), [s]);
  const pctFixed = fixedPct(s.silk);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const ok: File[] = [];
    let err = "";
    for (const f of Array.from(list)) {
      if (f.size > MAX_BYTES) err = fmt(t.order.errors.fileSize, { name: f.name });
      else if (!/^(image\/(jpeg|png|webp|heic|heif)|application\/pdf)$/.test(f.type) && !/\.(heic|heif)$/i.test(f.name)) err = fmt(t.order.errors.fileType, { name: f.name });
      else ok.push(f);
    }
    if (files.length + ok.length > MAX_FILES) err = t.order.errors.fileCount;
    setFiles([...files, ...ok].slice(0, MAX_FILES));
    setErrors((e) => ({ ...e, files: err || undefined }));
  };

  const go = (to: number) => {
    if (to > step) {
      const e = validate(step, s, t);
      if (Object.keys(e).length) {
        setErrors(e);
        return;
      }
    }
    setStep(to);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submit = async () => {
    const e = validate(5, s, t);
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await submitCustomOrder(toPayload(s), files);
      setResult({ code: res.reference_code });
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      // Validation messages from the API are shown as-is; network failures get the friendly text.
      setSubmitError(msg && !/fetch|network|failed to|load failed/i.test(msg) ? msg : t.common.serverDown);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------- success ---------------------------- */
  if (result) {
    const wa = getWhatsAppLink(`${summaryText(s, t, result.code)}\n\n${t.order.attachNote}`);
    return (
      <div ref={topRef} className="scroll-mt-28 rounded-3xl bg-heritage-brown-950 text-ivory-50 p-8 sm:p-12 text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-gold-500 text-heritage-brown-950 flex items-center justify-center">
          <Check className="w-7 h-7" aria-hidden="true" />
        </div>
        <h2 className="mt-6 font-serif text-3xl sm:text-4xl">{t.order.successTitle}</h2>
        <p className="mt-3 text-ivory-300 max-w-lg mx-auto">{fmt(t.order.successBody, { how: t.order.how[s.preferred_contact] })}</p>
        <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-gold-400/40 px-6 py-4">
          <span className="text-xs tracking-widest uppercase text-gold-300">{t.order.yourRef}</span>
          <span className="font-mono text-2xl tracking-widest">{result.code}</span>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(result.code).then(() => setCopied(true))}
            className="ml-1 rounded-full p-2 hover:bg-white/10"
            aria-label={t.order.copyRef}
          >
            {copied ? <Check className="w-4 h-4 text-gold-300" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-500 text-heritage-brown-950 px-6 py-3.5 text-sm font-semibold">
            <MessageCircle className="w-4 h-4" aria-hidden="true" /> {t.order.alsoWhatsapp}
          </a>
          <Link href={`/order-status?ref=${result.code}`} className="inline-flex items-center justify-center gap-2 rounded-full border border-ivory-200/30 px-6 py-3.5 text-sm font-semibold">
            {t.order.trackThis}
          </Link>
        </div>
      </div>
    );
  }

  /* ------------------------------ form ----------------------------- */
  const waFallback = getWhatsAppLink(summaryText(s, t));
  const d = s.design;

  return (
    <div ref={topRef} className="scroll-mt-28 grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      <div className="lg:col-span-7">
        {/* Stepper */}
        <ol className="flex items-center gap-2 overflow-x-auto pb-2" aria-label={t.order.stepsLabel}>
          {t.order.steps.map((label, i) => (
            <li key={i} className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => i < step && go(i)}
                disabled={i > step}
                aria-current={i === step ? "step" : undefined}
                className={`flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1.5 text-xs font-semibold transition-colors ${
                  i === step ? "bg-heritage-brown-950 text-ivory-50" : i < step ? "bg-gold-100 text-heritage-brown-900 hover:bg-gold-200" : "text-heritage-brown-400"
                }`}
              >
                <span
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] ${
                    i === step ? "bg-gold-500 text-heritage-brown-950" : i < step ? "bg-heritage-brown-950 text-gold-300" : "border border-heritage-brown-300"
                  }`}
                >
                  {i < step ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : i + 1}
                </span>
                {label}
              </button>
              {i < STEP_COUNT - 1 && <span className="h-px w-4 bg-heritage-brown-200" aria-hidden="true" />}
            </li>
          ))}
        </ol>
        <div className="mt-2 h-1 rounded-full bg-heritage-brown-100 overflow-hidden" aria-hidden="true">
          <div className="h-full bg-gradient-to-r from-silk-red-700 to-gold-500 transition-all duration-700" style={{ width: `${((step + 1) / STEP_COUNT) * 100}%` }} />
        </div>

        <form
          className="mt-8"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (step < STEP_COUNT - 1) go(step + 1);
            else submit();
          }}
        >
          {/* honeypot */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" value={s.website} onChange={(e) => set("website", e.target.value)} />
            </label>
          </div>

          <div key={step} className="animate-[pvs-step-in_0.5s_ease-out] space-y-6">
            {step === 0 && (
              <>
                <SectionTitle>{t.order.whoTitle}</SectionTitle>
                <div className="grid sm:grid-cols-3 gap-3">
                  {SEGMENTS.map(({ id, icon: Icon }) => (
                    <ChoiceCard key={id} selected={s.segment === id} onClick={() => set("segment", id)}>
                      <Icon className="w-6 h-6 text-silk-red-700" aria-hidden="true" />
                      <p className="mt-3 font-semibold text-heritage-brown-950">{o.segments[id].title}</p>
                      <p className="mt-1 text-xs text-heritage-brown-600 leading-relaxed">{o.segments[id].body}</p>
                    </ChoiceCard>
                  ))}
                </div>
                <div className="rounded-2xl bg-gold-50 border border-gold-200 p-4 text-sm text-heritage-brown-800">{t.order.noCommitment}</div>
              </>
            )}

            {step === 1 && (
              <>
                <SectionTitle>{t.order.sareeTitle}</SectionTitle>
                <Field id="saree_type" label={t.order.sareeType} error={errors.sareeType}>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {SAREE_TYPE_IDS.map((id) => (
                      <ChoiceCard key={id} selected={s.sareeType === id} onClick={() => set("sareeType", id)} className="py-3 text-sm font-medium text-heritage-brown-900">
                        {o.sareeTypes[id]}
                      </ChoiceCard>
                    ))}
                  </div>
                </Field>
                <Field id="occasion" label={`${t.order.occasion} (${t.common.optional})`}>
                  <select id="occasion" className={inputCls} value={s.occasion} onChange={(e) => set("occasion", e.target.value as OccasionId | "")}>
                    <option value="">{t.order.select}</option>
                    {OCCASION_IDS.map((id) => (
                      <option key={id} value={id}>
                        {o.occasions[id]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="files" label={`${t.order.yourDesign} (${t.common.optional})`} hint={t.order.yourDesignHint} error={errors.files}>
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
                    <span className="text-sm font-semibold text-heritage-brown-900">{t.order.drop}</span>
                    <span className="text-xs text-heritage-brown-600">{t.order.fileTypes}</span>
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
                            aria-label={fmt(t.order.removeFile, { name: f.name })}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Field>
                <Field id="design_notes" label={`${t.order.notes} (${t.common.optional})`} hint={t.order.notesHint}>
                  <textarea id="design_notes" rows={4} maxLength={3000} className={inputCls} value={s.notes} onChange={(e) => set("notes", e.target.value)} placeholder={t.order.notesPlaceholder} />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <SectionTitle>{t.order.designTitle}</SectionTitle>
                <p className="text-sm text-heritage-brown-700 -mt-3">{t.order.designHint}</p>

                <fieldset>
                  <legend className="text-[13px] font-semibold text-heritage-brown-900">{t.order.presetsTitle}</legend>
                  <div className="mt-2 flex gap-3 overflow-x-auto pb-2 snap-x">
                    {PRESET_IDS.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => set("design", { ...PRESETS[id] })}
                        className="snap-start shrink-0 w-40 rounded-2xl border border-heritage-brown-200 bg-[#f4ecdd] p-2 text-left hover:border-gold-500 transition-colors"
                      >
                        <SareeFlat design={PRESETS[id]} variant="fold" className="h-28" label={t.presets[id].name} />
                        <p className="mt-1.5 px-1 text-xs font-semibold text-heritage-brown-950">{t.presets[id].name}</p>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-[13px] font-semibold text-heritage-brown-900">{t.order.borderStyle}</legend>
                  <div className="mt-2 grid sm:grid-cols-2 gap-2">
                    {BORDER_STYLES.map((b) => (
                      <ChoiceCard
                        key={b}
                        selected={d.borderStyle === b}
                        onClick={() => {
                          setD("borderStyle", b);
                          if (b === "gangaJamuna" && !d.border2) setD("border2", "#C2185B");
                        }}
                      >
                        <p className="font-semibold text-sm text-heritage-brown-950">{o.borderStyles[b].label}</p>
                        <p className="mt-1 text-xs text-heritage-brown-600 leading-relaxed">{o.borderStyles[b].help}</p>
                      </ChoiceCard>
                    ))}
                  </div>
                </fieldset>
                {d.borderStyle !== "minimal" && <MotifPicker legend={t.order.borderMotif} value={d.borderMotif} onChange={(m) => setD("borderMotif", m)} ground={d.border} />}

                <fieldset>
                  <legend className="text-[13px] font-semibold text-heritage-brown-900">{t.order.bodyPattern}</legend>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BODY_PATTERNS.map((p) => (
                      <ChoiceCard key={p} selected={d.bodyPattern === p} onClick={() => setD("bodyPattern", p)} className="p-3">
                        <p className="font-semibold text-sm text-heritage-brown-950">{o.bodyPatterns[p].label}</p>
                        <p className="mt-1 text-[11px] text-heritage-brown-600 leading-snug">{o.bodyPatterns[p].help}</p>
                      </ChoiceCard>
                    ))}
                  </div>
                </fieldset>
                {(d.bodyPattern === "buttas" || d.bodyPattern === "checks" || d.bodyPattern === "jaal") && (
                  <MotifPicker legend={t.order.bodyMotif} value={d.bodyMotif} onChange={(m) => setD("bodyMotif", m)} ground={d.body} />
                )}

                <fieldset>
                  <legend className="text-[13px] font-semibold text-heritage-brown-900">{t.order.palluStyle}</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {PALLU_STYLES.map((p) => (
                      <ChoiceCard key={p} selected={d.palluStyle === p} onClick={() => setD("palluStyle", p)} className="p-3">
                        <p className="font-semibold text-sm text-heritage-brown-950">{o.palluStyles[p].label}</p>
                        <p className="mt-1 text-[11px] text-heritage-brown-600 leading-snug">{o.palluStyles[p].help}</p>
                      </ChoiceCard>
                    ))}
                  </div>
                </fieldset>
                {(d.palluStyle === "grand" || d.palluStyle === "motifRows") && (
                  <MotifPicker legend={t.order.palluMotif} value={d.palluMotif} onChange={(m) => setD("palluMotif", m)} ground={d.pallu} />
                )}
              </>
            )}

            {step === 3 && (
              <>
                <SectionTitle>{t.order.colourTitle}</SectionTitle>
                <p className="text-sm text-heritage-brown-700 -mt-3">{t.order.colourHint}</p>
                <ColourField id="c-body" label={t.order.body} value={d.body} onChange={(v) => setD("body", v)} />
                <ColourField id="c-border" label={t.order.border} value={d.border} onChange={(v) => setD("border", v)} />
                {d.borderStyle === "gangaJamuna" && <ColourField id="c-border2" label={t.order.border2} value={d.border2 ?? "#C2185B"} onChange={(v) => setD("border2", v)} />}
                <ColourField id="c-pallu" label={t.order.pallu} value={d.pallu} onChange={(v) => setD("pallu", v)} />
              </>
            )}

            {step === 4 && (
              <>
                <SectionTitle>{t.order.silkTitle}</SectionTitle>
                <fieldset>
                  <legend className="text-[13px] font-semibold text-heritage-brown-900">{t.order.silk}</legend>
                  <div className="mt-2 grid sm:grid-cols-2 gap-2">
                    {SILK_OPTIONS.map(({ id }) => (
                      <ChoiceCard key={id} selected={s.silk === id} onClick={() => set("silk", id)}>
                        <p className="font-semibold text-sm text-heritage-brown-950">{o.silkTypes[id].label}</p>
                        <p className="mt-1 text-xs text-heritage-brown-600 leading-relaxed">{o.silkTypes[id].help}</p>
                      </ChoiceCard>
                    ))}
                  </div>
                </fieldset>
                {pctFixed === undefined && s.silk !== "notSure" && (
                  <Field id="silk_percentage" label={fmt(t.order.silkContent, { pct: s.silkPct })} hint={t.order.silkContentHint}>
                    <input
                      id="silk_percentage"
                      type="range"
                      min={10}
                      max={90}
                      step={5}
                      value={s.silkPct}
                      onChange={(e) => set("silkPct", Number(e.target.value))}
                      className="w-full accent-silk-red-700"
                    />
                  </Field>
                )}
                <fieldset>
                  <legend className="text-[13px] font-semibold text-heritage-brown-900">{t.order.zari}</legend>
                  <div className="mt-2 grid sm:grid-cols-2 gap-2">
                    {ZARI_OPTIONS.map(({ id, tone }) => (
                      <ChoiceCard key={id} selected={s.zari === id} onClick={() => set("zari", id)}>
                        <p className="flex items-center gap-2 font-semibold text-sm text-heritage-brown-950">
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-black/10"
                            style={{ background: tone === "silver" ? "#C8C8CC" : tone === "antique" ? "#A8844A" : tone === "none" ? "transparent" : "#D8B25C" }}
                            aria-hidden="true"
                          />
                          {o.zariTypes[id].label}
                        </p>
                        <p className="mt-1 text-xs text-heritage-brown-600 leading-relaxed">{o.zariTypes[id].help}</p>
                      </ChoiceCard>
                    ))}
                  </div>
                  <p className="mt-2 text-xs">
                    <Link href="/our-craft#guide" className="underline text-silk-red-700">
                      {t.order.guideLink}
                    </Link>
                  </p>
                </fieldset>
              </>
            )}

            {step === 5 && (
              <>
                <SectionTitle>{t.order.detailsTitle}</SectionTitle>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field id="quantity" label={t.order.quantity} error={errors.quantity}>
                    <input id="quantity" type="number" min={1} max={10000} inputMode="numeric" className={inputCls} value={s.quantity} onChange={(e) => set("quantity", Math.max(0, Number(e.target.value)))} />
                  </Field>
                  <Field id="needed_by" label={`${t.order.neededBy} (${t.common.optional})`} error={errors.needed_by}>
                    <input id="needed_by" type="date" min={new Date().toISOString().slice(0, 10)} className={inputCls} value={s.needed_by} onChange={(e) => set("needed_by", e.target.value)} />
                  </Field>
                  <Field id="budget_range" label={t.order.budget}>
                    <select id="budget_range" className={inputCls} value={s.budget} onChange={(e) => set("budget", e.target.value as BudgetId | "")}>
                      <option value="">{t.order.select}</option>
                      {BUDGET_IDS.map((id) => (
                        <option key={id} value={id}>
                          {o.budgets[id]}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field id="contact_name" label={t.order.name} error={errors.contact_name}>
                    <input id="contact_name" autoComplete="name" className={inputCls} value={s.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
                  </Field>
                  <Field id="phone" label={t.order.phone} error={errors.phone}>
                    <input id="phone" type="tel" autoComplete="tel" inputMode="tel" className={inputCls} value={s.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91" />
                  </Field>
                  <Field id="city" label={t.order.city}>
                    <input id="city" autoComplete="address-level2" className={inputCls} value={s.city} onChange={(e) => set("city", e.target.value)} />
                  </Field>
                  <Field id="email" label={`${t.order.email} (${t.common.optional})`} error={errors.email}>
                    <input id="email" type="email" autoComplete="email" className={inputCls} value={s.email} onChange={(e) => set("email", e.target.value)} />
                  </Field>
                  {s.segment !== "INDIVIDUAL" && (
                    <Field id="business_name" label={t.order.business} error={errors.business_name}>
                      <input id="business_name" autoComplete="organization" className={inputCls} value={s.business_name} onChange={(e) => set("business_name", e.target.value)} />
                    </Field>
                  )}
                </div>
                <fieldset>
                  <legend className="text-[13px] font-semibold text-heritage-brown-900">{t.order.reachTitle}</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["whatsapp", "call", "visit", "email"] as const).map((v) => (
                      <ChoiceCard key={v} selected={s.preferred_contact === v} onClick={() => set("preferred_contact", v)} className="!rounded-full px-4 py-2 text-sm">
                        {o.contactPrefs[v]}
                      </ChoiceCard>
                    ))}
                  </div>
                </fieldset>
                <label className="flex items-start gap-3 text-sm text-heritage-brown-800">
                  <input type="checkbox" className="mt-1 accent-silk-red-700" checked={s.consent} onChange={(e) => set("consent", e.target.checked)} />
                  {t.order.consent}
                </label>
              </>
            )}
          </div>

          {submitError && (
            <div role="alert" className="mt-6 rounded-2xl border border-silk-red-200 bg-silk-red-50 p-4 text-sm text-silk-red-800">
              <p>{submitError}</p>
              <a href={waFallback} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 font-semibold underline">
                <MessageCircle className="w-4 h-4" aria-hidden="true" /> {t.common.sendOnWhatsapp}
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
              <ArrowLeft className="w-4 h-4" aria-hidden="true" /> {t.common.back}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="group inline-flex items-center gap-2 rounded-full bg-silk-red-700 hover:bg-heritage-brown-950 disabled:opacity-60 text-ivory-50 px-7 py-3.5 text-sm font-semibold tracking-wide transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> {t.common.sending}
                </>
              ) : step < STEP_COUNT - 1 ? (
                <>
                  {t.common.continue} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </>
              ) : (
                <>
                  {t.order.sendRequest} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Live preview + summary */}
      <aside className="lg:col-span-5 lg:sticky lg:top-28 space-y-5" aria-label={t.order.previewTitle}>
        <div className="rounded-3xl bg-heritage-brown-950 p-4 sm:p-5">
          <p className="text-[11px] tracking-[0.25em] uppercase text-gold-300 mb-3">{t.order.previewTitle}</p>
          <div className="[&_p.text-heritage-brown-600]:text-ivory-300/80">
            <SareePreview design={design} />
          </div>
        </div>
        <dl className="rounded-3xl border border-heritage-brown-200 bg-white p-5 text-sm grid grid-cols-2 gap-x-4 gap-y-3">
          {[
            [t.order.summary.saree, s.sareeType ? o.sareeTypes[s.sareeType] : "—"],
            [t.order.summary.quantity, String(s.quantity || "—")],
            [t.order.summary.silk, `${o.silkTypes[s.silk].label}${pctFixed === undefined && s.silk !== "notSure" ? ` · ${s.silkPct}%` : ""}`],
            [t.order.summary.zari, o.zariTypes[s.zari].label],
            [t.order.summary.border, o.borderStyles[d.borderStyle].label],
            [t.order.summary.motifs, [d.borderMotif, d.bodyMotif, d.palluMotif].filter(Boolean).map((m) => o.motifs[m as MotifId]).join(", ") || "—"],
            [t.order.summary.designs, files.length ? fmt(t.order.summary.files, { n: files.length }) : "—"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] uppercase tracking-wider text-heritage-brown-500">{k}</dt>
              <dd className="mt-0.5 font-medium text-heritage-brown-950">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="rounded-3xl border border-gold-300/60 bg-gold-50 p-5 text-sm">
          <p className="font-semibold text-heritage-brown-950">{t.order.preferTalk}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={`tel:+${siteConfig.business.phoneNumeric}`} className="inline-flex items-center gap-2 rounded-full bg-white border border-heritage-brown-200 px-4 py-2 font-medium">
              <Phone className="w-4 h-4" aria-hidden="true" /> {t.common.call}
            </a>
            <a href={waFallback} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white border border-heritage-brown-200 px-4 py-2 font-medium">
              <MessageCircle className="w-4 h-4" aria-hidden="true" /> {t.common.whatsapp}
            </a>
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-white border border-heritage-brown-200 px-4 py-2 font-medium">
              {t.common.visitUs}
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}

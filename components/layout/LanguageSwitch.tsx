"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";

/** EN | தமிழ் toggle. Stores the choice for a year and re-renders the page on the server. */
export function LanguageSwitch({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();

  const choose = (l: Locale) => {
    if (l === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = l;
    start(() => router.refresh());
  };

  const base = variant === "dark" ? "border-ivory-200/30 text-ivory-100" : "border-gold-400/40 text-heritage-brown-900";
  return (
    <div
      role="group"
      aria-label={t.common.languageLabel}
      className={`inline-flex items-center rounded-full border p-0.5 text-[11px] font-semibold ${base} ${pending ? "opacity-60" : ""}`}
    >
      <Languages className="w-3.5 h-3.5 mx-1.5 opacity-70" aria-hidden="true" />
      {(["en", "ta"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          aria-pressed={locale === l}
          lang={l}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            locale === l
              ? variant === "dark"
                ? "bg-gold-500 text-heritage-brown-950"
                : "bg-heritage-brown-950 text-gold-300"
              : "hover:text-silk-red-700"
          } ${l === "ta" ? "font-tamil" : ""}`}
        >
          {l === "en" ? "EN" : "தமிழ்"}
        </button>
      ))}
    </div>
  );
}

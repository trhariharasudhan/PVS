import "server-only";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { en } from "./dictionaries/en";
import { ta } from "./dictionaries/ta";
import type { Dict } from "./types";

const DICTS: Record<Locale, Dict> = { en, ta };

/** Locale from the visitor's choice (cookie); first visit falls back to the browser language. */
export function getLocale(): Locale {
  const c = cookies().get(LOCALE_COOKIE)?.value;
  if (isLocale(c)) return c;
  const accept = headers().get("accept-language") ?? "";
  return /^ta\b|,\s*ta\b/i.test(accept) ? "ta" : DEFAULT_LOCALE;
}

export function getDict(locale: Locale = getLocale()): Dict {
  return DICTS[locale];
}

export function getI18n() {
  const locale = getLocale();
  return { locale, t: DICTS[locale] };
}

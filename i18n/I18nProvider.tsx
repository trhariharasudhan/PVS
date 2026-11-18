"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "./config";
import type { Dict } from "./types";

const Ctx = createContext<{ locale: Locale; t: Dict } | null>(null);

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dict; children: ReactNode }) {
  return <Ctx.Provider value={{ locale, t: dict }}>{children}</Ctx.Provider>;
}

/** Client components: const { t, locale } = useI18n(); */
export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside <I18nProvider>");
  return v;
}

export { fmt } from "./fmt";

import { createContext, useContext } from "react";
import type { Translations } from "./types";
import { zh } from "./locales/zh";
import { en } from "./locales/en";

export type Locale = "zh" | "en";

const locales: Record<Locale, Translations> = { zh, en };

export const I18nContext = createContext<{
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
}>({
  locale: "zh",
  t: zh,
  setLocale: () => {},
});

export function useI18n() {
  return useContext(I18nContext);
}

export function getTranslations(locale: Locale): Translations {
  return locales[locale] ?? zh;
}

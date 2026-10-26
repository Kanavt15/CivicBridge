"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { Languages, ChevronDown } from "lucide-react";
import {
  isLocale,
  localeNames,
  locales,
  localeTags,
  translate,
  type Locale,
} from "@/lib/i18n/messages";
const Context = createContext<{ locale: Locale; setLocale: (locale: Locale) => void }>({
  locale: "en",
  setLocale: () => {},
});
export function LocaleProvider({
  children,
  initialLocale = "en",
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, set] = useState<Locale>(initialLocale);
  useEffect(() => {
    document.documentElement.lang = localeTags[locale];
  }, [locale]);
  function setLocale(next: Locale) {
    if (!isLocale(next)) return;
    set(next);
    document.cookie = `civicbridge_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    document.documentElement.lang = localeTags[next];
  }
  return <Context.Provider value={{ locale, setLocale }}>{children}</Context.Provider>;
}
export function useI18n() {
  const context = useContext(Context);
  return {
    ...context,
    t: (source: string, variables?: Record<string, string | number>) =>
      translate(source, context.locale, variables),
  };
}
export function Text({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  return typeof children === "string" ? t(children) : children;
}
export function LocalDate({ value }: { value: string | Date }) {
  const { locale } = useI18n();
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString(localeTags[locale], {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
    : "—";
}
export function LanguagePicker() {
  const { locale, setLocale, t } = useI18n();
  return (
    <label className="language-picker">
      <Languages size={17} aria-hidden="true" />
      <span className="sr-only">{t("Choose language")}</span>
      <select
        aria-label={t("Choose language")}
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
      >
        {locales.map((l) => (
          <option value={l} key={l} lang={localeTags[l]}>
            {localeNames[l]}
          </option>
        ))}
      </select>
      <ChevronDown size={13} aria-hidden="true" />
    </label>
  );
}

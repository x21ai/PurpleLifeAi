import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import es from "./locales/es.json";

// Single source of truth for supported UI languages.
// Profile.locale persists the user's choice; on first load we fall back
// to browser detection so signed-out marketing pages still match.
export const SUPPORTED_LOCALES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]["value"];

if (!i18n.isInitialized) {
  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        es: { translation: es },
      },
      fallbackLng: "en",
      supportedLngs: SUPPORTED_LOCALES.map((l) => l.value),
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator", "htmlTag"],
        caches: ["localStorage"],
        lookupLocalStorage: "purple-locale",
      },
      react: { useSuspense: false },
    });
}

export default i18n;

export function setLocale(locale: SupportedLocale) {
  void i18n.changeLanguage(locale);
  try {
    localStorage.setItem("purple-locale", locale);
  } catch {
    // ignore — private mode
  }
}

export function detectBrowserLocale(): SupportedLocale {
  if (typeof navigator === "undefined") return "en";
  const raw = (navigator.language || "en").toLowerCase();
  if (raw.startsWith("es")) return "es";
  return "en";
}
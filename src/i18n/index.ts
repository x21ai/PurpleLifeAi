import i18n from "i18next";
import { initReactI18next } from "react-i18next";
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

const isBrowser = typeof window !== "undefined";

function initialLanguage(): SupportedLocale {
  if (!isBrowser) return "en";
  try {
    const stored = localStorage.getItem("purple-locale");
    if (stored === "en" || stored === "es") return stored;
  } catch {
    // ignore
  }
  const nav = (navigator.language || "en").toLowerCase();
  return nav.startsWith("es") ? "es" : "en";
}

if (!i18n.isInitialized) {
  void i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        es: { translation: es },
      },
      lng: initialLanguage(),
      fallbackLng: "en",
      supportedLngs: SUPPORTED_LOCALES.map((l) => l.value),
      interpolation: { escapeValue: false },
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
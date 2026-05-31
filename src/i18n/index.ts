import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import es from "./locales/es.json";

export const SUPPORTED_LOCALES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]["value"];

export const DEFAULT_LOCALE: SupportedLocale = "en";
const STORAGE_KEY = "purple-locale";
const SUPPORTED_VALUES = SUPPORTED_LOCALES.map((l) => l.value) as readonly SupportedLocale[];

function isSupported(value: unknown): value is SupportedLocale {
  return typeof value === "string" && (SUPPORTED_VALUES as readonly string[]).includes(value);
}

function normalize(raw: string | null | undefined): SupportedLocale | null {
  if (!raw) return null;
  const base = raw.toLowerCase().split(/[-_]/)[0];
  return isSupported(base) ? base : null;
}

function readStoredLocale(): SupportedLocale | null {
  if (typeof window === "undefined") return null;
  try {
    return normalize(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function readNavigatorLocale(): SupportedLocale | null {
  if (typeof navigator === "undefined") return null;
  const langs: string[] = Array.isArray(navigator.languages) && navigator.languages.length
    ? [...navigator.languages]
    : navigator.language
      ? [navigator.language]
      : [];
  for (const lang of langs) {
    const match = normalize(lang);
    if (match) return match;
  }
  return null;
}

/**
 * Fallback chain: saved (localStorage / profile-seeded) → navigator → default.
 *
 * Saved choice ALWAYS wins. Once the user picks a language in Account, that
 * value lands in localStorage via `setLocale` (and is also seeded from the
 * Supabase profile on sign-in via `seedLocaleFromProfile`), so navigating
 * across pages can never demote it back to the navigator language.
 *
 * Returns DEFAULT_LOCALE on the server so SSR is deterministic and identical
 * across requests; the browser re-resolves after hydration via `hydrateLocale`.
 */
export function resolveClientLocale(): SupportedLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  return readStoredLocale() ?? readNavigatorLocale() ?? DEFAULT_LOCALE;
}

if (!i18n.isInitialized) {
  void i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        es: { translation: es },
      },
      // Always start with the default so server and first client render
      // produce identical markup. `hydrateLocale()` switches post-hydration.
      lng: DEFAULT_LOCALE,
      fallbackLng: DEFAULT_LOCALE,
      supportedLngs: SUPPORTED_VALUES as unknown as string[],
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
}

export default i18n;

export function setLocale(locale: SupportedLocale) {
  if (!isSupported(locale)) return;
  void i18n.changeLanguage(locale);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore — private mode
  }
}

export function detectBrowserLocale(): SupportedLocale {
  return readNavigatorLocale() ?? DEFAULT_LOCALE;
}

/**
 * Browser-only. Call inside `useEffect` after hydration to switch i18next
 * to the resolved locale without causing an SSR/CSR markup mismatch.
 */
export function hydrateLocale(): SupportedLocale {
  const next = resolveClientLocale();
  if (i18n.language !== next) void i18n.changeLanguage(next);
  return next;
}

/**
 * Seed the locale cache from the signed-in user's `profiles.locale`.
 * This guarantees the saved choice survives a fresh browser / cleared
 * localStorage / new device. Browser-only; no-op on the server.
 */
export function seedLocaleFromProfile(raw: string | null | undefined) {
  if (typeof window === "undefined") return;
  const next = normalize(raw);
  if (!next) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore — private mode
  }
  if (i18n.language !== next) void i18n.changeLanguage(next);
}
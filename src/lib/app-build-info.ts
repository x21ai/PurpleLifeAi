const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "1.0.0";
const APP_BUILD_NUMBER = import.meta.env.VITE_APP_BUILD_NUMBER ?? "0";
const APP_BUILD_DATE = import.meta.env.VITE_APP_BUILD_DATE ?? "";

function formatBuildDate(raw: string): string {
  if (!raw) return "Unknown";
  try {
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return "Unknown";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(parsed);
  } catch {
    return "Unknown";
  }
}

/** User-facing label, e.g. `Version 1.0.0 (23) · Jul 6, 2026`. */
export function formatAppBuildLabel(): string {
  return `Version ${APP_VERSION} (${APP_BUILD_NUMBER}) · ${formatBuildDate(APP_BUILD_DATE)}`;
}

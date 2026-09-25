export type WwwRouteTarget = "assets" | "astro" | "tanstack";

const PLOY_PUBLIC_ROUTES = new Set([
  "/",
  "/about",
  "/charter",
  "/contact",
  "/features",
  "/privacy",
  "/terms",
  "/trust",
]);

const PLOY_LIVE_APP_ROUTES = new Set([
  "/documents",
  "/journal",
  "/journal/new",
  "/login",
  "/meds",
  "/meds/history",
  "/reports",
  "/reports/documents",
  "/sign-in",
  "/today",
  "/tools",
]);

export function normalizeWwwPathname(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

export function getWwwRouteTarget(pathname: string): WwwRouteTarget {
  const normalized = normalizeWwwPathname(pathname);

  if (
    normalized === "/favicon.ico" ||
    normalized === "/robots.txt" ||
    normalized === "/sitemap-index.xml" ||
    normalized === "/llms.txt" ||
    /^\/sitemap-.*\.xml$/.test(normalized)
  ) {
    return "assets";
  }

  if (normalized.startsWith("/api/") || normalized.startsWith("/oauth/")) {
    return "tanstack";
  }

  if (normalized.startsWith("/assets/")) {
    return "assets";
  }

  if (normalized.startsWith("/_ploy_static/_astro/")) {
    return "astro";
  }

  if (PLOY_PUBLIC_ROUTES.has(normalized) || PLOY_LIVE_APP_ROUTES.has(normalized)) {
    return "astro";
  }

  return "tanstack";
}

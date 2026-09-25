export type WwwRouteTarget = "astro" | "tanstack";

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

  if (normalized.startsWith("/api/") || normalized.startsWith("/oauth/")) {
    return "tanstack";
  }

  if (normalized.startsWith("/_astro/")) {
    return "astro";
  }

  if (PLOY_PUBLIC_ROUTES.has(normalized) || PLOY_LIVE_APP_ROUTES.has(normalized)) {
    return "astro";
  }

  return "tanstack";
}

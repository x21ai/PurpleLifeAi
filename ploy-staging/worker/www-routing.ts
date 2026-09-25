export type WwwRouteTarget = "assets" | "astro" | "tanstack";

/**
 * www hybrid routing:
 * - /api/* and /oauth/* → TanStack (production auth, data, OAuth, crons)
 * - static asset paths → ASSETS binding
 * - everything else → Ploy Astro (latest design, same page tree as staging)
 *
 * Do not fall back unfinished Ploy pages to TanStack — that shows the old UI.
 * TanStack is only for API/OAuth (and static assets via ASSETS).
 */
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

  // Worker OAuth + API stay on TanStack even when Ploy also has matching .astro files.
  if (normalized.startsWith("/api/") || normalized.startsWith("/oauth/")) {
    return "tanstack";
  }

  if (normalized.startsWith("/assets/")) {
    return "assets";
  }

  if (normalized.startsWith("/_ploy_static/_astro/")) {
    return "assets";
  }

  // Latest Ploy design for every other route (same as staging page tree).
  return "astro";
}

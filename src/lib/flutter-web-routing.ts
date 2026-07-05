/**
 * Path dispatch helpers for Flutter web cutover on the Worker (see docs/FLUTTER-WEB-CUTOVER.md).
 * Gated by FLUTTER_WEB_CUTOVER env var (default off until owner approves prod deploy).
 */

/** Signed-in app routes from flutter/lib/shell/routes.dart (prefix match). */
export const FLUTTER_APP_PATH_PREFIXES = [
  "/sign-in",
  "/welcome",
  "/today",
  "/vitals",
  "/seizures/new",
  "/hydration",
  "/journal",
  "/meds",
  "/settings",
  "/account",
  "/tools",
  "/care",
  "/chat",
  "/chat-care",
  "/reports",
] as const;

/** TanStack marketing SSR paths: stay on TanStack even when cutover flag is on. */
export const MARKETING_TANSTACK_PATHS = new Set([
  "/",
  "/about",
  "/features",
  "/pricing",
  "/charter",
  "/contact",
  "/privacy",
  "/terms",
  "/how-purple-thinks",
]);

const FLUTTER_ROOT_STATIC_FILES = new Set([
  "/main.dart.js",
  "/flutter_bootstrap.js",
  "/flutter.js",
  "/sqlite3.wasm",
  "/drift_worker.js",
]);

export function isFlutterWebCutoverEnabled(env: { FLUTTER_WEB_CUTOVER?: string }): boolean {
  const flag = env.FLUTTER_WEB_CUTOVER;
  return flag === "true" || flag === "1";
}

export function normalizePathname(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

export function isMarketingTanStackPath(pathname: string): boolean {
  return MARKETING_TANSTACK_PATHS.has(normalizePathname(pathname));
}

export function isFlutterAppPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return FLUTTER_APP_PATH_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

export function isFlutterStaticAsset(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  if (normalized.startsWith("/_flutter/")) return true;
  if (FLUTTER_ROOT_STATIC_FILES.has(normalized)) return true;
  if (normalized.startsWith("/canvaskit/") || normalized.startsWith("/skwasm/")) return true;
  return false;
}

/** Map root Flutter web asset requests to merged dist/client/_flutter/ layout. */
export function rewriteFlutterAssetPath(pathname: string): string {
  const normalized = normalizePathname(pathname);
  if (normalized.startsWith("/_flutter/")) return normalized;
  if (
    FLUTTER_ROOT_STATIC_FILES.has(normalized) ||
    normalized.startsWith("/canvaskit/") ||
    normalized.startsWith("/skwasm/")
  ) {
    return `/_flutter${normalized}`;
  }
  return normalized;
}

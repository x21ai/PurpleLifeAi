/**
 * Explicit allowlists for OAuth redirect URIs and cross-origin Worker API callers.
 * Never use Access-Control-Allow-Origin: * for authenticated routes.
 */

/** HTTPS/HTTP site origins permitted for OAuth callbacks and CORS. */
export const PURPLE_ALLOWED_SITE_ORIGINS = new Set([
  "https://www.purplelife.org",
  "https://purplelife.org",
  /** Staging proxies /api/* to prod; include only for OAuth QA if callbacks ship there. */
  "https://staging.purplelife.org",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:8765",
  "http://127.0.0.1:8765",
]);

/** Native custom-scheme redirect URIs (Google/Apple sign-in + wearables). */
export const PURPLE_NATIVE_REDIRECT_URIS = new Set([
  "org.purplelife.app://auth-callback",
  "org.purplelife.app://reset-password",
  "org.purplelife.app://oauth-oura-callback",
  "org.purplelife.app://oauth-whoop-callback",
]);

const SOCIAL_OAUTH_CALLBACK_PATHS = new Set([
  "/oauth/google/callback",
  "/oauth/apple/callback",
]);

const WEARABLE_OAUTH_CALLBACK_PATHS = new Set([
  "/oauth/oura/callback",
  "/oauth/whoop/callback",
]);

export function normalizeSiteOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function isAllowedSiteOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false;
  return PURPLE_ALLOWED_SITE_ORIGINS.has(origin);
}

/**
 * Resolve the public site origin used to build provider callback URLs.
 * Rejects arbitrary `redirect_to` hosts (open-redirect hardening).
 */
export function resolveOAuthSiteOrigin(
  redirectTo?: string | null,
  fallback?: string | null,
): string {
  const trimmed = redirectTo?.trim();
  if (trimmed?.startsWith("http")) {
    const origin = normalizeSiteOrigin(trimmed);
    if (origin && isAllowedSiteOrigin(origin)) return origin;
  }

  const envFallback =
    fallback?.replace(/\/+$/, "") ??
    (typeof process !== "undefined" ? process.env.PUBLIC_SITE_URL?.replace(/\/+$/, "") : undefined);

  return envFallback ?? "https://www.purplelife.org";
}

function callbackPath(url: string): string | null {
  try {
    return new URL(url).pathname.replace(/\/+$/, "") || "/";
  } catch {
    return null;
  }
}

export function isAllowedSocialOAuthRedirectUri(redirectUri: string): boolean {
  const path = callbackPath(redirectUri);
  if (!path || !SOCIAL_OAUTH_CALLBACK_PATHS.has(path)) return false;
  const origin = normalizeSiteOrigin(redirectUri);
  return Boolean(origin && isAllowedSiteOrigin(origin));
}

export function isAllowedWearableOAuthRedirectUri(redirectUri: string): boolean {
  if (PURPLE_NATIVE_REDIRECT_URIS.has(redirectUri)) return true;
  const path = callbackPath(redirectUri);
  if (!path || !WEARABLE_OAUTH_CALLBACK_PATHS.has(path)) return false;
  const origin = normalizeSiteOrigin(redirectUri);
  return Boolean(origin && isAllowedSiteOrigin(origin));
}

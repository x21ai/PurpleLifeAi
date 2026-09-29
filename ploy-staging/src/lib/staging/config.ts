/** True when Astro build baked VITE_STAGING_LIVE_DATA=1 (staging.purplelife.org). */
export function isStagingLiveData(): boolean {
  return import.meta.env.VITE_STAGING_LIVE_DATA === "1";
}

/**
 * True for live Ploy builds (`VITE_PUBLIC_SITE_ENV=production`).
 * www and staging.purplelife.org both set that flag so marketing is the live journal,
 * not the design-preview copy. Local `astro dev` without the flag keeps preview copy.
 * The host itself comes from Astro `site` and Worker `PUBLIC_SITE_URL`.
 */
export function isProductionSite(): boolean {
  return import.meta.env.VITE_PUBLIC_SITE_ENV === "production";
}

export const STAGING_SESSION_KEY = "purple-cf-session";

export const DESIGN_PREVIEW_DEFAULT_USER_ID = "bb160030-2ed6-45d7-8a5a-7f6f7879e9bb";

/** True when Astro build baked VITE_STAGING_LIVE_DATA=1 (staging.purplelife.org). */
export function isStagingLiveData(): boolean {
  return import.meta.env.VITE_STAGING_LIVE_DATA === "1";
}

export const STAGING_SESSION_KEY = "purple-cf-session";

export const DESIGN_PREVIEW_DEFAULT_USER_ID = "bb160030-2ed6-45d7-8a5a-7f6f7879e9bb";

/** Cloudflare bindings for purplelife-staging (prod D1/R2 + prod API service). */
export type StagingEnv = {
  ASSETS: Fetcher;
  PROD: Fetcher;
  DB: D1Database;
  STORAGE: R2Bucket;
  AUTH_JWT_SECRET?: string;
  DESIGN_PREVIEW?: string;
  /** When set, GET /api/public/design-preview/session requires this header value. */
  DESIGN_PREVIEW_BYPASS_SECRET?: string;
  DESIGN_PREVIEW_USER_ID?: string;
  DESIGN_PREVIEW_USER_EMAIL?: string;
  /** When "1", public design-preview mint is off; use POST /api/auth/sign-in. */
  STAGING_REAL_AUTH?: string;
  DATA_BACKEND?: string;
  STAGING_LIVE_DATA?: string;
  PUBLIC_SITE_URL?: string;
};

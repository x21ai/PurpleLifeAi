/** Cloudflare bindings for purplelife-staging (prod D1/R2 + prod API service). */
export type StagingEnv = {
  ASSETS: Fetcher;
  PROD: Fetcher;
  DB: D1Database;
  STORAGE: R2Bucket;
  AUTH_JWT_SECRET?: string;
  DESIGN_PREVIEW?: string;
  DESIGN_PREVIEW_USER_ID?: string;
  DESIGN_PREVIEW_USER_EMAIL?: string;
  DATA_BACKEND?: string;
  STAGING_LIVE_DATA?: string;
  PUBLIC_SITE_URL?: string;
};

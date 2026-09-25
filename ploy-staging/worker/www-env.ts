import type { PurpleWorkerBindings } from "../../src/lib/cloudflare/env";

/**
 * Cloudflare bindings for production `purplelife` after the Ploy Astro UI flip.
 * Same D1/R2/KV as www today; no PROD service binding and no design-preview vars.
 */
export type WwwEnv = Pick<
  PurpleWorkerBindings,
  | "ASSETS"
  | "SELF"
  | "DB"
  | "STORAGE"
  | "CACHE"
  | "DATA_BACKEND"
  | "AUTH_JWT_SECRET"
  | "CRON_SECRET"
  | "PUBLIC_SITE_URL"
  | "SUPABASE_URL"
  | "SUPABASE_PUBLISHABLE_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "OURA_CLIENT_ID"
  | "OURA_CLIENT_SECRET"
  | "WHOOP_CLIENT_ID"
  | "WHOOP_CLIENT_SECRET"
  | "ANTHROPIC_API_KEY"
  | "OPENAI_API_KEY"
  | "GOOGLE_CLIENT_ID"
  | "GOOGLE_CLIENT_SECRET"
  | "APPLE_CLIENT_ID"
  | "APPLE_CLIENT_SECRET"
  | "IMPORT_ADMIN_SECRET"
> & {
  ASSETS: Fetcher;
  DB: D1Database;
  STORAGE: R2Bucket;
  CACHE: KVNamespace;
  DESIGN_PREVIEW?: "0";
  STAGING_REAL_AUTH?: "1";
  STAGING_LIVE_DATA?: "1";
};

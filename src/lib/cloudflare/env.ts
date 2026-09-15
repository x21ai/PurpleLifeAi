/**
 * Cloudflare Worker binding types for Purple D1 + R2 + KV cutover.
 * Bindings are declared in wrangler.jsonc / wrangler.deploy.jsonc.
 */

export type PurpleD1Database = D1Database;

export type PurpleR2Bucket = R2Bucket;

export type PurpleKvNamespace = KVNamespace;

export type PurpleWorkerBindings = {
  /** D1 database (purplelifeai) */
  DB: PurpleD1Database;
  /** R2 bucket (purplelifeai) */
  STORAGE: PurpleR2Bucket;
  /** KV namespace (purplelifeai) */
  CACHE: PurpleKvNamespace;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
  SELF?: { fetch: (request: Request) => Promise<Response> };
  /** supabase (default) | cloudflare */
  DATA_BACKEND?: string;
  /** HS256 secret for Workers JWT auth (cloudflare backend only) */
  AUTH_JWT_SECRET?: string;
  CRON_SECRET?: string;
  PUBLIC_SITE_URL?: string;
  /** Legacy Supabase vars remain required until cutover completes */
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  OURA_CLIENT_ID?: string;
  OURA_CLIENT_SECRET?: string;
  WHOOP_CLIENT_ID?: string;
  WHOOP_CLIENT_SECRET?: string;
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
  FLUTTER_WEB_CUTOVER?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  /** Apple Services ID (e.g. org.purplelife.web) */
  APPLE_CLIENT_ID?: string;
  /** Apple client secret JWT (generated from .p8 key; rotate per Apple docs) */
  APPLE_CLIENT_SECRET?: string;
  IMPORT_ADMIN_SECRET?: string;
};

/** Resolve bindings from the Worker env object or Node process.env in dev. */
export function getWorkerBindings(env?: unknown): Partial<PurpleWorkerBindings> {
  const e = (env ?? {}) as Partial<PurpleWorkerBindings>;
  return {
    ...e,
    DATA_BACKEND: e.DATA_BACKEND ?? process.env.DATA_BACKEND,
    AUTH_JWT_SECRET: e.AUTH_JWT_SECRET ?? process.env.AUTH_JWT_SECRET,
    CRON_SECRET: e.CRON_SECRET ?? process.env.CRON_SECRET,
    PUBLIC_SITE_URL: e.PUBLIC_SITE_URL ?? process.env.PUBLIC_SITE_URL,
    SUPABASE_URL: e.SUPABASE_URL ?? process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY:
      e.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY:
      e.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
    OURA_CLIENT_ID: e.OURA_CLIENT_ID ?? process.env.OURA_CLIENT_ID,
    OURA_CLIENT_SECRET: e.OURA_CLIENT_SECRET ?? process.env.OURA_CLIENT_SECRET,
    WHOOP_CLIENT_ID: e.WHOOP_CLIENT_ID ?? process.env.WHOOP_CLIENT_ID,
    WHOOP_CLIENT_SECRET: e.WHOOP_CLIENT_SECRET ?? process.env.WHOOP_CLIENT_SECRET,
    ANTHROPIC_API_KEY: e.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: e.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY,
    GOOGLE_CLIENT_ID: e.GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: e.GOOGLE_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET,
    APPLE_CLIENT_ID: e.APPLE_CLIENT_ID ?? process.env.APPLE_CLIENT_ID,
    APPLE_CLIENT_SECRET: e.APPLE_CLIENT_SECRET ?? process.env.APPLE_CLIENT_SECRET,
    IMPORT_ADMIN_SECRET: e.IMPORT_ADMIN_SECRET ?? process.env.IMPORT_ADMIN_SECRET,
  };
}

/**
 * Feature flag: which persistence backend is active.
 *
 * - `supabase` (default): existing Supabase Postgres + Storage + Auth. Safe for prod.
 * - `cloudflare`: D1 + R2 + Workers JWT auth. Enable only after schema apply + import verify.
 *
 * Set DATA_BACKEND=cloudflare in Doppler / wrangler secrets when cutover is verified.
 */

export type DataBackend = "supabase" | "cloudflare";

export function getDataBackend(env?: { DATA_BACKEND?: string }): DataBackend {
  const raw =
    env?.DATA_BACKEND ??
    process.env.DATA_BACKEND ??
    (typeof import.meta !== "undefined"
      ? (import.meta.env.VITE_DATA_BACKEND as string | undefined)
      : undefined) ??
    "supabase";
  const normalized = raw.trim().toLowerCase();
  if (normalized === "cloudflare" || normalized === "cf" || normalized === "d1") {
    return "cloudflare";
  }
  return "supabase";
}

export function isCloudflareBackend(env?: { DATA_BACKEND?: string }): boolean {
  return getDataBackend(env) === "cloudflare";
}

export function isSupabaseBackend(env?: { DATA_BACKEND?: string }): boolean {
  return getDataBackend(env) === "supabase";
}

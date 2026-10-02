# Cloudflare cutover (D1 + R2 + KV)

**Status:** foundation landed; prod still on Supabase.

- **Flag:** `DATA_BACKEND=supabase|cloudflare` (default supabase)
- **Auth:** Workers JWT + D1 `auth_users` (not Supabase Auth on cloudflare path)
- **Bindings:** `DB`, `STORAGE`, `CACHE` in wrangler. `setRequestBindings` merges.
  A later `process.env` (strings only) must not drop `DB`, `STORAGE`, `CACHE`,
  `ASSETS`, or `PROD`, and must not drop omitted string secrets such as
  `AUTH_JWT_SECRET`. Regression: `bun run test:bindings`.
- **Auth follow-ups (live after #62, 2026-09-29):** PBKDF2 max 100000 iterations.
  `profiles` scopes by `id`. Smoke `limit: 5`. Mac smoke Doppler is `x21` /
  `prd_cloudflare`. E2E `password_hash` lives in D1 only, set from that Doppler
  config. Do not commit it.
- **Runbook:** `docs/CLOUDFLARE-MIGRATION.md`
- **Legacy:** Supabase `xxnzmfzsjplrutrgbzxy` stays until import verified
- **Flutter (2026-10-02):** TestFlight default `DATA_BACKEND=cloudflare`.
  Password sign-in is `POST /api/auth/sign-in`. That HS256 JWT is the bearer
  for `/api/data/query` and R2 storage. `DATA_BACKEND=supabase` is rollback
  only. Build `1.0.0+32`. Native OAuth handoff needs a www deploy. No refresh
  token (1 hour). Do not upload build 31.

# Cloudflare cutover (D1 + R2 + KV)

**Status:** foundation landed; prod still on Supabase.

- **Flag:** `DATA_BACKEND=supabase|cloudflare` (default supabase)
- **Auth:** Workers JWT + D1 `auth_users` (not Supabase Auth on cloudflare path)
- **Bindings:** `DB`, `STORAGE`, `CACHE` in wrangler. `setRequestBindings` merges.
  A later `process.env` (strings only) must not drop `DB`, `STORAGE`, `CACHE`,
  `ASSETS`, or `PROD`. Regression: `bun run test:bindings`.
- **Runbook:** `docs/CLOUDFLARE-MIGRATION.md`
- **Legacy:** Supabase `xxnzmfzsjplrutrgbzxy` stays until import verified

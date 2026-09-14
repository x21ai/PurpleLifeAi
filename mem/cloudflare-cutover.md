# Cloudflare cutover (D1 + R2 + KV)

**Status:** foundation landed; prod still on Supabase.

- **Flag:** `DATA_BACKEND=supabase|cloudflare` (default supabase)
- **Auth:** Workers JWT + D1 `auth_users` (not Supabase Auth on cloudflare path)
- **Bindings:** `DB`, `STORAGE`, `CACHE` in wrangler
- **Runbook:** `docs/CLOUDFLARE-MIGRATION.md`
- **Legacy:** Supabase `xxnzmfzsjplrutrgbzxy` stays until import verified

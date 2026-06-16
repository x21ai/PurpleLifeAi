## Goal

Ship `purple-migration/` so you can move Purple to your own Supabase **without** the OLD project's DB password. Everything that needs the source DB runs inside Lovable as a super-admin server function using `SUPABASE_SERVICE_ROLE_KEY`. Everything else is static files you commit.

## What I can ship (all of it)

### 1. `01-schema.sql` — consolidated schema
Concatenate every file in `supabase/migrations/` in timestamp order into one schema-only bundle (public + storage policies + auth-related triggers like `handle_new_user`). Schema only — no data rows. This is built from the repo, no DB access needed.

### 2. `02-data/*.csv` — all rows, all users, all public tables
New server function `exportAllTablesCsv` in `src/lib/migration-export.functions.ts`:
- Super-admin gated (reuses `assertSuperAdmin`)
- Loads `supabaseAdmin` (service role, bypasses RLS)
- Discovers every `public` table via `information_schema.tables`
- For each table: paginated `select('*')` (1000 rows/page), serialized to CSV with proper quoting + JSON/array stringification
- Streams all CSVs + `row-counts-source.txt` + `rls-source.txt` into a single ZIP (using `fflate`, Worker-compatible)
- Returned to the browser from `/admin/migration-export` as a download button: **"Download all-tables.zip"**

### 3. `03-auth/import-auth.mjs`
Node script. Reads `auth-users.json` (already produced by existing `exportAuthUsers`). For each user:
- `supabaseAdmin.auth.admin.createUser({ id, email, phone, email_confirm: true, user_metadata, app_metadata })` — preserves UUIDs
- If `SEND_RECOVERY=1`, also calls `generateLink({ type: 'recovery' })` and writes `recovery-links.json`
- Skips already-existing users; logs failures to `import-auth.errors.json`

### 4. `04-storage/`
- `migrate-storage.mjs` — reads `storage-manifest.json` (existing export), streams each signed URL → uploads to NEW project via `supabaseAdmin.storage.from(bucket).upload(path, blob, { upsert: true, contentType })`. Recreates the 5 private buckets first if missing.
- `verify-storage.mjs` — lists every object in each bucket on NEW, compares count + path set vs the manifest, prints diff.

### 5. `05-cutover/`
- `row-counts-source.txt` — generated at export time by the same server fn (tab-separated `table\tcount`) and included in the ZIP
- `rls-source.txt` — generated at export time: per public table, `rls_enabled` + policy count from `pg_tables` + `pg_policies`
- `verify-counts.sql` — same query shape, run against NEW after import; diff vs source baseline
- `verify-rls.sql` — same RLS/policy query against NEW
- `verify-cutover.sh` — wrapper: runs both SQL files against `$NEW_DB_URL` (you have NEW password), diffs vs the `-source.txt` baselines, exits non-zero on any mismatch

### 6. `checklist.md` + `README.md`
Step-by-step: (a) open `/admin/migration-export`, click 3 download buttons, (b) `psql $NEW_DB_URL -f 01-schema.sql`, (c) `node 03-auth/import-auth.mjs`, (d) unzip `02-data` and `\copy` each CSV into NEW (one-liner loop included), (e) `node 04-storage/migrate-storage.mjs`, (f) `bash 05-cutover/verify-cutover.sh`, (g) flip `.env` + `supabase/config.toml`, redeploy.

## Files to add/modify
- `src/lib/migration-export.functions.ts` — add `exportAllTablesCsv` server fn
- `src/routes/_app/admin.migration-export.tsx` — add 3rd "Download all-tables.zip" button + status
- `package.json` — add `fflate` (Worker-safe ZIP)
- New committed folder `purple-migration/` with `01-schema.sql`, `03-auth/import-auth.mjs`, `04-storage/{migrate-storage,verify-storage}.mjs`, `05-cutover/{verify-counts.sql,verify-rls.sql,verify-cutover.sh}`, `checklist.md`, `README.md`
- `02-data/` and the two `-source.txt` files arrive **inside the downloaded ZIP**, not committed (they are live data)

## Blockers / honest caveats
1. **Passwords don't come over.** `auth.encrypted_password` is not exposed by the Admin API. Users sign in via the one-time recovery link from step 3 (`SEND_RECOVERY=1`), or via Google OAuth which works unchanged once you reconfigure the provider on NEW.
2. **OAuth identities** (`auth.identities` rows) can't be recreated through the Admin API. Google users will re-link on first sign-in automatically because the email matches; the UUID is preserved so all their data still connects.
3. **MFA factors / sessions** don't transfer. Everyone signs in fresh.
4. **Worker size:** the ZIP is built in memory. If your total CSV size is >~100 MB this could OOM the Worker. If that happens I'll switch the button to per-table CSV downloads (still one click each, no DB password needed) — I'll know after the first run.
5. **Sequences:** after CSV `\copy`, any `bigserial`/`identity` sequences need `setval`. The README includes a one-liner that resets all public sequences to `max(id)+1`.
6. **Extensions:** `01-schema.sql` includes `create extension if not exists vector, pgcrypto, pg_trgm, pgmq` at the top so a fresh project boots cleanly.

## Order of operations once you approve
1. Add server fn + UI button + commit static `purple-migration/` skeleton
2. You open `/admin/migration-export`, click all 3 buttons, get the files
3. Run the 4 scripts against NEW in Cursor
4. Tell me "verify passed" and I flip `.env`/`config.toml`

Want me to build it?
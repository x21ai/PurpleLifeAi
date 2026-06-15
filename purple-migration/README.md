# Purple migration package

Move Purple from Lovable Cloud to your own Supabase project **without** needing
the source project's database password. Everything that reads the source DB
runs inside Lovable as a super-admin server function using the service role.

## What you need

- A new Supabase project (the NEW project). Have its connection string ready as `$NEW_DB_URL` and the service role key as `$NEW_SUPABASE_SERVICE_ROLE_KEY`.
- Node 20+ and `psql` on your laptop.
- Super-admin login on the current Purple deployment.

## Files in this package

| Path | Built where | Purpose |
|------|-------------|---------|
| `01-schema.sql` | Committed (built from `supabase/migrations/`) | Full schema for the NEW DB |
| `02-data/*.csv` | Downloaded from `/admin/migration-export` | All rows of all public tables |
| `03-auth/import-auth.mjs` | Committed | Re-creates auth users with preserved UUIDs |
| `04-storage/migrate-storage.mjs` | Committed | Copies every storage object to NEW |
| `04-storage/verify-storage.mjs` | Committed | Diffs NEW vs manifest |
| `05-cutover/row-counts-source.txt` | Inside `02-data` zip | Per-table source row counts |
| `05-cutover/verify-counts.sql` | Committed | Same counts on NEW |
| `05-cutover/verify-rls.sql` | Committed | RLS + policy counts on NEW |
| `05-cutover/verify-cutover.sh` | Committed | Wraps the verifiers and diffs |
| `checklist.md` | Committed | The runbook, in order |

## Order of operations

See `checklist.md`. TL;DR:

1. Open `/admin/migration-export` on the current site → click the three Download buttons.
2. `psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 -f 01-schema.sql`
3. `node 03-auth/import-auth.mjs` (set `SEND_RECOVERY=1` to email reset links)
4. Unzip the data bundle, `cd` into `02-data/`, then run the `\copy` loop in `checklist.md`.
5. `node 04-storage/migrate-storage.mjs`
6. `bash 05-cutover/verify-cutover.sh`
7. Flip the app's `.env` to NEW credentials and redeploy.

## Honest caveats

- Passwords don't transfer. Users sign in via the recovery link or via Google. UUIDs are preserved so all relational data still connects.
- OAuth identity rows aren't recreated by the Admin API. Google re-links on first sign-in because the email + UUID match.
- MFA factors and sessions don't transfer.
- If the all-tables ZIP is larger than ~100 MB the Worker may OOM. If that happens, we'll split the export per-table.
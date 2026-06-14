
# Purple → your own Supabase: migration plan

Scope locked from your last message. No Lovable support ticket. Google re-links on first sign-in via your own OAuth client. DNS does not flip until three verifications pass.

---

## Step A — Auth shells (preserve UUIDs, reset passwords)

Build `/mnt/documents/03-auth/`:

- `auth-users.csv` — one row per existing user from Lovable Cloud's `auth.users`, columns: `id, email, email_confirmed_at, phone, raw_user_meta_data, raw_app_meta_data, created_at`. **No `encrypted_password`** (Cloud doesn't expose it; we're not waiting on support).
- `import-auth.mjs` — Node script you run locally with `NEW_SUPABASE_URL` + `NEW_SERVICE_ROLE_KEY`. For each row:
  1. `auth.admin.createUser({ id, email, email_confirm: true, user_metadata, app_metadata })` — Supabase Admin API accepts a provided `id`, so the UUID is preserved and every FK in the public schema stays intact.
  2. Generate a recovery link via `auth.admin.generateLink({ type: 'recovery', email })` and either (a) let Supabase send it through your configured SMTP/Resend, or (b) write the link to `reset-links.csv` so you can mail-merge yourself.
- `verify-uuids.sql` — `SELECT count(*) FROM auth.users` on new project must equal source; spot-check 3 UUIDs against `public.profiles.id`.

**Google users**: their `auth.users` row is created the same way (UUID preserved, no password). On first sign-in via your new Google OAuth client, Supabase sees an existing user with the same email and **links the new identity** to the existing UUID. All their journals/meds stay attached. No `auth.identities` transfer needed.

Caveat I'll document in the README: a Google-only user who tries password reset before signing in once will get a usable password too — that's actually fine (defense in depth), but worth noting.

## Step B — Public schema + data (already generated, re-verify)

`01-schema.sql` and `02-data/` exist. I'll:

- Re-run row-count snapshot now and save `row-counts-source.txt`.
- Add `verify-counts.sql` that runs the same counts on the new DB and diffs.
- Confirm `01-schema.sql` ends with `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + `CREATE POLICY` for **every** public table (your gate #2). Add `verify-rls.sql`: fails loudly if any public table has `rowsecurity = false` or zero policies.

## Step C — Storage via signed-URL manifest (from inside the app)

Five private buckets: `journal-media`, `reports`, `medical-reports`, `care-chat-attachments`, `dna-uploads`.

- Add a one-shot admin-only server fn `exportStorageManifest` (guarded by `has_role(_, 'super_admin')`) that, for each bucket, lists every object and creates a 7-day signed URL. Output: `/mnt/documents/04-storage/manifest.json` (bucket, path, signedUrl, size, contentType, metadata).
- `migrate-storage.mjs` — local script: streams each signed URL → uploads to the matching bucket in your new project using your new service-role key. Writes `progress.json`, resumable.
- After re-upload: `verify-storage.mjs` lists new buckets and diffs object counts + total bytes against the manifest.

Server fn gets deleted from the codebase after the export run — it's a migration tool, not a feature.

## Step D — Hand-written Supabase clients (parallel work, no behavior change yet)

Goal: detach the codebase from Lovable's auto-generated client files so it points at *your* env vars when you deploy off Lovable, without breaking the live Lovable preview today.

- New files (hand-written, edit-safe):
  - `src/integrations/supabase/client.custom.ts` — browser client reading `import.meta.env.VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`.
  - `src/integrations/supabase/client.server.custom.ts` — admin client reading `process.env.SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
  - `src/integrations/supabase/auth-middleware.custom.ts` and `auth-attacher.custom.ts` — equivalents of the auto-generated ones.
- A single switch module `src/integrations/supabase/index.ts` re-exports from either the Lovable auto-gen or the `.custom.ts` set based on `import.meta.env.VITE_USE_CUSTOM_SUPABASE === 'true'`. Default off → zero behavior change in Lovable today.
- Refactor app imports from `@/integrations/supabase/client` etc. to `@/integrations/supabase` (the switch). Auto-gen files stay untouched (per your constraints).
- `03-code-changes.patch` for the off-Lovable repo: flips the switch on, removes the auto-gen files, removes the switch indirection.

This keeps the Lovable Cloud integration UI working until you cut over.

## Step E — Secrets + Google OAuth setup checklist

`/mnt/documents/05-cutover/checklist.md`:

- New project secrets to set (you fill values): `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `GROK_API_KEY`, `OURA_CLIENT_ID/SECRET`, `WHOOP_CLIENT_ID/SECRET`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`, `MAYA_API_KEY`, `RESEND_API_KEY` (if using), `SEND_EMAIL_HOOK_SECRET`, `RESEND_WEBHOOK_SECRET`, `EMAIL_PREVIEW_SECRET`.
- Google Cloud Console: create new OAuth 2.0 Client ID (Web), authorized redirect URI = `https://<new-project-ref>.supabase.co/auth/v1/callback`. Paste client id/secret into new Supabase → Auth → Providers → Google.
- Apple/Oura/Whoop redirect URI updates listed the same way.

## Step F — Three-gate verification before DNS

I'll write `verify-cutover.sh` (you run locally against new DB) that exits non-zero unless **all three** pass:

1. **Row counts match**: every public table count on new == source snapshot from Step B.
2. **RLS coverage**: zero public tables with `rowsecurity = false`, zero public tables with zero policies.
3. **Sign-in smoke**: two manual checks documented — (a) one password user signs in after using the reset link, (b) one Google user signs in via your new OAuth client and lands with their data attached (verify by `select count(*) from public.journal_entries where user_id = '<their uuid>'`).

Only after all three: DNS, Google OAuth redirect propagation, Whoop/Oura redirect updates per the existing plan.

---

## Deliverables I'll produce in build mode

```text
/mnt/documents/
  01-schema.sql                          (exists; re-verify)
  02-data/*.csv + import.sh              (exists; re-verify)
  03-auth/
    auth-users.csv
    import-auth.mjs
    verify-uuids.sql
  04-storage/
    manifest.json                        (after running export fn once)
    migrate-storage.mjs
    verify-storage.mjs
  05-cutover/
    checklist.md
    verify-counts.sql
    verify-rls.sql
    verify-cutover.sh
  03-code-changes.patch                  (for off-Lovable repo)
  README-MIGRATION.md
```

In repo:
- New `src/integrations/supabase/*.custom.ts` files + `index.ts` switch (default off).
- One-shot `exportStorageManifest` server fn under `src/lib/migration-export.functions.ts`, super-admin gated, deleted after use.
- App-wide import rewrite to `@/integrations/supabase`.

## What I will NOT touch

- `src/integrations/supabase/{client,client.server,auth-middleware,auth-attacher,types}.ts` (auto-gen, per project rules).
- `.env`, `supabase/config.toml`.
- Lovable Cloud's live data — every export is read-only `SELECT` + storage signed URLs.

## Rollback

Old Lovable Cloud project untouched throughout. If verification fails, you don't flip DNS; nothing in production changes. The switch in `src/integrations/supabase/index.ts` stays at its default, so the Lovable preview keeps working.

---

Approve and I'll start with Step A (`03-auth/`) and the verification SQL for Step B in the first build pass, then move to the storage server fn and the client switch.

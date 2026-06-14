# Cursor migration prompts — final

Confirmed inputs: you have the new project's DB password; Oura/Whoop OAuth apps are being reused (only redirect URIs change).

Paste each block into Cursor one at a time, in order. Wait for it to finish and confirm "done" before moving to the next. If anything fails, paste the error back to me here and I'll patch the prompt.

Placeholders you'll fill in once, up front:
- `OLD_REF` = old Supabase project ref (the part before `.supabase.co` on the OLD project)
- `NEW_REF` = new project ref
- `NEW_REGION` = e.g. `eu-west-1`, `us-east-2` (shown in the new project's Connect dialog)
- `NEW_DB_PWD` = the new project's DB password
- `NEW_SERVICE_ROLE` = service-role key from the new project's API settings
- `NEW_ANON` = anon/publishable key from the new project
- `WORKERS_URL` = will be `purplelife.<your-account>.workers.dev` after Prompt 5

---

## Prompt 0 — scaffold the migration package

```
Create a top-level folder `purple-migration/` in this repo with this exact structure and contents. Do not touch any other repo files. Add `purple-migration/.env` to .gitignore.

purple-migration/
  .env.example         # documents OLD_DB_URL, NEW_DB_URL, NEW_SUPABASE_URL, NEW_SERVICE_ROLE_KEY
  01-schema.sql        # empty file, header comment only
  02-data/             # empty dir, add a .gitkeep
  03-auth/
    auth-users.json    # placeholder file with: {"note":"replace with /admin/migration-export output"}
  04-storage/
    storage-manifest.json   # placeholder with: {"note":"replace with /admin/migration-export output"}
    migrate-storage.mjs     # see below
    verify-storage.mjs      # see below
  import.sh            # see below
  README.md            # short usage notes pointing at the prompts

`migrate-storage.mjs`: Node ESM script that reads `04-storage/storage-manifest.json` (array of { bucket, path, signedUrl }), downloads each object via fetch, and uploads to the NEW project's Supabase Storage using @supabase/supabase-js with NEW_SUPABASE_URL + NEW_SERVICE_ROLE_KEY. Use bucket.upload with upsert:true and contentType from the response header. Process 8 concurrent. Log progress every 50 files. On any 4xx, log path + status and continue. Exit non-zero if total failures > 0.

`verify-storage.mjs`: same inputs, but for each manifest entry HEAD the object in the new bucket via signed URL (createSignedUrl, 60s) and assert byte length matches the manifest's `size` field when present. Print a summary { ok, mismatched, missing } and exit non-zero if mismatched+missing > 0.

`import.sh`: bash script that takes one arg (NEW_DB_URL) and runs `psql "$1" -v ON_ERROR_STOP=1` against the CSV files in `02-data/` in FK-safe order. Defer constraints with `SET session_replication_role = replica;` at the top and reset at the end. Order: profiles, then anything that references profiles, then leaves last. Use `\copy public.<table> FROM '02-data/<file>.csv' WITH (FORMAT csv, HEADER true);`. If the exact table list isn't obvious, read `src/integrations/supabase/types.ts` to enumerate public tables and order them by FK dependencies in the generated types.

After scaffolding, print a checklist of next steps:
1. Drop `/admin/migration-export` output: `auth-users.json` into `03-auth/`, `storage-manifest.json` into `04-storage/`.
2. Copy `.env.example` to `.env` and fill in OLD_DB_URL + NEW_DB_URL + NEW_SUPABASE_URL + NEW_SERVICE_ROLE_KEY.
3. Ready for Prompt 1.

Do not run any psql or network commands in this prompt. File scaffolding only.
```

---

## Prompt 1 — restore schema (Session pooler)

```
Goal: copy the database schema (public + auth + storage) from the OLD Supabase project into the NEW one. Use the Session pooler, port 5432.

Connection strings (assume the user has supabase CLI ≥ 1.180 and psql ≥ 15 installed):
- OLD_DB_URL: postgresql://postgres.OLD_REF:<OLD_PASSWORD>@aws-0-<OLD_REGION>.pooler.supabase.com:5432/postgres
- NEW_DB_URL: postgresql://postgres.NEW_REF:NEW_DB_PWD@aws-0-NEW_REGION.pooler.supabase.com:5432/postgres

Steps:
1. If `purple-migration/.env` is missing or OLD_DB_URL is blank, stop and ask the user for the OLD project's DB password (the user has the NEW one; they may need to fetch the OLD one from that project's Database settings → reset password if forgotten).
2. Dump schema only: `supabase db dump --db-url "$OLD_DB_URL" --schema public,auth,storage --schema-only -f purple-migration/01-schema.sql`. Do NOT pass `--data-only`.
3. Open `01-schema.sql` and remove or comment out any line that touches roles owned by Supabase that already exist in a fresh project (CREATE ROLE, ALTER ROLE, GRANT/REVOKE on supabase_admin/authenticator/anon/authenticated/service_role). The Supabase docs call these out — keep policies, triggers, functions, tables, types, sequences. If unsure, leave the line and let `psql -v ON_ERROR_STOP=1` flag it; comment only what errors.
4. Apply to new: `psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 -f purple-migration/01-schema.sql`.
5. Sanity check: `psql "$NEW_DB_URL" -c "\dt public.*"` and confirm the table count roughly matches the OLD project's count (run the same query against OLD_DB_URL too and diff).

Stop and report:
- Schema dump file size
- Table counts old vs new
- Any errors that required commenting lines in step 3
```

---

## Prompt 2 — restore auth users (CSV primary, JSON fallback)

```
Goal: recreate users in the NEW project's auth.users table, preserving password hashes where possible and recreating OAuth-only users with their original UUIDs.

Inputs:
- `purple-migration/03-auth/auth-users.json` — must be the real export from /admin/migration-export (not the placeholder). If it still contains {"note":...} stop and tell the user to export it first.
- A CSV of auth.users from the OLD project. If `purple-migration/02-data/02_auth_users.csv` doesn't exist yet, generate it now by running:
  psql "$OLD_DB_URL" -c "\copy (SELECT id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, confirmed_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at FROM auth.users) TO STDOUT WITH (FORMAT csv, HEADER true)" > purple-migration/02-data/02_auth_users.csv

Step 1 — CSV load (preserves encrypted_password for email/password users):
  psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 -c "\copy auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, confirmed_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at) FROM 'purple-migration/02-data/02_auth_users.csv' WITH (FORMAT csv, HEADER true)"

If that fails because rows already exist, truncate with: `TRUNCATE auth.users CASCADE;` and retry. Confirm with the user before truncating if any rows exist.

Step 2 — JSON fallback for OAuth-only users:
Write a one-off Node script at `purple-migration/03-auth/import-oauth-users.mjs`:
- Reads `auth-users.json` (array of { id, email, raw_app_meta_data, raw_user_meta_data, providers: [...] } — match the shape produced by /admin/migration-export; if shape differs, inspect a sample and adjust).
- Creates a Supabase admin client with NEW_SUPABASE_URL + NEW_SERVICE_ROLE_KEY.
- For each user, query the new auth.users by id. If present, skip. If absent, call `supabase.auth.admin.createUser({ user_id: <id>, email, email_confirm: true, app_metadata, user_metadata })` — note this passes the original UUID so foreign keys in public tables stay valid.
- Log: { total, skipped_existing, created, errors }.

Run it: `node purple-migration/03-auth/import-oauth-users.mjs`.

Step 3 — verify:
  psql "$NEW_DB_URL" -c "select count(*) from auth.users;"
Compare against OLD.

Report counts and any errors.
```

---

## Prompt 3 — restore public table data (Session pooler)

```
Goal: copy row data for every public table from OLD to NEW in FK-safe order.

1. Export CSVs from OLD into `purple-migration/02-data/`. For each public table T (enumerate from src/integrations/supabase/types.ts), run:
   psql "$OLD_DB_URL" -c "\copy public.T TO STDOUT WITH (FORMAT csv, HEADER true)" > purple-migration/02-data/T.csv
   Skip tables that are views or are obviously ephemeral (e.g. anything named *_cache, *_tmp). Always include: profiles, conditions-related tables, medications, medication_doses, journal_entries, journal_media, reports, report_media, trips, friendships, care_links, behavior_extractions, push_subscriptions, suppressed_emails, send_log, and every other public table that holds user data.

2. Run the importer with FK constraints deferred:
   bash purple-migration/import.sh "$NEW_DB_URL"

3. Spot check 5 large tables:
   psql "$NEW_DB_URL" -c "select 'profiles', count(*) from public.profiles union all select 'journal_entries', count(*) from public.journal_entries union all select 'medication_doses', count(*) from public.medication_doses union all select 'reports', count(*) from public.reports union all select 'medications', count(*) from public.medications;"
   Diff against OLD.

Report counts and any CSV import failures with the offending table.
```

---

## Prompt 4 — copy storage (with 6-day TTL check)

```
Goal: copy all storage objects from OLD to NEW.

1. Open `purple-migration/04-storage/storage-manifest.json`. Decode the JWT in the first entry's `signedUrl` (split on '.', base64-decode the middle segment, parse JSON). If `exp` is less than (now + 24*3600), STOP and tell the user: "Storage manifest expires within 24h. Re-run /admin/migration-export on the OLD app, replace 04-storage/storage-manifest.json, then re-run this prompt." Do not proceed.

2. Confirm `NEW_SUPABASE_URL` and `NEW_SERVICE_ROLE_KEY` are in `purple-migration/.env`.

3. Confirm the destination buckets exist with matching public/private settings. Buckets used by this project (private): `journal-media`, `reports`, `avatars` (check supabase/migrations for any others — search for `storage.create_bucket` or `INSERT INTO storage.buckets`). For each, if missing in NEW project, create it via:
   psql "$NEW_DB_URL" -c "insert into storage.buckets (id, name, public) values ('<id>','<id>', false) on conflict do nothing;"
   Then re-apply the storage RLS policies that the schema dump already restored in Prompt 1.

4. Run: `node purple-migration/04-storage/migrate-storage.mjs`. Then `node purple-migration/04-storage/verify-storage.mjs`.

Report: { total, uploaded, failed }, and verify summary.
```

---

## Prompt 5 — deploy to workers.dev + smoke test

```
Goal: deploy the app to its workers.dev URL pointed at the NEW Supabase project, before any DNS change.

1. Update CI build vars and local .env (do NOT commit the .env):
   - In .env at repo root: set VITE_SUPABASE_URL=https://NEW_REF.supabase.co, VITE_SUPABASE_PUBLISHABLE_KEY=NEW_ANON, VITE_SUPABASE_PROJECT_ID=NEW_REF.
   - In GitHub repo Settings → Secrets and variables → Actions, update the same three names with NEW values.

2. Set all Cloudflare Worker secrets. Run each of these and paste the value when prompted (ask the user for each one you don't already have):
   wrangler secret put SUPABASE_URL              # https://NEW_REF.supabase.co
   wrangler secret put SUPABASE_PUBLISHABLE_KEY  # NEW_ANON
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY # NEW_SERVICE_ROLE
   wrangler secret put STRIPE_SECRET_KEY
   wrangler secret put STRIPE_WEBHOOK_SECRET     # will be re-set in Prompt 6 after Stripe dashboard update
   wrangler secret put CRON_SECRET               # generate a fresh 32-char random string
   wrangler secret put PUBLIC_SITE_URL           # https://WORKERS_URL for now; will change in Prompt 7
   wrangler secret put VAPID_PUBLIC_KEY
   wrangler secret put VAPID_PRIVATE_KEY
   wrangler secret put VAPID_SUBJECT
   wrangler secret put OURA_CLIENT_ID
   wrangler secret put OURA_CLIENT_SECRET
   wrangler secret put WHOOP_CLIENT_ID
   wrangler secret put WHOOP_CLIENT_SECRET
   wrangler secret put ANTHROPIC_API_KEY
   wrangler secret put RESEND_API_KEY
   wrangler secret put RESEND_WEBHOOK_SECRET     # will be re-set in Prompt 6
   wrangler secret put SEND_EMAIL_HOOK_SECRET    # will be re-set in Prompt 6
   wrangler secret put EMAIL_PREVIEW_SECRET      # 32-char random

3. Build and deploy:
   bun run build
   wrangler deploy -c wrangler.deploy.jsonc

4. Print the deployed URL (purplelife.<account>.workers.dev) so the user can run smoke tests:
   - load the homepage
   - sign up with email/password, confirm via Resend email (only works after Prompt 6 sub-task 5 — flag this)
   - existing user password sign-in (should work now)
   - open a journal entry that has media (signed URL must load)
   - open a medical report PDF
   - Google sign-in is expected to fail until Prompt 6 sub-task 6 completes

Report deploy output and any failures.
```

---

## Prompt 6 — wire external services

Run these six sub-prompts one at a time. They're independent; if a service is irrelevant (e.g. Stripe in test only), skip that sub-prompt.

### 6a Edge functions
```
Link supabase CLI to NEW project: `supabase link --project-ref NEW_REF`. Then deploy:
supabase functions deploy ai-orchestrator risk-forecaster journal-extract journal-processor med-dose-action oura-sync
Set function secrets:
supabase secrets set ANTHROPIC_API_KEY=<value>
(also GEMINI_API_KEY, OPENAI_API_KEY, GROK_API_KEY, OURA_CLIENT_ID/SECRET if those lanes are used)
Confirm `supabase functions list` shows all six as deployed.
```

### 6b pg_cron email pump
```
In the NEW project's SQL editor, run (substitute WORKERS_URL and the vault key name for the service-role bearer, which Phase 7 of docs/LOVABLE-MIGRATION.md documents):

select cron.unschedule('process-email-queue');

select cron.schedule(
  'process-email-queue',
  '* * * * *',
  $$
    select net.http_post(
      url := 'https://WORKERS_URL/api/email/queue/process',
      headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'))
    );
  $$
);

If the vault secret doesn't exist yet, insert it first: `select vault.create_secret('NEW_SERVICE_ROLE', 'service_role_key');`. Confirm with `select * from cron.job where jobname='process-email-queue';`.
```

### 6c Stripe webhook
```
In Stripe Dashboard → Developers → Webhooks, update the existing endpoint URL to https://WORKERS_URL/api/public/stripe-webhook (or add new and delete old). Copy the new signing secret and run: `wrangler secret put STRIPE_WEBHOOK_SECRET`. Then in Stripe, click "Send test event" → checkout.session.completed and confirm 200 OK.
```

### 6d Resend webhook
```
In Resend Dashboard → Webhooks, point bounced + complained events at https://WORKERS_URL/api/email/suppression. Copy the signing secret and run: `wrangler secret put RESEND_WEBHOOK_SECRET`. Trigger a test send to a Resend bounce sandbox address and confirm a row appears in public.suppressed_emails.
```

### 6e Supabase send-email hook
```
In the NEW project's Auth settings → Email → Send Email Hook, set URL to https://WORKERS_URL/api/email/auth/webhook, copy the generated secret, run: `wrangler secret put SEND_EMAIL_HOOK_SECRET`. Trigger a password reset for a test user and confirm the email arrives via Resend.
```

### 6f Google + Apple OAuth, Oura + Whoop redirects
```
Google: in NEW project's Auth dashboard → Providers → Google, paste existing Google Client ID + Secret from docs/oauth-provider-setup.md. In Google Cloud Console → Credentials, add https://NEW_REF.supabase.co/auth/v1/callback to the authorized redirect URIs.
Apple: same flow — paste credentials in Supabase, then add the new callback URL in the Apple Service ID config.
Oura: in Oura dev console for the existing app, add redirect URI https://WORKERS_URL/oauth/oura/callback. No secret change.
Whoop: same — add https://WORKERS_URL/oauth/whoop/callback to the existing Whoop app's redirect URIs.

Test: from the deployed workers.dev URL, sign in with Google end-to-end.
```

---

## Prompt 7 — DNS cutover in Cloudflare

```
Goal: flip www.purplelife.org from Lovable hosting to the Cloudflare Worker.

1. In Cloudflare → Workers & Pages → purplelife → Settings → Domains & Routes → Add → Custom domain → enter www.purplelife.org. Wait for SSL "active".
2. Update Worker secret PUBLIC_SITE_URL to https://www.purplelife.org: `wrangler secret put PUBLIC_SITE_URL`.
3. Re-run all of Prompt 6's URL-bearing sub-tasks to swap WORKERS_URL → www.purplelife.org:
   - pg_cron URL
   - Stripe webhook endpoint
   - Resend webhook endpoint
   - Supabase send-email hook URL
   - Oura + Whoop redirect URIs
4. Apex redirect: in Cloudflare DNS, ensure purplelife.org has a Page Rule or Redirect Rule sending it to https://www.purplelife.org.
5. Smoke test on www.purplelife.org: password sign-in, Google sign-in, journal media, report PDF, /api/public/cron/dose-reminders via curl with CRON_SECRET.

Rollback (if any test fails): remove the custom domain from the Worker — DNS reverts to Lovable in 1–2 min.
```

---

## After Prompt 7

Keep the Lovable project alive for 7 days as a read-only fallback. Then archive it. The migration package (`purple-migration/`) can be deleted from the repo or moved to a private archive once you're confident.

If any prompt fails, paste me the error and I'll patch the prompt — that's faster than guessing what Cursor saw.

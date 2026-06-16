# Migrating Purple to your own Supabase - Cursor playbook v2

You don't need to write app code. Paste **8 prompts** (0 through 7) into Cursor in order, and answer when it asks for URLs, keys, or passwords. After each prompt, check the "Done when" line before moving on.

## What changed vs v1

1. **Prompt 0 (new)** : scaffolds `purple-migration/` and exports schema + CSVs from the old Lovable project before anything touches the new Supabase project.
2. **Session pooler (port 5432)** : every `psql` connection in Prompts 0–3 uses the Session pooler, not the Transaction pooler (port 6543, breaks `\copy` and large DDL).
3. **Auth path priority** : CSV `auth.users` import preserves `encrypted_password` (primary); `auth-users.json` is fallback for OAuth-only or missing users.
4. **Storage manifest TTL** : Prompt 4 checks signed URL expiry; re-export from `/admin/migration-export` if the manifest is older than 6 days.
5. **Prompt 5 deploy** : `wrangler deploy -c wrangler.deploy.jsonc` to `*.workers.dev` (no Wrangler `env.preview` block in this repo).
6. **Prompt 6 (new)** : wire edge functions, pg_cron email pump, Stripe/Resend webhooks, send-email hook, and OAuth before DNS.
7. **Prompt 7** : DNS cutover (was "final step" in v1).

## Prompt sequence

```text
0. Scaffold purple-migration/ package
1. Restore schema                            (Session pooler)
2. Restore auth - CSV primary, JSON fallback (Session pooler)
3. Restore public table data                 (Session pooler)
4. Copy storage                              (re-export manifest if >6 days old)
5. Deploy to *.workers.dev + smoke test
6. Wire external services
7. DNS cutover in Cloudflare
```

---

## Before you start (one-time)

1. Create a **new** Supabase project. Save:
   - Project URL (`https://<ref>.supabase.co`)
   - `anon` public key
   - `service_role` secret key
   - **Database password** (needed for Session pooler `psql` URLs)
2. From `/admin/migration-export` in the Lovable preview, download both JSON files (super-admin only).
3. Have the **old** Lovable DB Session pooler URL ready for Prompt 0:
   `postgresql://postgres.<old-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres`
4. **Never use port 6543** (Transaction pooler) for DDL, `\copy`, or large imports.

---

## Pre-cutover checklist (printable)

Complete every row before Prompt 7 DNS flip:

- [ ] Prompt 0: `purple-migration/` scaffolded; schema dumped; CSVs exported; JSON exports in place; `row-counts-source.txt` generated from **old** DB
- [ ] Prompt 1: schema applied; RLS on all `public` tables; 5 buckets exist
- [ ] Prompt 2: `auth.users` count matches source; password users retain hashes; OAuth-only users filled from JSON fallback
- [ ] Prompt 3: all public table counts match `verify-counts.sql` diff
- [ ] Prompt 4: storage object counts + bytes match per bucket; manifest younger than 6 days
- [ ] Prompt 5: `bun run build && wrangler deploy -c wrangler.deploy.jsonc` green; workers.dev loads app; password login + journal media + report PDF work
- [ ] Prompt 6: edge functions live on new project; pg_cron pump hits workers.dev; Stripe test event 200; Resend bounce webhook 200; password-reset email arrives; Google sign-in works on workers.dev
- [ ] Prompt 6 (wearables): Oura + Whoop developer consoles list `https://purplelife.<account>.workers.dev/oauth/{oura,whoop}/callback`
- [ ] Prompt 6 (wearables at DNS): add `https://www.purplelife.org/oauth/{oura,whoop}/callback` before or during Prompt 7
- [ ] GitHub secrets updated: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
- [ ] Rollback plan: old Lovable env vars + DNS route removal documented

---

## Prompt 0 - Scaffold migration package

**What it does:** creates the local folder structure and exports schema + CSVs from the **old** Lovable project. Nothing touches the new Supabase project yet.

**Paste into Cursor:**

> Create the `purple-migration/` folder in this repo (add `purple-migration/.env` to `.gitignore` if not already ignored via `*.local`). Do not touch the new Supabase project yet.
>
> **Folder layout:**
> - `purple-migration/01-schema.sql` : dump from the **old** Lovable project using Session pooler (port **5432**): `pg_dump --schema-only --schema=public --schema=auth --schema=storage "$OLD_DB_URL" > purple-migration/01-schema.sql`. If `supabase db dump` fails (CLI 403), use `pg_dump` only.
> - `purple-migration/02-data/*.csv` : export all `auth.*` and `public.*` tables from the **old** project via `psql` `\copy` in FK-safe order. Name auth CSVs `01_auth_users.csv`, `02_auth_identities.csv`, etc.
> - `purple-migration/03-auth/auth-users.json` : I will place the file from `/admin/migration-export` here (fallback for OAuth-only users).
> - `purple-migration/04-storage/storage-manifest.json` : I will place the file from `/admin/migration-export` here.
> - `purple-migration/04-storage/migrate-storage.mjs` + `verify-storage.mjs` : write these: stream signed URLs from manifest into destination buckets via service-role Storage API; verify counts + bytes per bucket.
> - `purple-migration/import.sh` : FK-safe `\copy` import for auth + public tables + `setval` on sequences; reads `NEW_DB_URL` from `.env`.
> - `purple-migration/05-cutover/verify-counts.sql` + `row-counts-source.txt` : generate `row-counts-source.txt` by running count queries against the **old** DB now (baseline for Prompts 2–3).
> - `purple-migration/.env.example` : document `OLD_DB_URL`, `NEW_DB_URL`, `NEW_SUPABASE_URL`, `NEW_SERVICE_ROLE_KEY`.
>
> Ask me for `OLD_DB_URL` (Session pooler, port 5432) and the old DB password. After scaffolding, tell me to drop the two JSON exports into `03-auth/` and `04-storage/` before Prompt 2 and Prompt 4.

**Done when:** folder exists, schema + CSVs exported from old DB, `row-counts-source.txt` captured, `.env` has both connection strings, JSON files in place.

---

## Prompt 1 - Restore schema

**What it does:** creates all tables, RLS policies, functions, and storage buckets in the new project. No user data yet.

**Paste into Cursor:**

> Using `purple-migration/01-schema.sql`, apply the full schema to my **new** Supabase project. I'll paste the new project URL and database password when you ask.
>
> Connect with **Session pooler port 5432** (not 6543):
> `postgresql://postgres.<new-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres`
>
> Run: `psql "$NEW_DB_URL" -f purple-migration/01-schema.sql`
>
> After it runs, query the new project and report:
> (a) total table count in `public` schema
> (b) any `public` table where `relrowsecurity = false`
> (c) whether these 5 storage buckets exist: `journal-media`, `reports`, `medical-reports`, `care-chat-attachments`, `dna-uploads`
>
> **Stop if any check fails** - show the failure. Do not load data.

**Done when:** schema applied, RLS enabled on every `public` table, 5 buckets present.

---

## Prompt 2 - Restore auth (CSV primary, JSON fallback)

**What it does:** loads auth users so every existing user keeps their original UUID. Email/password users keep their password hash via CSV; OAuth-only users are recreated from JSON.

**Paste into Cursor:**

> Restore auth to my **new** Supabase project using Session pooler `NEW_DB_URL` (port 5432).
>
> **Step 1 - CSV primary (preserves `encrypted_password`):**
> Load from `purple-migration/02-data/` in FK-safe order via `psql \copy`:
> `01_auth_users.csv` → `auth.users`, then `02_auth_identities.csv` → `auth.identities`, then remaining auth CSVs per `purple-migration/import.sh`.
>
> **Step 2 - JSON fallback (OAuth-only / missing rows):**
> Write and run a small Node script reading `purple-migration/03-auth/auth-users.json`. For each user whose `id` is **not** in `auth.users` after Step 1, call `supabase.auth.admin.createUser({ id, email, email_confirm: true, user_metadata, app_metadata })` using `NEW_SUPABASE_URL` + `NEW_SERVICE_ROLE_KEY`. Do **not** overwrite users loaded from CSV.
>
> **Verify:** `SELECT count(*) FROM auth.users` on new DB vs `purple-migration/05-cutover/row-counts-source.txt` auth.users line. Stop and show diff if counts don't match.

**Done when:** `auth.users` count matches source exactly.

---

## Prompt 3 - Restore public table data

**What it does:** loads all public-schema CSVs (journals, meds, reports, profiles, etc.) in FK-safe order and resets sequences.

**Paste into Cursor:**

> Run `purple-migration/import.sh` against my new Supabase project (`NEW_DB_URL`, Session pooler port 5432) to load all **public** table CSVs in FK-safe order and `setval` all sequences. Skip auth tables already loaded in Prompt 2.
>
> When finished, run `purple-migration/05-cutover/verify-counts.sql` on the new project and diff against `row-counts-source.txt`. Show every table where counts don't match. **Do not continue if there are diffs.**

**Done when:** every table count matches the source snapshot.

---

## Prompt 4 - Copy storage files

**What it does:** streams every file from Lovable's 5 buckets (using the signed-URL manifest) into matching buckets in the new project.

**Paste into Cursor:**

> **Precondition:** Check `purple-migration/04-storage/storage-manifest.json` signed URL expiry (decode JWT `exp` on the first URL). If any URL expires within 24 hours, **stop** and tell me to re-download the manifest from `/admin/migration-export` on the Lovable preview (7-day TTL).
>
> Run `purple-migration/04-storage/migrate-storage.mjs` with manifest input and my new project's `NEW_SUPABASE_URL` + `NEW_SERVICE_ROLE_KEY` as destination. Then run `verify-storage.mjs` and diff object counts + total bytes per bucket. Show any mismatch.

**Done when:** object counts + bytes match per bucket.

---

## Prompt 5 - Deploy to workers.dev + smoke test

**What it does:** points the app at the new Supabase backend on Cloudflare Workers and runs a manual smoke test. No DNS change.

**Paste into Cursor:**

> Point this app at the new Supabase backend on Cloudflare Workers. **Do not flip production DNS.**
>
> **Step 1 - Local build vars:** Update `.env.local` (gitignored) with new `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`.
>
> **Step 2 - Worker secrets:** Set every secret listed in `docs/LOVABLE-MIGRATION.md` "Secrets that must exist in Cloudflare" via `wrangler secret put <NAME>`. I'll paste values when asked. Minimum for smoke test: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PUBLIC_SITE_URL` (workers.dev URL), `CRON_SECRET`. Reuse existing Stripe/Resend/Anthropic/VAPID/OURA/WHOOP values where unchanged.
>
> **Step 3 - GitHub Actions:** Update repo secrets `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` per `.github/workflows/deploy.yml`.
>
> **Step 4 - Deploy:** `bun run build && wrangler deploy -c wrangler.deploy.jsonc`. Report the `purplelife.<account>.workers.dev` URL.
>
> **Step 5 - Smoke test on workers.dev URL:**
> 1. Sign in as an email/password user
> 2. Open journal - confirm entries load (including one with media)
> 3. Open a medical report PDF from storage
>
> Google sign-in is **not** in scope for this prompt (configured in Prompt 6).

**Done when:** workers.dev serves the app; password login, journal media, and report PDF all work.

---

## Prompt 6 - Wire external services

**What it does:** connects edge functions, email pump, webhooks, and OAuth to the new Supabase project and workers.dev URL. Run these six sub-prompts in order.

### 6a - Edge functions

**Paste into Cursor:**

> Deploy all 6 edge functions to the new Supabase project: `ai-orchestrator`, `risk-forecaster`, `journal-extract`, `journal-processor`, `med-dose-action`, `oura-sync`. Set function secrets: `ANTHROPIC_API_KEY` (required), plus optional `GEMINI_API_KEY`, `OPENAI_API_KEY`, `GROK_API_KEY`, `OURA_CLIENT_ID`, `OURA_CLIENT_SECRET`. If Supabase CLI 403s, follow `docs/manual-deploy-bundle.md` dashboard path. Apply pending migration `20260611010000_remove_lovable_ai_provider.sql` if not already on new project.

### 6b - pg_cron email pump

**Paste into Cursor:**

> In the **new** project's SQL editor: `SELECT cron.unschedule('process-email-queue');` then recreate the job posting to `https://purplelife.<account>.workers.dev/api/email/queue/process` with the vault-stored service-role bearer (`email_queue_service_role_key`). Confirm vault secret matches new project's `service_role` key. Reference: `docs/LOVABLE-MIGRATION.md` Phase 7.

### 6c - Stripe webhook

**Paste into Cursor:**

> In Stripe dashboard, update webhook endpoint to `https://purplelife.<account>.workers.dev/api/public/stripe-webhook`. Copy new signing secret into Worker: `wrangler secret put STRIPE_WEBHOOK_SECRET`. Send a test event; expect HTTP 200.

### 6d - Resend webhook

**Paste into Cursor:**

> Point bounced/complained webhook to `https://purplelife.<account>.workers.dev/api/email/suppression`. Store `RESEND_WEBHOOK_SECRET` via `wrangler secret put`.

### 6e - Supabase send-email hook

**Paste into Cursor:**

> In new project's Auth → Hooks, set send-email hook URL to `https://purplelife.<account>.workers.dev/api/email/auth/webhook`. Copy hook secret into `SEND_EMAIL_HOOK_SECRET` via `wrangler secret put`. Trigger a password reset; confirm email arrives via Resend from `notify.purplelife.org`.

### 6f - OAuth providers (Google, Apple, Oura, Whoop)

**Paste into Cursor:**

> **Google + Apple (new Supabase project):** Create new OAuth clients per `docs/oauth-provider-setup.md`. Callback URI: `https://<new-ref>.supabase.co/auth/v1/callback`. Add workers.dev origin to Google Authorized JavaScript origins. Enable providers in new Supabase Auth dashboard. Test Google sign-in on workers.dev.
>
> **Oura + Whoop (existing apps, redirect only):** Add to each developer console:
> - `https://purplelife.<account>.workers.dev/oauth/oura/callback`
> - `https://purplelife.<account>.workers.dev/oauth/whoop/callback`
> No new `OURA_*` / `WHOOP_*` Worker secrets needed (same credentials).

**Done when:** password-reset email delivers; Stripe test 200; Google sign-in completes on workers.dev.

---

## Prompt 7 - DNS cutover

**What it does:** points production traffic at the new backend. Roll back by removing the Worker route and restoring old Lovable env vars.

**Paste into Cursor:**

> I am ready for production DNS. Walk me through:
> 1. Add custom domain/route `www.purplelife.org` to the `purplelife` Worker in Cloudflare
> 2. Update `PUBLIC_SITE_URL` secret to `https://www.purplelife.org`
> 3. Re-point pg_cron email pump, Stripe webhook, Resend webhook, and Supabase send-email hook from workers.dev to `https://www.purplelife.org/...`
> 4. Add `https://www.purplelife.org/oauth/oura/callback` and `.../oauth/whoop/callback` to Oura/Whoop consoles
> 5. Redeploy: `bun run build && wrangler deploy -c wrangler.deploy.jsonc`
> 6. Sign in at `purplelife.org`, confirm one journal entry loads
> 7. Rollback plan: remove Worker route, restore old Lovable env vars
>
> Watch 30 minutes before deleting `/admin/migration-export` tooling.

**Done when:** production sign-in works; no error spike for 30 minutes.

---

## Notes

- **Passwords survive.** CSV `auth.users` import (Prompt 2, Step 1) preserves `encrypted_password`. No reset emails. JSON fallback (Step 2) is for OAuth-only users only.
- **Google users:** They re-link on first sign-in via your new Google OAuth client, matched on email. Configure providers in Prompt 6f, not Prompt 5.
- **No data loss window:** Until Prompt 7, live writes still go to Lovable Cloud. Run Prompts 2–3 and the DNS cutover close together to minimize drift.
- **Supabase CLI 403:** This project cannot use `supabase db dump` or `supabase functions deploy` reliably. Use `pg_dump`/`psql` for schema and data; use `docs/manual-deploy-bundle.md` for edge functions.
- **Storage manifest:** Signed URLs expire after 7 days. Re-export from `/admin/migration-export` if Prompt 4 does not finish in time.

## What happens after cutover

Once Prompt 7 is stable for 30 minutes:

- Delete `/admin/migration-export` tooling from the codebase (it should not live in production long-term)
- Archive or remove the Lovable project when confident in the new stack

If Cursor gets stuck on any prompt, paste the error back for debugging. Do not proceed past a failed verification step.

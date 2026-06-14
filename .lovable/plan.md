
# Migrate Purple off Lovable Cloud → your own Supabase

Goal: move database (schema + data), auth users (with password hashes so nobody has to reset), storage files, secrets, and the codebase to infrastructure you fully own — with zero data loss for live users.

---

## What I can do from inside Lovable

I have `psql` SELECT access to the Cloud database. That's enough to dump every table — **including `auth.users`** with `encrypted_password` (bcrypt hashes), `auth.identities`, `auth.mfa_factors`, and `auth.sessions` — as CSV/SQL into `/mnt/documents/` for you to download.

What I **cannot** pull out automatically:
- **Storage object bytes** (the actual files in `journal-media`, `reports`, `medical-reports`, `care-chat-attachments`, `dna-uploads`). The service-role key for the Cloud project isn't exposed. We'll handle this with a short script you run locally using your Lovable account's session token — details in step 4.
- Edge Function source for any non-`supabase/functions/` runtime — but Purple uses `createServerFn`, so all server logic already lives in the repo and ships with the code.
- Cron schedules configured in Cloud UI (we have the SQL for pg_cron jobs in migrations, so this is fine).

---

## Migration steps

### 1. Stand up your target Supabase project
You said it's ready. I'll need from you (paste when we start step 2):
- New project ref
- New project URL
- New `anon` / publishable key
- New `service_role` key
- DB connection string (host, port, password) for `psql`/`pg_dump`-style imports

These go to **you** locally — I won't store them. The DB password and service_role key should never be pasted into Lovable chat; you'll use them on your own machine.

### 2. Schema migration (105 files → one consolidated SQL)
I generate `/mnt/documents/01-schema.sql` from `supabase/migrations/`:
- All `CREATE TYPE`, `CREATE TABLE`, `CREATE FUNCTION`, `CREATE TRIGGER`, RLS policies, GRANTs, indexes
- Storage bucket definitions (5 private buckets) + their RLS policies on `storage.objects`
- pg_cron job definitions (e.g. dose-reminders, daily medication seeding, stuck-entry cleanup)

You run: `psql "$NEW_DB_URL" -f 01-schema.sql`

### 3. Data migration (public schema + auth schema)
I generate `/mnt/documents/02-data/` containing one `.csv` per table, ordered by FK dependencies, plus an `import.sh`:
- **public.\*** — all 65 app tables (profiles, journal_entries, medications, medication_doses, seizure_events, care_*, trips, subscriptions, user_roles, etc.)
- **auth.users** — id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, last_sign_in_at, phone, etc.
- **auth.identities** — for Google OAuth users (provider, provider_id, identity_data)
- **auth.mfa_factors** — if any users have MFA

You run: `bash import.sh` — it `\copy`s into the new project in correct order, then runs `SELECT setval(...)` on sequences.

**Result:** every user can sign in with their existing email + password, Google OAuth keeps working, all app data is there.

Caveat: `auth.sessions` are not migrated → all users get logged out once and sign in again (this is normal and expected).

### 4. Storage files
I write `/mnt/documents/migrate-storage.mjs`. You run it locally with both projects' service-role keys:
- Lists every object in each of the 5 buckets from the source via REST API using a session token you generate from the Lovable Cloud UI (Cloud → Storage gives you temporary signed access)
- Streams each object into the matching bucket on your new project, preserving path and metadata
- Resumable — keeps a `progress.json` so you can re-run if interrupted
- Estimated runtime depends on total size; the script reports counts before starting

If the Lovable UI doesn't expose a usable token for bulk export, fallback: I generate per-object signed URLs from inside Lovable (I have insert access, can create them via a one-off SQL approach), write them to a manifest, and the script downloads + re-uploads from that.

### 5. Code migration off Lovable
- Export the repo from Lovable to GitHub (you click GitHub → Connect → Create repository in the Lovable UI)
- Clone locally
- I prepare a single PR-ready commit (as a patch in `/mnt/documents/03-code-changes.patch`) that:
  - Replaces `src/integrations/supabase/client.ts`, `client.server.ts`, `auth-middleware.ts`, `auth-attacher.ts` with hand-written equivalents that read from `import.meta.env.VITE_SUPABASE_*` and `process.env.SUPABASE_*` directly (no Lovable auto-gen)
  - Removes the Lovable AI Gateway dependency from the Ask-Purple flow and swaps it for direct Google Gemini API calls using your own `GEMINI_API_KEY` (which you already have set)
  - Updates `.env.example` with the new variable names
  - Adds a `README-MIGRATION.md` with the deploy checklist
- Deploy target: you pick (Cloudflare Workers via `wrangler`, Vercel, Netlify, or self-host). I'll include the config for whichever you choose — tell me at start of step 5.

### 6. Secrets re-creation in your new project
You re-add these in the new Supabase Edge Function Secrets (or your hosting platform's env vars):
- AI: `LOVABLE_API_KEY` → swap for direct provider keys (`GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GROK_API_KEY` — all already set in Cloud)
- Wearables: `OURA_CLIENT_ID/SECRET`, `WHOOP_CLIENT_ID/SECRET`
- Push: `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- Cron: `CRON_SECRET`
- Misc: `MAYA_API_KEY`
- Skip: `SUPABASE_*` (auto-provided by your new project)

I'll generate a checklist; you fetch the values from Lovable Cloud → Project Settings → Secrets and paste into your new env.

### 7. DNS cutover for purplelife.org
Last step, after you've smoke-tested the new deploy on a temporary URL:
- Point `purplelife.org` and `www.purplelife.org` DNS to your new host
- Update Google OAuth redirect URIs in Google Cloud Console to include the new Supabase auth callback URL
- Update Whoop and Oura OAuth redirect URIs the same way
- Update any Apple Health / push notification origin allowlists

---

## What you do vs what I do

| Step | I do (in Lovable) | You do (on your machine) |
|---|---|---|
| 1 | — | Share new project credentials with yourself |
| 2 | Generate `01-schema.sql` | Run `psql -f 01-schema.sql` |
| 3 | Generate CSVs + `import.sh` | Run `import.sh` |
| 4 | Generate `migrate-storage.mjs` | Run the script with both keys |
| 5 | Generate code patch | Apply patch, deploy |
| 6 | Generate secrets checklist | Re-add secrets in new project |
| 7 | — | Update DNS + OAuth redirects |

---

## Risks & how we handle them

- **Password hashes** — Supabase uses bcrypt; importing `encrypted_password` directly into the new `auth.users` table works on the same Postgres major version. Both are managed Supabase = same setup. ✅
- **Google OAuth users** — keep working as long as `auth.identities` is imported and the new project has Google provider configured with the same client ID/secret. You'll need to add the new project's callback URL in Google Cloud Console before users next sign in.
- **Realtime subscriptions** — paused during the cutover window; resume automatically after DNS flip.
- **In-flight medication_doses cron** — schedule a 15-min maintenance window; pause cron in old, import, resume in new.
- **Rollback** — old Cloud project stays untouched until you explicitly disable it. If anything goes wrong, flip DNS back.

---

## When you approve this plan, the first thing I'll do

Build step 2 in full: the consolidated `01-schema.sql` written to `/mnt/documents/01-schema.sql`, and a dry-run report showing row counts per table so we know what step 3 will move. Nothing in your live database gets touched.

# Migrating Purple to your own Supabase — Cursor playbook

You don't need to write code. You'll paste 5 prompts into Cursor, in order, and answer when it asks for the new project's URL/keys. After each prompt I tell you what "done" looks like so you know when to move on.

## Before you start (one-time, 2 minutes)

1. From `/admin/migration-export` in the Lovable preview, click both download buttons. Put the two files (`auth-users.json`, `storage-manifest.json`) into `purple-migration/exports/` inside the repo Cursor has open.
2. Open the repo in Cursor. You should see the `purple-migration/` folder containing `01-schema.sql`, `02-data/` (75 CSVs), `03-auth/`, `04-storage/`, `05-cutover/`.
3. Have these three values from your new Supabase project ready to paste when Cursor asks:
   - Project URL (`https://xxxx.supabase.co`)
   - `anon` public key
   - `service_role` secret key

---

## Prompt 1 — Restore the schema (tables, functions, policies)

What it does: creates all 67 tables, RLS policies, functions, and storage buckets in the new project. No user data yet.

> Paste into Cursor:
>
> "Using `purple-migration/01-schema.sql`, apply the full schema to my new Supabase project. I'll paste the project URL and service_role key when you ask. Use `psql` with the project's pooler connection string (ask me for the database password). After it runs, query the new project and tell me: (a) total table count in the `public` schema, (b) whether RLS is enabled on every public table, (c) whether the 5 storage buckets exist: journal-media, reports, medical-reports, care-chat-attachments, dna-uploads. Do not proceed if any check fails — show me the failure."

Done when: Cursor reports 67 tables, RLS enabled on all, 5 buckets present.

---

## Prompt 2 — Restore auth users (preserves UUIDs + passwords)

What it does: loads the 7 `auth.*` CSVs so every existing user keeps their original UUID *and* their password hash. This is why no FK breaks and no reset emails go out.

> Paste into Cursor:
>
> "Restore the auth schema from `purple-migration/02-data/`. Load these CSVs in order into the new Supabase project's `auth` schema using `psql \copy`: `01_auth_users.csv`, `02_auth_identities.csv`, then the other 5 auth tables in FK-safe order from `import.sh`. Use the service_role connection. After loading, run `SELECT count(*) FROM auth.users` and compare to `purple-migration/05-cutover/row-counts-source.txt`. Stop and show me the diff if counts don't match."

Done when: `auth.users` count matches the source snapshot exactly.

---

## Prompt 3 — Restore public table data

What it does: loads all 68 public-schema CSVs (journals, meds, reports, profiles, etc.) in FK-safe order and resets sequences.

> Paste into Cursor:
>
> "Run `purple-migration/02-data/import.sh` against my new Supabase project to load all public table CSVs in FK-safe order and `setval` all sequences. When it finishes, run `purple-migration/05-cutover/verify-counts.sql` against the new project and diff against `row-counts-source.txt`. Show me any table where counts don't match. Don't continue if there are diffs."

Done when: every table's row count matches the source snapshot.

---

## Prompt 4 — Copy storage files

What it does: streams every file from Lovable's 5 buckets (using the signed-URL manifest we exported) into the matching buckets in the new project.

> Paste into Cursor:
>
> "Run `purple-migration/04-storage/migrate-storage.mjs` using `exports/storage-manifest.json` as input and my new project's service_role key as the destination. After it finishes, run `verify-storage.mjs` to diff object counts and total bytes per bucket. Show me any mismatch."

Done when: object counts + bytes match per bucket.

---

## Prompt 5 — Point the app at the new backend + smoke test

What it does: swaps the env vars and runs a manual login test before any DNS change.

> Paste into Cursor:
>
> "Update `.env.local` to use my new Supabase project's URL and anon key (I'll paste them). Also update the Cloudflare Workers env vars for the preview environment via `wrangler` — same two values plus `SUPABASE_SERVICE_ROLE_KEY` as a secret. Deploy a preview build to a Cloudflare preview URL (not production). Then walk me through: (1) sign in as a password user, (2) sign in with Google (I'll need to set up Google OAuth credentials in the new Supabase project first — give me the redirect URL to register), (3) open the journal, confirm entries load, (4) open a report PDF from storage. Report back on each step. Do not flip production DNS."

Done when: both logins work on the preview URL and journal + storage both load.

---

## Final step — DNS cutover (you do this manually, ~5 minutes)

Once Prompt 5 is fully green:

1. In Cloudflare Workers, promote the preview env vars to production.
2. Redeploy production.
3. Visit `purplelife.org`, sign in, confirm one entry loads.
4. Watch for 30 minutes. If anything breaks, roll back env vars to the Lovable values.

---

## What I'll do after you confirm this plan

Nothing on the code side — the migration package is already complete. I'll just be on standby to:
- Fix any prompt if Cursor gets stuck and you paste the error back to me
- Help debug if a verification step fails
- Delete the `/admin/migration-export` tooling from the codebase once you confirm cutover is stable (it shouldn't live in production long-term)

## Notes

- **Passwords survive.** Because we're loading `01_auth_users.csv` directly (Prompt 2), `encrypted_password` is preserved. No reset emails. The earlier "send recovery links" plan is the fallback only if Prompt 2 fails.
- **Google users:** They'll re-link automatically on first sign-in via your new Google OAuth client, matched on email. Cursor will give you the redirect URL to register in Google Cloud Console during Prompt 5.
- **No data loss window:** Until you do the DNS cutover, all live writes still go to Lovable Cloud. The moment you flip, new writes go to your Supabase. There's no "two backends drifting" if you do Prompts 2–3 and the cutover close together.

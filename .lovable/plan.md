# Cursor migration playbook v2

Folds in Cursor's six findings. No code changes in this repo — the deliverable is the updated set of prompts and the pre-cutover checklist.

## What changed vs v1

1. **`purple-migration/` package** — v1 assumed Cursor would find it in the repo. It isn't there. **Prompt 0 (new)** scaffolds the folder, schema dump source, and CSV layout before Prompt 1 runs.
2. **Pooler choice** — switch every `psql` connection string in Prompts 1–3 from the Transaction pooler (port 6543, no prepared statements, breaks `\copy` and large DDL) to the **Session pooler (port 5432)**. Direct DB connection is fine too if the user has it.
3. **Passwords** — clarify path priority: **CSV `auth.users` import preserves `encrypted_password` and is primary**; `auth-users.json` is the fallback for users created via OAuth or whose CSV row is malformed. Prompt 2 reflects this ordering explicitly.
4. **Storage manifest 7-day TTL** — Prompt 4 gets a precondition: if `storage-manifest.json` is older than 6 days, re-run `/admin/migration-export` first. Otherwise signed URLs expire mid-copy.
5. **Prompt 5 deploy command** — drop the "preview env" assumption. Use `wrangler deploy -c wrangler.deploy.jsonc` to the `*.workers.dev` URL with new-project secrets set via `wrangler secret put`, run smoke tests against that URL, then flip DNS. The repo has no Wrangler `env.preview` block.
6. **Pre-cutover external wiring (Prompt 6, new)** — edge functions, pg_cron email pump, Stripe webhook, Resend webhook, Supabase send-email hook, Google/Apple OAuth, Oura/Whoop redirect URIs. None of these are in the 5-prompt sequence but all must be done before DNS flips.

## Revised prompt sequence

```text
0. Scaffold purple-migration/ package        (NEW)
1. Restore schema                            (Session pooler)
2. Restore auth users — CSV primary, JSON fallback   (Session pooler)
3. Restore public table data                 (Session pooler)
4. Copy storage  (re-export manifest if >6 days old)
5. Deploy to *.workers.dev + smoke test      (wrangler deploy, not preview env)
6. Wire external services                    (NEW — edge fns, pg_cron, webhooks, OAuth)
7. DNS cutover in Cloudflare
```

## Prompt 0: scaffold the migration package

One-paragraph framing for the user: this prompt creates the local folder structure Cursor will fill in Prompts 1–4. Nothing touches the new Supabase project yet.

Asks Cursor to create:
- `purple-migration/01-schema.sql` (empty, will be filled by `supabase db dump --schema public,auth,storage` against the old project)
- `purple-migration/02-data/` (empty dir for CSVs)
- `purple-migration/03-auth/auth-users.json` (user drops the file from `/admin/migration-export` here)
- `purple-migration/04-storage/storage-manifest.json` (same — user drops file here)
- `purple-migration/04-storage/migrate-storage.mjs` + `verify-storage.mjs` (Cursor writes these)
- `purple-migration/import.sh` (Cursor writes this — FK-safe table import order)
- `purple-migration/.env.example` documenting `OLD_DB_URL`, `NEW_DB_URL`, `NEW_SUPABASE_URL`, `NEW_SERVICE_ROLE_KEY`

Done when: folder exists, the two exported JSON files are in place, `.env` (gitignored) has both connection strings.

## Prompts 1–3 deltas

- Connection string: `postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres` (Session pooler, port 5432). Not 6543.
- Prompt 2: load `02_auth_users.csv` first via `\copy auth.users(...) FROM ...`. Then run a Node script that reads `03-auth/auth-users.json` and calls `supabase.auth.admin.createUser({ id, email, ... })` **only for users not present after the CSV load** (OAuth-only users). This preserves password hashes for email/password users and recreates OAuth users with their original UUIDs.

## Prompt 4 delta

First step in the prompt: `node -e "const m=require('./04-storage/storage-manifest.json'); /* check first signed URL age via JWT exp claim */"`. If any URL expires within 24h, stop and tell the user to re-download the manifest from `/admin/migration-export` before continuing.

## Prompt 5 rewrite (deploy + smoke test)

Done in three steps:

1. `cd` to repo, set every secret from `docs/LOVABLE-MIGRATION.md` "Secrets that must exist in Cloudflare" via `wrangler secret put <NAME>` (Cursor pastes the value the user provides). Also update the `VITE_SUPABASE_*` build vars in GitHub Actions secrets so CI builds against the new project.
2. `bun run build && wrangler deploy -c wrangler.deploy.jsonc`. This deploys to `purplelife.<account>.workers.dev`.
3. Smoke test against that URL: password sign-in, Google sign-in (after Prompt 6 OAuth config), open a journal entry with media, open a medical report PDF.

Done when: workers.dev URL serves the app, both logins work, journal media loads, report PDF renders.

## Prompt 6: wire external services (NEW)

This is the gap Cursor flagged. Six sub-tasks, each its own short prompt, all done against the new Supabase project and Cloudflare Worker:

1. **Edge functions** — `supabase functions deploy ai-orchestrator risk-forecaster journal-extract journal-processor med-dose-action oura-sync` against the new project, with `ANTHROPIC_API_KEY` + provider keys set as function secrets.
2. **pg_cron email pump** — unschedule the old `process-email-queue` job, recreate it pointing at `https://<workers.dev>/api/email/queue/process` with the service-role bearer from vault. SQL is in `docs/LOVABLE-MIGRATION.md` Phase 7.
3. **Stripe webhook** — update endpoint URL in Stripe dashboard to `https://<workers.dev>/api/public/stripe-webhook`, copy new `STRIPE_WEBHOOK_SECRET` into Worker.
4. **Resend webhook** — point bounced/complained webhook at `https://<workers.dev>/api/email/suppression`, store `RESEND_WEBHOOK_SECRET`.
5. **Supabase send-email hook** — in new project's Auth settings, set send-email hook URL to `https://<workers.dev>/api/email/auth/webhook` and copy hook secret into `SEND_EMAIL_HOOK_SECRET`.
6. **OAuth providers** — Google + Apple client IDs configured in new project's Auth dashboard with callback `https://<new-project-ref>.supabase.co/auth/v1/callback`. Oura + Whoop developer consoles updated with new redirect URI `https://<workers.dev>/oauth/{oura,whoop}/callback`.

Done when: a fresh password reset email arrives via Resend, a Stripe test event hits the webhook and returns 200, Google sign-in completes end-to-end on the workers.dev URL.

## Prompt 7: DNS cutover

Unchanged from v1. Add the custom domain/route `www.purplelife.org` to the Worker in Cloudflare, verify, then update the apex redirect. Rollback = remove the route.

## What I need from you before writing the actual prompts

Two quick confirmations so the prompts are exact:

1. Do you have the **new project's database password** (needed to build the Session pooler connection string), or do you only have the URL + anon/service-role keys? If only the keys, I'll add a Prompt 0.5 to retrieve it from the new project's dashboard.
2. Are `OURA_CLIENT_ID/SECRET` and `WHOOP_CLIENT_ID/SECRET` the same credentials in both old and new environments, or are you registering new OAuth apps on those providers? (Affects whether Prompt 6 sub-task 6 is "update redirect URI" or "create new app + update Worker secrets".)

Once you answer those two, I'll write Prompts 0 through 7 as copy-paste blocks for Cursor.

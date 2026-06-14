# Migrate to your own Supabase project (`xxnzmfzsjplrutrgbzxy`)

Since Lovable doesn't expose a "Transfer to my org" button for this workspace, we go the **clone + cutover** route. End state: app talks only to your Supabase project, Lovable Cloud is no longer in the data path. Lovable still works as a dev environment because all it needs is `VITE_SUPABASE_*` env values, which we'll override.

Source project (Lovable-managed): `lzuodgpqseijhhyzgfky`
Target project (yours): `xxnzmfzsjplrutrgbzxy`

There are 104 migrations, 6 edge functions, 5 storage buckets, ~65 tables, pg_cron jobs (email queue + dose seeding), and ~20 secrets to move.

---

## Phase 0 — Prerequisites (you, ~10 min)

From your Supabase dashboard for `xxnzmfzsjplrutrgbzxy`, collect:

1. **Project URL**: `https://xxnzmfzsjplrutrgbzxy.supabase.co`
2. **Publishable (anon) key** — Settings → API
3. **Service role key** — Settings → API (keep secret)
4. **DB password** — Settings → Database (used by CLI)
5. **JWT secret** — Settings → API → JWT (needed only if you want to preserve existing user sessions; otherwise everyone re-signs in once)

Install Supabase CLI locally (`brew install supabase/tap/supabase`) and `supabase login`.

---

## Phase 1 — Clone schema (~15 min)

1. In a local clone of the repo:
   ```bash
   supabase link --project-ref xxnzmfzsjplrutrgbzxy
   supabase db push
   ```
   This applies all 104 files in `supabase/migrations/` to your new project. RLS, policies, GRANTs, functions, triggers, and pgvector indexes all come with it.
2. Enable extensions the migrations assume are already on: `pgvector`, `pgmq`, `pg_cron`, `pg_net`, `vault`. Dashboard → Database → Extensions.
3. Re-create the 5 storage buckets (all private): `journal-media`, `reports`, `medical-reports`, `care-chat-attachments`, `dna-uploads`. Either via dashboard or `supabase storage` CLI. Storage RLS policies are already in the migrations.

## Phase 2 — Move data (~30–60 min, depends on size)

Lovable Cloud blocks `pg_dump` from this side, but **your own** Supabase project accepts inbound `pg_dump` if Lovable exposes the DB URL. Two paths:

- **Path A (preferred):** Ask Lovable support (or use the Cloud → Database connection string if visible to project owners) for a read-only DB URL for `lzuodgpqseijhhyzgfky`. Then:
  ```bash
  pg_dump "$SOURCE_URL" --data-only --schema=public --schema=storage \
    --exclude-table-data='auth.*' --no-owner --no-privileges \
    | psql "$TARGET_URL"
  ```
  Followed by an `auth.users` export via the Supabase Auth Admin API (`GET /admin/users`) → import into target with `POST /admin/users` (set `email_confirm=true`, copy `id`, `email`, metadata, provider links). Preserving `auth.users.id` is critical — every `public.*.user_id` references it.
- **Path B (no dump access):** Use the CSV exporter (Lovable Cloud → Database → Tables → download each as CSV), then `\copy` into target. Slower, but works without Lovable support. Do users last and remember to insert into `auth.users` via the Admin API, not raw SQL.

Storage objects: use `rclone` with two S3 remotes (Supabase Storage exposes S3-compatible endpoints) to copy each of the 5 buckets.

## Phase 3 — Edge functions + secrets (~20 min)

1. In your new project's dashboard → Edge Functions → Secrets, set: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROK_API_KEY`, `OURA_CLIENT_ID/SECRET`, `WHOOP_CLIENT_ID/SECRET`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` (the new one). Skip `LOVABLE_API_KEY` — we're off it.
2. Deploy the 6 functions:
   ```bash
   supabase functions deploy ai-orchestrator journal-extract journal-processor med-dose-action oura-sync risk-forecaster
   ```

## Phase 4 — Auth providers (~15 min)

In your new project: Authentication → Providers → enable Email, Google, Apple. Reuse the existing Google/Apple client IDs from `docs/oauth-provider-setup.md`, but **add the new callback URL** `https://xxnzmfzsjplrutrgbzxy.supabase.co/auth/v1/callback` to each provider's allowed redirects (Google Cloud Console + Apple Services ID). Existing OAuth users keep their accounts because Supabase matches on `provider + subject + email`.

## Phase 5 — pg_cron jobs (~5 min)

Re-create the two scheduled jobs on the new DB via SQL editor:
- `seed-daily-doses` → calls `public.seed_daily_medication_doses()` nightly.
- `process-email-queue` → POSTs to `https://www.purplelife.org/api/email/queue/process` with the vault-stored service-role bearer.

(Both definitions live in the original migrations; just re-run their `cron.schedule(...)` lines against the new DB.)

## Phase 6 — Point the app at the new project (~5 min)

This is the actual cutover. In Lovable's Connectors panel **disable Lovable Cloud** for this project (or just override env), then set these env vars in **both** Lovable (Project Settings → Environment) and Cloudflare Workers (`wrangler secret put` for the published site):

```
VITE_SUPABASE_URL=https://xxnzmfzsjplrutrgbzxy.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<new anon key>
VITE_SUPABASE_PROJECT_ID=xxnzmfzsjplrutrgbzxy
SUPABASE_URL=https://xxnzmfzsjplrutrgbzxy.supabase.co
SUPABASE_PUBLISHABLE_KEY=<new anon key>
SUPABASE_SERVICE_ROLE_KEY=<new service role key>
```

No code change needed — `src/integrations/supabase/client.ts` and `client.server.ts` already read these. `supabase/config.toml` still says `project_id = "lzuodgpqseijhhyzgfky"` but that file only affects local `supabase` CLI, not the running app; update it after cutover so future migrations target the new project.

Regenerate types against the new project (optional, schema is identical):
```bash
supabase gen types typescript --project-id xxnzmfzsjplrutrgbzxy > src/integrations/supabase/types.ts
```

## Phase 7 — External webhook re-pointing (~10 min)

- **Stripe** webhook → still your app URL, no change. But rotate `STRIPE_WEBHOOK_SECRET` if you want.
- **Resend** bounce/complaint webhook → still your app URL, no change.
- **Supabase Auth send-email hook** → in the *new* project's Auth → Hooks, point at `https://www.purplelife.org/api/email/auth/webhook` and store its secret as `SEND_EMAIL_HOOK_SECRET` (Workers + Lovable env).

## Phase 8 — Verify, then retire (~30 min)

Smoke checklist on a staging deploy first:
1. Sign in (email + Google + Apple).
2. Create a journal entry → confirm media uploads to new bucket.
3. Add a medication → confirm dose seeded and reminder fires.
4. Ask Purple → confirm AI streams and a citation chip appears.
5. Connect Oura/Whoop → confirm OAuth round-trip with new callback URL.
6. Caregiver invite + accept.
7. Stripe checkout in test mode → subscription row appears.

When clean: flip production env to new project, monitor for 24h, then in Lovable → Cloud → Disable for this project. Lovable continues to work as an editor; it just no longer provisions a backend.

## What breaks once (unavoidable)

- All users are signed out at cutover (different JWT signing key). They re-sign in with the same credentials/social accounts.
- OAuth users see the consent screen once on first sign-in.
- Any in-flight push subscriptions need to re-register (the SW handles this automatically on next visit).

## Rollback

If anything goes wrong in Phase 6–8, revert the env vars to the old Lovable values and the app instantly talks to `lzuodgpqseijhhyzgfky` again. Keep Lovable Cloud enabled until Phase 8 passes.

---

## What I need from you to start executing (when you switch to build mode)

1. The new project's **anon key** and **service role key** (via the secrets tool — I'll prompt).
2. Confirmation you've installed Supabase CLI and run `supabase link --project-ref xxnzmfzsjplrutrgbzxy` locally.
3. Path A or Path B for data migration.
4. Whether you want me to update `supabase/config.toml` and `.env` defaults to the new ref *now* (changes future migrations' target) or *after* cutover (safer).

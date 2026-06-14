# Execute migration to `xxnzmfzsjplrutrgbzxy` — Path A, flip config now

## What I do when you switch to build mode

### Step 1 — Store the two new-project keys as Lovable secrets
I'll trigger the secure secret-entry form for:
- `NEW_SUPABASE_PUBLISHABLE_KEY` (your new project's anon key)
- `NEW_SUPABASE_SERVICE_ROLE_KEY` (your new project's service role key)

These go into Lovable's secret store. We use temporary names so they don't collide with the live `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SERVICE_ROLE_KEY` that the running app still needs. We'll rename them at cutover (Step 7).

### Step 2 — Flip `supabase/config.toml` to the new project ref
Change `project_id = "lzuodgpqseijhhyzgfky"` → `project_id = "xxnzmfzsjplrutrgbzxy"`. From this point, every new migration the Lovable agent writes lands in your new project.

### Step 3 — Update `.env` defaults to the new project
Replace `lzuodgpqseijhhyzgfky` references with `xxnzmfzsjplrutrgbzxy` and the new anon key. The running preview keeps working because Lovable's secret store still serves the live `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` at runtime; `.env` is only used as a fallback / for local dev. (We do the final runtime flip in Step 7.)

### Step 4 — Schema + GRANTs + RLS + triggers on the new DB
You run locally (one time):
```
supabase login
supabase link --project-ref xxnzmfzsjplrutrgbzxy
supabase db push
```
This replays all 104 migration files — including today's security-hardening one — against `xxnzmfzsjplrutrgbzxy`. Enable `pgvector`, `pgmq`, `pg_cron`, `pg_net`, `vault` in the new project's Extensions page first (most are on by default; verify).

### Step 5 — Storage buckets
You create the five buckets in your new project's Storage page, all **private**:
- `journal-media`
- `reports`
- `medical-reports`
- `care-chat-attachments`
- `dna-uploads`

The bucket-level RLS policies are already in the migrations from Step 4.

### Step 6 — Data clone via `pg_dump` (Path A)
You ask Lovable support for a read-only connection string for `lzuodgpqseijhhyzgfky`. Once you have it:
```bash
export SRC="postgres://...@db.lzuodgpqseijhhyzgfky.supabase.co:5432/postgres?sslmode=require"
export DST="postgres://postgres:<new-db-password>@db.xxnzmfzsjplrutrgbzxy.supabase.co:5432/postgres?sslmode=require"

# Public data (skip storage rows; we'll handle storage objects separately)
pg_dump "$SRC" --data-only --schema=public --no-owner --no-privileges \
  --disable-triggers \
  | psql "$DST"
```

Then `auth.users` via the Auth Admin API (I'll provide a small Node script during build mode that lists users from the old project and recreates them in the new one, preserving `id`, `email`, provider links, and email_confirmed_at). Preserving the UUID is non-negotiable — every `public.*.user_id` foreign-keys to it.

Storage objects: I'll provide an `rclone` config snippet that copies each of the 5 buckets between the two projects' S3-compatible endpoints.

### Step 7 — Cutover (the live flip)
I update the live Lovable runtime secrets so the running preview and the published Cloudflare Worker both start hitting the new project:
- `SUPABASE_URL` → `https://xxnzmfzsjplrutrgbzxy.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY` → value of `NEW_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` → value of `NEW_SUPABASE_SERVICE_ROLE_KEY`
- (mirror as `VITE_*` for client build)
- Then delete the temporary `NEW_*` secrets.

For the Cloudflare Worker (production), you run the equivalent `wrangler secret put` commands — I'll print the exact list when we get there.

### Step 8 — Edge functions + their secrets
You set in the new project's Edge Functions → Secrets page:
`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROK_API_KEY`, `OURA_CLIENT_ID/SECRET`, `WHOOP_CLIENT_ID/SECRET`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`. Then:
```
supabase functions deploy ai-orchestrator journal-extract journal-processor med-dose-action oura-sync risk-forecaster
```

### Step 9 — Auth providers + pg_cron + send-email hook
- Enable Email / Google / Apple in the new project's Auth → Providers (reuse existing client IDs; add new callback `https://xxnzmfzsjplrutrgbzxy.supabase.co/auth/v1/callback` in Google Console and Apple Services ID).
- Re-create the two `pg_cron` jobs via the new project's SQL editor (`seed-daily-doses`, `process-email-queue`).
- In Auth → Hooks, point the send-email hook at `https://www.purplelife.org/api/email/auth/webhook`.

### Step 10 — Smoke test, then retire Lovable Cloud
Run the 7-step smoke checklist from the previous plan against the preview. When clean, you disable Lovable Cloud for this project from Connectors.

---

## Rollback at every step
Until Step 7, the live app still points at `lzuodgpqseijhhyzgfky` and is unaffected. After Step 7, rollback is `wrangler secret put` + Lovable secret revert back to the old values — the schema in the old project is untouched.

---

## What I need from you to start
1. Switch to **build mode** so I can prompt for the two keys via the secrets form.
2. Have your new project's DB password handy for Step 6.
3. (Async) Request the read-only source DB URL from Lovable support so Step 6 isn't blocked when we reach it.

Steps 1–3 land right away in build mode. Steps 4–10 each have a clear "your turn / my turn" split and we'll go one at a time.

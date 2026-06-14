# Migrate Purple to the new Lovable Cloud project

## What you gave me

- **New project ref:** `xxnzmfzsjplrutrgbzxy`
- **Direct DB host:** `db.xxnzmfzsjplrutrgbzxy.supabase.co:5432`
- **Session pooler (for migrations):** `aws-1-us-east-2.pooler.supabase.com:5432`
  user: `postgres.xxnzmfzsjplrutrgbzxy`
- **Transaction pooler (for app runtime):** `aws-1-us-east-2.pooler.supabase.com:6543` with `?pgbouncer=true`

Confirmed: the pooler prefix on your project is `aws-1-us-east-2` (not `aws-0`). I'll bake that into the scripts.

## Plan

### Phase 1 — Secrets (you, in Lovable)
You'll be prompted to paste two values into a secure form:
1. `NEW_DB_PASSWORD` — the database password for the new project (from Backend → Connect, "Reset password" if you don't have it)
2. `NEW_SERVICE_ROLE_KEY` — the service_role key for the new project (Backend → API keys)

(`NEW_SUPABASE_SERVICE_ROLE_KEY` and `NEW_SUPABASE_PUBLISHABLE_KEY` are already in your secrets list — I'll reuse those and only ask for what's missing.)

### Phase 2 — Plan document (me)
I'll write the full migration runbook to `.lovable/plan.md`. It covers:

- **0.4 Export from OLD Cloud** — walks you through Backend → Export on the current project, producing `schema.sql`, `data.sql`, and a storage archive.
- **1. Schema import to NEW** — runs `schema.sql` via the new session pooler (`aws-1-us-east-2.pooler.supabase.com:5432`).
- **2. Data import to NEW** — runs `data.sql` via the same pooler.
- **3. Storage rehydration** — re-uploads the 5 private buckets (`journal-media`, `reports`, `medical-reports`, `care-chat-attachments`, `dna-uploads`) using the new service role key.
- **4. Auth users migration** — uses the Auth Admin API on the new project to recreate users with preserved IDs (so all `user_id` foreign keys stay valid).
- **5. Secrets parity** — checklist of which of your 23 existing secrets need to be copied to the new project's edge function environment (GEMINI, GROK, ANTHROPIC, OPENAI, OURA_*, WHOOP_*, MAYA, VAPID_*, CRON_SECRET, LOVABLE_API_KEY).
- **6. App cutover** — update `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`) and `supabase/config.toml` `project_id` to point at `xxnzmfzsjplrutrgbzxy`. Regenerate `src/integrations/supabase/types.ts`.
- **7. Smoke test** — sign in, load Today, write a journal entry, confirm dose-reminders cron URL.

The scripts in the plan read `NEW_DB_PASSWORD` and `NEW_SERVICE_ROLE_KEY` from environment, so nothing sensitive lands in a file.

### Phase 3 — Hand-off
After the plan is written, I'll give you **Prompt 0.4** to run in Cursor (or whatever local agent you're using) to do the OLD-project export. Each subsequent prompt (1 through 7) is self-contained — you run it, paste back the result, we move on.

## What I will NOT do in this turn

- No edits to `.env`, `supabase/config.toml`, or `src/integrations/supabase/client.ts` yet — those only flip at Phase 6 cutover, after data and auth are verified on the new project.
- No migrations against the current (old) Cloud DB.
- No destructive operations on either project.

## After you approve

1. I trigger the secrets form for `NEW_DB_PASSWORD` + `NEW_SERVICE_ROLE_KEY`.
2. I write `.lovable/plan.md`.
3. I hand you Prompt 0.4.

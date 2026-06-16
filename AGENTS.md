## Learned User Preferences

- When implementing an attached plan, do not edit the plan file itself.
- Plan to-dos are pre-created; mark them in_progress and complete all without recreating them.
- When migration artifacts are missing from the repo, provide copy-paste Lovable prompts the user can run there.
- At cutover, keep existing Oura/Whoop OAuth apps and only add workers.dev redirect URIs.
- Migration cutover priority: preserve user UUIDs, public data, and storage; password reset is OK; password hashes are not required.

## Learned Workspace Facts

- Purple's old Supabase project ref is `lzuodgpqseijhhyzgfky` (Lovable Cloud); see repo `.env` and `PROJECT_KNOWLEDGE.md`.
- Purple's new Supabase project ref is `xxnzmfzsjplrutrgbzxy` (Purple Life, us-east-2), user-owned; schema and data import complete (5,751 rows, 13 auth users); production DNS cutover complete (`www.purplelife.org` and apex route to Cloudflare Worker `purplelife`); edge functions deployed: oura-sync, journal-processor, journal-extract, ai-orchestrator, risk-forecaster, med-dose-action.
- On Lovable Cloud, the database password and `SUPABASE_SERVICE_ROLE_KEY` are not accessible to the project owner.
- GitHub `main` `purple-migration/` is the migration source of truth; auth import uses Admin API plus `auth-users.json` via `import-auth.mjs` to preserve UUIDs (password hashes optional, not CSV-primary); live Lovable `/admin/migration-export` exports `auth-users.json`, `storage-manifest.json`, and `all-tables.zip`.
- Migration storage buckets: `journal-media`, `reports`, `medical-reports`, `care-chat-attachments`, `dna-uploads`.
- Use Supabase Session pooler (port 5432) for psql DDL and `\copy`; Transaction pooler (6543) breaks large DDL; CLI `db query --linked` may 403, use dashboard SQL editor or Management API `database/query`.
- `supabase/config.toml` is in-repo; set `project_id` to the new project ref (not downloaded from the dashboard).
- Apple Health syncs via Health Auto Export webhook to `/api/public/hooks/apple-health`, not Sign in with Apple OAuth.
- Doppler `cursor-cloudflare`/`prd_cloudlfare` uses `SUPABASE_URL`, `SERVICE_ROLE_KEY`, `VITE_*` (no `NEW_*` prefix; migration import complete); separate Cloudflare tokens `CLOUDFLARE_API_TOKEN` (Workers deploy) and `CLOUDFLARE_DNS` (zone DNS edit); `CLOUDFLARE_ACCOUNT_ID` is eigital (`08e766e92db74bc7ef14c6b5c86bddf0`), not POS (`c7f99ecba0ace852de43684ec8a44612`); map Doppler `RESEND_KEY` to Worker `RESEND_API_KEY`.
- Production auth emails: Supabase Send Email hook to Worker `/api/email/auth/webhook`; Doppler `SUPABASE_SEND_EMAIL` maps to Worker `SEND_EMAIL_HOOK_SECRET`; PGMQ plus pg_cron job `process-email-queue` (`purple-migration/05-cutover/setup-email-pump.sql`) pumps `/api/email/queue/process`; Resend sends from `noreply@notify.purplelife.org` (API key must authorize that domain).
- `wrangler.deploy.jsonc` production deploy needs `workers_dev: true` plus zone routes for `www.purplelife.org/*` and `purplelife.org/*`; Sunday cron day must be `7` not `0` (Cloudflare).
- One DNA gzip (~245MB) deferred: NEW Supabase storage limit blocks upload.

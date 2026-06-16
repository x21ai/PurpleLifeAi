## Learned User Preferences

- When implementing an attached plan, do not edit the plan file itself.
- Plan to-dos are pre-created; mark them in_progress and complete all without recreating them.
- When migration artifacts are missing from the repo, provide copy-paste Lovable prompts the user can run there.
- At cutover, keep existing Oura/Whoop OAuth apps and only add workers.dev redirect URIs.
- Migration cutover priority: preserve user UUIDs, public data, and storage; password reset is OK; password hashes are not required.

## Learned Workspace Facts

- Purple's old Supabase project ref is `lzuodgpqseijhhyzgfky` (Lovable Cloud); see repo `.env` and `PROJECT_KNOWLEDGE.md`.
- Purple's new Supabase project ref is `xxnzmfzsjplrutrgbzxy` (Purple Life, us-east-2), user-owned; schema applied on NEW, tables empty until import.
- On Lovable Cloud, the database password and `SUPABASE_SERVICE_ROLE_KEY` are not accessible to the project owner.
- GitHub `main` `purple-migration/` is the migration source of truth (`import-auth.mjs`, checklist, full `01-schema.sql`); no OLD DB password needed.
- `/admin/migration-export` on live Lovable exports three files: `auth-users.json`, `storage-manifest.json`, and `all-tables.zip` (CSVs plus cutover baselines).
- Migration storage buckets: `journal-media`, `reports`, `medical-reports`, `care-chat-attachments`, `dna-uploads`.
- Signed URLs from migration-export expire after 7 days; re-export before storage migration if needed.
- Use Supabase Session pooler (port 5432) for psql DDL and `\copy`; Transaction pooler (6543) breaks large DDL.
- Auth import uses Admin API plus `auth-users.json` via `import-auth.mjs` to preserve UUIDs; password hashes are optional, not CSV-primary.
- NEW Supabase credentials live in Doppler project `cursor-cloudflare`, config `prd_cloudlfare` (typo spelling).
- GitHub migration scripts expect `NEW_SUPABASE_SERVICE_ROLE_KEY`; Doppler stores `NEW_SERVICE_ROLE_KEY` (alias at runtime).
- `NEW_DB_URL` must use a URI-encoded Session pooler password for `psql`; Supabase Admin API works without it.

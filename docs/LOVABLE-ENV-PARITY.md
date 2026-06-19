# Lovable preview env parity

Lovable and Cursor share one codebase through the GitHub repo `AstroAii/purpledrw`
(Lovable two-way syncs the `main` branch). Code now lands on `main`, so Lovable
sees Cursor's changes after it pulls.

Code parity is not the same as runtime parity. Lovable's in-app preview runs the
build with Lovable's own environment variables, while production runs on the
Cloudflare Worker `purplelife` against the user-owned Supabase project
(ref `xxnzmfzsjplrutrgbzxy`). If Lovable's preview still points at the old
Lovable Cloud Supabase (ref `lzuodgpqseijhhyzgfky`), previews will show different
data or fail auth even though the code is identical.

## Set these in Lovable so previews match production

These are the client-side variables the browser bundle reads. Set them in the
Lovable project environment to the NEW project:

- `VITE_SUPABASE_URL`: the browser Supabase client URL. Production uses the
  branded custom domain `https://auth.purplelife.org` (falls back to
  `https://xxnzmfzsjplrutrgbzxy.supabase.co`). Use the same value Cursor builds
  with so Google OAuth consent and auth behave the same.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: the publishable (anon) key for the new
  project. Copy the exact value from Doppler (`cursor-cloudflare` /
  `prd_cloudlfare`) or the Supabase dashboard for ref `xxnzmfzsjplrutrgbzxy`.
  Do not paste it into the repo or chat.
- `VITE_SUPABASE_PROJECT_ID`: `xxnzmfzsjplrutrgbzxy`.

After setting these, Lovable previews read and write the same Supabase data as
production.

## What will not work in a Lovable preview (and that is expected)

Server-only secrets live on the Cloudflare Worker, not in Lovable. Features that
depend on them will be inert or fail in a Lovable preview unless you also provide
the secret there (generally not recommended):

- AI (chat, narratives, report trends): needs `ANTHROPIC_API_KEY` on the Worker
  (`callAIForUser`).
- Auth and transactional email: Resend via the Worker (`RESEND_API_KEY` mapped
  from Doppler `RESEND_KEY`) plus the Supabase Send Email hook.
- Drug-database autofill, edge functions, and any `*.server.ts`/server-function
  path that runs on the Worker or Supabase edge.

These are intentionally Worker-side; never put service-role keys or provider API
keys in the client bundle or in Lovable's public env.

## Source of truth

- Branch Lovable tracks: `main` on `AstroAii/purpledrw`.
- Production secrets and `VITE_*` values: Doppler `cursor-cloudflare` /
  `prd_cloudlfare`.
- New Supabase ref: `xxnzmfzsjplrutrgbzxy` (old Lovable Cloud ref
  `lzuodgpqseijhhyzgfky` is the rollback, read-only).

## Redesign workflow

During the whole-app Lovable redesign, see
[`docs/LOVABLE-REDESIGN-WORKFLOW.md`](LOVABLE-REDESIGN-WORKFLOW.md). Cursor
reviews and tests every Lovable push to `main` before production deploy.
Baseline commit: `7086ffa`.

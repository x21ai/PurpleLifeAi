# Cursor Handoff

Operational state of the PurpleLife project for the next agent or engineer. Last updated: 2026-06-12.

Positioning: PurpleLife is an AI health journal for any health management (epilepsy was the founding focus; the condition catalog is general).

Development model: the project is edited from both Cursor and Lovable; production hosting targets our own Cloudflare account. Lovable dev tooling (`@lovable.dev/vite-tanstack-config`, `.lovable/`, preview-host checks in `src/lib/med-notifications.ts`) is kept intact on purpose. Do not remove it.

## Orientation

- Product and architecture: `docs/ARCHITECTURE.md`
- Feature inventory and route map: `docs/FEATURES.md`
- **Launch cutover runbook**: `docs/LAUNCH-CHECKLIST.md` (migrations, secrets, webhooks, Devyn 3-day test, DNS flip)
- Launch surface grades: `docs/LAUNCH-AUDIT.md`
- Med reminder reliability: `docs/RELIABILITY.md`
- Security audit: `docs/SECURITY-FINDINGS.md`
- Lovable exit + Cloudflare cutover plan: `docs/LOVABLE-MIGRATION.md`
- Supabase manual deploy procedure: `docs/manual-deploy-bundle.md`
- OAuth provider setup: `docs/oauth-provider-setup.md`
- Durable decisions: `mem/index.md` (no em dashes, footer visibility, metric naming)
- Editor rules: `.cursor/rules/` (conventions, server functions, Cloudflare constraints, **launch invariants**)

## Quick facts

| Item | Value |
|------|-------|
| Brand / domain | Purple, `https://www.purplelife.org` |
| Framework | TanStack Start 1.168, React 19, Vite 7, Tailwind 4 |
| Runtime | Cloudflare Worker (`wrangler.jsonc`, entry `src/server.ts`, `nodejs_compat`) |
| Package manager | bun (commands below) |
| Database | Supabase project `lzuodgpqseijhhyzgfky`, ~100 migrations, 6 edge functions |
| Dev server | `bun run dev` on port 8080 |
| Unit tests | `bun run test:unit` (`tests/unit/`) |
| E2E | `bun run test:e2e` (Playwright, boots dev server unless `E2E_BASE_URL` set) |
| Lint/format | `bun run lint`, `bun run format` (lint not in CI yet; lint only changed files) |
| Quality gates | `check:em-dash`, `check:live-data`, `check:unique-images`, `check:i18n-es`, `check:entry-budget` (after build) |
| Seeds | `bun run seed:research` (needs `OPENAI_API_KEY` + `SUPABASE_SERVICE_ROLE_KEY`) |

## Launch stack landed (2026-06-12)

PRs #8–#19 plus overnight PRs 1–8. Highlights:

- **Time integrity**: user-local dose days, hourly seed cron, timezone capture at onboarding, regeneration on Account change, DST unit tests.
- **Dose reliability**: SW + web push + catch-up card fallback chain, snooze re-remind, delivery log + admin stats (`docs/RELIABILITY.md`).
- **Journal pipeline**: offline flush, stuck-entry cleanup cron, canonical tag namespaces, photo URL self-healing.
- **Sync truthfulness**: `last_sync_at` only for UI freshness; no `updated_at` fallback; Oura sleep mapping fixes.
- **Security**: care invite SECURITY DEFINER RPCs, 7-day expiry, community column REVOKEs (`docs/SECURITY-FINDINGS.md`).
- **UX polish**: no native dialogs (AlertDialog/Dialog), 2-step onboarding → `/today`, `/trust` page, voice/copy sweep.
- **Dark launch**: community, DNA, friends behind `app_settings` flags (default OFF). Mock `/my-health` and `/vitals` redirect away.
- **SEO**: marketing metadata, `/sitemap.xml`, `/robots.txt`.
- **Performance**: lazy Spanish locale, entry-chunk CI budget, deferred startup work.

## Current hosting state

Production currently runs on Lovable-managed infrastructure; the Worker is named `purplelife` in `wrangler.jsonc` and is ready to deploy to our own Cloudflare account once secrets and DNS are in place. The code-level Lovable service couplings are resolved:

- OAuth: native `supabase.auth.signInWithOAuth()` (Apple/Google). New client codes must be configured in the Supabase dashboard per `docs/oauth-provider-setup.md`.
- Email: queue delivery via Resend (`/api/email/queue/process`), Supabase send-email hook at `/api/email/auth/webhook` (Standard Webhooks verification), Resend bounce/complaint webhook at `/api/email/suppression`.
- AI: Anthropic Claude is the platform default (`src/lib/ai-gateway.server.ts`); the Lovable gateway remains only as a last-resort fallback for Lovable previews without an Anthropic key.

Deployment is fully scripted: `bun run build && bunx wrangler deploy -c wrangler.deploy.jsonc` (validated with `--dry-run`), or automatically via `.github/workflows/deploy.yml` on pushes to main. Cron Triggers fan out from the `scheduled()` handler in `src/server.ts` through a `SELF` service binding.

Remaining cutover steps: see **`docs/LAUNCH-CHECKLIST.md`** (migrations through `20260613010000`, edge redeploys, secrets, webhooks, Devyn 3-day test, DNS flip).

## Environment variables

In the local `.env` (values not committed beyond this machine):

- `SUPABASE_PROJECT_ID`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

Referenced in code but NOT present locally (production needs them; several block local testing of those paths):

| Variable | Used by |
|----------|---------|
| `ANTHROPIC_API_KEY` | Platform-default AI (chat, insights, care profiles, edge functions) |
| `RESEND_API_KEY` | Email delivery (`/api/email/queue/process`) |
| `RESEND_WEBHOOK_SECRET` | Resend bounce/complaint webhook (`/api/email/suppression`) |
| `SEND_EMAIL_HOOK_SECRET` | Supabase send-email hook verification (`/api/email/auth/webhook`) |
| `EMAIL_PREVIEW_SECRET` | Email template preview routes |
| `SUPABASE_SERVICE_ROLE_KEY` | Cron, email enqueue, admin functions, seeds |
| `CRON_SECRET` | All `/api/public/cron/*` endpoints |
| `PUBLIC_SITE_URL` | Email links, share links, unsubscribe headers, cron self-calls |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Billing |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web push |
| `OURA_CLIENT_ID/SECRET`, `WHOOP_CLIENT_ID/SECRET` | Wearable OAuth |
| `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROK_API_KEY` | Optional per-user AI provider choices (and embeddings seeds for OpenAI) |
| `LOVABLE_API_KEY` | Legacy fallback only: lets Lovable previews run AI without an Anthropic key |

## Known gaps and sharp edges

1. **Supabase CLI 403s** on this project; migrations and edge functions are deployed manually via the dashboard (`docs/manual-deploy-bundle.md`). Pending migrations listed in `docs/LAUNCH-CHECKLIST.md` Section 1.
2. **CI/CD committed but dormant until GitHub secrets exist**: `.github/workflows/ci.yml` and `deploy.yml` need `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and the `VITE_SUPABASE_*` values as repository secrets.
3. **Repo-wide lint debt**: `bun run lint` fails with thousands of pre-existing prettier errors. CI runs `test:unit` and `tsc --noEmit` instead. New code should be prettier-clean in touched files.
4. **Email queue pump scheduling**: the pump is a Supabase pg_cron job (`process-email-queue`, 5s interval) that POSTs to the app with the vault-stored service-role key. Its URL must be re-pointed to `https://www.purplelife.org/api/email/queue/process` at cutover.
5. **`src/routeTree.gen.ts` is generated.** Never hand-edit; it regenerates from `src/routes/` during dev/build.
6. **`vite.config.ts` is a wrapper.** Do not add tanstackStart/react/tailwind/tsconfig-paths/cloudflare plugins manually while `@lovable.dev/vite-tanstack-config` is in place; duplicates break the build. The import must stay pointed at `dist/index.js` (the ESM build); the bare specifier resolves to the CJS build, which crashes config loading on Node 22+.
7. **Email DNS**: `notify.purplelife.org` is delegated to Lovable nameservers. It must be re-verified with Resend and re-pointed, coordinated with the Supabase auth-hook URL change.
8. **External webhook pointers** that must move at cutover: Stripe webhook, Supabase send-email hook (to `/api/email/auth/webhook`), Resend webhook (to `/api/email/suppression`), Google/Apple OAuth redirect URLs, Oura/Whoop redirect URIs.
9. **Dark-launch flags** default OFF: community, DNA, friends. Enable deliberately via `app_settings` when ready.

## Decisions made (2026-06-11, still current)

1. Email provider: Resend.
2. Platform-default AI provider: Anthropic Claude.
3. Canonical public GitHub repository: `AstroAii/purpledrw`.
4. Worker name: `purplelife`; deploys go directly to Cloudflare.
5. Dual development continues in Cursor and Lovable; do not remove Lovable dev tooling.

## How to verify a change (cheapest first)

1. `bun run check:em-dash`
2. `bun run check:i18n-es`
3. `bun run test:unit` (timezone, doses, adherence, travel, Oura mapping)
3. `bun run build` + `bun run check:entry-budget` (catches Worker/SSR bundling and entry chunk regressions)
4. `bunx tsc --noEmit`
5. `bun run test:e2e` for routed/UI changes (smoke spec `tests/e2e/routes-smoke.spec.ts` is the fastest meaningful signal)
6. For Worker behavior: `wrangler dev` against the built output

## Conventions snapshot

- Server code: `*.functions.ts` (RPC, auth middleware, zod) + `*.server.ts` (secrets, dynamic import only). Details in `.cursor/rules/server-functions.mdc`.
- Launch invariants: timezone, `last_sync_at`, dose fallback chain, no native dialogs, `check:i18n-es`, care invite RPCs. See `.cursor/rules/launch-invariants.mdc`.
- 404 (not 403) on cross-user access; audit log after sensitive writes; RLS on every table.
- No em dashes anywhere, ever (CI gate).
- i18n strings through i18next; SSR renders `en` then hydrates locale; `bun run check:i18n-es` enforces Spanish completeness.
- Footer only on marketing/auth pages, never inside `AppShell`.

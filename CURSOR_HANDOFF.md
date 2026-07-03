# Cursor Handoff

Operational state of the PurpleLife project for the next agent or engineer. Last updated: 2026-07-03.

Positioning: PurpleLife is an AI health journal for any health management (epilepsy was the founding focus; the condition catalog is general).

Development model: the project is edited from both Cursor and Lovable. A whole-app redesign is in progress in Lovable; GitHub `main` syncs both sides. Cursor is the production gatekeeper: review and test every Lovable landing on `main`, then ask the owner before deploying live. Lovable dev tooling (`@lovable.dev/vite-tanstack-config`, `.lovable/`, preview-host checks in `src/lib/med-notifications.ts`) is kept intact on purpose. Do not remove it.

**Mandatory after every task:** sync documentation per `.cursor/rules/post-task-documentation.mdc` (handoff, `docs/`, rules, `AGENTS.md`, `mem/`). Never leave important context only in chat.

## Orientation

- Product and architecture: `docs/ARCHITECTURE.md`
- Feature inventory and route map: `docs/FEATURES.md`
- Sync and release runbook: `docs/SYNC-AND-RELEASE.md`
- Lovable redesign gatekeeper: `docs/LOVABLE-REDESIGN-WORKFLOW.md` (baseline `7086ffa`)
- Lovable preview env parity: `docs/LOVABLE-ENV-PARITY.md`
- Lovable exit + Cloudflare cutover plan: `docs/LOVABLE-MIGRATION.md`
- Supabase manual deploy procedure: `docs/manual-deploy-bundle.md`
- OAuth provider setup: `docs/oauth-provider-setup.md`
- Durable decisions: `mem/index.md` (no em dashes, footer visibility, metric naming, post-task documentation)
- Editor rules: `.cursor/rules/` (conventions, server functions, Cloudflare constraints, lovable-redesign-workflow, **post-task-documentation**)

## Quick facts

| Item | Value |
|------|-------|
| Brand / domain | Purple, `https://www.purplelife.org` |
| Framework | TanStack Start 1.168, React 19, Vite 7, Tailwind 4 |
| Runtime | Cloudflare Worker (`wrangler.deploy.jsonc`, entry `src/server.ts`, `nodejs_compat`) |
| Package manager | bun (commands below) |
| Database | Supabase project `xxnzmfzsjplrutrgbzxy` (Purple Life, us-east-2), ~100+ migrations, edge functions deployed |
| Git heads | `main` and `lovable/redesign` at `0367edc` (synced) |
| Production deploy | Worker `purplelife`, version `bd28333c-3141-4881-8df5-da51d0fd991d` |
| Dev server | `bun run dev` on port 8080 |
| E2E local | `bun run test:e2e` (boots dev server unless `E2E_BASE_URL` set) |
| E2E prod | `bun run test:e2e:prod` (580 tests, 5 viewports, ~1.5h; Doppler creds) |
| Lint/format | `bun run lint`, `bun run format` |
| Quality gates | `check:em-dash`, `check:live-data` (incl. `check-no-fake-vitals.mjs`), `check:lovable-auth`, `check:unique-images`, `check:supabase-types`, `check:entry-budget` |
| DB live-data scan | `doppler run --project cursor-cloudflare --config prd_cloudlfare -- bun run check:live-data:db` |
| Seeds | `bun run seed:research` (needs `OPENAI_API_KEY` + service role) |

## Current hosting state

Production runs on the Cloudflare Worker `purplelife` at `https://www.purplelife.org`
(DNS cutover complete). Supabase live data is on ref `xxnzmfzsjplrutrgbzxy` with
branded auth at `https://auth.purplelife.org`.

- OAuth: `supabase.auth.signInWithOAuth()` on prod/local; `lovable.auth` only on Lovable preview hosts (`isLovablePreviewHost()` in `src/lib/lovable-preview.ts`).
- Email: queue delivery via Resend (`/api/email/queue/process`), Supabase send-email hook at `/api/email/auth/webhook`, Resend bounce/complaint webhook at `/api/email/suppression`.
- AI: Anthropic Claude is the platform default (`src/lib/ai-gateway.server.ts`); Lovable gateway remains only as a last-resort fallback for Lovable previews without an Anthropic key.
- Health data UI: HIPAA-ready empty states on `/vitals` and `/my-health` when no biometrics (no sample numbers, no DemoBadge). CI guard: `scripts/check-no-fake-vitals.mjs`.

**Deploy model (during Lovable redesign):** manual only. `.github/workflows/deploy.yml`
triggers on `workflow_dispatch`, not on push to `main`. Cursor runs the gatekeeper
checklist in `docs/LOVABLE-REDESIGN-WORKFLOW.md`, then asks the owner before deploy.
Local path: `bun run build:prod` then `doppler run --project cursor-cloudflare --config prd_cloudlfare -- bash -c 'export CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0; bunx wrangler deploy -c wrangler.deploy.jsonc'`.
Cron Triggers fan out from `scheduled()` in `src/server.ts` through a `SELF` service binding.

Redesign baseline on `main`: commit `7086ffa` (perf/responsive/native foundation).

## Recent changes (2026-07-02 to 2026-07-03)

1. **iOS / PWA mobile fixes (2026-07-03, uncommitted):** Date strip edge padding + margin parity with Today column; mobile nav sheet scroll containment + GitHub link removed; PWA install banner platform detection (`src/lib/pwa-platform.ts`) with iOS Safari vs Chrome guidance; keyboard focus helper + 16px inputs on mobile; Apple Health Tools copy (Health Auto Export steps, no HealthKit on web); manifest `start_url` `/today`, `display_override`.
2. **Lovable merge (2026-07-03):** Today `DateStrip`, historical day view, date-aware vitals, sign-in redesign; follow-up commit removed score-tile date gating (`d209c34`). Deploy `bd28333c`.
2. **Lovable redesign merged and deployed** to prod; OAuth host split, home images restored from Lovable CDN breakage.
2. **Auth fixes:** MFA-aware reset password, duplicate-email signup message, supabase-js 2.110.0.
3. **HIPAA data cleanup:** removed fake health metrics; empty states + connect prompts; `check-no-fake-vitals.mjs` CI guard.
4. **CI:** `check:lovable-auth`, CI on `lovable/redesign` pushes, `check:live-data:db` auto-resolves Doppler `SERVICE_ROLE_KEY`.
5. **Docs:** `docs/SYNC-AND-RELEASE.md` runbook; post-task documentation rule (`.cursor/rules/post-task-documentation.mdc`).
6. **Full prod e2e (2026-07-03):** 445 passed, 32 skipped, 89 flaky, 12 hard failures (mostly stale `samuel-fixes.spec.ts` + tablet web-vitals budgets). HIPAA `integrations-vitals` tests passed on all viewports.

## Environment variables

In the local `.env` (values not committed beyond this machine):

- `SUPABASE_PROJECT_ID`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

Production secrets live in Doppler `cursor-cloudflare` / `prd_cloudlfare`. Agent runs operational commands via `doppler run` automatically; do not ask the user for manual dashboard work unless truly blocked.

Referenced in code but NOT present locally (production needs them; several block local testing of those paths):

| Variable | Used by |
|----------|---------|
| `ANTHROPIC_API_KEY` | Platform-default AI (chat, insights, care profiles, edge functions) |
| `RESEND_API_KEY` | Email delivery (`/api/email/queue/process`) |
| `RESEND_WEBHOOK_SECRET` | Resend bounce/complaint webhook (`/api/email/suppression`) |
| `SEND_EMAIL_HOOK_SECRET` | Supabase send-email hook verification (`/api/email/auth/webhook`) |
| `EMAIL_PREVIEW_SECRET` | Email template preview routes |
| `SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` | Cron, email enqueue, admin functions, seeds, `check:live-data:db` |
| `CRON_SECRET` | All `/api/public/cron/*` endpoints |
| `PUBLIC_SITE_URL` | Email links, share links, unsubscribe headers |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Billing |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web push |
| `OURA_CLIENT_ID/SECRET`, `WHOOP_CLIENT_ID/SECRET` | Wearable OAuth |
| `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROK_API_KEY` | Optional per-user AI provider choices (and embeddings seeds for OpenAI) |
| `LOVABLE_API_KEY` | Legacy fallback only: lets Lovable previews run AI without an Anthropic key |

## Known gaps and sharp edges

1. **Supabase CLI 403s** on this project; migrations and edge functions are deployed manually via Management API or `bunx supabase@latest functions deploy` (`docs/manual-deploy-bundle.md`).
2. **CI/CD committed but dormant until GitHub secrets exist**: `.github/workflows/ci.yml` and `deploy.yml` need `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and the `VITE_SUPABASE_*` values as repository secrets.
3. **Repo-wide lint debt**: `bun run lint` fails with thousands of pre-existing prettier errors across the codebase. New code should be prettier-clean; a one-shot `bun run format` cleanup is a separate decision because of the diff size. Lint is intentionally not in CI yet.
4. **Email queue pump scheduling**: the pump is a Supabase pg_cron job (`process-email-queue`, 5s interval) that POSTs to the app with the vault-stored service-role key. Its URL must point to `https://www.purplelife.org/api/email/queue/process`.
5. **`src/routeTree.gen.ts` is generated.** Never hand-edit; it regenerates from `src/routes/` during dev/build.
6. **`vite.config.ts` is a wrapper.** Do not add tanstackStart/react/tailwind/tsconfig-paths/cloudflare plugins manually while `@lovable.dev/vite-tanstack-config` is in place; duplicates break the build. The import must stay pointed at `dist/index.js` (the ESM build); the bare specifier resolves to the CJS build, which crashes config loading on Node 22+.
7. **E2E debt:** `tests/e2e/samuel-fixes.spec.ts` has 12 persistent prod failures (verify-sent button copy, prescriber label). Not blocking HIPAA empty-state work.
8. **External webhook pointers** at cutover: Stripe webhook, Supabase send-email hook, Resend webhook, Google/Apple OAuth redirect URLs, Oura/Whoop redirect URIs (prod URLs registered).

## Decisions made (2026-06-11)

1. Email provider: Resend.
2. Platform-default AI provider: Anthropic Claude.
3. Canonical public GitHub repository: `AstroAii/purpledrw`.
4. Worker name: `purplelife`; deploys go directly to Cloudflare.
5. Dual development continues in Cursor and Lovable; do not remove Lovable dev tooling.

## How to verify a change (cheapest first)

When reviewing Lovable changes, follow the full checklist in
`docs/LOVABLE-REDESIGN-WORKFLOW.md` and `docs/SYNC-AND-RELEASE.md`. Minimum gates:

1. `bun run check:em-dash` (lint is currently red repo-wide; lint only your changed files)
2. `bun run check:live-data`, `bun run check:lovable-auth`, and `bun run check:unique-images`
3. `bunx tsc --noEmit` and `bun run build:prod` + `bun run check:entry-budget`
4. `doppler run ... bun run check:live-data:db` when seeds or marketing data touched
5. `bunx playwright test tests/e2e/responsive-sweep.spec.ts -g "public routes"` for UI changes
6. `bun run test:e2e:prod` before asking the owner to deploy live (or after deploy for full confidence)

For Worker behavior: `wrangler dev` against the built output.

## Conventions snapshot

- Server code: `*.functions.ts` (RPC, auth middleware, zod) + `*.server.ts` (secrets, dynamic import only). Details in `.cursor/rules/server-functions.mdc`.
- 404 (not 403) on cross-user access; audit log after sensitive writes; RLS on every table.
- No em dashes anywhere, ever (CI gate).
- i18n strings through i18next; SSR renders `en` then hydrates locale.
- Footer only on marketing/auth pages, never inside `AppShell`.
- Post-task documentation mandatory: `.cursor/rules/post-task-documentation.mdc`.

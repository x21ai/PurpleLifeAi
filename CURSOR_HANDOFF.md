# Cursor Handoff

Operational state of the PurpleLife project for the next agent or engineer. Last updated: 2026-06-19.

Positioning: PurpleLife is an AI health journal for any health management (epilepsy was the founding focus; the condition catalog is general).

Development model: the project is edited from both Cursor and Lovable. A whole-app redesign is in progress in Lovable; GitHub `main` syncs both sides. Cursor is the production gatekeeper: review and test every Lovable landing on `main`, then ask the owner before deploying live. Lovable dev tooling (`@lovable.dev/vite-tanstack-config`, `.lovable/`, preview-host checks in `src/lib/med-notifications.ts`) is kept intact on purpose. Do not remove it.

## Orientation

- Product and architecture: `docs/ARCHITECTURE.md`
- Feature inventory and route map: `docs/FEATURES.md`
- Lovable redesign gatekeeper: `docs/LOVABLE-REDESIGN-WORKFLOW.md` (baseline `7086ffa`)
- Lovable preview env parity: `docs/LOVABLE-ENV-PARITY.md`
- Lovable exit + Cloudflare cutover plan: `docs/LOVABLE-MIGRATION.md`
- Supabase manual deploy procedure: `docs/manual-deploy-bundle.md`
- OAuth provider setup: `docs/oauth-provider-setup.md`
- Durable decisions: `mem/index.md` (no em dashes, footer visibility, metric naming)
- Editor rules: `.cursor/rules/` (conventions, server functions, Cloudflare constraints, lovable-redesign-workflow)

## Quick facts

| Item | Value |
|------|-------|
| Brand / domain | Purple, `https://www.purplelife.org` |
| Framework | TanStack Start 1.168, React 19, Vite 7, Tailwind 4 |
| Runtime | Cloudflare Worker (`wrangler.jsonc`, entry `src/server.ts`, `nodejs_compat`) |
| Package manager | bun (commands below) |
| Database | Supabase project `xxnzmfzsjplrutrgbzxy` (Purple Life, us-east-2), ~100+ migrations, edge functions deployed |
| Dev server | `bun run dev` on port 8080 |
| E2E | `bun run test:e2e` (Playwright, boots dev server unless `E2E_BASE_URL` set); prod: `bun run test:e2e:prod` |
| Lint/format | `bun run lint`, `bun run format` |
| Quality gates | `bun run check:em-dash` (also prebuild), `check:live-data`, `check:unique-images`, `check:entry-budget` |
| Seeds | `bun run seed:research` (needs `OPENAI_API_KEY` + `SUPABASE_SERVICE_ROLE_KEY`) |

## Current hosting state

Production runs on the Cloudflare Worker `purplelife` at `https://www.purplelife.org`
(DNS cutover complete). Supabase live data is on ref `xxnzmfzsjplrutrgbzxy` with
branded auth at `https://auth.purplelife.org`.

- OAuth: native `supabase.auth.signInWithOAuth()` (Apple/Google).
- Email: queue delivery via Resend (`/api/email/queue/process`), Supabase send-email hook at `/api/email/auth/webhook`, Resend bounce/complaint webhook at `/api/email/suppression`.
- AI: Anthropic Claude is the platform default (`src/lib/ai-gateway.server.ts`); Lovable gateway remains only as a last-resort fallback for Lovable previews without an Anthropic key.

**Deploy model (during Lovable redesign):** manual only. `.github/workflows/deploy.yml`
triggers on `workflow_dispatch`, not on push to `main`. Cursor runs the gatekeeper
checklist in `docs/LOVABLE-REDESIGN-WORKFLOW.md`, then asks the owner before deploy.
Local path: `bun run build:prod` then `bunx wrangler deploy -c wrangler.deploy.jsonc`
(account ID `08e766e92db74bc7ef14c6b5c86bddf0` if Doppler still has POS). Cron Triggers
fan out from `scheduled()` in `src/server.ts` through a `SELF` service binding.

Redesign baseline on `main`: commit `7086ffa` (perf/responsive/native foundation).

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
| `PUBLIC_SITE_URL` | Email links, share links, unsubscribe headers |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Billing |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web push |
| `OURA_CLIENT_ID/SECRET`, `WHOOP_CLIENT_ID/SECRET` | Wearable OAuth |
| `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROK_API_KEY` | Optional per-user AI provider choices (and embeddings seeds for OpenAI) |
| `LOVABLE_API_KEY` | Legacy fallback only: lets Lovable previews run AI without an Anthropic key |

## Known gaps and sharp edges

1. **Supabase CLI 403s** on this project; migrations and edge functions are deployed manually via the dashboard (`docs/manual-deploy-bundle.md`). The pending migration to apply: `supabase/migrations/20260611010000_remove_lovable_ai_provider.sql`, plus redeploys of `ai-orchestrator` and `risk-forecaster`.
2. **CI/CD committed but dormant until GitHub secrets exist**: `.github/workflows/ci.yml` and `deploy.yml` need `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and the `VITE_SUPABASE_*` values as repository secrets.
3. **Repo-wide lint debt**: `bun run lint` fails with thousands of pre-existing prettier errors across the codebase. New code should be prettier-clean; a one-shot `bun run format` cleanup is a separate decision because of the diff size. Lint is intentionally not in CI yet.
4. **Email queue pump scheduling**: the pump is a Supabase pg_cron job (`process-email-queue`, 5s interval) that POSTs to the app with the vault-stored service-role key. Its URL must be re-pointed to `https://www.purplelife.org/api/email/queue/process` at cutover.
5. **`src/routeTree.gen.ts` is generated.** Never hand-edit; it regenerates from `src/routes/` during dev/build.
6. **`vite.config.ts` is a wrapper.** Do not add tanstackStart/react/tailwind/tsconfig-paths/cloudflare plugins manually while `@lovable.dev/vite-tanstack-config` is in place; duplicates break the build. The import must stay pointed at `dist/index.js` (the ESM build); the bare specifier resolves to the CJS build, which crashes config loading on Node 22+.
7. **Email DNS**: `notify.purplelife.org` is delegated to Lovable nameservers. It must be re-verified with Resend and re-pointed, coordinated with the Supabase auth-hook URL change.
8. **External webhook pointers** that must move at cutover: Stripe webhook, Supabase send-email hook (to `/api/email/auth/webhook`), Resend webhook (to `/api/email/suppression`), Google/Apple OAuth redirect URLs, Oura/Whoop redirect URIs.

## Decisions made (2026-06-11)

1. Email provider: Resend.
2. Platform-default AI provider: Anthropic Claude.
3. Canonical public GitHub repository: `AstroAii/purpledrw`.
4. Worker name: `purplelife`; deploys go directly to Cloudflare.
5. Dual development continues in Cursor and Lovable; do not remove Lovable dev tooling.

## How to verify a change (cheapest first)

When reviewing Lovable changes, follow the full checklist in
`docs/LOVABLE-REDESIGN-WORKFLOW.md`. Minimum gates:

1. `bun run check:em-dash` (lint is currently red repo-wide; lint only your changed files)
2. `bun run check:live-data` and `bun run check:unique-images`
3. `bunx tsc --noEmit` and `bun run build` + `bun run check:entry-budget`
4. `bunx playwright test tests/e2e/responsive-sweep.spec.ts -g "public routes"` for UI changes
5. `bun run test:e2e:prod` before asking the owner to deploy live

For Worker behavior: `wrangler dev` against the built output.

## Conventions snapshot

- Server code: `*.functions.ts` (RPC, auth middleware, zod) + `*.server.ts` (secrets, dynamic import only). Details in `.cursor/rules/server-functions.mdc`.
- 404 (not 403) on cross-user access; audit log after sensitive writes; RLS on every table.
- No em dashes anywhere, ever (CI gate).
- i18n strings through i18next; SSR renders `en` then hydrates locale.
- Footer only on marketing/auth pages, never inside `AppShell`.

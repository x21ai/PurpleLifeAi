# Purple Architecture

PurpleLife is an AI health journal for any health management (epilepsy was the founding focus; the condition catalog is general). Brand domain: `https://www.purplelife.org`. This document describes how the system is put together. For the feature inventory see `docs/FEATURES.md`; for the Lovable exit plan see `docs/LOVABLE-MIGRATION.md`; for the current operational state see `CURSOR_HANDOFF.md`.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start 1.168 (React 19, file-based routing, SSR + server functions) |
| Build | Vite 7 via `@lovable.dev/vite-tanstack-config` wrapper, `vite-imagetools` for responsive images |
| Styling | Tailwind CSS 4, shadcn/ui (`src/components/ui/`), Oura-styled variants (`src/components/ui-oura/`) |
| Data | Supabase: Postgres (~100 migrations), Auth, Storage, Edge Functions, pgvector, PGMQ |
| Payments | Stripe (subscriptions, promo codes, webhooks) |
| AI | Vercel AI SDK (`ai`, `@ai-sdk/*`); Anthropic Claude is the platform default, with OpenAI, Gemini, and Grok as user-selectable options |
| Email | React Email templates, queue in Postgres (PGMQ), delivery via Resend, suppression via Resend bounce/complaint webhooks |
| Hosting | Cloudflare Workers (`wrangler.jsonc`, `nodejs_compat`), SSR worker entry `src/server.ts` |
| i18n | i18next + react-i18next, `en` and `es` |
| Tests | Playwright e2e (`tests/e2e/`), 5 viewport projects |

## Entry points and request flow

1. `wrangler.jsonc` sets `main: src/server.ts`. The `@cloudflare/vite-plugin` (injected by the Lovable vite wrapper) builds the Worker from that entry; `vite.config.ts` redirects TanStack Start's server entry to the same file via `tanstackStart.server.entry: "server"`.
2. `src/server.ts` exports the fetch handler. It delegates to `@tanstack/react-start/server-entry` and wraps unhandled SSR failures in a branded HTML error page (`src/lib/error-page.ts`).
3. `src/start.ts` registers global middleware:
   - `errorMiddleware` (request-level): converts uncaught server errors into the branded 500 page while passing through structured `statusCode` errors.
   - `attachSupabaseAuth` (function-level): attaches the client's Supabase Bearer token to every server function call.
4. `src/router.tsx` builds the TanStack Router with a shared React Query client in context.
5. `src/routes/__root.tsx` is the HTML shell: meta/OG tags, manifest and icon links, `AuthProvider`, service worker registration, locale hydration, and Oura auto-sync kickoff.

## Routing

File-based under `src/routes/`, generated into `src/routeTree.gen.ts` (never hand-edit).

- **Public marketing**: top-level files (`index.tsx`, `about.tsx`, `features.tsx`, `pricing.tsx`, `charter.tsx`, `contact.tsx`, `privacy.tsx`, `terms.tsx`, `how-purple-thinks.tsx`, `community.*`). These render `MarketingHeader` and `SiteFooter`. Footer rules: see `mem/design/footer-visibility.md`.
- **Auth**: `sign-in.tsx`, `sign-up.tsx`, `reset-password.tsx`, `unsubscribe.tsx`.
- **Authenticated app**: everything under `src/routes/_app/`. The pathless `_app.tsx` layout guards the session in `beforeLoad` (redirects to `/sign-in`), redirects un-onboarded users to `/welcome`, and wraps pages in `AppShell` (no marketing footer).
- **Token-based semi-public**: `care.accept.tsx`, `friend.join.tsx`, `friend.accept.tsx`, `share.report.$token.tsx` (noindex), `email.unsubscribe.tsx`.
- **OAuth callbacks**: `oauth.oura.callback.tsx`, `oauth.whoop.callback.tsx`.
- **API routes** (`src/routes/api/`): `server.handlers` exports.
  - `/api/chat`: streaming AI chat (Vercel AI SDK `streamText`).
  - `/api/public/stripe-webhook`: Stripe signature-verified webhooks.
  - `/api/public/hooks/*`: Apple Health ingest, risk forecaster callbacks.
  - `/api/public/cron/*`: 8 endpoints (dose reminders, Oura/Whoop sync, care digests, weekly recap, email queue pump, etc.), each guarded by `CRON_SECRET`.
- **Email routes** (`src/routes/api/email/*`): Supabase send-email hook (`auth/webhook`), transactional send, queue processor (Resend delivery), suppression webhook (Resend events), template previews.

## Server code pattern

Two-file split in `src/lib/`, roughly 35 + 14 files:

- `<feature>.functions.ts`: `createServerFn()` RPCs. Input validated with zod, auth attached by global middleware and verified by `src/integrations/supabase/auth-middleware.ts`, which yields `{ supabase, userId }` bound to the caller's JWT (RLS applies).
- `<feature>.server.ts`: server-only modules holding secrets and privileged clients (Stripe SDK, AI provider keys, VAPID keys, wearable OAuth secrets, service-role Supabase). Imported dynamically from the functions file so secrets never enter the client bundle.

## Auth

- Email/password: direct Supabase Auth.
- Apple/Google OAuth: native `supabase.auth.signInWithOAuth()` (`src/components/auth/social-sign-in-buttons.tsx`); `src/lib/auth-oauth.ts` handles callback detection. Provider setup is documented in `docs/oauth-provider-setup.md`.
- Session state and locale seeding: `src/integrations/supabase/auth-context.tsx`.
- Roles: `user_roles` table; admin routes check server-side.

## Data model (domain summary)

| Domain | Key tables |
|--------|-----------|
| Core health | `profiles`, `seizure_events`, `medications`, `medication_doses`, `medication_side_effects`, `journal_entries`, `biometrics`, `risk_forecasts`, `alerts` |
| Wearables | `oura_tokens`, `whoop_tokens`, `apple_health_tokens` |
| AI | `ai_memory` (pgvector), `research_sources` (embedded research library) |
| Care | `care_relationships`, `care_scopes`, `pending_changes`, `care_audit_log`, `care_threads`, `care_messages` |
| Reports | `medical_reports`, `report_documents`, `report_metrics`, `metric_dictionary`, `medical_report_shares`, `medical_report_schedules` |
| Intake | `hydration_intake`, `aura_events`, `food_entries`, `vitals_log`, `vital_goals` |
| DNA | `dna_files`, `dna_variants` |
| Community | `community_posts`, `community_comments`, `community_reactions`, `community_reports`, `community_resources` |
| Billing | `subscriptions`, `promo_codes`, `promo_code_redemptions`, `app_settings` (`pro_free_for_everyone` flag) |
| Email | `email_send_log`, `suppressed_emails`, `email_unsubscribe_tokens`, PGMQ queues (`auth_emails`, `transactional_emails`) |
| Compliance | `phi_access_log`, `platform_rule_audit` |

All health tables carry RLS. Caregiver access is mediated by scopes (`src/lib/care.scopes.ts`), and denied cross-user access returns 404.

## Supabase edge functions

| Function | Purpose |
|----------|---------|
| `ai-orchestrator` | Ask Purple backend with tools + research retrieval |
| `journal-processor` / `journal-extract` | AI extraction from journal entries |
| `med-dose-action` | Mark doses taken/missed from notifications |
| `oura-sync` | Oura data sync |
| `risk-forecaster` | Daily risk score + narrative |

Manual deploy procedure (when the Supabase CLI 403s): `docs/manual-deploy-bundle.md`.

## Email pipeline

1. Producers: Supabase auth hook (`/lovable/email/auth/webhook`, HMAC-verified) and app code (`src/lib/email/send.ts` over HTTP with user JWT, or `src/lib/email/render-and-enqueue.server.ts` directly from cron with service role).
2. Templates: React Email components in `src/lib/email-templates/`, rendered server-side.
3. Queue: PGMQ via `enqueue_email` RPC; suppression list checked before enqueue.
4. Delivery: `/lovable/email/queue/process` (cron) dequeues and sends via `@lovable.dev/email-js` from `noreply@notify.purplelife.org`; failures go to a DLQ.
5. Feedback: Mailgun-format bounce/complaint/unsubscribe webhook at `/lovable/email/suppression` writes `suppressed_emails`.

## PWA

- `public/manifest.json` (name "Purple", theme `#5B2C82`), icons 192/512.
- `public/sw.js`: med dose reminders driven by IndexedDB schedules, shell cache `purple-shell-v4`. Registration in `src/lib/med-notifications.ts` (skips Lovable preview hosts).
- Install prompts: `src/components/pwa/`.
- Web push: VAPID keys, `push_subscriptions` table, `src/lib/push.server.ts`.

## i18n

i18next with `en` and `es` locales (`src/i18n/locales/`). SSR always renders `en` to avoid hydration mismatch; `hydrateLocale()` switches post-hydration from localStorage, then navigator, and syncs with `profiles.locale`.

## Quality gates and tests

- `bun run lint`, `bun run check:em-dash` (also a prebuild gate), `bun run check:live-data`, `bun run check:unique-images`.
- Playwright e2e in `tests/e2e/` across mobile-375, tablet-768, tablet-1023, desktop-1024, desktop-1440. `bun run test:e2e`; it boots `bun run dev` on port 8080 unless `E2E_BASE_URL` is set.
- No GitHub Actions CI is currently committed.

## Durable decisions

`mem/` is the decision log: no em dashes (`mem/constraint/no-em-dash.md`), footer visibility rules (`mem/design/footer-visibility.md`), metric naming canon (`mem/feature/metric-naming.md`). Check `mem/index.md` before changing related behavior.

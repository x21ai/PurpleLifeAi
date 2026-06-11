# Lovable Exit Plan: branding, performance, Cloudflare cutover

Goal: remove Lovable service dependencies and branding, optimize page speed, and serve production from our own Cloudflare account (Workers + static assets) instead of Lovable-managed hosting. Lovable remains a supported development environment (decision 2026-06-11), so dev tooling (`@lovable.dev/vite-tanstack-config`, `.lovable/`, preview-host checks) is intentionally kept.

Status (2026-06-11):

| Phase | Status |
|-------|--------|
| 1. Vite unwrap | CANCELLED, wrapper kept for Lovable dev compatibility (only the import was fixed to the ESM build for Node 22) |
| 2. OAuth to native Supabase | CODE DONE, needs new Google/Apple codes configured in the Supabase dashboard |
| 3. Email to Resend | CODE DONE, needs `RESEND_API_KEY`, domain verification, hook/webhook configuration |
| 4. AI to Anthropic | CODE DONE, needs `ANTHROPIC_API_KEY` in Worker + edge function secrets, migration `20260611010000` applied, edge functions redeployed |
| 5. Branding sweep | DONE (dev tooling intentionally kept) |
| 6. Performance | DONE (caching pass; bundle/images/fonts were already in good shape) |
| 7. Cloudflare cutover | PENDING (worker renamed `purplelife`; needs Cloudflare credentials, secrets, DNS) |

Decisions locked: Resend for email, Anthropic for platform AI, `AstroAii/purpledrw` as the canonical repo, worker name `purplelife`, dual Cursor + Lovable development.

## Current Lovable coupling map

| Coupling | Where | Replacement |
|----------|-------|-------------|
| Vite config wrapper | `vite.config.ts` (`@lovable.dev/vite-tanstack-config`) | Explicit plugin list |
| OAuth (Apple/Google) | `src/integrations/lovable/index.ts`, `src/components/auth/social-sign-in-buttons.tsx` (`@lovable.dev/cloud-auth-js`) | Native `supabase.auth.signInWithOAuth()` |
| Email delivery | `src/routes/lovable/email/*` (6 routes), `@lovable.dev/email-js`, `@lovable.dev/webhooks-js`, DNS on `notify.purplelife.org` | Resend or Mailgun direct + own DNS |
| AI gateway | `src/routes/api/chat.ts`, `src/lib/ai-gateway.server.ts`, `src/lib/ai-provider.server.ts`, `src/lib/care-profile.functions.ts`, `src/lib/report-trends.functions.ts`, `supabase/functions/ai-orchestrator`, `supabase/functions/risk-forecaster` (all use `ai.gateway.lovable.dev` + `LOVABLE_API_KEY`) | Direct provider keys (Gemini/Anthropic/OpenAI), already partially wired |
| Branding strings | `src/routes/index.tsx` JSON-LD (`purplelife.lovable.app`), settings label "Lovable AI Gateway", About link `github.com/lovable-dev/purple`, "Connect Supabase in Lovable Cloud" error strings | Purple-branded equivalents |
| Host checks | `src/lib/med-notifications.ts` skips SW on `lovableproject.com` etc. | Harmless; remove once off Lovable previews |
| Metadata | `.lovable/` folder, `bunfig.toml` exclusion, `.env` comments | Delete after cutover |

## Phase 1: Vite config (CANCELLED, wrapper kept)

Decision: Lovable remains a development environment, and its editor/preview tooling depends on `@lovable.dev/vite-tanstack-config` (dev-server bridge, HMR gate, component tagger). All of it is dev-only and does not ship to production, so the wrapper stays.

One fix landed: the import in `vite.config.ts` points at `@lovable.dev/vite-tanstack-config/dist/index.js` (the ESM build). The package has no `exports` map, so the bare specifier resolves to the CJS build, which `require()`s Vite's ESM entry in a cycle and crashes config loading on Node 22+.

## Phase 2: OAuth to native Supabase (CODE DONE)

Landed: `src/components/auth/social-sign-in-buttons.tsx` now calls `supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })`; `src/integrations/lovable/` and `@lovable.dev/cloud-auth-js` are removed. Callback handling in `src/lib/auth-oauth.ts` is unchanged.

Remaining (external): configure the new Google and Apple client codes in the Supabase dashboard per `docs/oauth-provider-setup.md` (callback `https://lzuodgpqseijhhyzgfky.supabase.co/auth/v1/callback`). New client IDs were the chosen path; existing OAuth users re-consent on first sign-in but keep the same accounts (Supabase matches provider subject + email).

## Phase 3: Email to Resend (CODE DONE)

Landed:

1. Routes moved to `/api/email/*`: `auth/webhook`, `auth/preview`, `transactional/send`, `transactional/preview`, `queue/process`, `suppression`. Internal callers updated (`src/lib/email/send.ts`; the weekly-recap cron now enqueues directly via `enqueueRenderedEmail`, fixing a latent auth bug in its old HTTP call).
2. `queue/process` delivers through the Resend API (`RESEND_API_KEY`), with Idempotency-Key, `List-Unsubscribe` one-click headers, 429 backoff via Retry-After, and 401/403 straight to DLQ. PGMQ queue, TTLs, retries, send log unchanged.
3. `auth/webhook` verifies the Supabase send-email hook natively (Standard Webhooks HMAC, `SEND_EMAIL_HOOK_SECRET`, implemented on Web Crypto in `src/lib/email/webhook-verify.server.ts`) and builds verification URLs from `token_hash`.
4. `suppression` consumes Resend's svix-signed `email.bounced` / `email.complained` events (`RESEND_WEBHOOK_SECRET`); transient bounces are ignored.
5. Previews gated by `EMAIL_PREVIEW_SECRET`. `@lovable.dev/email-js` and `@lovable.dev/webhooks-js` removed.

Remaining (external): verify `notify.purplelife.org` in Resend and move its DNS off Lovable nameservers (SPF/DKIM records from the Resend dashboard), point the Supabase Auth send-email hook at `https://www.purplelife.org/api/email/auth/webhook` and store its secret as `SEND_EMAIL_HOOK_SECRET`, create a Resend webhook for bounced/complained pointed at `/api/email/suppression`.

Verify: auth emails (sign-up confirm, reset) deliver end-to-end on a staging address before flipping the Supabase hook in production; suppression webhook writes `suppressed_emails`.

## Phase 4: AI to Anthropic (CODE DONE)

Landed:

1. `src/lib/ai-gateway.server.ts` is now `resolvePlatformModel(provider)`: Anthropic Claude (`claude-sonnet-4-5` via `@ai-sdk/anthropic`) is the platform default; when the user picked OpenAI/Grok/Gemini in Settings and the matching platform key exists, that provider is called directly (OpenAI-compatible endpoints). The Lovable gateway survives only as a last-resort fallback when no `ANTHROPIC_API_KEY` exists but `LOVABLE_API_KEY` does, which keeps Lovable previews working.
2. `/api/chat` no longer requires `LOVABLE_API_KEY`; it streams through the resolved platform model with tools intact.
3. The `lovable` provider option is removed from `ai-provider.functions.ts`, `ai-provider.server.ts`, and the Settings UI. Migration `supabase/migrations/20260611010000_remove_lovable_ai_provider.sql` rewrites stored `'lovable'` prefs to `'claude'` and tightens the CHECK constraint.
4. `care-profile.functions.ts` and `report-trends.functions.ts` use `resolvePlatformModel()`.
5. Edge functions: `risk-forecaster` narrates via the Anthropic API; `ai-orchestrator`'s text-only lane calls Gemini/OpenAI directly when their keys exist and otherwise falls through to the Claude tool-use lane.

Remaining (external): set `ANTHROPIC_API_KEY` in Worker secrets and Supabase edge function secrets (optionally `GEMINI_API_KEY`/`OPENAI_API_KEY`/`GROK_API_KEY` for user-choice lanes), apply the migration, redeploy both edge functions per `docs/manual-deploy-bundle.md` if the CLI still 403s.

Verify: chat streams, daily insight cards generate, risk forecaster narrative renders, free-tier limit still enforced.

## Phase 5: Branding sweep (DONE, dev tooling intentionally kept)

1. JSON-LD `sameAs` with `purplelife.lovable.app` removed from `src/routes/index.tsx`.
2. About link points at `https://github.com/AstroAii/purpledrw`.
3. "Connect Supabase in Lovable Cloud" error strings replaced with neutral missing-env messages.
4. `package.json` and `wrangler.jsonc` renamed to `purplelife`.
5. Kept on purpose (Lovable remains a dev environment): `@lovable.dev/vite-tanstack-config`, `.lovable/`, the preview-host service worker checks in `src/lib/med-notifications.ts`, and the AI fallback in `ai-gateway.server.ts`.

## Phase 6: Performance (DONE)

Audit findings (2026-06-11): the heavy work was already in place. Route-level code splitting keeps `recharts` (368 kB), `jszip` (96 kB), and chat (256 kB) out of marketing chunks; marketing heroes ship AVIF/WebP srcsets with explicit dimensions, `loading="lazy"` below the fold, and `fetchpriority="high"` on the LCP image only; Google Fonts load async (preconnect + print-media swap + noscript fallback).

Landed:

1. **Immutable asset caching**: `public/_headers` (honored by Cloudflare Workers static assets) sets `max-age=31536000, immutable` for `/assets/*`, daily revalidation for icons/OG image, and `no-cache` for `sw.js` so PWA updates roll out promptly.
2. **Edge caching for marketing SSR HTML**: `src/server.ts` serves `/`, `/about`, `/features`, `/pricing`, `/charter`, `/contact`, `/privacy`, `/terms`, `/how-purple-thinks` from `caches.default` with `public, max-age=60, s-maxage=300, stale-while-revalidate=600`. Safe because SSR output never varies by user (auth lives in localStorage) and SSR always renders the `en` locale. TTL kept short so new deploys (new hashed asset URLs) propagate within minutes. Community and all app/auth routes are never cached.

Remaining (after cutover): run Lighthouse against the deployed Worker and record LCP/TBT/CLS in `CURSOR_HANDOFF.md`. The shared client entry chunk (~824 kB minified, framework + Supabase + i18n) is the next candidate if scores need more headroom.

## Phase 7: Cloudflare cutover

The build already produces a Worker. Remaining work is account, config, and DNS:

1. `wrangler.jsonc`: rename worker to `purple` (or `purplelife`), add `assets` binding for the client build output, add `routes` for `www.purplelife.org` + apex redirect, define `triggers.crons` mapping to the 8 `/api/public/cron/*` endpoints (a small scheduled handler in `src/server.ts` can fan out fetches with `CRON_SECRET`).
2. Secrets via `wrangler secret put`: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`, `VAPID_PRIVATE_KEY`, `WHOOP_CLIENT_*`, `OURA_CLIENT_*`, AI provider keys, email provider key. Non-secret vars (`PUBLIC_SITE_URL`, `VITE_SUPABASE_*`) in `vars`/build env.
4. Update external pointers: Stripe webhook URL, Supabase auth hook URL, email provider webhooks, OAuth redirect URLs, wearable OAuth redirect URIs.
5. DNS: move `purplelife.org` zone to Cloudflare (if not already), route to the Worker, re-point `notify.purplelife.org` (Phase 3).
6. Staged rollout: deploy to a `*.workers.dev` URL, run the full Playwright suite with `E2E_BASE_URL` pointed at it, then flip DNS. Keep Lovable hosting live until the Worker has served production traffic cleanly, then archive the Lovable project.
7. Add CI (GitHub Actions): lint + checks + e2e on PR, `wrangler deploy` on main.

## Decisions (resolved 2026-06-11)

| # | Decision | Resolution |
|---|----------|------------|
| 1 | Email provider | Resend |
| 2 | Default AI provider for platform-paid usage | Anthropic Claude |
| 3 | Canonical GitHub repo for the About link | `AstroAii/purpledrw` |
| 4 | Worker name | `purplelife`, deployed directly to Cloudflare |
| 5 | Development model | Cursor and Lovable both stay; Lovable dev tooling is not removed |

## Secrets that must exist in Cloudflare before cutover

`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`, `PUBLIC_SITE_URL`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `OURA_CLIENT_ID/SECRET`, `WHOOP_CLIENT_ID/SECRET`, `ANTHROPIC_API_KEY` (plus optional `GEMINI_API_KEY`, `OPENAI_API_KEY`, `GROK_API_KEY` for user-choice lanes and embeddings seeds), `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `SEND_EMAIL_HOOK_SECRET`, `EMAIL_PREVIEW_SECRET`.

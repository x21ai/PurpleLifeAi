# Lovable Exit Plan: branding, performance, Cloudflare cutover

Goal: remove all Lovable dependencies and branding, optimize page speed, and serve production from our own Cloudflare account (Workers + static assets) instead of Lovable-managed hosting.

Status: PLANNED. Each phase lists concrete edits, blockers, and verification. Phases are ordered by dependency; 1 to 3 are independent of each other, 4 depends on 1, 5 depends on everything.

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

## Phase 1: Unwrap the Vite config

Replace `defineConfig` from `@lovable.dev/vite-tanstack-config` with an explicit config. The wrapper currently injects (per its own comments): `tanstackStart` (entry redirect to `src/server.ts`), `@vitejs/plugin-react`, `@tailwindcss/vite`, `vite-tsconfig-paths`, `@cloudflare/vite-plugin` (build-only), `lovable-tagger` (dev-only, drop it), `VITE_*` env injection, `@` alias, React/TanStack dedupe, error logger plugins, and dev server port/host settings.

Edits:

1. Rewrite `vite.config.ts` with those plugins directly (all already in `package.json` except `vite-tsconfig-paths`, which arrives via `vite-tsconfig-paths` dep, present). Keep `imagetools()`, the `entities` aliases, `optimizeDeps`, and `tanstackStart.server.entry: "server"`.
2. Set dev server `port: 8080` explicitly (Playwright config expects it).
3. Remove `@lovable.dev/vite-tanstack-config` from devDependencies and `bunfig.toml`.

Verify: `bun run build` succeeds, `bun run dev` serves on 8080, `bun run test:e2e` smoke specs pass, `wrangler dev` boots the built worker.

## Phase 2: OAuth to native Supabase

`docs/oauth-provider-setup.md` already documents Google + Apple provider setup on Supabase project `lzuodgpqseijhhyzgfky` (callback `https://lzuodgpqseijhhyzgfky.supabase.co/auth/v1/callback`).

Edits:

1. Confirm the providers are configured in the Supabase dashboard with our own Google/Apple credentials (external step).
2. Replace `lovable.auth.signInWithOAuth(provider)` in `src/components/auth/social-sign-in-buttons.tsx` with `supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })`.
3. Keep `src/lib/auth-oauth.ts` callback handling (it already works off Supabase session establishment); adjust param detection if needed.
4. Delete `src/integrations/lovable/` and drop `@lovable.dev/cloud-auth-js`.

Risk: existing OAuth users keep working as long as the same Google/Apple client IDs are used; if new client IDs are issued, users re-consent but keep the same accounts (Supabase matches on provider subject + email).

## Phase 3: Email off Lovable

Decision needed: **Resend** (recommended; React Email is first-class) or **Mailgun direct** (suppression webhook already speaks Mailgun's payload format).

Edits:

1. Move `/lovable/email/*` routes to `/api/email/*` (auth webhook, transactional send, queue processor, suppression, previews). Update the two internal callers: `src/lib/email/send.ts` and `src/routes/api/public/cron/weekly-recap.ts`.
2. In the queue processor, replace `sendLovableEmail()` with the chosen provider's API. Keep the PGMQ queue, DLQ, suppression check, and send log exactly as-is.
3. Replace `@lovable.dev/webhooks-js` HMAC verification with the standard Supabase auth-hook signature verification (it is a Standard Webhooks signature; the `standardwebhooks` package or a small manual HMAC check covers it).
4. Gate previews behind a new `EMAIL_PREVIEW_SECRET` instead of `LOVABLE_API_KEY`.
5. External: take `notify.purplelife.org` DNS back from Lovable nameservers, add the provider's SPF/DKIM/DMARC records, update the Supabase auth email hook URL and the bounce webhook URL in the provider dashboard.

Verify: auth emails (sign-up confirm, reset) deliver end-to-end on a staging address before flipping the Supabase hook in production; suppression webhook writes `suppressed_emails`.

## Phase 4: AI off the Lovable gateway

The code already supports direct providers. The work is making one the platform default and removing the `lovable` option.

Decision needed: default provider for platform-paid usage. Gemini Flash is the closest like-for-like on cost; Anthropic is already wired for higher-quality paths.

Edits:

1. `src/routes/api/chat.ts`: stop requiring `LOVABLE_API_KEY`; route platform-default traffic to the chosen provider via the existing `@ai-sdk/*` clients.
2. `src/lib/ai-gateway.server.ts`: replace the Lovable provider factory with the chosen default (or delete and use `ai-provider.server.ts` paths).
3. `src/lib/ai-provider.server.ts` / `ai-provider.functions.ts` / `src/components/settings/ai-provider-section.tsx`: remove the `lovable` provider; relabel the built-in option "Purple AI (built-in)". Migrate stored user prefs: one migration updating `profiles.ai_provider = 'lovable'` to the new default, and update the CHECK constraint added in `supabase/migrations/20260607224715_*`.
4. `src/lib/care-profile.functions.ts`, `src/lib/report-trends.functions.ts`: swap gateway calls to the default provider.
5. Edge functions `ai-orchestrator` and `risk-forecaster`: replace `callGeminiViaLovableAI()`/gateway fetches with direct Gemini calls using `GEMINI_API_KEY`; redeploy per `docs/manual-deploy-bundle.md` if the CLI still 403s.
6. Set `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` / `OPENAI_API_KEY` in Worker secrets and Supabase edge function secrets.

Verify: chat streams, daily insight cards generate, risk forecaster narrative renders, free-tier limit still enforced.

## Phase 5: Branding sweep and dependency removal

1. `src/routes/index.tsx`: drop `https://purplelife.lovable.app` from JSON-LD `sameAs`.
2. `src/components/settings/about-section.tsx`: point the GitHub link at the real repository (decision: which org/repo is canonical; docs currently mention `AstroAii/purpledrw` while the link says `lovable-dev/purple`).
3. `src/integrations/supabase/client.ts`, `client.server.ts`, `auth-middleware.ts`: reword "Connect Supabase in Lovable Cloud" errors to plain missing-env messages.
4. `src/lib/med-notifications.ts`: remove Lovable preview-host checks.
5. Delete `.lovable/`, remove all `@lovable.dev/*` from `package.json`, regenerate lockfiles, scrub `bunfig.toml`.
6. `package.json` name from `tanstack_start_ts` to `purple`.
7. Grep gate: `rg -i lovable` should return only this document and historical docs.

## Phase 6: Performance

Targets: marketing pages (first impression, SEO) and the app shell.

1. **Bundle**: build with `--mode production` and inspect chunks (rollup-plugin-visualizer or `vite-bundle-visualizer`). Known heavy deps to keep out of marketing-page chunks: `recharts`, `pdf-lib`, `jszip`/`fflate`, `react-email` renderer, `embla-carousel`. Confirm route-level code splitting is effective; lazy-load chart and PDF code behind user interaction.
2. **Images**: `vite-imagetools` is installed; ensure every marketing hero emits AVIF/WebP `srcset` with explicit width/height (CLS) and `loading="lazy"` below the fold, `fetchpriority="high"` on the LCP image only.
3. **Fonts**: self-host with `font-display: swap` and preload only the weights used above the fold.
4. **SSR caching**: marketing routes are static per-locale; add `Cache-Control: public, s-maxage` headers (Cloudflare edge cache) for `/`, `/about`, `/features`, `/pricing`, `/charter`, `/privacy`, `/terms`, `/how-purple-thinks`. Keep app routes `private`.
5. **Dev-only weight**: removing `lovable-tagger` (Phase 1) trims dev transforms; verify no tagger artifacts ship in prod.
6. Measure before/after with Lighthouse against the deployed Worker (LCP, TBT, CLS) and record results in `CURSOR_HANDOFF.md`.

## Phase 7: Cloudflare cutover

The build already produces a Worker. Remaining work is account, config, and DNS:

1. `wrangler.jsonc`: rename worker to `purple` (or `purplelife`), add `assets` binding for the client build output, add `routes` for `www.purplelife.org` + apex redirect, define `triggers.crons` mapping to the 8 `/api/public/cron/*` endpoints (a small scheduled handler in `src/server.ts` can fan out fetches with `CRON_SECRET`).
2. Secrets via `wrangler secret put`: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`, `VAPID_PRIVATE_KEY`, `WHOOP_CLIENT_*`, `OURA_CLIENT_*`, AI provider keys, email provider key. Non-secret vars (`PUBLIC_SITE_URL`, `VITE_SUPABASE_*`) in `vars`/build env.
4. Update external pointers: Stripe webhook URL, Supabase auth hook URL, email provider webhooks, OAuth redirect URLs, wearable OAuth redirect URIs.
5. DNS: move `purplelife.org` zone to Cloudflare (if not already), route to the Worker, re-point `notify.purplelife.org` (Phase 3).
6. Staged rollout: deploy to a `*.workers.dev` URL, run the full Playwright suite with `E2E_BASE_URL` pointed at it, then flip DNS. Keep Lovable hosting live until the Worker has served production traffic cleanly, then archive the Lovable project.
7. Add CI (GitHub Actions): lint + checks + e2e on PR, `wrangler deploy` on main.

## Decisions needed before execution

| # | Decision | Options |
|---|----------|---------|
| 1 | Email provider | Resend (recommended) vs Mailgun direct |
| 2 | Default AI provider for platform-paid usage | Gemini Flash (cost) vs Anthropic (quality) |
| 3 | Canonical GitHub repo for the About link | `AstroAii/purpledrw` vs other |
| 4 | Worker name + apex/www routing preference | n/a |

## Secrets that must exist in Cloudflare before cutover

`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`, `PUBLIC_SITE_URL`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `OURA_CLIENT_ID/SECRET`, `WHOOP_CLIENT_ID/SECRET`, chosen AI keys (`GEMINI_API_KEY` and/or `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` for embeddings/seeds), email provider key, `EMAIL_PREVIEW_SECRET`. Until Phase 3/4 land, `LOVABLE_API_KEY` is still required.

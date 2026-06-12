# Purple: Project Knowledge

A single-file handoff for any AI or engineer picking up Purple. Paste this into a new Lovable, Cursor, ChatGPT, or Claude session to bring it fully up to speed. Companion to (not a replacement for) `CURSOR_HANDOFF.md`, `docs/ARCHITECTURE.md`, `docs/FEATURES.md`, `docs/LAUNCH-CHECKLIST.md`, `docs/LOVABLE-MIGRATION.md`, and the `mem/` decision log.

Last updated: 2026-06-12.

No em dashes anywhere in this document (CI gate). Use commas, "and", "or", colons, or split sentences.

---

## 1. What Purple is

Purple is a private, AI-powered health journal for people living with conditions that need daily attention: epilepsy, migraine, diabetes, mental health, autoimmune, POTS / dysautonomia, long COVID, chronic pain, and more. It also serves the family members and caregivers who support them.

Users write, speak, or snap entries. Purple stores them, extracts structured behaviors, tracks medications, syncs wearables, and surfaces patterns over time. Free, open source, ad-free. The user's data is theirs.

Epilepsy is the depth Purple is known for. The catalog and feature set are condition-aware, not condition-locked.

Purple is not a medical device and is not a substitute for clinical care. Every AI surface that touches health output ships with the medical disclaimer.

### Brand rules (non-negotiable)

- Name is always written "Purple", capitalized. Never lowercase "purple" in copy.
- Tone: calm, quiet, respectful of the user's energy. Apple-like restraint.
- The PURPLE wordmark stands alone. Never put a role switcher, menu, or badge next to it. The account menu lives top right on every screen.
- No third-party analytics or trackers, ever. No gtag, posthog, plausible, mixpanel, amplitude, fathom, sentry, none of them.
- User-uploaded media (the `journal-media` and `reports` storage buckets) is private. Always read it through `createSignedUrl`. Never make these buckets public.
- No em dashes anywhere, ever (enforced by `bun run check:em-dash`, also a prebuild gate).
- Footer (`SiteFooter`) renders on all viewports for marketing and auth routes only. The signed-in `AppShell` never renders it. Do not gate the footer on `lg:` or larger breakpoints.
- Metric labels always show the canonical human name from `src/lib/metric-naming.ts`. The PDF's original wording is preserved as "as printed: ..." unless it matches the canonical. Never delete PDF wording from the DB.

### Domains

- Primary: `https://www.purplelife.org`
- Preview / Lovable: `https://purplelife.lovable.app`
- Email sender: `purplelife <noreply@notify.purplelife.org>`

---

## 2. Current status (2026-06-12)

Production currently runs on Lovable-managed infrastructure. The Cloudflare Worker (named `purplelife` in `wrangler.jsonc`) is ready to deploy to our own Cloudflare account once secrets and DNS are in place.

Launch stack landed (PRs #8–#19 + overnight PRs 1–8): timezone-correct doses, dose reminder reliability chain, journal pipeline hardening, sync truthfulness via `last_sync_at`, care invite security RPCs, dark-launch feature flags, SEO (sitemap/robots), `/trust` page, 2-step onboarding to `/today`, mock route redirects, no native dialogs, lazy Spanish locale, CI unit tests + entry budget.

Cutover runbook: `docs/LAUNCH-CHECKLIST.md`. Route grades: `docs/LAUNCH-AUDIT.md`. Med reliability: `docs/RELIABILITY.md`.

Code-level Lovable couplings are all resolved:

- OAuth: native `supabase.auth.signInWithOAuth()` (Apple + Google).
- Email: Resend delivery, Supabase send-email hook at `/api/email/auth/webhook`, Resend bounce / complaint webhook at `/api/email/suppression`.
- AI: Anthropic Claude is the platform default (`src/lib/ai-gateway.server.ts`). Lovable gateway remains only as a last-resort fallback for Lovable previews without an Anthropic key.

Deployment is fully scripted: `bun run build && bunx wrangler deploy -c wrangler.deploy.jsonc`, or automatically via `.github/workflows/deploy.yml` on pushes to main. Cron triggers fan out from the `scheduled()` handler in `src/server.ts` through a `SELF` service binding.

### Locked decisions

1. Email provider: Resend.
2. Platform-default AI provider: Anthropic Claude.
3. Canonical public GitHub repository: `AstroAii/purpledrw`.
4. Worker name: `purplelife`. Deploys go directly to Cloudflare.
5. Dual development continues in Cursor and Lovable. Do not remove Lovable dev tooling (`@lovable.dev/vite-tanstack-config`, `.lovable/`, preview-host checks in `src/lib/med-notifications.ts`).

### Pending external cutover steps

See `docs/LAUNCH-CHECKLIST.md` for the full ordered checklist. Summary:

1. Apply migrations from `20260611010000` through `20260613010000` (feature flags, delivery log, timezone seeding, tag namespaces, security hardening).
2. Redeploy edge functions `ai-orchestrator`, `risk-forecaster`, `oura-sync` (and `journal-processor` if not current).
3. Verify `notify.purplelife.org` in Resend and re-point DNS off Lovable nameservers.
4. Point the Supabase send-email hook at `https://www.purplelife.org/api/email/auth/webhook` and store `SEND_EMAIL_HOOK_SECRET`.
5. Create a Resend webhook for `email.bounced` and `email.complained` pointed at `/api/email/suppression`.
6. Configure new Google and Apple OAuth client codes in the Supabase dashboard.
7. Re-point the pg_cron email pump URL to the new domain.
8. Set Worker secrets (see Section 11), deploy, move DNS.
9. Add `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and the `VITE_SUPABASE_*` values as GitHub repo secrets so CI / CD wakes up.
10. Run Devyn 3-day real-use test before DNS flip (Section 6 of launch checklist).

---

## 3. Tech stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start 1.168, React 19, file-based routing, SSR plus server functions |
| Build | Vite 7 via `@lovable.dev/vite-tanstack-config` wrapper, `vite-imagetools` for responsive images |
| Styling | Tailwind CSS 4 (configured through `src/styles.css`, no `tailwind.config.js`), shadcn/ui (`src/components/ui/`), Oura-styled variants (`src/components/ui-oura/`) |
| Data | Lovable Cloud (Supabase): Postgres (~100 migrations), Auth, Storage, Edge Functions, pgvector, PGMQ |
| Payments | Stripe (subscriptions, promo codes, webhooks) |
| AI | Vercel AI SDK (`ai`, `@ai-sdk/*`), Anthropic Claude default; user-selectable OpenAI, Gemini, Grok |
| Email | React Email templates, Postgres PGMQ queue, Resend delivery, Resend bounce / complaint suppression |
| Hosting | Cloudflare Workers (`wrangler.jsonc`, `nodejs_compat`), SSR worker entry `src/server.ts` |
| i18n | i18next + react-i18next, `en` and `es` |
| Tests | Playwright e2e (`tests/e2e/`), 5 viewport projects |
| Package manager | bun |

Dev server: `bun run dev` on port 8080.

---

## 4. Architecture

### Request flow

1. `wrangler.jsonc` sets `main: src/server.ts`. The `@cloudflare/vite-plugin` builds the Worker from that entry. `vite.config.ts` redirects TanStack Start's server entry to the same file via `tanstackStart.server.entry: "server"`.
2. `src/server.ts` exports the fetch handler. It delegates to `@tanstack/react-start/server-entry` and wraps unhandled SSR failures in a branded HTML error page (`src/lib/error-page.ts`).
3. `src/start.ts` registers global middleware:
   - `errorMiddleware` (request-level): converts uncaught server errors into the branded 500 page while passing structured `statusCode` errors through.
   - `attachSupabaseAuth` (function-level): attaches the client's Supabase Bearer token to every server function call.
4. `src/router.tsx` builds the TanStack Router with a shared React Query client in context.
5. `src/routes/__root.tsx` is the HTML shell: meta / OG tags, manifest and icon links, `AuthProvider`, service worker registration, locale hydration, and Oura auto-sync kickoff.

### Routing layout (file-based, under `src/routes/`)

- **Public marketing** (top-level files): `index.tsx`, `about.tsx`, `features.tsx`, `pricing.tsx`, `charter.tsx`, `contact.tsx`, `privacy.tsx`, `terms.tsx`, `how-purple-thinks.tsx`, `trust.tsx`, `community.*`. Render `MarketingHeader` and `SiteFooter`. SEO via `src/lib/seo.ts`; `/sitemap.xml` and `/robots.txt` from `src/server.ts`.
- **Auth**: `sign-in.tsx`, `sign-up.tsx`, `reset-password.tsx`, `unsubscribe.tsx`.
- **Authenticated app**: everything under `src/routes/_app/`. The pathless `_app.tsx` layout guards the session in `beforeLoad` (redirects to `/sign-in`), redirects un-onboarded users to `/welcome`, and wraps pages in `AppShell` (no marketing footer). Launch redirects: `/my-health` → `/biometrics`, `/vitals` → `/insights`.
- **Token-based semi-public**: `care.accept.tsx`, `friend.join.tsx`, `friend.accept.tsx`, `share.report.$token.tsx` (noindex), `email.unsubscribe.tsx`.
- **OAuth callbacks**: `oauth.oura.callback.tsx`, `oauth.whoop.callback.tsx`.
- **API routes** (`src/routes/api/`):
  - `/api/chat`: streaming AI chat (Vercel AI SDK `streamText`).
  - `/api/public/stripe-webhook`: Stripe signature-verified webhooks.
  - `/api/public/hooks/*`: Apple Health ingest, risk forecaster callbacks.
  - `/api/public/cron/*`: dose reminders (every minute), hourly wearable sync + dose seed + journal cleanup, daily jobs, weekly recap. Each guarded by `CRON_SECRET`. Cloudflare Cron Triggers fan out via `SELF` in `src/server.ts`. Email queue pump stays on Supabase pg_cron (5s).
  - `/api/email/*`: Supabase send-email hook, transactional send, queue processor, suppression, template previews.

The route tree (`src/routeTree.gen.ts`) is auto-generated during dev / build. Never hand-edit.

### Server code pattern

Two-file split in `src/lib/`:

- `<feature>.functions.ts`: `createServerFn()` RPCs. Input validated with zod, auth attached by global middleware and verified by `src/integrations/supabase/auth-middleware.ts`, which yields `{ supabase, userId }` bound to the caller's JWT (RLS applies).
- `<feature>.server.ts`: server-only modules holding secrets and privileged clients (Stripe SDK, AI provider keys, VAPID keys, wearable OAuth secrets, service-role Supabase). Imported dynamically from the functions file so secrets never enter the client bundle.

Do not add new Supabase Edge Functions for app-internal logic. Use `createServerFn` instead. Edge Functions are reserved for the 6 existing specialized workloads.

### Auth

- Email / password: direct Supabase Auth.
- Apple / Google OAuth: native `supabase.auth.signInWithOAuth()` from `src/components/auth/social-sign-in-buttons.tsx`. Callback detection in `src/lib/auth-oauth.ts`.
- Session state and locale seeding: `src/integrations/supabase/auth-context.tsx`.
- Roles: `user_roles` table queried via the `has_role(uuid, app_role)` security-definer function. Never store roles on `profiles`.

---

## 5. Complete feature inventory

Each entry lists the routes and the key files an AI should open when working on that area.

### Marketing and public site
- Routes: `/`, `/about`, `/features`, `/pricing`, `/trust`, `/charter`, `/contact`, `/privacy`, `/terms`, `/how-purple-thinks`, `/community`, `/community/$postId`, `/community/resources`. Community gated by `feature_community_enabled` (default OFF).
- Components: `src/components/marketing/`.
- Contact form lands in `contact_messages`, surfaced in admin.
- Each route has a unique hero image (CI-enforced via `check:unique-images`).

### Auth and onboarding
- Routes: `/sign-in`, `/sign-up`, `/reset-password`, `/welcome`.
- Social: `src/components/auth/social-sign-in-buttons.tsx`.
- `_app` layout redirects un-onboarded users to `/welcome` (two steps: profile + first journal entry with extraction, then `/today`). Captures timezone when unset.

### Today
- Routes: `/today`, `/today/risk`.
- Components: `src/components/today/`.
- Surfaces readiness and risk scores, due med doses, hydration quick-add, travel/timezone banners, weekly recap card, condition tips, install nudges, missed-dose catch-up card.

### Patterns (Insights)
- Route: `/insights` (vitals tiles, goals, pattern cards). `/vitals` redirects here.
- Components: `src/routes/_app/insights.tsx`, `src/components/insights/`.

### Journal
- Routes: `/journal`, `/journal/new`.
- Text, voice (`src/components/journal/use-voice-capture.ts`), and photo capture.
- Offline queue: `src/lib/offline-journal-queue.ts`, `src/hooks/use-offline-journal-sync.ts`.
- AI extraction via the `journal-processor` edge function.

### Seizures and timeline
- Routes: `/seizures/new`, `/timeline`.

### Hydration and intake
- Routes: `/hydration`.
- Water, electrolytes, aura events, food logging with voice (`voice-intake-sheet.tsx`) and photo recognition (`src/lib/food.server.ts`).

### Vitals
- Route: `/vitals` redirects to `/insights` (launch decision). Real vitals UI lives under Patterns.

### Medications
- Routes: `/meds`, `/meds/$medId`.
- Meds, supplements, rescue meds. Dose schedules, side-effect tracking, refill awareness. Inline took/skip/snooze; log-dose-now.
- Reminders: service worker alarms (`public/sw.js` plus `src/lib/med-notifications.ts`), web push (`src/lib/push.server.ts`), dose-reminders cron, and the `med-dose-action` edge function for taken / missed actions from notifications. Delivery log: `notification_delivery_log` (`docs/RELIABILITY.md`).
- Add by scan or voice (`src/lib/med-recognition.server.ts`).
- Drug knowledge via `src/lib/med-dictionary.ts` and `med-intelligence.functions.ts`.
- Reminder cron: `/api/public/cron/dose-reminders`.

### Biometrics and integrations
- Routes: `/biometrics`, `/biometrics/$metric`. `/my-health` redirects to `/biometrics`.
- Oura, Whoop, Apple Health, manual data; metric detail charts. Sync UI uses `last_sync_at` only (never `updated_at`).
- OAuth connects under `/tools` with callbacks at `/oauth/oura/callback` and `/oauth/whoop/callback`.
- Cron sync via `/api/public/cron/oura-sync-all` and `/api/public/cron/whoop-sync-all`. Daily auto-sync hook `src/hooks/use-oura-daily-autosync.ts`. Edge function `oura-sync`.
- Apple Health XML import: `/apple-health-import`, `src/lib/apple-health-xml.ts`.

### Reports and records
- Routes: `/reports/metrics`, `/reports/documents`, `/reports/medical-history`, `/reports/new`, `/reports/$reportId`, `/reports/trends/$metricKey`.
- Lab PDF upload, AI metric extraction into `report_metrics` with canonical naming (`src/lib/metric-naming.ts`).
- Trend charts, clinician-ready PDF export (`pdf-lib`), shareable tokenized links (`/share/report/$token`), scheduled report sharing, duplicate detection (admin).

### DNA (Pro)
- Route: `/my-health-dna`.
- 23andMe-style raw file upload, curated RSID interpretation (`src/lib/dna-curated-rsids.ts`), feeds the care profile.
- Pro-gated via `src/lib/pro-gate.ts`. Dark-launched behind `feature_dna_enabled` (default OFF).

### Ask Purple (AI chat)
- Route: `/chat`. Streaming responses from `/api/chat` via Vercel AI SDK.
- Tools: `src/lib/purple-chat-tools.server.ts`. System prompt: `src/lib/purple-chat-prompt.server.ts`.
- Research citations from the pgvector `research_sources` library.
- Free-tier limit: 10 messages per day.
- User-selectable AI provider in settings (`src/components/settings/ai-provider-section.tsx`): built-in gateway or own API key (Anthropic, OpenAI, Gemini, Grok).
- `ai_memory` table provides long-term memory with embeddings.

### Care (caregivers)
- Routes: `/care`, `/care/$ownerId`, `/care/inbox`, `/care/accept`, plus caregiver messaging at `/chat-care`.
- Invite acceptance via SECURITY DEFINER RPCs (`accept_care_invite`, `accept_assigned_care_invite`); tokens not client-readable. Scoped read / write permissions (`src/lib/care.scopes.ts`), pending-change approval, audit logging (`care_audit_log`), care digests by email, caregiver visit tracking.
- Read-only by default. Any write by a caregiver requires an explicit "confirm to write" step.

### Conditions
- Route: `/condition/$slug`.
- Per-condition pages built from `src/lib/condition-catalog.ts`, with care profiles, tips (`condition-tips.ts`), welcome copy (`condition-welcome-copy.ts`), and AI feature suggestions (`feature-suggestions.functions.ts`).
- `/my-health`: body hub and condition overview.
- Conditions live on `profiles.conditions` (text[]) plus `profiles.conditions_note`. Used by onboarding, Today greeting, journal prompt suggestions, and the Ask-Purple system prompt. See `src/lib/condition-prompts.ts`.

### Travel
- Route: `/settings/travel`.
- Itinerary-driven: `trips.legs` (jsonb) plus `shift_strategy` (`home` | `snap` | `gradual`).
- Schedule generation is in `src/lib/travel-scheduler.ts` (pure functions).
- Trip-generated doses carry `medication_doses.trip_id` for clean regeneration.
- ICS calendar export via `src/lib/ics.ts`.
- One active trip at a time. No multi-trip overlap. Itineraries are typed manually, no real flight API.

### Community and friends
- Public feed plus in-app compose (`/community-new`), reactions, comments, reporting, admin moderation. Gated by `feature_community_enabled`.
- Friend invites: `/friend/join`, `/friend/accept`, `/friends/$friendshipId`. Gated by `feature_friends_enabled`.

### Pro and billing
- Stripe checkout and customer portal (`src/lib/billing.server.ts`), subscription state in `subscriptions`, promo codes, `pro_free_for_everyone` kill switch in `app_settings`, webhook at `/api/public/stripe-webhook`.

### Admin
- Routes: `/admin` plus subpages for users, community moderation, billing, promo codes, resources CMS, platform rules (with audit), contact messages, feedback, broadcast messages, duplicate report detection, med reminder reliability.
- Role-gated server-side via `user_roles` and `has_role`.

### Settings and account
- `/settings` hub: sharing controls, AI provider, locale, travel, "how Purple thinks".
- `/account`: profile, password, subscription, 2FA.
- Data export (`src/lib/data-export.ts`: zip / tar via `fflate`, `jszip`, `nanotar`).

### Email
- React Email templates in `src/lib/email-templates/`.
- PGMQ queue, suppression list, one-click unsubscribe (`/email/unsubscribe`, `/unsubscribe`), weekly recap cron, send log.

### PWA
- Manifest `public/manifest.json` (name "Purple", theme `#5B2C82`), icons 192 / 512.
- Service worker `public/sw.js`: med dose reminders driven by IndexedDB schedules, shell cache `purple-shell-v4`.
- Registration in `src/lib/med-notifications.ts` (skips Lovable preview hosts on purpose).
- Install prompts: `src/components/pwa/`.
- Web push: VAPID keys, `push_subscriptions` table, `src/lib/push.server.ts`.

### Internationalization
- English and Spanish today (`src/i18n/locales/en.json`, `es.json`).
- Locale picker `src/components/locale/`. Per-profile persistence via `profiles.locale`.
- SSR always renders `en` to avoid hydration mismatch. `hydrateLocale()` switches post-hydration. Spanish loads lazily (not in entry bundle). `check:i18n-es` enforces completeness.

---

## 6. Domain rules and security invariants

- RLS is enabled on every public-schema table. Every `CREATE TABLE` migration also issues explicit `GRANT`s.
- Cross-user access returns 404, never 403.
- Caregiver access is mediated by `care_scopes`. Writes require explicit confirm-to-write.
- Care invite tokens are not client-readable. Acceptance uses `accept_care_invite()` / `accept_assigned_care_invite()` SECURITY DEFINER RPCs with pinned `search_path` (`docs/SECURITY-FINDINGS.md`).
- Roles live in `user_roles` only. Check them server-side through `has_role(auth.uid(), 'admin')`.
- Sensitive writes append to `phi_access_log` or `platform_rule_audit` as appropriate.
- Storage buckets `journal-media` and `reports` are private; read via `createSignedUrl` only.
- No third-party analytics or trackers, ever.
- No em dashes anywhere (`bun run check:em-dash`, prebuild gate).
- No native dialogs: use shadcn AlertDialog/Dialog, never `window.confirm`, `window.alert`, or `window.prompt`.
- Footer visibility: marketing and auth routes on all viewports, never inside `AppShell`.
- Metric naming: canonical labels from `src/lib/metric-naming.ts`, preserve PDF wording as "as printed: ..." subtitle.
- Timezone: dose days and charts use `profiles.timezone`; regenerate doses when it changes.
- Sync freshness: display and logic use `last_sync_at`, not `updated_at`.
- Dose reminders: SW local → web push → catch-up card fallback chain must stay intact (`docs/RELIABILITY.md`).
- Dark-launch flags on `app_settings` default OFF for community, DNA, friends.

---

## 7. Data model summary

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
| Auth / roles | `user_roles` (with `app_role` enum) |

---

## 8. Edge functions inventory

Only 6 functions exist. Do not add more for app-internal logic.

| Function | Purpose |
|----------|---------|
| `ai-orchestrator` | Ask Purple backend with tools and research retrieval |
| `journal-processor` | AI extraction from journal entries (full pipeline) |
| `journal-extract` | Lighter extraction pass used in capture flows |
| `med-dose-action` | Mark doses taken / missed from web push notifications |
| `oura-sync` | Oura data sync |
| `risk-forecaster` | Daily risk score plus narrative |

Manual deploy procedure (when the Supabase CLI 403s): `docs/manual-deploy-bundle.md`.

---

## 9. Email pipeline

1. Producers:
   - Supabase send-email hook posts to `/api/email/auth/webhook` (Standard Webhooks HMAC).
   - App code via `src/lib/email/send.ts` (HTTP with user JWT) or `src/lib/email/render-and-enqueue.server.ts` (direct from cron with service role).
2. Templates: React Email components in `src/lib/email-templates/`, rendered server-side.
3. Queue: PGMQ via the `enqueue_email` RPC. Suppression list checked before enqueue.
4. Delivery: `/api/email/queue/process` (pg_cron pump every 5s) dequeues and sends via the Resend API from `noreply@notify.purplelife.org`. Idempotency-Key, `List-Unsubscribe` headers, 429 backoff via Retry-After, 401 / 403 straight to DLQ.
5. Feedback: Resend bounce / complaint webhook at `/api/email/suppression` writes `suppressed_emails`. One-click unsubscribe via `List-Unsubscribe` headers and `/email/unsubscribe`.

---

## 10. Quality gates and tests

- `bun run check:em-dash` (also prebuild gate)
- `bun run check:live-data`
- `bun run check:unique-images`
- `bun run check:i18n-es` (en/es parity + static `t()` key coverage; also in CI)
- `bun run check:entry-budget` (after build; client entry gzip budget)
- `bun run test:unit` (`tests/unit/`: timezone, dose snooze, adherence, travel, Oura sleep mapping)
- `bun run lint`: repo-wide prettier debt remains. Lint only changed files. Full lint intentionally not in CI yet.
- `bun run build` (catches Worker / SSR bundling issues)
- `bunx tsc --noEmit` (in CI)
- `bun run test:e2e`: Playwright across mobile-375, tablet-768, tablet-1023, desktop-1024, desktop-1440. Boots `bun run dev` on port 8080 unless `E2E_BASE_URL` is set. Smoke spec: `tests/e2e/routes-smoke.spec.ts`. Optional: `tests/e2e/rls-isolation.spec.ts` with test-user env vars.
- CI: `.github/workflows/ci.yml` (gates, i18n-es, unit tests, tsc, build, entry budget, smoke e2e on PRs). Needs GitHub secrets to wake up.
- CD: `.github/workflows/deploy.yml` (`wrangler deploy -c wrangler.deploy.jsonc` on main). Needs Cloudflare secrets.

### Cheapest-first verification ladder

1. `bun run check:em-dash`
2. `bun run check:i18n-es`
3. `bun run test:unit`
4. `bun run build` + `bun run check:entry-budget`
5. `bun run test:e2e` (smoke for routed / UI changes)
6. `wrangler dev` against the built output for Worker behavior

---

## 11. Environment variables

Present locally in `.env`:

- `SUPABASE_PROJECT_ID`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

Referenced in code, not present locally (production needs them; several block local testing of those paths):

| Variable | Used by |
|----------|---------|
| `ANTHROPIC_API_KEY` | Platform-default AI (chat, insights, care profiles, edge functions) |
| `RESEND_API_KEY` | Email delivery (`/api/email/queue/process`) |
| `RESEND_WEBHOOK_SECRET` | Resend bounce / complaint webhook (`/api/email/suppression`) |
| `SEND_EMAIL_HOOK_SECRET` | Supabase send-email hook verification (`/api/email/auth/webhook`) |
| `EMAIL_PREVIEW_SECRET` | Email template preview routes |
| `SUPABASE_SERVICE_ROLE_KEY` | Cron, email enqueue, admin functions, seeds |
| `CRON_SECRET` | All `/api/public/cron/*` endpoints |
| `PUBLIC_SITE_URL` | Email links, share links, unsubscribe headers |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Billing |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web push |
| `OURA_CLIENT_ID` / `_SECRET`, `WHOOP_CLIENT_ID` / `_SECRET` | Wearable OAuth |
| `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROK_API_KEY` | Optional per-user AI provider choices, plus embeddings seeds for OpenAI |
| `LOVABLE_API_KEY` | Legacy fallback only. Lets Lovable previews run AI without an Anthropic key |

---

## 12. Files that are auto-generated, never edit

- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/client.server.ts`
- `src/integrations/supabase/auth-middleware.ts`
- `src/integrations/supabase/auth-attacher.ts`
- `src/integrations/supabase/types.ts`
- `src/routeTree.gen.ts`
- `.env` (managed values: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`)
- `supabase/config.toml` (project-level settings)
- `supabase/migrations/*` (read-only after creation; create new timestamped migrations instead of editing)

Schemas you must never touch: `auth`, `storage`, `realtime`, `supabase_functions`, `vault`. No triggers on them either.

---

## 13. Known gaps and sharp edges

1. **Supabase CLI 403s on this project.** Migrations and edge functions are deployed manually via the dashboard following `docs/manual-deploy-bundle.md`. Full pending list: `docs/LAUNCH-CHECKLIST.md` Section 1.
2. **CI / CD committed but dormant** until GitHub secrets exist (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, the `VITE_SUPABASE_*` values).
3. **Repo-wide lint debt.** `bun run lint` fails with thousands of pre-existing prettier errors. CI runs `test:unit` and `tsc` instead. New code should be prettier-clean in touched files.
4. **Email queue pump scheduling.** Supabase pg_cron job (`process-email-queue`, 5s interval) POSTs to the app with the vault-stored service-role key. Its URL must be re-pointed to `https://www.purplelife.org/api/email/queue/process` at cutover.
5. **`src/routeTree.gen.ts` is generated.** It regenerates from `src/routes/` during dev / build.
6. **`vite.config.ts` is a wrapper.** Do not add `tanstackStart` / `react` / `tailwind` / `tsconfig-paths` / `cloudflare` plugins manually while `@lovable.dev/vite-tanstack-config` is in place. Duplicates break the build. The import must stay pointed at `dist/index.js` (the ESM build); the bare specifier resolves to the CJS build and crashes config loading on Node 22+.
7. **Email DNS.** `notify.purplelife.org` is delegated to Lovable nameservers. It must be re-verified with Resend and re-pointed, coordinated with the Supabase auth-hook URL change.
8. **External webhook pointers** to move at cutover: Stripe webhook, Supabase send-email hook (to `/api/email/auth/webhook`), Resend webhook (to `/api/email/suppression`), Google / Apple OAuth redirect URLs, Oura / Whoop redirect URIs, pg_cron email pump URL.
9. **Dark-launch flags** (`feature_community_enabled`, `feature_dna_enabled`, `feature_friends_enabled`) default OFF. Enable deliberately when ready.
10. **`SUPABASE_SERVICE_ROLE_KEY` and the database password are inaccessible** on Lovable Cloud. If a user asks, say plainly they are not available here. Never fabricate a placeholder.

---

## 14. Server runtime constraints (Cloudflare Workers, `nodejs_compat`)

Server functions and the SSR entry run in a Worker. Avoid:

- `child_process` (spawn / exec / fork) is a stubbed non-functional shim.
- `sharp`, `canvas`, `puppeteer`: native binaries or filesystem.
- `fs.watch` / `fs.watchFile`.
- `os.cpus()`, `os.networkInterfaces()`.
- Any package that needs a real OS filesystem or spawns subprocesses.

Safe: `fs` (virtual), `path`, `crypto`, `Buffer`, `stream`, `url`, `events`, `timers`, `net`, `http`, `https`, `zlib`.

Bundling: every npm package must be fully bundled at build time. Never set `ssr.external` or `resolve.external` for the Worker SSR environment.

---

## 15. Out of scope (do not propose without asking)

- Native mobile apps. Purple is a PWA.
- Heavy condition-specific trackers (glucose meter SDKs and similar). Keep tailoring light.
- Real flight API integration for travel. Users type itineraries manually.
- Multi-trip overlap. One active trip at a time.
- Adding new Supabase Edge Functions for app-internal logic. Use `createServerFn`.

---

## 16. Suggested next-steps backlog

Primary source: **`docs/LAUNCH-CHECKLIST.md`**. Pick from here when prompting the next session.

1. Apply all pending migrations (Section 1 of launch checklist) and redeploy edge functions.
2. Set Worker secrets in Cloudflare (Section 3).
3. Configure webhooks and OAuth (Section 4).
4. Run staging verification + Devyn 3-day test (Sections 5–6).
5. Add GitHub repo secrets, deploy Worker, flip DNS (Section 7).
6. Optional: one-shot `bun run format` cleanup to clear lint debt, then re-enable lint in CI.
7. Optional: community author identity decision (`docs/SECURITY-FINDINGS.md`).

---

## 17. How to use this document with another AI

1. Paste this entire file at the top of a new session.
2. State the goal of the next change in one or two sentences.
3. Point the AI at the specific routes / files listed in Section 5 for the area you are touching.
4. Remind the AI of the relevant invariant from Section 6 if the change is sensitive (auth, RLS, footer, em dashes, metric naming, branding).
5. Verify with the ladder in Section 10 before declaring done.

For deeper detail, the AI should read `docs/ARCHITECTURE.md`, `docs/FEATURES.md`, `docs/LAUNCH-CHECKLIST.md`, `docs/LOVABLE-MIGRATION.md`, and `CURSOR_HANDOFF.md` directly from the repo. This document is the index, not the encyclopedia.

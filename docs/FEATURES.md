# Purple Feature Inventory

What has been built, by area, with the routes and code that implement it. Companion to `docs/ARCHITECTURE.md`.

## Marketing and public site

| Route | Purpose |
|-------|---------|
| `/` | Home: "Purple. A quiet companion for your health." JSON-LD, OG tags |
| `/about` | Why Purple exists |
| `/features` | Feature overview |
| `/pricing` | Free plan + future Pro ($9.99/mo, $99/yr) |
| `/charter` | Founding charter |
| `/contact` | Contact form (lands in `contact_messages`, surfaced in admin) |
| `/privacy`, `/terms` | Legal |
| `/how-purple-thinks` | Public explanation of the AI approach |
| `/community`, `/community/$postId`, `/community/resources` | Public community feed, single post, curated resources |

Components in `src/components/marketing/`. Each route has a unique hero image (CI-enforced).

## Auth and onboarding

- `/sign-in`, `/sign-up`, `/reset-password`: email/password plus Apple and Google OAuth (`src/components/auth/social-sign-in-buttons.tsx`).
- `/welcome`: first-run onboarding (name, conditions, wearables, notifications). The `_app` layout redirects un-onboarded users here.

## Daily use

- **Today** (`/today`, `/today/risk`): readiness and risk scores, due med doses, hydration quick-add, travel banners, weekly recap card, condition tips, install nudges. `src/components/today/`.
- **Journal** (`/journal`, `/journal/new`): text, voice, and photo capture with offline queue (`src/lib/offline-journal-queue.ts`); AI extraction via `journal-processor` edge function.
- **Seizure logging** (`/seizures/new`) and unified **Timeline** (`/timeline`).
- **Hydration and intake** (`/hydration`): water, electrolytes, aura events, food logging with voice and photo recognition (`src/lib/food.server.ts`).
- **Vitals** (`/vitals`) with goals and metric insights.

## Medications

- `/meds`, `/meds/$medId`: meds, supplements, rescue meds; dose schedules; side-effect tracking; refill awareness.
- Reminders: service worker alarms (`public/sw.js` + `src/lib/med-notifications.ts`), web push (`src/lib/push.server.ts`), and the `med-dose-action` edge function for taken/missed actions from notifications.
- Add by scan or voice (`src/lib/med-recognition.server.ts`), drug knowledge via `src/lib/med-dictionary.ts` and `med-intelligence.functions.ts`.

## Biometrics and integrations

- `/biometrics`, `/biometrics/$metric`: Oura, Whoop, Apple Health, and manual data; metric detail charts.
- OAuth connects under `/tools` with callbacks at `/oauth/oura/callback` and `/oauth/whoop/callback`; cron sync via `/api/public/cron/*` and the `oura-sync` edge function.
- Apple Health XML import (`/apple-health-import`, `src/lib/apple-health-xml.ts`).

## Reports and records

- `/reports/metrics`, `/reports/documents`, `/reports/medical-history`, `/reports/new`, `/reports/$reportId`, `/reports/trends/$metricKey`.
- Lab PDF upload, AI metric extraction into `report_metrics` with canonical naming (`src/lib/metric-naming.ts`, rules in `mem/feature/metric-naming.md`), trend charts, clinician-ready PDF export (`pdf-lib`), shareable tokenized links (`/share/report/$token`), scheduled report sharing, duplicate detection (admin).

## DNA (Pro)

- `/my-health-dna`: 23andMe-style raw file upload, curated RSID interpretation (`src/lib/dna-curated-rsids.ts`), feeds the care profile. Pro-gated via `src/lib/pro-gate.ts`.

## Ask Purple (AI chat)

- `/chat` with streaming responses from `/api/chat` (Vercel AI SDK), tool calls (`src/lib/purple-chat-tools.server.ts`), research citations from the pgvector `research_sources` library, and a free-tier limit of 10 messages/day.
- User-selectable AI provider in settings (`src/components/settings/ai-provider-section.tsx`): built-in gateway or own API key (Anthropic, OpenAI, Gemini, Grok).
- `ai_memory` table provides long-term memory with embeddings.

## Care (caregivers)

- `/care`, `/care/$ownerId`, `/care/inbox`, `/care/accept`, plus caregiver messaging at `/chat-care`.
- Invite flow, scoped read/write permissions (`src/lib/care.scopes.ts`), pending-change approval, audit logging (`care_audit_log`), care digests by email, caregiver visit tracking.

## Conditions

- `/condition/$slug`: per-condition pages built from `src/lib/condition-catalog.ts`, with care profiles, tips, welcome copy, and AI feature suggestions.
- `/my-health`: body hub and condition overview.

## Travel

- `/settings/travel`: trips with timezone-shifted med schedules (`src/lib/travel-scheduler.ts`) and ICS calendar export (`src/lib/ics.ts`).

## Community and friends

- Public feed plus in-app compose (`/community-new`), reactions, comments, reporting, and admin moderation.
- Friend invites (`/friend/join`, `/friend/accept`, `/friends/$friendshipId`).

## Pro and billing

- Stripe checkout and customer portal (`src/lib/billing.server.ts`), subscription state in `subscriptions`, promo codes, `pro_free_for_everyone` kill switch in `app_settings`, webhook at `/api/public/stripe-webhook`.

## Admin

- `/admin` plus subpages: users, community moderation, billing overview, promo codes, resources CMS, platform rules (with audit), contact messages, feedback, broadcast messages, duplicate report detection.
- Role-gated server-side via `user_roles`.

## Settings and account

- `/settings` hub: sharing controls, AI provider, locale, travel, "how Purple thinks".
- `/account`: profile, password, subscription, 2FA.
- Data export (`src/lib/data-export.ts`: zip/tar via `fflate`, `jszip`, `nanotar`).

## Email

- React Email templates (`src/lib/email-templates/`), PGMQ queue, suppression list, one-click unsubscribe (`/email/unsubscribe`, `/unsubscribe`), weekly recap cron, send log. Sender: `purplelife <noreply@notify.purplelife.org>`.

## PWA

- Installable app (manifest, icons, install prompts after 3 sessions), offline shell cache, med reminder alarms while installed.

## Internationalization

- English and Spanish today; locale picker (`src/components/locale/`), per-profile persistence.

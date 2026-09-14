# DECISIONS

Standing decisions that all future work must respect. Append, never rewrite history.
If a decision is reversed, add a new entry that supersedes the old and mark the old
one **SUPERSEDED** (do not delete it).

Format:

### YYYY-MM-DD — <decision title> [ACTIVE | SUPERSEDED by <date>]

- **Decision:**
- **Reason:**
- **Implications:**

Also see `mem/index.md` for deeper architectural notes.

---

### 2026-09-14 — Cloudflare cutover uses DATA_BACKEND flag; Workers JWT replaces Supabase Auth on cloudflare path [ACTIVE]

- **Decision:** Persistence backend is selected by `DATA_BACKEND` (`supabase` default,
  `cloudflare` after verified import). Cloudflare path uses D1 (`DB`), R2 (`STORAGE`),
  KV (`CACHE`), and HS256 JWT auth in D1 `auth_users`. RLS is enforced in Worker code,
  not SQL. Legacy Supabase project stays live until operator flips the flag.
- **Reason:** Avoid hard cutover before data import; POS Ai account already provisioned
  empty D1/R2/KV.
- **Implications:** New server code should use `unified-auth-middleware` and check
  `getDataBackend()`. Runbook: `docs/CLOUDFLARE-MIGRATION.md`. Do not delete Supabase
  from this work alone.

### 2026-07-05 — Flutter parity is client-side; server-only capabilities stay web-only until a Worker route exists [ACTIVE]

- **Decision:** The Flutter app reaches parity by (a) reusing Supabase-RLS-safe reads/writes and (b) calling Worker `/api/*` routes. Server functions that require service-role/`supabaseAdmin` (caregiver `caregiverRead*`/`caregiverMarkDose`/`acceptInvite`/`declineInvite`, AI `summarizeReport`/`getMetricInsight`/`getDailyInsightCards`/`computeUserPatterns`, `getVitalsSnapshot`) are **not** reimplemented client-side and are **not** faked — they render honest gap-states until a Flutter-callable Worker route is added.
- **Reason:** RLS correctly blocks these from the anon client; weakening RLS or fabricating data in a health app is unacceptable. Discovered during the 2026-07-05 fleet (caregiver accept + dashboard + AI).
- **Implications:** New Worker routes must front the existing server fns and preserve `assertScope`/`has_care_scope` + `phi_access_log`. Backlog in OPEN-ISSUES `care-accept-server-route`. `/api/care/{accept,decline,incoming-invites}.ts` written 2026-07-05, **deployed to prod 2026-07-06** (Worker Version `07bbab77-f4de-4501-89c0-e22a52e60941`, verified 401-not-404 live). Remaining backlog (`caregiverRead*` dashboard routes, AI Worker routes) still gap-states client-side until their own routes ship and deploy. `/api/ai/{summarize-report,metric-insight,daily-insight-cards}.ts` written 2026-07-06 fronting `summarizeReport`/`getMetricInsight`/`getDailyInsightCards` via new `src/lib/ai-insights.server.ts` (mirrors `care.server.ts`: user-scoped Supabase client + explicit `userId`, RLS enforces ownership, no `assertScope`/`phi_access_log` needed since these are single-owner reads/AI, not caregiver-shared); **Flutter client wiring, CORS allow-list entry, and deploy all pending**. `getVitalsSnapshot`/`computeUserPatterns` still have no Worker route.

### 2026-07-05 — Ask-Purple 10/day free limit applies to all native users until a Pro flag is exposed [ACTIVE]

- **Decision:** TF19 ships the Ask-Purple daily limit (10/day) for every native user; the over-limit gate is an upsell to purplelife.org. Web gates on `useIsPro()`; Flutter has no client entitlement flag yet.
- **Reason:** Operator-approved ship-as-is for TF19 rather than block the release.
- **Implications:** Pro users are wrongly limited on native until a Pro/entitlement flag (or `/api` check) is exposed to the client. Revisit before GA.

### 2026-07-05 — profiles.home_city stores user city separately from timezone [ACTIVE]

- **Decision:** `profiles.home_city` (nullable text) holds the user's home city name. IANA
  `profiles.timezone` remains the source of truth for time math. UI may show friendly timezone
  labels derived from IANA, but must not treat that label as the stored city.
- **Reason:** TestFlight feedback: users want a distinct city field (e.g. Brooklyn vs
  America/New_York).
- **Implications:** Account locale sections on Flutter and web read/write `home_city`. RLS
  unchanged (existing `profiles_*_own` policies). Welcome/onboarding may add the field later.

### 2026-07-05 — Handoff trio is canonical session state [ACTIVE]

- **Decision:** Every session reads `docs/HANDOFF.md`, `docs/DECISIONS.md`, and
  `docs/OPEN-ISSUES.md` before work. Every completed task appends a log entry to
  `docs/HANDOFF.md` before claiming done. Rule: `.cursor/rules/00-handoff.mdc`.
- **Reason:** Multi-machine, multi-agent work; state must survive outside chat history.
- **Implications:** `CURSOR_HANDOFF.md` remains extended ops detail but is not a
  substitute for the log. Never delete log history; append and mark status.

### 2026-07-05 — Secrets never live in code, .env, docs, or chat [ACTIVE]

- **Decision:** All secrets injected at runtime from Doppler (or ASC API keys via
  Doppler). Docs and rules reference project/config names only, never values.
- **Reason:** Health data sensitivity; prior credential-leak risk; HIPAA readiness.
- **Implications:** No token or key text in any committed file, including handoff docs.

### 2026-07-04 — Flutter-only TestFlight; Capacitor interim retired [ACTIVE]

- **Decision:** `bun run ios:testflight` uploads Flutter native (`flutter/`). Capacitor
  path is `ios:testflight:capacitor` for rollback reference only. Builds 1–9 were
  Capacitor WebView loading prod web.
- **Reason:** Operator decision; Flutter is Phase 5 target; Capacitor hid Flutter gaps.
- **Implications:** Flutter web `:8765` fixes do not reach users until Flutter TestFlight
  upload. See `docs/FLUTTER-TESTFLIGHT-CUTOVER.md`.

### 2026-07-04 — Lovable owns web design; Cursor owns Flutter and schema [ACTIVE]

- **Decision:** Lovable edits TanStack on `lovable/redesign`. Cursor owns `flutter/`,
  `design/tokens.json`, migrations, RLS, Worker routes, and gatekeeps `main`.
- **Reason:** Split workflow documented in `docs/LOVABLE-FLUTTER-SYNC.md`.
- **Implications:** Lovable must not edit `flutter/` or `types.ts`. Manual prod deploy
  during redesign.

### 2026-07-04 — Apple Health iOS auth: trust requestAuthorization, not bool [ACTIVE]

- **Decision:** On iOS, after HealthKit `requestAuthorization`, persist connect flag in
  Keychain; do not gate on `requestAuthorization` bool (write-only signal). Omit VO2_MAX
  from auth read types. Partial grants OK (`isCoreAuthorized`). Last synced UI uses
  `apple_health_tokens.last_sync_at`.
- **Reason:** Matches Capacitor `health-ios.ts`; TF13 failed with bool gate.
- **Implications:** See `mem/native-app-healthkit.md`, `flutter/lib/features/health/`.

### 2026-07-04 — Native OAuth redirect URIs [ACTIVE]

- **Decision:** Oura/Whoop native callbacks use `org.purplelife.app://oauth-{oura,whoop}-callback`.
  Web prod uses `https://www.purplelife.org/oauth/{oura,whoop}/callback`. Whoop OAuth
  exchange runs on Worker (`/api/health/whoop-config`, `whoop-exchange`); Oura uses
  Supabase `oura-sync` edge function.
- **Reason:** Parity with `src/lib/native/wearable-oauth.ts`.
- **Implications:** Provider dev consoles must register native URIs; deploy Worker with
  `CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0` (not POS account in Doppler).

### 2026-07-04 — Supabase NEW project only [ACTIVE]

- **Decision:** Production and Lovable preview use NEW ref `xxnzmfzsjplrutrgbzxy` via
  `auth.purplelife.org`. OLD ref `lzuodgpqseijhhyzgfky` is deprecated.
- **Reason:** Migration complete; owner-controlled schema and RLS.
- **Implications:** Only Cursor regenerates `types.ts`; `check:supabase-types` in CI.

### 2026-07-04 — No em dashes in user-facing strings [ACTIVE]

- **Decision:** U+2014 forbidden in `src/` and `public/`; CI `check:em-dash` prebuild.
- **Reason:** Brand/style constraint (`mem/constraint/no-em-dash.md`).
- **Implications:** Same rule applies to Flutter user-facing strings.

### 2026-07-04 — Agent-owned operations [ACTIVE]

- **Decision:** Agents run Doppler, Supabase API, wrangler deploy, git, gates, previews,
  and iOS CLI; do not instruct operator to open GUIs for routine work.
- **Reason:** `.cursor/rules/no-manual-operator-work.mdc`.
- **Implications:** Ask operator only for App Store 2FA, USB device unlock, or explicit
  prod approval gates.

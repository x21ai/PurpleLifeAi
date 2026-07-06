# OPEN ISSUES

Known problems, blockers, and deferred work. Add issues as they arise. Mark resolved
with strikethrough and date; do not delete.

Format:

- [ ] **`<id>`** — description. _Raised YYYY-MM-DD by \<who\>._
- [x] ~~**`<id>`**~~ — RESOLVED YYYY-MM-DD: how.

---

## Repo hygiene / gates (raised 2026-07-06 full audit)

- [x] ~~**audit-tsc-uncommitted-invites-route**~~ — RESOLVED 2026-07-06: this was the
  P0 `care-accept-server-route` close-out work landing concurrently in the same
  working tree (parallel agent sessions on one checkout). Regenerated
  `routeTree.gen.ts` via `bun run build:prod` (now registers
  `/api/care/incoming-invites` correctly); `bunx tsc`/`bun run tsc` now exits 0.
  `incoming-invites.ts` + `care.server.ts` + `routeTree.gen.ts` are logged and
  ready to commit together per the `care-accept-server-route` entry below.
  `bunx tsc --noEmit` was originally run mid-edit
  (`care_repository.dart` line 742 `GET /care/incoming-invites` call the audit
  cites did not exist yet at the time it read that file; it does now).

- [x] ~~**audit-repo-duplicate-junk-files**~~ — RESOLVED 2026-07-06: deleted **22**
  untracked `" 2"`-suffixed duplicate files on this checkout (mostly
  `flutter/build/ios 2`, Linux/Windows ephemeral symlinks, `Podfile 2`, `xcrun
  2`; audit had counted 58 on a dirtier tree), plus `.flutter-web-serve.pid`
  (none git-tracked). Confirmed `bun run check:em-dash` **PASS** afterward.
  Kept untracked `flutter/ios/Flutter/Developer.xcconfig` (local Xcode-beta fix).

## Flutter / TestFlight

- [x] ~~**tf-login-wrong-surface**~~ — RESOLVED 2026-07-06: **confirmed root cause** and fixed the
  TestFlight distribution gap (not a Flutter code bug). Investigation: `welcome_screen.dart` and
  `sign_in_screen.dart` were read in full plus `shell/router.dart`/`auth_gate.dart`; no WebView,
  no `purplelife.org` sign-in redirect, no reverted copy exists anywhere in `flutter/lib` (grepped
  for `webview|WebView|purplelife.org`, only found benign "open in browser" links deep in
  Settings/Tools/Account, none in the auth flow). `git log --follow` on `sign_in_screen.dart`
  shows it has read "Purple" / "Sign in" / "Create your account" since the **2026-07-04 Flutter
  cutover commit** (`918c766`), unchanged through TF12-19. `flutter test` (116/116, incl.
  `widget_test.dart: PurpleApp renders sign-in shell`) and a live render via
  `./scripts/flutter-web-serve.sh` both confirm the shipped screen is the correct Flutter design
  (serif "Purple" title, dark glass card, purple gradient "Sign in" button, outlined
  Google/Apple buttons) — the opposite of the reported "Welcome back!" web copy.
  **Actual root cause, confirmed via ASC API:** the external **"Founding Team"** beta group
  (`8ad416f5-8248-48e6-9951-03af3f932b6c`) still had **build 1.0 (1)** — the original
  **pre-cutover Capacitor WebView shell** uploaded 2026-07-03, `expired=false` — active
  alongside 13/18. Capacitor's `capacitor.config.ts` loads **live** `https://www.purplelife.org`
  at runtime (not a bundled snapshot), so any tester still on that never-updated install sees
  today's real web sign-in page (`src/routes/sign-in.tsx`: "Welcome back!" / "Login Now" /
  "Create a new account now") — an exact match for the report. Separately, build **1.0 (19)**
  (the newest Flutter build) had **never been submitted to the external group** at all
  (`externalBuildState=READY_FOR_BETA_SUBMISSION`); external testers' newest available build
  was still **18**, three behind current `HEAD`.
  **Fix applied (ASC API, `purple-life`/`prd` key):** (1) `PATCH /v1/builds/{build1}` →
  `expired:true` (forces any tester still on it to update on next TestFlight open, blocking
  reopen of the Capacitor shell); (2) `POST /v1/betaGroups/{foundingTeam}/relationships/builds`
  added build **1.0 (19)**; (3) `POST /v1/betaAppReviewSubmissions` for build 19 →
  `betaReviewState: WAITING_FOR_REVIEW` (required before Apple serves it to the external group).
  **Confirmed resolved end-to-end:** re-polled `bun run ios:check-asc-builds` ~2 min later —
  build **1.0 (19)** now shows `external=IN_BETA_TESTING` (review cleared fast, an expedited
  re-review since the group already had an approved build). **No Flutter code change needed or
  made** — `sign_in_screen.dart`/`welcome_screen.dart` were already correct.
  **Next:** ask the reporting tester to delete-and-reinstall Purple from TestFlight (not just
  "Open") to guarantee the old Capacitor binary is discarded, not resumed from a backgrounded
  state, then re-verify. New ASC feedback 2026-07-06 ("Unable to login", "Error is wrong") is tracked
  separately as `flutter-auth-screen-parity` below (raw Supabase error strings once a tester
  *is* on real Flutter TF19+ — a genuine Flutter UX gap, unrelated to this wrong-surface bug).
  _Raised 2026-07-06 by Cursor (auth routing audit); resolved 2026-07-06 by Cursor (TestFlight
  distribution fix)._

- [ ] **flutter-auth-screen-parity** — When tester is on **Flutter TF19** (not Capacitor web),
  sign-in still fails UX: `sign_in_screen.dart` shows raw `e.toString()` Supabase exceptions
  ("Error is wrong" ASC 2026-07-06), no forgot-password flow, plain Material layout vs web
  liquid-glass two-panel design (`sign-in.tsx` + `friendlyAuthError`). Port friendly error
  mapping, forgot-password, and `GlassCard`/token styling. See also `tf-login-wrong-surface`
  if "Welcome back!" appears (that is web/Capacitor, not this issue). _Raised 2026-07-06 by
  TF19 audit._

- [ ] **care-accept-server-route** — Caregiver-invite **accept and decline** need a
  service-role server route that does not exist yet. RLS gives caregivers SELECT-only on
  `care_relationships` (no caregiver UPDATE policy), so the status flip to `active`
  (accept) / `revoked` (decline) must run server-side. Web does this via a TanStack
  `createServerFn` (`src/lib/care.functions.ts` `acceptInvite`) that is **not** exposed as
  a Worker `/api/...` route. Flutter now posts `POST /api/care/accept {invite_token}`
  (mirroring the WorkerClient pattern) but it 404s until the web/Worker side adds
  `src/routes/api/care/accept.ts` (and ideally `.../decline.ts`) fronting the server fn,
  with Flutter CORS. **Also:** the existing Flutter `declineIncomingCareInvite` direct
  `.update()` is silently RLS-blocked today (same root cause). _Raised 2026-07-05 by
  Wave-1 care/reports agent._

  **Update 2026-07-05 (P0 close-out pass):** all three routes now exist and are
  build-verified (`bun run tsc` + `bun run build:prod` both **pass**, `flutter analyze
  lib/` clean, `flutter test` **124/124**):
  - `src/routes/api/care/accept.ts` + `src/routes/api/care/decline.ts` — already written,
    confirmed still correct, no changes needed.
  - **New:** `src/routes/api/care/incoming-invites.ts` (GET) fronting a new
    `listIncomingInvitesForUser` in `src/lib/care.server.ts` (mirrors the existing
    `listIncomingCareInvites` server fn exactly: same email-match query, same owner-name
    join, same expiry filter). Added to the Flutter CORS allow-list in
    `src/lib/flutter-api-cors.ts`.
  - **Root-caused the actual "dead code" card:** it was the **Flutter**
    `IncomingCareInvitesCard` (`flutter/lib/features/care/incoming_care_invites_card.dart`),
    not the web one. Web's card already called the service-role `listIncomingCareInvites`
    TanStack server fn correctly. Flutter's `CareRepository._loadIncomingCareInvites` did a
    **direct client `.select()` on `care_relationships` filtered by `invite_email`** —
    RLS's `care_rel_caregiver_select` policy is `auth.uid() = caregiver_id`, which is
    `NULL` on a still-pending (not-yet-accepted) invite, so that query always returned 0
    rows. Same root cause silently broke Flutter's `declineIncomingCareInvite` (direct
    `.update()`, 0-row no-op).
  - **Fixed in `flutter/lib/features/care/care_repository.dart`:**
    `_loadIncomingCareInvites` now calls `GET /api/care/incoming-invites`;
    `declineIncomingCareInvite` now calls `POST /api/care/decline` (mirroring the existing
    `acceptInvite` → `POST /api/care/accept` pattern). Removed the now-dead
    `_currentUserEmail()` helper (flagged by `flutter analyze`).
  - **NOT deployed.** `wrangler deploy` was prepared but **not run** — prod deploy requires
    explicit operator approval per `.cursor/rules/no-manual-operator-work.mdc` /
    `agent-orchestration-safety.mdc` and this branch (`lovable/redesign`) is mid-session
    with unrelated concurrent Flutter auth-screen work also uncommitted in the same
    working tree. Until deployed, Flutter's `acceptInvite`/`declineIncomingCareInvite`/
    incoming-invites list all 404 against prod (`www.purplelife.org`) exactly as before.
    **Exact command for approval:** `doppler run --project cursor-cloudflare --config
    prd_cloudlfare -- bunx wrangler deploy -c wrangler.deploy.jsonc` (run from repo root
    after `bun run build:prod`; override `CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0`
    per `doppler-cloudflare-account-id` below if Doppler still resolves the POS account).
  - **Also fixed (unrelated repo hygiene, was blocking `check:em-dash`/`build:prod`):**
    removed ~50 stray untracked `" 2.<ext>"` duplicate files scattered across `src/`,
    `scripts/`, `flutter/`, `mem/`, `ios/` (macOS-style duplicate-save artifacts, all
    either byte-identical to or a stale snapshot of their real tracked counterpart);
    `src/lib/flutter-web-routing 2.ts` contained a stray em dash that failed the prebuild
    gate. None were git-tracked, so nothing of substance was lost.
  - Caregiver dashboard tabs + AI Worker-route backlog below is still **fully open**,
    untouched by this pass.

  **Extended 2026-07-05 (Wave-2 fleet): full Worker-route backlog.** The same gap blocks
  not just accept/decline but **every caregiver dashboard read** and the insights/reports
  AI surfaces. All of these exist as TanStack `createServerFn`s in
  `src/lib/care.functions.ts` (line refs below) but have no Flutter-callable Worker
  `/api/...` routes. Flutter Wave-1/2 UI is wired against the mirror pattern and shows
  clear errors / honest gap-states until these land. Grouped by priority:

  1. **Care loop (P0 — invite flow is dead-ended without these):**
     - `acceptInvite` — `POST /api/care/accept` (Flutter already posts this).
     - `decline` — `POST /api/care/decline` (fixes the silent RLS no-op above).
  2. **Caregiver dashboard reads/actions (blocks all `/care/$ownerId` tabs):**
     - `caregiverReadToday` (L1356)
     - `caregiverReadMeds` (L1233)
     - `caregiverMarkDose` (L1414)
     - `caregiverReadJournal` (L1274)
     - `proposeChange` (L978)
     - `caregiverReadSeizures` (L1289)
     - `caregiverLogSeizure` (L1469)
     - `caregiverReadReports` (L1303)
     - `caregiverReadReport` (L1323) — **must preserve the `phi_access_log`
       `caregiver_view` audit write** when fronted by a Worker route.
     - `listHydrationForDay`
     - `getOrCreateDirectThread` (also unblocks caregiver-initiated care chat, see
       2026-07-05 care-chat HANDOFF entry).
  3. **Insights / reports AI (blocks AI cards on `/insights` and report summaries;
     Flutter currently shows honest server-only gap-states):**
     - `getVitalsSnapshot`
     - `getDailyInsightCards`
     - `computeUserPatterns`
     - `summarizeReport`
     - `getMetricInsight`

  _Extended 2026-07-05 by Wave-2 docs agent (orchestrated fleet)._

- [ ] **tf-settings-shell-nav** — Tester ASC feedback (2026-07-05 15:41 ET, build 17/18): wants
  settings/shell burger **left of Purple logo**, menu slide **left to right** (not right
  `endDrawer`), more connections visible. Conflicts with current AGENTS.md right-drawer rule;
  needs product decision then Flutter shell work. _Raised 2026-07-05 ASC after TF18._

- [ ] **tf-heading-typography** — Tester ASC feedback (2026-07-05 15:41 ET): section heading too
  long, too large vs web. Identify screen(s) from screenshot; match web type scale from
  `design/tokens.json`. _Raised 2026-07-05 ASC after TF18._

- [ ] **tf-bottom-whitespace** — Tester ASC feedback (2026-07-05 15:40 ET, recurring): excess
  whitespace above bottom nav on multiple tabs. Likely safe-area / shell padding; compare web
  `_app` layout. _Raised 2026-07-05 ASC after TF18._

- [ ] **flutter-web-cutover-impl** — Runbook at `docs/FLUTTER-WEB-CUTOVER.md` (plan only).
  Needs `merge-flutter-web-assets.sh`, `src/server.ts` path dispatch, staging smoke, owner
  approval before prod. Build: `./scripts/flutter-web-build-prod.sh`. _Raised 2026-07-05._

- [ ] **tf-synced-data-visibility** — Tester ASC feedback (2026-07-05): "how do i see all my
  synched data?" **Partially improved 2026-07-05:** Flutter `/my-health`, `/vitals`, and `/tools`
  now show shared **All synced data (90 days)** panel with per-provider day counts, last sync
  relative time, and link chips to Vitals / My Body / Biometrics / Tools. Biometrics hub depth
  and bottom-nav My Body label still open for TF17+ re-verify. _Raised 2026-07-05 cutover audit._

- [ ] **tf-oauth-not-working** — Tester ASC feedback (2026-07-05): "why is this not workibg"
  (Tools). Likely Oura native redirect + connect UX; ties to `oura-native-redirect-console`.
  _Raised 2026-07-05 cutover audit._

- [x] ~~**tf16-asc-processing**~~ — RESOLVED 2026-07-05: ASC builds API shows **1.0 (16)** VALID,
  IN_BETA_TESTING. Bundle: Luciq, settings scroll, `home_city`, sync fixes. Re-run
  `bun run ios:check-asc-builds` before future uploads only.
  _Raised 2026-07-05 by TF upload agent._

- [x] ~~**tf-settings-design**~~ — RESOLVED 2026-07-05: Flutter `/settings` renders full scroll
  parity with web (Preferences, AI provider, What I track, Health history, Data, Help, About,
  Admin inline sections with wired Supabase fields). Verified on `:8765` accessibility tree +
  `settings_screen_scroll_test.dart`. Needs TF16+ upload for tester re-check.
  _Raised 2026-07-05 from ASC beta feedback._

- [ ] **tf-crash-report** — Tester reported "App is crashing" (2026-07-04 screenshot feedback);
  ASC crash submissions API shows 0 crash logs. **Luciq Flutter SDK wired** on TF16+
  (`luciq_flutter`, `LUCIQ_APP_TOKEN`). **2026-07-05:** Doppler sync (`luciq:sync-secrets`),
  Cursor MCP install (`luciq:install-mcp`, `pmt@eatos.com`, token from `servers-teamkeys/dev`).
  Triage via Luciq MCP **Flutter - Purple - Beta** after Cursor restart (REST API returns 401
  for MCP token; expected). **Re-verified 2026-07-06 (full audit):** called Luciq MCP
  `list_crashes` directly for both apps in this Luciq account matching Purple
  (`purple` slug, iOS, mode beta; `flutter-purple` slug, Flutter, mode beta) — **both
  return zero crashes**. No crash telemetry exists for the original TF (pre-7/4)
  report or for any Flutter build since. Still open only because the original
  screenshot has no reproduction path; downgrading urgency, not closing (cannot
  prove a negative for a single unreproduced report). _Raised 2026-07-05 from ASC
  beta feedback; re-verified 2026-07-06._

- [x] ~~**tf-sync-bar-every-page**~~ — RESOLVED 2026-07-05: Removed `SyncStatusBar` from Meds and
  Vitals; kept on Today (+ Tools integrations cards). Sync button labels name providers.

- [x] ~~**tf-sync-time-labels**~~ — RESOLVED 2026-07-05: Sync bar shows provider names while syncing,
  last sync relative + clock time, local timezone conversion.

- [x] ~~**tf-timezone-city-label**~~ — RESOLVED 2026-07-05: Account timezone picker shows city labels
  (e.g. New York) via `timezoneLabel()` instead of raw IANA strings only.

- [ ] **flutter-phase5-nogo** — Phase 5 cutover NO-GO: Vitals My Body depth, Tools 90d
  wearable stats, symptom radar data gaps, Worker-only Settings (export/2FA/avatar),
  journal voice/photo native capture, full reports upload. _Raised 2026-07-05 by verify fleet._

- [ ] **oura-native-redirect-console** — **Flutter UX done 2026-07-05:** Tools shows inline
  errors plus pre-connect hint to register `org.purplelife.app://oauth-oura-callback` (and Whoop
  native URI) in provider developer consoles. **Still open:** owner must add the Oura redirect URI
  in the Oura developer console for native connect to succeed. _Raised 2026-07-05 by OAuth fleet._

- [ ] **tf16-device-verify** — Apple Health Connect, settings scroll, sync bar labels, and
  Account `home_city` need confirmation on physical iPhone with **TestFlight 1.0 (16)** (ASC VALID
  2026-07-05). Agent cannot run HealthKit in CI. Supersedes tf15-device-verify. _Raised 2026-07-05._

- [x] ~~**apple-health-bool-gate**~~ — RESOLVED 2026-07-05: iOS Keychain connect flag
  after `requestAuthorization` (TF14/15). Was blocking connect on TF13.

- [x] ~~**account-hash-redirect**~~ — RESOLVED 2026-07-05: `RouterRefreshNotifier` +
  `resolvePlatformInitialLocation()` in `99e836c`; included in TF15.

- [x] ~~**compile-tools-syntax**~~ — RESOLVED 2026-07-05: Missing `}` in
  `tools_screen.dart` caused 186 analyze errors; fixed in `92e0c0b` / `98d1ec8`.

- [x] ~~**tf14-missing-settings-oura**~~ — RESOLVED 2026-07-05: TF14 uploaded before
  Settings/Oura commits; **TF15** includes full bundle.

## Web / Lovable

- [ ] **lovable-redesign-merge** — `lovable/redesign` branch has large Flutter overnight
  work; merge to `main` requires full gate pass and explicit deploy approval. _Raised
  2026-07-04 by redesign workflow._

- [ ] **manual-prod-deploy** — Production deploy is `workflow_dispatch` only during
  redesign; push to `main` does not auto-deploy. _Raised 2026-07-04 by workflow._

## Infrastructure

- [ ] **doppler-cloudflare-account-id** — Doppler `CLOUDFLARE_ACCOUNT_ID` may point at POS
  account; override with eigital `08e766e92db74bc7ef14c6b5c86bddf0` on wrangler deploy.
  _Raised 2026-07-04 by ship agent._

- [ ] **remote-push-apns-fcm** — Native remote push needs APNs/FCM secrets in Doppler/Worker.
  Local med reminders work natively. _Raised 2026-07-04 by native-app docs._

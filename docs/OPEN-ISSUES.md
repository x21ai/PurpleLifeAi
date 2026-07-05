# OPEN ISSUES

Known problems, blockers, and deferred work. Add issues as they arise. Mark resolved
with strikethrough and date; do not delete.

Format:

- [ ] **`<id>`** — description. _Raised YYYY-MM-DD by \<who\>._
- [x] ~~**`<id>`**~~ — RESOLVED YYYY-MM-DD: how.

---

## Flutter / TestFlight

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
  for MCP token; expected). _Raised 2026-07-05 from ASC beta feedback._

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

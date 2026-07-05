# HANDOFF

Current state of the world. Read this first, every session. Update before any task is
done. Newest entries at the top of the log.

Enforced by `.cursor/rules/00-handoff.mdc`. Extended ops: `CURSOR_HANDOFF.md`.

---

## Current snapshot

Purple Life on **`lovable/redesign`** (wave 1 parity commit). TestFlight **1.0 (16)**
**VALID**, IN_BETA_TESTING (2026-07-05). Flutter signed-in wave 1 shipped: `/my-health`,
`/biometrics`, reports upload, My Body nav, synced-data banners. **Flutter web cutover scaffold**
landed (`merge-flutter-web-assets.sh`, `server.ts` dispatch gated `FLUTTER_WEB_CUTOVER`,
`build:prod:flutter-web`); prod deploy still blocked.

**Next action:** Register Oura native redirect in developer console (`oura-native-redirect-console`);
device verify Tools OAuth on TF16/17; staging `build:prod:flutter-web` on workers.dev.

---

## Log

### 2026-07-05T14:05:00Z — P0-3 Flutter wearable OAuth error UX

- **Requested:** Improve Tools Oura/Whoop OAuth inline errors; register redirect hint for
  `org.purplelife.app://oauth-oura-callback`; compare web tools integration UI; analyze + test;
  commit and push.
- **Done:** `wearable_oauth.dart` — `whoopFunctionErrorMessage`, `oauthCallbackQueryErrorMessage`,
  `nativeConnectSetupHint`, `emitWearableOAuthFailure`; Whoop exchange + callback error mapping.
  `tools_screen.dart` — inline errors on both cards, native pre-connect hints (Oura + Whoop).
  `wearable_oauth_callback_screen.dart` — emits failures to Tools stream. Tests extended.
  `flutter analyze lib/features/tools/` + `flutter test test/wearable_oauth_test.dart` pass.
- **Issues:** Oura developer console still needs native redirect URI registered (UX only).
- **Stand / next:** Owner adds `org.purplelife.app://oauth-oura-callback` in Oura console; TF device
  verify connect path.
- **Who / where:** Cursor subagent · darwin · lovable/redesign
- **Timestamp:** 2026-07-05T14:05:00Z

### 2026-07-05T18:30:00Z — Flutter web Worker cutover scaffold

- **Requested:** Implement merge script, `server.ts` path dispatch stub, `build:prod:flutter-web`
  chain; commit + push; no prod deploy.
- **Done:** `scripts/merge-flutter-web-assets.sh`; `src/lib/flutter-web-routing.ts` +
  `src/server.ts` dispatch (`/api/*`, `/oauth/*` → TanStack; Flutter static + SPA fallback when
  `FLUTTER_WEB_CUTOVER=true`; marketing TanStack fallback). `package.json`
  `build:prod:flutter-web`. `bunx tsc --noEmit` pass.
- **Issues:** Flag defaults off; no staging smoke; `flutter-phase5-nogo` and E2E TanStack paths
  remain.
- **Stand / next:** `build:prod:flutter-web` on workers.dev; owner sign-off before wrangler deploy.
- **Who / where:** Cursor subagent · darwin · lovable/redesign
- **Timestamp:** 2026-07-05T18:30:00Z

### 2026-07-05T18:10:00Z — Flutter signed-in route parity wave 1

- **Requested:** Complete P0 wave 1: `/my-health` + nav, Tools OAuth UX, vitals depth,
  reports hub, journal honest capture; analyze + test; commit and push.
- **Done:** Added `MyHealthScreen` + repository (narrative, 90-day coverage, metric rows);
  bottom nav **My Body** → `/my-health`; `/biometrics` hub + trend drilldowns; vitals synced
  strip + My Body link; Tools Oura redirect hint + coverage summary; reports upload route
  (`/settings/reports/new`); journal platform-honest capture dock. `flutter test` **50/50**
  (excludes WIP `marketing_routes_test.dart` on disk). Commit `fix(flutter): signed-in route
  parity wave 1`.
- **Issues:** Oura console redirect still manual (`tf-oauth-not-working`). Marketing Flutter
  WIP remains untracked on disk.
- **Stand / next:** TF device sign-off on synced-data visibility; ship TF17 when ready.
- **Who / where:** Cursor subagent · darwin · lovable/redesign
- **Timestamp:** 2026-07-05T18:10:00Z


- **Requested:** Document Worker path for Flutter web at www.purplelife.org; scaffold prod build
  script; list Worker route changes (plan only); commit TF16 Luciq dedupe; push.
- **Done:** Added `docs/FLUTTER-WEB-CUTOVER.md` (build pipeline, asset paths, path-based Worker
  dispatch vs TanStack SSR, rollback, `:8080` vs `:8765` roles). Added
  `scripts/flutter-web-build-prod.sh` (Doppler dart-defines → `flutter/build/web`). Linked from
  `docs/FLUTTER-TESTFLIGHT-CUTOVER.md`. Committed **d62472b** `chore(ios): TF16 build bump and
  Luciq dedupe` (`1.0.0+16`, removed duplicate SPM Luciq, Podfile.lock). `flutter test` **47/47**
  on committed tree (parallel fleet WIP in untracked `lib/features/marketing/` breaks local
  analyze until merged).
- **Issues:** Worker `src/server.ts` dispatch + `merge-flutter-web-assets.sh` not implemented.
  `flutter-phase5-nogo` still blocks prod Flutter web. Parallel agents left untracked marketing/
  reports WIP on disk.
- **Stand / next:** Staging cutover on workers.dev; owner approval before prod deploy.
- **Who / where:** Cursor subagent · darwin · lovable/redesign@d62472b
- **Timestamp:** 2026-07-05T14:00:00Z


- **Requested:** Pull ASC/Luciq feedback, confirm TF16, map feedback to Flutter gaps, compare web vs
  Flutter routes, refresh gap matrix and open issues; audit only, commit + push.
- **Done:** `bun run ios:check-tf-feedback` (10 ASC submissions); `bun run ios:check-asc-builds`
  (**1.0 (16) VALID**); refreshed `docs/FLUTTER-CUTOVER-GAP-MATRIX.md` with P0/P1/P2 table,
  feedback map, route counts (33 gaps); `docs/OPEN-ISSUES.md` (`tf-synced-data-visibility`,
  `tf-oauth-not-working`, resolved `tf16-asc-processing`).
- **Issues:** Luciq dashboard API creds still absent (manual crash triage). No screen work this pass.
- **Stand / next:** `tf16-device-verify` on iPhone; ship P0-2 `/my-health` + P0-3 Oura console.
- **Who / where:** Cursor cutover audit subagent · darwin · lovable/redesign
- **Timestamp:** 2026-07-05T17:55:00Z

### 2026-07-05T13:36:00Z — Settings scroll re-verification (subagent)

- **Requested:** Confirm Flutter `/settings` full scroll web parity; browser verify `:8765`; analyze +
  test; resolve `tf-settings-design`.
- **Done:** Compared web `settings.tsx` vs Flutter hub + inline sections (order matches). Rebuilt
  `:8765`; browser MCP accessibility tree **108 nodes** (Preferences through Admin); scrollIntoView
  screenshots for AI provider, Data, Help, About; `flutter analyze lib/features/settings/` clean;
  `flutter test` **47/47** incl. `settings_screen_scroll_test.dart`.
- **Issues:** None. Commit `fb3b018` already on `origin/lovable/redesign`; TF16 needed for tester
  re-check.
- **Stand / next:** Poll ASC for TF16 VALID; device sign-off on settings scroll.
- **Who / where:** Cursor settings subagent · darwin · lovable/redesign@2b3fbb1
- **Timestamp:** 2026-07-05T13:36:00Z


- **Requested:** Ship TF16 bundling `home_city` (9b3de42), Luciq (e1cd69d), settings scroll
  (fb3b018), TF sync/timezone feedback (2aeabd4).
- **Done:** Polled `git pull` until fb3b018 + 2aeabd4 on branch; `flutter analyze lib/` + `flutter
  test` 47/47; bumped `pubspec.yaml` to **1.0.0+16**; ASC pre-check TF15 VALID; fixed duplicate
  LuciqSDK (removed SPM `luciq-ios-sdk` from Flutter `project.pbxproj`, keep CocoaPods via
  `luciq_flutter`); `bun run ios:testflight` via Xcode-beta **EXPORT SUCCEEDED**, upload **100%**
  (~09:33 ET); `bun run ios:check-tf-feedback` (7 ASC submissions, Luciq SDK token present).
- **Issues:** ASC API still lists **1.0 (15)** as newest VALID (16 processing). Local **+16** and
  pbxproj fix **not committed**. `xcode-select` points at CLT; script used `/Applications/Xcode-beta.app`.
- **Stand / next:** Poll ASC for 16 VALID; commit chore bump + Luciq SPM dedupe; close TF feedback
  items on device after install.
- **Who / where:** Cursor TF upload subagent · darwin · lovable/redesign@2b3fbb1 (upload tree) +
  local pbx/pubspec edits
- **Timestamp:** 2026-07-05T13:35:00Z

### 2026-07-05T13:34:00Z — Luciq vs Sentry observability audit

- **Requested:** Can agents access Luciq without manual checks? Sentry project exists? Need both?
- **Done:** Audit confirms SDK capture works; dashboard automation blocked until
  `LUCIQ_API_TOKEN` + `LUCIQ_ACCOUNT_EMAIL` in Doppler. No Sentry in repo or Doppler; policy
  keeps Luciq-only for TestFlight beta (no dual SDK).
- **Issues:** User must add Luciq API creds in Luciq dashboard, then Doppler, for agent crash pulls.
- **Stand / next:** TF16 upload; optional Luciq MCP install; do not create Sentry.
- **Who / where:** agent d29d33cc · darwin · lovable/redesign@fb3b018
- **Timestamp:** 2026-07-05T13:34:00Z

### 2026-07-05T13:22:00Z — Post-fleet integration verification

- **Requested:** Pull `lovable/redesign`, run Flutter gates, rebuild `:8765`, curl + browser
  verify `#/settings` scroll and `#/account` city field; update `CURSOR_HANDOFF.md`.
- **Done:** `git pull` up to date at `e1cd69d`; `flutter analyze lib/` 0 issues; `flutter test`
  46/46; `./scripts/flutter-web-serve.sh --rebuild` OK; curl **200**; browser MCP verified
  settings sections scroll and account city field (`e.g. Brooklyn`); re-fetch showed no new
  settings/TF commits; `CURSOR_HANDOFF.md` integration section updated.
- **Issues:** None blocking. Signed-in browser session required for account form (existing session
  used).
- **Stand / next:** TF16 upload with accumulated fixes; Luciq verify on device after TF16.
- **Who / where:** Cursor agent · darwin · lovable/redesign@e1cd69d
- **Timestamp:** 2026-07-05T13:22:00Z

### 2026-07-05T13:25:00Z — Flutter settings full scroll web parity

- **Requested:** Complete Flutter `/settings` full scroll parity with prod web; verify, resolve
  `tf-settings-design`, commit and push.
- **Done:** Confirmed inline sections already wired in `settings_screen.dart` +
  `settings_sections.dart` (Preferences through Admin); added
  `flutter/test/settings_screen_scroll_test.dart`; `flutter analyze lib/` clean; `flutter test`
  47/47; browser verified `http://127.0.0.1:8765/#/settings` (108 interactive a11y nodes incl.
  Export, Contact, About, Admin); resolved `tf-settings-design` in OPEN-ISSUES.
- **Issues:** TF16 upload needed for tester re-check; Travel sub-route still placeholder.
- **Stand / next:** Upload TF16; run `bun run ios:check-tf-feedback` after VALID.
- **Who / where:** Cursor agent · darwin · lovable/redesign (this commit)
- **Timestamp:** 2026-07-05T13:25:00Z

### 2026-07-05T13:20:00Z — TestFlight sync bar and timezone label fixes (commit)

- **Requested:** Commit uncommitted TestFlight feedback fixes (sync bar, timezone labels) and
  handoff kit files; push `lovable/redesign`.
- **Done:** Committed `sync_status_bar.dart` (provider names in sync button, relative + clock
  last sync, local time), removed `SyncStatusBar` from Meds/Vitals, `timezoneLabel()` in
  `locale_data.dart`; handoff kit (`00-handoff.mdc`, `CLAUDE.md`, `install-handoff-kit.sh`,
  post-task doc rule updates); `flutter analyze` 0 errors (5 pre-existing info), `flutter test`
  46/46; pushed to `origin/lovable/redesign`.
- **Issues:** Settings design still wrong per tester (see OPEN-ISSUES); fixes need TF16 upload to
  reach testers.
- **Stand / next:** Upload TF16; run `bun run ios:check-tf-feedback` after VALID.
- **Who / where:** Cursor agent · darwin · lovable/redesign (this commit)
- **Timestamp:** 2026-07-05T13:20:00Z

### 2026-07-05T13:30:00Z — Luciq Flutter crash reporting

- **Requested:** Luciq vs free alternatives; integrate `luciq_flutter`; agent periodic checks.
- **Done:** Added `luciq_flutter` ^19.8, `luciq_bootstrap.dart`, dart-define injection in
  `flutter-ios-testflight.sh`; removed duplicate native Luciq init from Flutter AppDelegate;
  `scripts/luciq-fetch-reports.mjs`, `check-testflight-feedback.mjs`, `ios:check-luciq`,
  `ios:check-tf-feedback`; `mem/observability/crash-reporting.md`, testflight-setup section,
  `.cursor/rules/flutter-testflight-observability.mdc`; analyze 0 issues, 46/46 tests.
- **Issues:** Dashboard API automation needs optional `LUCIQ_API_TOKEN` + `LUCIQ_ACCOUNT_EMAIL`
  in Doppler; SDK token alone sufficient for device crash capture. `tf-crash-report` open until
  TF16+ verified in Luciq UI.
- **Stand / next:** Upload TF16; run `bun run ios:check-tf-feedback` after VALID.
- **Who / where:** Cursor agent · darwin · lovable/redesign (this commit)
- **Timestamp:** 2026-07-05T13:30:00Z

### 2026-07-05T13:20:00Z — profiles.home_city field (DB + Flutter + web Account)

- **Requested:** Separate city field in DB (not just timezone label); migration, Flutter Account,
  optional web Account parity; commit and push.
- **Done:** Verified no `city`/`home_city` on live NEW DB; migration
  `supabase/migrations/20260705131400_profiles_home_city.sql` applied via Management API;
  regenerated `src/integrations/supabase/types.ts`; Flutter `account_screen.dart` city text
  field (autosave); web `LocaleFields` + `account.tsx` + i18n en/es; `flutter test` 46/46,
  `check:supabase-types` ok.
- **Issues:** None blocking. Settings scroll parity and Luciq out of scope.
- **Stand / next:** TF16 upload can include city field; welcome/onboarding does not yet collect
  `home_city`.
- **Who / where:** Cursor agent · darwin · lovable/redesign (this commit)
- **Timestamp:** 2026-07-05T13:20:00Z

### 2026-07-05T13:10:00Z — TestFlight feedback API + triage fixes

- **Requested:** Access TestFlight user feedback/screenshots; resolve issues.
- **Done:** Confirmed ASC API access (`/v1/apps/6787298041/betaFeedbackScreenshotSubmissions`);
  added `scripts/asc-list-testflight-feedback.mjs`, `bun run ios:check-asc-feedback`; triaged 7
  submissions; removed sync bar from Meds/Vitals; sync labels name providers + clock time;
  Account timezone shows city labels (New York not America/New_York).
- **Issues:** Settings design still wrong per tester; crash screenshot with no ASC crash log;
  fixes need TF16 upload.
- **Stand / next:** Upload TF16; Settings parity agent; optional ASC webhook for real-time feedback.
- **Who / where:** Cursor agent · darwin · lovable/redesign (superseded by commit above)
- **Timestamp:** 2026-07-05T13:10:00Z

### 2026-07-05T12:05:00Z — Install handoff/documentation discipline kit

- **Requested:** Apply permanent handoff rules from attached kit to Cursor repo
  (`docs/HANDOFF.md`, `docs/DECISIONS.md`, `docs/OPEN-ISSUES.md`, `.cursor/rules/00-handoff.mdc`,
  `CLAUDE.md`, install script); integrate with existing Purple docs.
- **Done:** Created `.cursor/rules/00-handoff.mdc`, `CLAUDE.md`, `docs/HANDOFF.md`,
  `docs/DECISIONS.md`, `docs/OPEN-ISSUES.md`, `scripts/install-handoff-kit.sh`; updated
  `.cursor/rules/post-task-documentation.mdc` and `AGENTS.md` to reference the trio;
  seeded snapshot and log from overnight Flutter fleet state (`327c161`, TF15 VALID).
- **Issues:** Phase 5 cutover still NO-GO; Oura native redirect URI may need manual
  Oura console registration; `CURSOR_HANDOFF.md` remains large legacy ops doc (maintain
  in parallel, not replaced).
- **Stand / next:** All future tasks append here first; operator verifies TF15 on device.
- **Who / where:** Cursor agent · darwin · lovable/redesign@327c161 (pre-commit for this task)
- **Timestamp:** 2026-07-05T12:05:00Z

### 2026-07-05T09:01:00Z — TestFlight 15 shipped (Settings, Account, Oura, Apple Health)

- **Requested:** Ship TF15 with Settings/`#/account`/Oura fixes missing from TF14 upload.
- **Done:** `pubspec` **1.0.0+15**; upload VALID ASC id `e85ac1a5-f547-4cb1-b51b-aa091191ba15`;
  commits `99e836c` (router refresh, Account deep links), `98d1ec8` (Oura OAuth),
  `92e0c0b` (compile + Apple Health Keychain connect); handoff `327c161` pushed.
- **Issues:** Device-side HealthKit and Oura connect not agent-verified on physical iPhone.
- **Stand / next:** Install **1.0 (15)** from TestFlight; verify connect flows on device.
- **Who / where:** overnight fleet agents · CI Mac · lovable/redesign@327c161
- **Timestamp:** 2026-07-05T09:01:00Z

### 2026-07-05T08:49:00Z — Apple Health TF14 (Keychain connect fix)

- **Requested:** Fix Apple Health connect on device (TF13 bool gate bug).
- **Done:** iOS trusts `requestAuthorization` + Keychain flag (matches Capacitor
  `health-ios.ts`); user-visible errors in Tools panel; TF14 uploaded VALID
  (`9aaf275d-c070-4a26-934c-6d21373b5edd`); superseded by TF15.
- **Issues:** TF14 predated Settings/Oura commits.
- **Stand / next:** Superseded by TF15 upload.
- **Who / where:** agent 60b9bcad · darwin · lovable/redesign@92e0c0b
- **Timestamp:** 2026-07-05T08:49:00Z

### 2026-07-05T08:00:00Z — Compile gates restored after parallel WIP break

- **Requested:** Fix 186 analyze errors from broken `tools_screen.dart` syntax.
- **Done:** `92e0c0b` — analyze 0 issues, **44/44** then **46/46** tests, `:8765` rebuild;
  preserved Oura OAuth and Apple Health WIP.
- **Issues:** None blocking after fix.
- **Stand / next:** Continue Settings/Health/Oura agents; upload TF14/15.
- **Who / where:** agent a83f8337 · darwin · lovable/redesign@92e0c0b
- **Timestamp:** 2026-07-05T08:00:00Z

<!--
Copy this template for each new entry. Newest at the top.

### YYYY-MM-DDTHH:MM:SSZ — <short title>
- **Requested:**
- **Done:**
- **Issues:**
- **Stand / next:**
- **Who / where:** <name or agent> · <machine> · <branch@commit>
- **Timestamp:** YYYY-MM-DDTHH:MM:SSZ
-->

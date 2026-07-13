# OPEN ISSUES

Known problems, blockers, and deferred work. Add issues as they arise. Mark resolved
with strikethrough and date; do not delete.

Format:

- [ ] **`<id>`** — description. _Raised YYYY-MM-DD by \<who\>._
- [x] ~~**`<id>`**~~ — RESOLVED YYYY-MM-DD: how.

---

## Flutter Meds catch-up (raised 2026-07-12)

- [x] ~~**flutter-missed-dose-catchup-log-dropdown**~~ — RESOLVED 2026-07-13: Flutter
  Today had no Merged-preview missed-dose catch-up (`Log ▾`). Restored slim banner
  with PopupMenu (I took it / I missed it / Review in Meds / Not now), wired to
  `MedsRepository.loadMissedDoseCatchup` + SharedPreferences acted TTL. Evidence:
  `flutter test test/missed_dose_catchup_test.dart test/today_screen_render_test.dart`
  **6/6**. _Raised 2026-07-12 by preview parity audit._

## Flutter Wearables (raised 2026-07-13 audit)

- [x] ~~**flutter-wearable-visit-sync-missing**~~ — RESOLVED 2026-07-13: Tools
  `SyncModeSelect` advertised "When I open Purple (every 3h)" but Flutter never ran
  visit-mode Oura/Whoop sync (web has `useWearableAutoSync`). Added
  `syncVisitModeWearables` + wired into `NativeHealthStartupListener` (startup +
  resume, 3h throttle). Evidence: `wearable_visit_sync_test.dart` +
  `wearable_oauth_test.dart` **21/21**. _Raised 2026-07-13 by wearables audit._

- [x] ~~**flutter-today-sync-now-no-refresh**~~ — RESOLVED 2026-07-13: Today Wearables
  expand `SyncStatusBar` Sync now did not invalidate Today scores. Wired
  `onSynced` → invalidate `todayDataProvider` + bump `syncTick`. _Raised 2026-07-13
  by wearables audit._

- [ ] **whoop-native-redirect-console** — Whoop Connect on native still needs
  `org.purplelife.app://oauth-whoop-callback` registered in the Whoop developer
  console (Oura URI already registered). Until then Whoop Connect fails after
  consent with redirect_uri rejection. Flutter shows setup hint under Whoop card
  only. Owner console action; cannot fix in app code. Split from resolved
  `oura-native-redirect-console`. See also `tf-oauth-not-working`,
  `tf16-device-verify`. _Raised 2026-07-05; restated 2026-07-13 wearables audit._

## Auth / onboarded_at gate (raised 2026-07-13)

- [x] ~~**flutter-onboarded-at-redirect-loop**~~ — RESOLVED 2026-07-13: After password
  login, `authRedirect` `_isOnboarded` fail-closed on offline timeout/error and
  treated null profile as not onboarded, bouncing live users `/welcome` ↔ `/today`
  or blocking on welcome. Fixed via `onboarding_gate.dart` (cache + always
  fail-open on lookup failure; welcome only on proven incomplete profile). TF27
  `AuthGate` / `authGateStatusProvider` unchanged. Ops: backfilled
  `onboarded_at` for Apple Health user without metadata. Evidence: auth +
  onboarding gate tests **16/16**. _Raised 2026-07-13 by post-TF27 password login audit._

## Flutter Meds (raised 2026-07-13 drug autofill audit)

- [x] ~~**flutter-add-med-no-name-search**~~ — RESOLVED 2026-07-13: Add-med sheet had a
  plain name `TextField` with no autocomplete. Ported `med-dictionary.ts` to
  `flutter/lib/features/meds/med_dictionary.dart` and wired `MedNameSearch` (mirrors
  web `med-name-search.tsx`) into `medication_form_sheet.dart`. Selecting a hit
  applies kind/unit/strength defaults. Evidence: `flutter test test/med_dictionary_test.dart`
  5/5. _Raised 2026-07-13 by drug autofill audit._

- [ ] **flutter-drug-db-enrich-missing** — P2: Web calls `getDrugDefaults` (openFDA +
  RxNorm via Worker server fn) on name commit to fill form/strength when the local
  dict has no defaults. Flutter has no Worker `/api/meds/drug-defaults` yet, so
  enrichment is local-dictionary only. Custom/out-of-dict names still save fine.
  _Raised 2026-07-13 by drug autofill audit._

## Flutter Data / Vitals / Biometrics (raised 2026-07-13 audit)

- [x] ~~**vitals-health-connect-series-blank**~~ — RESOLVED 2026-07-13: `sourceKeyFromString`
  ignored `health_connect`, so `_buildSeriesResult` skipped Android native rows and
  Data/Biometrics hub/detail looked empty. Added `SourceKey.healthConnect` + labels.
  Also aligned Vitals `hasData` with real metric values; hub avoids empty-while-loading.
  _Raised 2026-07-13 by live-user vitals audit._

- [ ] **data-tab-wearable-connect-cta** — P1: Data tab with no labs and no wearables
  shows labs upload empty only; no "Connect a device" path to Tools. Vitals/My Health
  already have connect links. _Raised 2026-07-13 by vitals audit._

- [ ] **biometrics-hub-empty-tools-link** — P1: Biometrics hub empty copy mentions
  connect but is not a tappable Tools CTA. _Raised 2026-07-13 by vitals audit._

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

## Journal / Log capture (raised 2026-07-13 TF audit)

- [x] ~~**tf27-journal-save-under-status-bar**~~ — RESOLVED 2026-07-13 (code, TF28
  pending): `/journal/new` Save was drawn under the iOS status bar because
  `NativeAppShell` removes `MediaQuery.padding` on full-bleed routes and
  `SafeArea` became a no-op. ASC Devyn: "trying to submit and it isn't letting
  me." **Fix:** pad with `MediaQuery.viewPadding`, nested Scaffold, high-contrast
  Save, keyboard-hide control, flush sync + pending-cache merge after save.
  Files: `journal_capture_screen.dart`, `journal_repository.dart`. Tests
  `journal_pending_upload_test.dart` **5/5**. _Raised 2026-07-06 ASC; fixed
  2026-07-13._

- [x] ~~**tf27-journal-photo-dead**~~ — RESOLVED 2026-07-13 (code, TF28 pending):
  Photo/Record buttons were disabled or "coming soon" only; ASC Devyn could not
  take a picture. **Fix:** Photo opens camera/library via `image_picker`, uploads
  to `journal-media`, updates `media_urls`. Voice/video remain coming soon.
  _Raised 2026-07-06 ASC; photo fixed 2026-07-13._

## Care scopes / meds Taken (raised 2026-07-12 audit)

- [x] ~~**flutter-med-offline-queue-optimistic-drop**~~ — RESOLVED 2026-07-13:
  Partial dose Taken/Skip/Snooze and med refill `queueWrite`s stayed in
  `sync_queue` but Drift optimistic cache ignored them (required full
  `scheduled_at`+`medication_id` / `updated_at`). Fixed merge-on-partial +
  pending-write pull skip + local pill-stock mirror in
  `flutter/lib/core/offline/sync_service.dart` + `database.dart`. Tests
  `med_offline_queue_test.dart` + `med_offline_cache_db_test.dart` **10/10**.
  _Raised 2026-07-13 by med offline queue audit._

- [x] ~~**care-meds-scope-403-to-404**~~ — RESOLVED 2026-07-12: Worker
  `assertScopeForUser` in `src/lib/care.server.ts` returned **403**
  `"Missing scope: …"` on denied caregiver reads (including `/api/care/meds`).
  Project rule is cross-user denial → **404**. Fixed to `CareApiError("Not found", 404)`.
  Flutter caregiver Meds tab is **read-only** via `POST /api/care/meds` (no raw
  owner `user_id` Taken/refill path). Own-user Taken uses `MedsRepository` + auth uid
  + RLS. Web `caregiverMarkDose` already 404s wrong-owner dose ids (`Dose not found`).
  **Still open:** no Worker `POST /api/care/mark-dose` for Flutter caregiver Taken
  (see `caregiverMarkDose` under care Worker backlog). Refill remains owner-only.

## Flutter Plan + Ask Maya (raised 2026-07-12 audit)

- [x] ~~**plan-protocol-stuck-loading**~~ — RESOLVED 2026-07-12: Plan Protocol
  (and Insights / Data teaser) could spin forever when `/api/ai/daily-insight-cards`
  hung. `dailyInsightCardsProvider` had catch-all fail-open but **no timeout**, and
  caught errors returned `DailyInsightCardsResult.empty` with `error: null`, so empty
  copy said "log more readings" on transport failure. **Fix:** 20s timeout +
  `error: timeout|unavailable` so Protocol empty state is honest. Files:
  `flutter/lib/features/insights/ai_insights_repository.dart`. Ask Maya em dash in
  greeting removed (`ask_maya_screen.dart`). _Raised 2026-07-12 by Plan/Maya audit._

- [ ] **plan-recommended-loading-flash** — P2: Recommended segment uses
  `todayDataProvider` / `reportsHubProvider` via `valueOrNull`. While those are still
  loading, conditions are treated as empty and the UI briefly shows "Set your focus
  conditions..." even for users who have conditions. Prefer a small loading glass
  (or keep last known conditions) until first settle. _Raised 2026-07-12 by Plan/Maya
  audit._

- [ ] **ask-maya-load-error-polish** — P2: Ask Maya always fail-opens (greeting
  "there", general starter chips) with no loading indicator, error banner, or
  pull-to-refresh when `todayDataProvider` is loading or failed. Deep-link `?q=`
  only highlights a matching chip; it does not auto-open `/chat`. Chat itself has
  empty/error/limit handling. _Raised 2026-07-12 by Plan/Maya audit._

## Care / burger menu (raised 2026-07-13)

- [x] ~~**care-index-incoming-invites-missing**~~ — RESOLVED 2026-07-13 (code, uncommitted):
  Burger → Care (`/care`) listed only RLS-visible relationships (`caregiver_id = me`).
  Email-addressed pending invites have `caregiver_id` NULL, so Accept/Decline never
  appeared on the Care hub (card lived only on `/care/inbox`). **Fix:** `loadCareIndex`
  calls Worker `GET /api/care/incoming-invites`; `CareIndexScreen` renders
  `IncomingCareInvitesCard`. _Raised 2026-07-13 by burger Account/Care audit._

- [ ] **flutter-today-incoming-care-invites** — Web Today shows `IncomingCareInvitesCard`;
  Flutter Today does not. Care Index + Care Inbox now cover Accept/Decline; Today parity
  still open (P1 discoverability). _Raised 2026-07-13 by burger Care audit._

## Auth / password sign-in (raised 2026-07-12)

- [x] ~~**tf26-password-signin-blank-today**~~ — RESOLVED 2026-07-12 (code; **TF27 upload
  required**): After email/password `signInWithPassword`, `AuthRepository.currentSession`
  was set immediately while `authSessionProvider` could still be `AsyncData(null)` for a
  frame. `authGateStatusProvider` treated that as `signedOut`, so `AuthGate` rendered
  `SizedBox.shrink` on `/today` (looked like sign-in failed). TF26 (`3e405e51`) also
  replaced the Sign in `FilledButton` with `InkWell` over a gradient. **Fix:** gate falls
  back to repo `currentSession`; restore `FilledButton` CTA; do not navigate without a
  session (register confirmation path). Verified: auth/sign-in tests **21/21**, analyze
  clean. Live API password grant for E2E user **200**. **TF26 still broken until TF27.**
  _Raised 2026-07-12 by live-user P0; fixed in `fix/auth-password-signin-tf27`._

- [ ] **auth-old-password-and-forgot-post-tf27** — Distinct from TF27 AuthGate race.
  Live 2026-07-12 re-check: E2E password grant on `auth.purplelife.org` **200**; wrong
  password **400** `invalid_credentials`; `/auth/v1/recover` with
  `org.purplelife.app://reset-password` **200**; redirect allow list includes native
  reset; email hook + cron healthy (`email_send_log` recovery **sent**, queue depth 0).
  Auth users: **21/25** have `encrypted_password`; **4** without are OAuth-only
  (Apple/Google). `import-auth.mjs` never imported Lovable password hashes, so
  pre-migration "old passwords" cannot work. `pmt@eigital.com` has a hash +
  `recovery_sent_at` today, but `@eigital.com` corporate quarantine still blocks
  inbox delivery of `notify.purplelife.org` (Resend delivered, inbox empty). **Ops
  unblock:** Admin API temp password out-of-band; user changes password in Account;
  IT allowlist or non-corporate email for recovery. Copy hint added on Flutter
  forgot-password success (spam/quarantine). Native deep-link E2E still open under
  `auth-reset-native-tf21`. _Raised 2026-07-12 by live-user report after TF27._

## Auth / password reset (raised 2026-07-06)

- [x] ~~**email-pump-pgmq-metrics-broken**~~ — RESOLVED 2026-07-06 (ops): Supabase
  pg_cron job `process-email-queue` failed every minute (~10,080 failures over 7
  days) with `relation "pgmq.metrics" does not exist`. Auth recovery emails
  enqueued via the Send Email hook but sat in `pgmq.q_auth_emails` as
  `email_send_log.status=pending` until manually pumped. **Fix:** rescheduled job
  on live DB (`xxnzmfzsjplrutrgbzxy`) to count `pgmq.q_auth_emails` /
  `pgmq.q_transactional_emails` directly; verified cron run **succeeded** at
  13:52 UTC and auto-sent recovery at 13:53 UTC. Repo:
  `purple-migration/05-cutover/setup-email-pump.sql`,
  `scripts/fix-email-pump-cron.sql`. Cloudflare Worker `server.ts` also pumps
  `/api/email/queue/process` each minute as backup. _Raised 2026-07-06 by email
  reset investigation._

- [x] ~~**auth-reset-pkce-web**~~ — RESOLVED 2026-07-06: Web `/reset-password` showed
  expired/invalid links because recovery emails carry PKCE `?code=` (or legacy
  `#access_token=`) but the page never exchanged the code for a session before
  `updateUser({ password })`. Multiple recovery sends in one session also
  invalidate earlier OTPs (only the latest email works). **Fix (uncommitted WIP):**
  `src/lib/auth-recovery.ts` `bootstrapRecoverySessionFromUrl()` parses errors,
  calls `exchangeCodeForSession`, polls for implicit tokens; `reset-password.tsx`
  bootstraps on mount. **Deploy:** needs `bun run build:prod` + owner-approved
  `wrangler deploy` before prod web serves the fix. Verify: forgot-password from
  `/sign-in` → open **latest** email only → form loads → password update succeeds.
  _Raised 2026-07-06 by auth reset session; resolved in code, deploy pending._

- [x] ~~**pmt-migration-no-password-hash**~~ — RESOLVED 2026-07-06 (ops): `pmt@eigital.com`
  (live-data QA account per `docs/FLUTTER-STAGE1-SIGNOFF.md`) had **no
  `encrypted_password`** after auth import (`purple-migration/import-auth.mjs`
  preserves UUIDs, not password hashes). Could not email/password sign-in until
  ops set a **temporary password via Supabase Admin API**. Password value is **not**
  stored in repo, docs, or agent logs; rotate or retrieve only via Supabase dashboard
  or Admin API with Doppler `SERVICE_ROLE_KEY`. User should change password after
  first sign-in or via recovery email. _Raised 2026-07-06 by auth reset session._

- [ ] **auth-reset-native-tf21** — Native password recovery deep link
  (`org.purplelife.app://reset-password`) **shipped in TestFlight 1.0 (21)** VALID
  2026-07-06 (`auth_deep_link.dart`, `reset_password_screen.dart`, Android intent
  filter, Supabase allow list). **Device verify still pending:** trigger reset from
  Flutter sign-in on iPhone → open email → app opens → reset screen → new password →
  sign-in. `@eigital.com` corporate mail may quarantine recovery emails. See
  `mem/auth-password-reset.md`. _Raised 2026-07-06; code shipped TF21, E2E pending._

## Flutter / TestFlight

- [ ] **tf28-pre-baseline-stuck-screen** — ASC screenshot 2026-07-08
  (`samuel.cortez@eatos.com`): "Stuck on this screen". **P0 candidate** until
  reproduced on **TF27** (or dismissed as pre-TF25 blank/stuck already fixed).
  No ASC submissions dated after TF27 upload (2026-07-12). Screenshot URL in
  `ios:check-tf-feedback` run 2026-07-13 UTC. **Next:** device QA on TF27; if
  still stuck, fix before TF28 upload. _Raised 2026-07-13 TF28 pre-upload
  baseline._

- [ ] **tf28-pre-baseline-share-menus-lag** — ASC screenshot 2026-07-08
  (`samuel.cortez@eatos.com`): lag on selection, menus missing X/cancel, share
  feedback button not working. Treat as **P1/P2** polish (not login/data-loss).
  _Raised 2026-07-13 TF28 pre-upload baseline._

### TF27 live users Devyn / Sam / Jaspreet (raised 2026-07-12)

P0 screenshots on ASC build **1.0 (27)** Today (Merged). Capability-gap explores
(pills/refill audit, sibling TF28 Today P0 search) and the TF28 fix wave share
these ids; do not close until TF28+ device re-verify. Coordinate: do not duplicate
as new ids when logging explore findings, append updates under these entries.

- [ ] **tf27-pills-no-refill** — Meds show **"0 pills left"** / **"Count zero, refill to
  update"**; Taken gated by `outOfStock`. **TF28 WIP (`feat/meds-refill-restore`):**
  `MedRefillSheet` + `MedsRepository.updatePillsRemaining` (`pills_remaining` +
  `updated_at` via queueWrite); dose **Refill to update**, library/detail **Update
  stock**, form **Pills on hand** / **Alert at** (`refill_threshold`). Offline
  optimistic cache fix: `flutter-med-offline-queue-optimistic-drop`. Do **not**
  close until TF28 device re-verify. Cross-links: `tf27-taken-blocked`,
  `meds-pill-stock-amount-vs-count`, `tf27-newdesign-meds-capability-gaps`.
  _Raised 2026-07-12 by live TF27 users Devyn/Sam/Jaspreet._
  _Code restore 2026-07-13._

- [ ] **meds-pill-stock-amount-vs-count** — DB trigger
  `medication_doses_pill_stock` (`supabase/migrations/20260625143701_…sql`)
  decrements `medications.pills_remaining` by `COALESCE(dose.amount, 1)` on Taken.
  When `amount` stores **mg / dosage units** (e.g. Crestor `5`) rather than **pill
  count (1)**, one Taken can subtract 5 and drive stock to a **real 0** quickly,
  which then gates UI via `outOfStock`. Refill write path is still required
  regardless; this is a separate semantic bug. **Next:** confirm live dose
  `amount` units vs pill count; either store amount as pill units for stocked
  meds, or change trigger to decrement by 1 (or a dedicated `pill_units` field).
  Do not silently change trigger without owner + migration. Cross-links:
  `tf27-pills-no-refill`, `tf27-taken-blocked`,
  `meds-pill-stock-trigger-mg-as-pills`.
  _Raised 2026-07-12 by TF28 live-user regression audit._

- [ ] **meds-pill-stock-trigger-mg-as-pills** — Live `pills_remaining=0` can be
  **trigger over-depletion**: dose `amount` in mg is subtracted as if it were
  pill count (`COALESCE(dose.amount, 1)` in `medication_doses_pill_stock`).
  Same root as `meds-pill-stock-amount-vs-count`; tracked separately for TF28
  containment. **Refill UI still required** (`MedRefillSheet` / Today zero-stock
  CTA) so users can recover stock even before trigger semantics are fixed.
  Do not change the DB trigger without owner + migration. Cross-links:
  `tf27-pills-no-refill`, `meds-pill-stock-amount-vs-count`.
  _Raised 2026-07-13 by TF28 compile-restore containment._

- [x] ~~**tf27-stuck-keyboard**~~ — RESOLVED 2026-07-13: Soft keyboard stayed
  visible on Today with no focused field, covering meds. Root: Quick log
  `TextField` (and leftover focus after route change) plus shell
  `resizeToAvoidBottomInset: false` with no unfocus on scroll / tap / panel /
  route. Fix: `native_app_shell.dart` dismiss on drag scroll, scaffold tap,
  route change, menu; Today `_toggleExpand` / `_openMedsPanel` / `_openLogPanel`
  unfocus + scroll `keyboardDismissBehavior.onDrag`. Evidence: `dart analyze`
  clean on shell + Today. Originally: leftover focus from sign-in / Ask Maya /
  journal; TF27 users Devyn/Sam/Jaspreet. _Raised 2026-07-12._

- [ ] **tf27-score-font-wrap** — Today three-up **score tiles** wrap digits vertically
  (Sleep shows "8" over "2", Activity "5" over "8") because fixed ~56px numerals
  overflow the narrow column. Should stay one line ("82", "58", or duration).
  **Next:** FittedBox / smaller `TextStyle` / `maxLines: 1` in
  `flutter/lib/features/shared/score_tile.dart` (partial WIP may already be in
  tree for TF28). _Raised 2026-07-12 by live TF27 users Devyn/Sam/Jaspreet._

- [ ] **tf27-huge-narrative** — **"Today's reading"** AI narrative card
  (`TodayMayaCard` in `today_merged_widgets.dart`) uses large `bodySerif` and
  dominates the phone viewport. Distinct from resolved
  `tf-today-duplicate-narrative` (duplicate render). **Next:** compact body size
  (~14 / regular) without changing copy or removing the card. TF28 wave in
  progress. _Raised 2026-07-12 by live TF27 users Devyn/Sam/Jaspreet._

- [x] ~~**tf27-taken-blocked**~~ — RESOLVED 2026-07-13 (code, TF28 pending):
  Root cause A: `medsForDayProvider` / `medsDataProvider` used
  `authSessionProvider.valueOrNull` only → empty doses after password sign-in
  (Taken never rendered). Fixed via `readActiveSession`. Root cause B: online
  Taken only queued, then `regenerate_today_pending_doses` deleted pending
  before flush. Fixed: `updateDoseStatus` direct Supabase when online. Evidence:
  `meds_session_provider_test.dart` **2/2**. Remaining product choice: Taken when
  `outOfStock` (still gated like web). Cross-links: `tf27-stuck-keyboard`,
  `tf27-pills-no-refill`. _Raised 2026-07-12; fixed 2026-07-13._

- [ ] **tf27-newdesign-today-capability-gaps** — Flutter Merged Today capability
  inventory vs web. **Dropped / missing:** signals filter nulls; score focus /
  ScoreHero → risk; inline `QuickAddWater`; `MissedDoseCatchup`; `MedsMiniTimeline`;
  "More for today" suite (also `flutter-today-more-for-today-removed`). **Present:**
  score row, Maya narrative, dose Taken/Snooze/Skip. Cross-links: `tf27-taken-blocked`,
  `tf27-score-font-wrap`, `tf27-huge-narrative`, `tf27-stuck-keyboard`,
  `flutter-today-more-for-today-removed`. _Raised 2026-07-13 by TF27 newdesign
  capability-gap audit._

- [ ] **tf27-newdesign-meds-capability-gaps** — Flutter Meds ship-risk inventory vs
  web (`src/routes/_app/meds*`, `src/components/meds/*`). Library audit 2026-07-13
  (column is `pills_remaining`, not `remaining_quantity`).
  **Present (core):** add/edit name+kind+strength+times; Active/Archive;
  Taken/Snooze/Skip/reclassify/mark-all; library badges; history; archive/restore;
  drug name search (`MedNameSearch` + local dict); past dose sheet on detail
  and `/meds/history` row tap;
  refill restock (`MedRefillSheet` / detail Update stock / library Update stock
  wired from `meds_screen`). **Write path:** Flutter refill writes
  `medications.pills_remaining` (+ optional `refill_threshold`) via
  `MedsRepository.updatePillsRemaining` / form `updateStock` + offline
  `queueWrite` with `updated_at` (RLS `medications_all_own`). Form sheet now
  edits pills on hand + alert threshold on create/edit (non-rescue).
  **Still missing / stub vs web:** scan/voice (toolbar snackbar); form
  dosage_form / with_food / per-slot amounts / start+end dates / prescriber /
  pharmacy / Rx; side effects log; permanent
  delete archived; export ICS; med-intelligence refill forecast cards; critical
  alarm + reminder sound; openFDA enrich; profile snooze_minutes alarm sheet.
  Cross-links: `tf27-pills-no-refill`, `tf27-taken-blocked`,
  `meds-pill-stock-amount-vs-count`, `flutter-drug-db-enrich-missing`, care
  refill owner-only.
  _Raised 2026-07-13 by TF27 newdesign capability-gap audit._

- [x] ~~**flutter-today-doses-regression**~~ — RESOLVED 2026-07-06 (TF25): inline Taken /
  Snooze / Skip on `TodayMedsSection` for pending doses; shared `MedsPendingDoseActions`
  (44pt targets); `MedLibraryRow` Taken moved outside parent `InkWell`. Verified:
  `flutter test test/meds*.dart test/today_meds_actions_test.dart` **7/7**.
  _Raised 2026-07-06 audit `a198e779`; fixed same day._

- [x] ~~**tf-meds-taken-not-tappable**~~ — RESOLVED 2026-07-06 (TF25): ASC build 24
  `devynrosewalker` could not press Taken on Today (read-only card) or Meds library
  (InkWell swallowed tap). Same commit as `flutter-today-doses-regression`. _Raised
  2026-07-06 ASC; fixed same day._

- [x] ~~**flutter-today-more-for-today-removed**~~ — PARTIAL 2026-07-13: Merged
  preview drops the "More for today" disclosure (always-visible cards). Flutter now
  matches that contract for expanders + secondary cards: icon row (Meds default open),
  flat Meds panel body (no nested GlassCard), Quick log inline composer, Wearables
  expand fail-open SyncStatusBar, team announcement banner → opens Log, missed-dose
  catchup, Last 7 days + Recommended. **Still open / sibling-owned:** rich Last 7
  trend grid vs stub; Hydration expand depth (hydration sibling). _Raised 2026-07-06
  audit `a198e779`; expand panels fixed 2026-07-13._

- [ ] **flutter-oauth-auth-callback** — P0 login blocker for Google/Apple on Flutter native
  (2026-07-06). **Fix shipped** in `4430c13` (native `org.purplelife.app://auth-callback`, web
  origin `/`) on TF24 **`ff263b07`**. Supabase Google + Apple **enabled** on `xxnzmfzsjplrutrgbzxy`.
  **Next:** device QA on TF24; confirm redirect allow list includes native callback + `:8765`.
  _Raised 2026-07-06; fix committed 2026-07-06 serial integrate._

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

- [ ] **flutter-auth-screen-parity** — Partially addressed in TF21: `friendlyAuthError`
  mapping, forgot-password flow, and `?reset=expired` on sign-in are in
  `sign_in_screen.dart` / `reset_password_screen.dart` (tests pass). **Still open:**
  liquid-glass two-panel layout parity vs web `sign-in.tsx` (`GlassCard`/token styling).
  If "Welcome back!" appears, that is Capacitor web (`tf-login-wrong-surface`, resolved);
  not this issue. _Raised 2026-07-06; friendly errors shipped TF21, layout deferred._

- [x] ~~**care-accept-server-route**~~ — RESOLVED (deploy) 2026-07-06: `POST
  /api/care/accept`, `POST /api/care/decline`, and `GET /api/care/incoming-invites`
  deployed to prod via `doppler run --project cursor-cloudflare --config
  prd_cloudlfare -- env CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0 bunx
  wrangler deploy --config wrangler.deploy.jsonc` from `main`/`lovable/redesign` @
  `d31d2a8` (both branches identical at deploy time). **Worker Version ID:
  `07bbab77-f4de-4501-89c0-e22a52e60941`.** First attempt without the
  `CLOUDFLARE_ACCOUNT_ID` override failed the zone-route attach step (Doppler
  resolved the POS account `c7f99ecba0ace852de43684ec8a44612` instead of eigital;
  see `doppler-cloudflare-account-id` below) — script/cron uploaded but
  `www.purplelife.org/*` route did not attach; retried with the override and it
  succeeded (`www.purplelife.org/*`, `purplelife.org/*` both listed). **Verified
  live (curl, no auth):** `POST /api/care/accept` → **401** `{"error":"Unauthorized"}`;
  `POST /api/care/decline` → **401** `{"error":"Unauthorized"}`; `GET
  /api/care/incoming-invites` → **401** `{"error":"Unauthorized"}` (all real route
  hits, not the 404 catch-all — confirmed by a control request to a nonexistent
  `/api/care/*` path returning 404). Homepage and `/sign-in` both **200** post-deploy
  (no regression). Gates before deploy: `check:em-dash` PASS, `bun run build:prod`
  PASS. **Note:** an unrelated, incomplete WIP batch (new `src/routes/api/care/
  {today,meds,journal,seizures,reports}.ts` + a `src/lib/care.server.ts` docblock
  update) was found uncommitted in the working tree at task start; those files
  import `caregiverReadTodayForUser`/`CareApiError`/etc. from `care.server.ts`
  that **do not exist yet** and would have failed typecheck. They were **stashed**
  (`git stash`, message "wip: caregiver dashboard backlog routes...") before the
  build/deploy so only the already-verified accept/decline/incoming-invites code
  shipped. **Left in `git stash@{1}`, intentionally not popped back:** partway
  through this task a concurrent agent session was found actively writing to
  the same checkout, already re-doing/extending this exact backlog (new
  Flutter chat/reports files, `ai-insights.server.ts`, `/api/ai/*` routes,
  dependency file changes) — popping the older stash into that live dirty tree
  risked a collision on the same filenames
  (`src/routes/api/care/{today,meds,journal,seizures,reports}.ts`,
  `care.server.ts`, `insights_widgets.dart`). The stashed functions use the
  same names cited in the "Extended 2026-07-05 (Wave-2 fleet)" backlog below
  (`caregiverReadToday`, `caregiverReadMeds`, `caregiverReadJournal`,
  `caregiverReadSeizures`, `caregiverReadReports`). Whoever owns the concurrent
  work should `git stash show -p stash@{1}` to check for anything worth
  merging, then `git stash drop stash@{1}` once reconciled.
  _Raised 2026-07-05 by Wave-1 care/reports agent; deploy closed 2026-07-06 by
  ops deploy agent._

- [ ] **care-accept-server-route** (original entry, superseded by the resolved entry
  above) — Caregiver-invite **accept and decline** need a
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
     - ~~`caregiverReadToday`~~ — Worker `POST /api/care/today` landed
     - ~~`caregiverReadMeds`~~ — Worker `POST /api/care/meds` landed
     - `caregiverMarkDose` (L1414) — **still open** (Flutter Taken for caregivers)
     - ~~`caregiverReadJournal`~~ — Worker `POST /api/care/journal` landed
     - `proposeChange` (L978)
     - ~~`caregiverReadSeizures`~~ — Worker `POST /api/care/seizures` landed
     - `caregiverLogSeizure` (L1469)
     - ~~`caregiverReadReports`~~ — Worker `POST /api/care/reports` landed
     - ~~`caregiverReadReport`~~ — Worker `POST /api/care/report` landed (+ `phi_access_log`)
     - `listHydrationForDay`
     - `getOrCreateDirectThread` (also unblocks caregiver-initiated care chat, see
       2026-07-05 care-chat HANDOFF entry).
  3. **Insights / reports AI (blocks AI cards on `/insights` and report summaries;
     Flutter currently shows honest server-only gap-states):**
     - `getVitalsSnapshot` — still open, no Worker route.
     - `computeUserPatterns` — still open, no Worker route.
     - `getDailyInsightCards` — **Worker route added** 2026-07-06
       (`POST /api/ai/daily-insight-cards`, `src/lib/ai-insights.server.ts`),
       **Flutter client not wired yet**, **not added to
       `flutter-api-cors.ts`**, **not deployed**. Not resolved until all
       three are done.
     - `summarizeReport` — **Worker route added** 2026-07-06
       (`POST /api/ai/summarize-report`), same caveats as above.
     - `getMetricInsight` — **Worker route added** 2026-07-06
       (`POST /api/ai/metric-insight`), same caveats as above.

  _Extended 2026-07-05 by Wave-2 docs agent (orchestrated fleet). Worker
  routes for the three AI fns above landed 2026-07-06 (tsc-only slice, see
  HANDOFF); Flutter wiring + CORS allow-list + deploy are the remaining
  steps before this bullet can be marked resolved._

- [ ] **tf-settings-shell-nav** — Tester ASC feedback (2026-07-05 15:41 ET, build 17/18): wants
  settings/shell burger **left of Purple logo**, menu slide **left to right** (not right
  `endDrawer`), more connections visible. Conflicts with current AGENTS.md right-drawer rule;
  needs product decision then Flutter shell work. _Raised 2026-07-05 ASC after TF18._

  **Update 2026-07-05 (Flutter P0 closure pass): still NOT implemented, intentionally.**
  AGENTS.md hard-mandates a right-edge `Scaffold.endDrawer` for the shell burger menu
  ("**not** a SnackBar, left drawer, or floating popover"); this issue's ask is the exact
  opposite (left-of-logo burger, left-to-right slide). Changing it unilaterally would
  contradict a standing, explicitly documented workspace convention. **Needs an explicit
  product/owner decision** on which convention wins (tester preference vs. the documented
  right-drawer standard) before any Flutter shell change lands. `native_app_shell.dart` /
  `shell_menu_sheet.dart` untouched this pass; only unrelated bottom-padding (`tf-bottom-
  whitespace`) and typography (`tf-heading-typography`) fixes landed in the shell/screen
  files. _Re-affirmed 2026-07-05 by Flutter P0 closure pass; still blocked on owner call._

- [ ] **tf-heading-typography** — Tester ASC feedback (2026-07-05 15:41 ET): section heading too
  long, too large vs web. Identify screen(s) from screenshot; match web type scale from
  `design/tokens.json`. _Raised 2026-07-05 ASC after TF18._

  **Update 2026-07-05 (Flutter P0 closure pass): fixed for Settings, the most likely
  screenshot target.** `settings_screen.dart`'s hero heading ("All in your\ncontrol.") used
  `textTheme.displaySmall` with no explicit `fontSize` override, unlike every sibling
  marketing-hero screen (Vitals, My Health, Meds, Hydration, Reports), which all pin
  `displaySmall` to an explicit `fontSize: 44` matching web's mobile hero scale
  (`text-[44px]` in `settings.tsx`). Settings is structurally a **hub landing screen**
  (hub cards below the heading, same role as `/tools`), not a single-metric feature hero,
  so instead of adding the missing `fontSize: 44` (which would make it bigger, not
  smaller), changed the token to `headlineMedium` (28px) — the app's established compact
  section-heading scale already used by `sign_in_screen.dart` ("Purple"),
  `care_dashboard_screen.dart`, `care_report_screen.dart`, and `empty_state.dart`. Kept the
  serif font family and copy unchanged (only the size token moved). **Not independently
  visually re-verified against a live tester screenshot** (the original ASC feedback had no
  attached screenshot identifying the exact screen); `flutter-web-serve.sh` preview at
  `:8765` requires a signed-in session which was not available this pass, so this is a
  code-level fix based on cross-screen convention audit, not a pixel-diff confirmation.
  Re-open or adjust further if the next TestFlight round shows this was the wrong screen or
  the new size still reads large. _Partially resolved 2026-07-05 by Flutter P0 closure pass._

- [ ] **tf-bottom-whitespace** — Tester ASC feedback (2026-07-05 15:40 ET, recurring): excess
  whitespace above bottom nav on multiple tabs. Likely safe-area / shell padding; compare web
  `_app` layout. _Raised 2026-07-05 ASC after TF18._

  **Update 2026-07-05 (Flutter P0 closure pass): root-caused and fixed for Today, Vitals,
  Tools.** `NativeAppShell` (`native_app_shell.dart`) wraps every shell-routed screen's body
  in `Padding(bottom: shellTabBarInset(context))` (~90-114px: nav bar height + FAB overflow +
  device safe-area) so content never renders behind the floating glass nav bar. On top of
  that, `today_screen.dart`, `vitals_screen.dart`, and `tools_screen.dart` each had their own
  `SingleChildScrollView`/`Padding` bottom padding hardcoded to **120-128px**, stacking
  additively with the shell's own inset for a combined ~210-240px of dead space above the
  nav bar on every scroll state (loading, data, error). Reduced each screen's own bottom
  padding to **32px** (a small breathing-room buffer only, not a second copy of the nav-bar
  height) across all three files' loading/data/error branches; `native_app_shell.dart`'s
  `shellTabBarInset` itself was left unchanged since it is the single correct source of the
  nav-bar clearance and is not itself excessive. **Not audited this pass:** `meds_screen.dart`
  line ~346 has a different, likely also-excessive pattern (`shellTabBarInset(context) + 12`,
  which double-counts the shell's own inset) — out of this pass's named scope (Today/Vitals/
  Tools only); flag for a follow-up sweep of the remaining shell-routed screens
  (Meds, My Health, Reports, Insights, Timeline, Biometrics, Hydration, Care) for the same
  additive-padding bug. _Partially resolved 2026-07-05 by Flutter P0 closure pass (Today/
  Vitals/Tools only; other tabs still open)._

- [x] ~~**tf-today-duplicate-narrative**~~ — RESOLVED 2026-07-06: ASC screenshot feedback
  **×3** from `a@arora.net` (14:32, 18:03, 18:19 ET): AI narrative rendered twice on Today
  (lede under greeting + glass `NarrativeBlock` after scores). Feedback was visible via
  `ios:check-tf-feedback` but not fixed until this pass (triage logged themes only). **Fix:**
  show narrative once in `NarrativeBlock` only; lede uses condition prompt when no narrative.
  Same fix in web `today.tsx`. **TestFlight 1.0 (22)** ships the Flutter fix. _Raised
  2026-07-06 ASC; resolved 2026-07-06._

- [ ] **flutter-web-cutover-impl** — Runbook at `docs/FLUTTER-WEB-CUTOVER.md` (plan only).
  Needs `merge-flutter-web-assets.sh`, `src/server.ts` path dispatch, staging smoke, owner
  approval before prod. Build: `./scripts/flutter-web-build-prod.sh`. _Raised 2026-07-05._

- [ ] **tf-synced-data-visibility** — Tester ASC feedback (2026-07-05): "how do i see all my
  synched data?" **Partially improved 2026-07-05:** Flutter `/my-health`, `/vitals`, and `/tools`
  now show shared **All synced data (90 days)** panel with per-provider day counts, last sync
  relative time, and link chips to Vitals / My Body / Biometrics / Tools. Biometrics hub depth
  and bottom-nav My Body label still open for TF17+ re-verify. _Raised 2026-07-05 cutover audit._

- [ ] **tf-oauth-not-working** — Tester ASC feedback (2026-07-05): "why is this not workibg"
  (Tools). Oura native redirect **registered** 2026-07-06. Remaining: Whoop console URI
  (`whoop-native-redirect-console`) or expired Oura/Whoop tokens (Disconnect + Connect).
  Visit-mode Oura/Whoop sync restored 2026-07-13 (`flutter-wearable-visit-sync-missing`).
  Device verify on next TF. _Raised 2026-07-05 cutover audit; updated 2026-07-13._

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

- [x] ~~**oura-native-redirect-console**~~ — **RESOLVED 2026-07-06 (Oura):** Owner registered
  `org.purplelife.app://oauth-oura-callback` in Oura Cloud. Agent verified: authorize URL returns
  **302** to Oura login (registered URI); unregistered URI returns **400 invalid_request**.
  Flutter `wearable_oauth_test.dart` **PASS**. Whoop URI tracked separately as
  `whoop-native-redirect-console`. _Raised 2026-07-05._

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

## Design / product (raised 2026-07-06)

- [ ] **superpower-design-parity** — Superpower-inspired multi-screen preview with **three layout modes**
  (Classic / Expanded / Merged) at `docs/previews/personalized-dashboard-preview.html` served on
  http://127.0.0.1:8766. AI persona **Ask Maya** (app name Purple). **Status (2026-07-06 TF23 fleet):**
  Merged layout **approved** in preview; **production Partial** — Flutter + TanStack now ship Merged
  5-tab shell, `/data`, `/plan`, `/ask-maya`, dual-score Today hero, Data summary bar, theme-aware
  Settings/Account, metric dated readings (~68% weighted Merged parity per
  `docs/FLUTTER-CUTOVER-GAP-MATRIX.md`). **Still P1:** Recommended trait grid depth, lab order modal,
  light-mode purple accent pass on all routes, chat history attachments. **Do not build:** generic
  marketplace, bio age (no schema field). _Raised 2026-07-06; TF23 fleet integrate 2026-07-06._

- [ ] **lab-ordering-mvp** — Lab ordering preview + spec only (no prod integration).
  Preview: Recommended hero "Order blood panel", 3-step modal (panel / collection /
  Stripe placeholder), Data tab empty state when labs unchecked. Spec:
  `docs/previews/LAB-ORDERING-SPEC.md`. **MVP recommendation: Phase 1** concierge or
  partner deep link + existing upload ingest; **Phase 2** in-app Stripe + Quest/Labcorp
  API. **Blockers (owner):** lab partner choice, Stripe lab SKUs, provider-of-record,
  legal review, US state kit availability. _Raised 2026-07-06 by lab ordering preview
  session._

## Web / Lovable

- [ ] **lovable-redesign-merge** — `lovable/redesign` branch has large Flutter overnight
  work; merge to `main` requires full gate pass and explicit deploy approval. _Raised
  2026-07-04 by redesign workflow._

- [ ] **manual-prod-deploy** — Production deploy is `workflow_dispatch` only during
  redesign; push to `main` does not auto-deploy. _Raised 2026-07-04 by workflow._

## Infrastructure

- [ ] **doppler-cloudflare-account-id** — Doppler `CLOUDFLARE_ACCOUNT_ID` may point at POS
  account; override with eigital `08e766e92db74bc7ef14c6b5c86bddf0` on wrangler deploy.
  _Raised 2026-07-04 by ship agent._ **Reconfirmed 2026-07-06:** deploying the
  `care-accept-server-route` fix without the override deployed the Worker script and
  cron triggers fine but failed the `www.purplelife.org/*` zone-route attach step
  (`POST .../accounts/c7f99ecba0ace852de43684ec8a44612/workers/scripts/purplelife/routes`
  errored); retrying with `CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0`
  fixed it immediately. Doppler value itself was not changed (no write access
  needed for the fix); every `wrangler deploy` invocation still needs the explicit
  env override until Doppler's stored value is corrected at the source.

- [ ] **remote-push-apns-fcm** — Native remote push needs APNs/FCM secrets in Doppler/Worker.
  Local med reminders work natively. _Raised 2026-07-04 by native-app docs._

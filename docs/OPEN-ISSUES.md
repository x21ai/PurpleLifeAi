# OPEN ISSUES

Known problems, blockers, and deferred work. Add issues as they arise. Mark resolved
with strikethrough and date; do not delete.

Format:

- [ ] **`<id>`** — description. _Raised YYYY-MM-DD by \<who\>._
- [x] ~~**`<id>`**~~ — RESOLVED YYYY-MM-DD: how.

---

## Flutter / TestFlight

- [x] ~~**tf-settings-design**~~ — RESOLVED 2026-07-05: Flutter `/settings` renders full scroll
  parity with web (Preferences, AI provider, What I track, Health history, Data, Help, About,
  Admin inline sections with wired Supabase fields). Verified on `:8765` accessibility tree +
  `settings_screen_scroll_test.dart`. Needs TF16+ upload for tester re-check.
  _Raised 2026-07-05 from ASC beta feedback._

- [ ] **tf-crash-report** — Tester reported "App is crashing" (2026-07-04 screenshot feedback);
  ASC crash submissions API shows 0 crash logs. **Luciq Flutter SDK wired 2026-07-05**
  (`luciq_flutter`, Doppler `LUCIQ_APP_TOKEN` dart-define on TestFlight builds). After TF16+
  upload, agents run `bun run ios:check-tf-feedback` and check Luciq dashboard **Flutter -
  Purple - Beta** → Crashes.
  _Raised 2026-07-05 from ASC beta feedback._

- [x] ~~**tf-sync-bar-every-page**~~ — RESOLVED 2026-07-05: Removed `SyncStatusBar` from Meds and
  Vitals; kept on Today (+ Tools integrations cards). Sync button labels name providers.

- [x] ~~**tf-sync-time-labels**~~ — RESOLVED 2026-07-05: Sync bar shows provider names while syncing,
  last sync relative + clock time, local timezone conversion.

- [x] ~~**tf-timezone-city-label**~~ — RESOLVED 2026-07-05: Account timezone picker shows city labels
  (e.g. New York) via `timezoneLabel()` instead of raw IANA strings only.

- [ ] **flutter-phase5-nogo** — Phase 5 cutover NO-GO: Vitals My Body depth, Tools 90d
  wearable stats, symptom radar data gaps, Worker-only Settings (export/2FA/avatar),
  journal voice/photo native capture, full reports upload. _Raised 2026-07-05 by verify fleet._

- [ ] **oura-native-redirect-console** — Native Oura connect may fail until
  `org.purplelife.app://oauth-oura-callback` is registered in Oura developer console
  (in addition to prod web callback). Inline Tools error should show hint. _Raised 2026-07-05
  by OAuth fleet._

- [ ] **tf15-device-verify** — Apple Health Connect + Sync and Settings scroll sections
  need confirmation on physical iPhone with **TestFlight 1.0 (15)** (agent cannot run
  HealthKit in CI). _Raised 2026-07-05 by morning status._

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

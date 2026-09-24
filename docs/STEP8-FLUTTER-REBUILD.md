# Step 8: Flutter iOS + Android rebuild (Cloudflare-backed www)

**Repo:** [x21ai/PurpleLifeAi](https://github.com/x21ai/PurpleLifeAi)  
**Status:** Runbook + build scripts ready. **No www design flip.**  
**www track:** Owner GO for Ploy www received **2026-09-24**. Merge [PR #47](https://github.com/x21ai/PurpleLifeAi/pull/47) then operator-deploy per `docs/DEPLOY-WWW-PLOY.md`. Step 8 native rebuilds remain independent of that flip.

## Goal

Rebuild and ship the **Flutter native** app (`flutter/`, bundle `org.purplelife.app`) against the **existing** Cloudflare Worker at `https://www.purplelife.org/api`. Marketing UI on www may stay TanStack (or later Ploy); **native store binaries are independent** of the www design flip.

| Surface | Step 8 scope | Held (not Step 8) |
|---------|--------------|-------------------|
| iOS TestFlight / App Store | Rebuild Flutter IPA, upload ASC | — |
| Android internal testing | Build signed AAB (Play upload manual until automation) | — |
| `www.purplelife.org` marketing UI | Unchanged | PR #47 Ploy hybrid entry |
| Worker `/api/*` | Unchanged host; accepts Supabase JWT from Flutter | `DATA_BACKEND=cloudflare` web cutover is separate |

## Architecture (native client)

```
Flutter (iOS/Android)
  ├─ Auth/session     → Supabase Auth @ https://auth.purplelife.org (PKCE + secure storage)
  ├─ Direct data      → Supabase PostgREST (meds doses, journal, vitals RLS) + Drift offline cache
  └─ Worker API       → https://www.purplelife.org/api/*  (Bearer = Supabase access token)
        unified-auth-middleware accepts Supabase JWT (and Workers JWT on cloudflare web path)
```

Flutter does **not** read `DATA_BACKEND` or `VITE_DATA_BACKEND`. Those flags affect the **TanStack web** build only. Native rebuilds stay valid while www runs Supabase or Cloudflare data backend, as long as Worker routes and Supabase Auth remain live.

## Mobile app inventory

### Bundle / application IDs

| Platform | ID | Config path |
|----------|-----|-------------|
| iOS | `org.purplelife.app` | `flutter/ios/Runner.xcodeproj`, `flutter/ios/Runner/Info.plist` |
| Android | `org.purplelife.app` | `flutter/android/app/build.gradle.kts` (`applicationId`) |
| macOS (optional) | `org.purplelife.app` | `flutter/macos/Runner/Configs/AppInfo.xcconfig` |
| Legacy Capacitor (rollback only) | `org.purplelife.app` | `ios/App/`, `android/app/` — **not** Step 8 primary path |

**Display name:** Info.plist `CFBundleDisplayName` = "Purple App" (store listing: **Purple for Life**).

### Version / build number

| Field | Source | Current (2026-09-20) |
|-------|--------|----------------------|
| Marketing version | `flutter/pubspec.yaml` before `+` | `1.0.0` |
| Build number (iOS CFBundleVersion, Android versionCode) | `flutter/pubspec.yaml` after `+` | `28` |
| iOS archive name override | `scripts/flutter-ios-testflight.sh` | `--build-name=1.0.0` |

Bump **`+N`** in `pubspec.yaml` before each ASC upload; N must exceed the latest **VALID** build on App Store Connect.

### Dart-defines (compile-time)

Defined in `flutter/lib/core/config/app_config.dart`. Injected by `scripts/lib/flutter-dart-defines.sh` (shared across iOS, Android, Flutter web prod).

| Define | Required | Default (if omitted) | Doppler source |
|--------|----------|----------------------|----------------|
| `SUPABASE_ANON_KEY` | **Yes** (runtime throw) | — | `cursor-cloudflare` / `prd_cloudlfare` → `VITE_SUPABASE_PUBLISHABLE_KEY` |
| `SUPABASE_URL` | No | `https://auth.purplelife.org` | Hardcoded in `AppConfig` |
| `SITE_URL` | No | `https://www.purplelife.org` | Script (local web preview uses `http://127.0.0.1:8765`) |
| `WORKER_API_BASE_URL` | No | `https://www.purplelife.org/api` | Script (`SITE_URL` + `/api`) |
| `BUILD_DATE` | Yes in release scripts | ISO8601 UTC | `scripts/app-build-env.sh` |
| `LUCIQ_APP_TOKEN` | No (iOS TestFlight only) | empty | `x21` / `prd` → `PURPLE_LIFE_LUCIQ_APP_TOKEN` |

**Staging overrides** (optional, not prod Step 8):

```bash
export FLUTTER_SITE_URL=https://purplelife-staging.example.com
export FLUTTER_WORKER_API_BASE_URL=https://purplelife-staging.example.com/api
```

### WORKER_API_BASE_URL — routes Flutter calls

Base URL must **not** include a trailing slash. Paths are appended in `WorkerClient` (`flutter/lib/core/api/worker_client.dart`).

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/health/native-sync` | HealthKit / Health Connect batch ingest |
| GET | `/health/whoop-config` | Whoop OAuth client id (public) |
| POST | `/health/whoop-exchange` | Whoop OAuth code exchange |
| POST | `/health/whoop-sync` | Whoop incremental sync |
| POST | `/chat` | Ask Purple / Maya streaming AI |
| POST | `/account/personal-share-code` | Account invite code |
| POST | `/ai/daily-insight-cards` | Insights "For you" cards |
| POST | `/ai/metric-insight` | Metric trend AI |
| POST | `/ai/summarize-report` | Report plain-English summary |
| POST | `/care/today`, `/care/meds`, `/care/journal`, `/care/seizures`, `/care/reports`, `/care/report` | Caregiver read APIs |
| POST | `/care/accept`, `/care/decline`, `/care/incoming-invites` | Care invites (`care_repository.dart`) |

**Not** on Worker (use Supabase client / edge instead):

- Med dose Taken / Skip / Snooze (own user) → Supabase RLS + offline queue
- Oura sync cron → Supabase edge or Worker cron (not Flutter-direct)
- `POST /api/med-dose-action` → 404 by design (notification actions only)

Contract tests: `flutter/test/worker_client_test.dart`.

### Deep links (native URL scheme)

Scheme: **`org.purplelife.app`** (same as bundle id).

| URI | Flow | Registered |
|-----|------|------------|
| `org.purplelife.app://auth-callback` | Google / Apple OAuth return | iOS `CFBundleURLTypes`, Android intent-filter |
| `org.purplelife.app://reset-password` | Password recovery | iOS + Android |
| `org.purplelife.app://oauth-oura-callback` | Oura wearable OAuth | iOS + Android |
| `org.purplelife.app://oauth-whoop-callback` | Whoop wearable OAuth | iOS + Android |

**iOS:** `FlutterDeepLinkingEnabled` = **false** in `Info.plist` so `app_links` receives wearable callbacks before the Flutter engine.

**Supabase Auth redirect allow list** must include all four URIs on project `xxnzmfzsjplrutrgbzxy` (custom domain `auth.purplelife.org`).

**Third-party consoles (owner manual):**

- Oura Cloud: register `org.purplelife.app://oauth-oura-callback`
- Whoop Developer: register `org.purplelife.app://oauth-whoop-callback`

Runbooks: `docs/native-oauth-setup.md`, `mem/native-wearable-oauth-redirects.md`.

### Store records and notes

#### Apple (ready for TestFlight)

| Field | Value |
|-------|--------|
| App Store Connect name | **Purple for Life** |
| ASC Apple ID | `6787298041` |
| Bundle ID | `org.purplelife.app` |
| Team ID | `C3HY4MF66F` (ideaTree Inc.) |
| Latest known VALID build | **1.0 (28)** Founding Team (2026-07-13) |
| Upload command | `bun run ios:testflight` → `scripts/flutter-ios-testflight.sh` |
| Export | `flutter/ios/ExportOptions.plist` (`app-store-connect`, automatic signing) |
| Crash reporting | Luciq (`luciq_flutter` + native SDK); token via `--dart-define=LUCIQ_APP_TOKEN` |

Full runbook: `docs/testflight-setup.md`, `docs/FLUTTER-TESTFLIGHT-CUTOVER.md`.

#### Google Play (not ready)

| Field | Status |
|-------|--------|
| Play Console app for `org.purplelife.app` | **Not created** (agent/CI cannot create first listing) |
| Release signing | **Debug keystore only** (`build.gradle.kts` Release → `signingConfigs.debug`) |
| Upload keystore / Play App Signing | **Not configured** |
| Play Developer API service account | **Not configured** |
| Target artifact | AAB (`flutter build appbundle --release`) |
| Health Connect | Permissions declared; policy form + Play review required |

Target automation plan: `docs/templates/play-store-automation-plan.md`.

## Rebuild commands

### Prerequisites (all platforms)

```bash
cd flutter && flutter pub get
flutter analyze lib/
flutter test
```

Doppler access:

- **`cursor-cloudflare` / `prd_cloudlfare`** — `VITE_SUPABASE_PUBLISHABLE_KEY` (Flutter anon key)
- **`x21` / `prd`** — iOS ASC + team + Luciq (`PURPLE_LIFE_*`)

### iOS (TestFlight)

**Requires:** macOS with **full Xcode.app** (Command Line Tools alone cannot archive or sign).

```bash
# From repo root
bun run ios:check-asc          # verify x21/prd ASC secrets
bun run ios:testflight         # analyze, test, build, archive, upload
```

Pipeline (`scripts/flutter-ios-testflight.sh`):

1. `flutter analyze lib/` + `flutter test`
2. `bun run ios:local-signing` → `ios/LocalSigning.xcconfig`
3. `flutter build ios --release --no-codesign` with shared dart-defines (incl. `WORKER_API_BASE_URL`)
4. `xcodebuild archive` + `-exportArchive` to App Store Connect

Post-upload (mandatory): `bun run ios:check-asc-builds`, `bun run ios:check-tf-feedback`, Luciq MCP triage. Rule: `.cursor/rules/flutter-testflight-observability.mdc`.

**Capacitor rollback (deprecated):** `bun run ios:testflight:capacitor` loads prod www in WebView — do not use for Step 8.

### Android (release AAB)

**No Play upload automation yet.** Builds locally for QA or manual Console upload.

```bash
./scripts/flutter-android-release.sh          # AAB only
./scripts/flutter-android-release.sh --apk    # AAB + sideload APK
```

Output:

- `flutter/build/app/outputs/bundle/release/app-release.aab`
- `flutter/build/app/outputs/flutter-apk/app-release.apk` (with `--apk`)

Until upload keystore is configured, the AAB is signed with the **debug** key (Play Console will reject or require reset). Fix signing before first Play upload (see blockers below).

### Local device QA (no store upload)

```bash
# iOS USB device
bun run ios:device-build    # Capacitor path; for Flutter use:
cd flutter && doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  flutter run -d <device_id> --release \
  --dart-define=SUPABASE_ANON_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY" \
  --dart-define=WORKER_API_BASE_URL=https://www.purplelife.org/api

# Android emulator / USB
cd flutter && doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  flutter run -d android --release \
  --dart-define=SUPABASE_ANON_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY"
```

Flutter web preview (not store): `./scripts/flutter-web-serve.sh --rebuild` → http://localhost:8765

## Verification gates (Step 8 GO)

Run before claiming a rebuild ready for testers:

| Gate | Command / check |
|------|-----------------|
| Static analysis | `cd flutter && flutter analyze lib/` |
| Unit/widget tests | `cd flutter && flutter test` |
| Worker URL contract | `cd flutter && flutter test test/worker_client_test.dart` |
| iOS secrets | `bun run ios:check-asc` |
| Sign-in + session | Device: email/password or OAuth → Today loads |
| Worker health | Tools → Whoop config loads; native health sync POST succeeds |
| Wearable OAuth | Oura/Whoop connect completes via deep link (after console URIs registered) |
| Offline | Airplane mode: cached Today/meds readable; queue drains on reconnect |
| ASC post-upload | Build VALID; Luciq + ASC feedback triaged |

**Explicitly out of scope for Step 8 GO:**

- www Ploy/TanStack design flip (PR #47)
- `wrangler deploy` with `wrangler.deploy.ploy.jsonc`
- Flutter web merge into `dist/client` (`docs/FLUTTER-WEB-CUTOVER.md`)

## Signing blockers

### Apple (TestFlight)

| Blocker | Severity | Resolution |
|---------|----------|------------|
| Full **Xcode.app** missing (CLT only) | **P0** | Install Xcode from App Store; `xcode-select -s /Applications/Xcode.app` |
| Doppler `x21/prd` ASC API key missing | **P0** | Add `PURPLE_LIFE_APP_STORE_CONNECT_KEY_ID`, `_ISSUER_ID`, `_API_KEY` (.p8 PEM) |
| `PURPLE_LIFE_DEVELOPMENT_TEAM` missing | **P0** | Set team `C3HY4MF66F` in Doppler; run `bun run ios:local-signing` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` missing | **P0** | Doppler `cursor-cloudflare/prd_cloudlfare` |
| Build number ≤ latest ASC VALID | **P0** | Bump `pubspec.yaml` `+N` |
| Apple Developer Program membership / agreements | **P0** | Owner: ASC → Agreements, Tax, Banking |
| Provisioning / cert expiry | **P1** | Automatic signing + `-allowProvisioningUpdates` (script default) |
| Luciq token missing | **P2** | Ship without crash SDK or add `PURPLE_LIFE_LUCIQ_APP_TOKEN` |
| Oura/Whoop redirect not in vendor console | **P1** (feature) | Owner registers native redirect URIs |
| Xcode beta without Simulator.app | **P2** (CI QA) | Use physical device or full Xcode install |

### Google Play

| Blocker | Severity | Resolution |
|---------|----------|------------|
| **No Play Console app** for `org.purplelife.app` | **P0** | Owner: create app in Play Console ($25 dev account) |
| Release signed with **debug keystore** | **P0** | Generate upload keystore; implement `scripts/android-write-signing.sh`; wire Gradle Release config |
| Play App Signing not enrolled | **P0** | Enable in Console → Release → Setup → App signing |
| No Play Developer API service account | **P0** | GCP service account + JSON key; grant Release manager in Console |
| Secrets not in Doppler | **P0** | Store base64 keystore + passwords (never commit); see play-store template |
| No `bun run android:play-upload` script | **P1** | Implement fastlane supply or GitHub Action per template |
| Health Connect sensitive permissions | **P1** | Complete Play policy declaration + demo video if requested |
| FCM remote push (optional) | **P2** | `google-services.json` + Worker APNs/FCM secrets |

## Cloudflare www context (read-only for Step 8)

Step 8 assumes **production Worker host unchanged**:

- API base: `https://www.purplelife.org/api`
- Auth: `https://auth.purplelife.org` (Supabase custom domain)
- Web `DATA_BACKEND=cloudflare` cutover (`docs/CLOUDFLARE-MIGRATION.md`) does not require a new Flutter dart-define; Worker middleware accepts existing Supabase JWTs.

Do **not** deploy www Ploy as part of Step 8. Native apps do not load www HTML; they only call `/api/*` and Supabase.

Merge order (www track, separate from Step 8): trunk CI green → #45 → #44 → #47 (owner GO 2026-09-24) → operator deploy `docs/DEPLOY-WWW-PLOY.md`.

## Related docs

| Doc | Topic |
|-----|--------|
| `docs/testflight-setup.md` | iOS upload, Luciq, ASC |
| `docs/FLUTTER-TESTFLIGHT-CUTOVER.md` | Capacitor → Flutter native cutover |
| `docs/templates/play-store-automation-plan.md` | Android signing + Play API target |
| `docs/native-oauth-setup.md` | Deep link + Supabase redirect setup |
| `docs/android-health-connect-setup.md` | Health Connect permissions |
| `docs/CLOUDFLARE-MIGRATION.md` | Web data backend (orthogonal to native) |
| `mem/doppler-purple-life.md` | iOS secret locations |
| `flutter/README.md` | Local dev commands |

## Scripts reference

| Script | Purpose |
|--------|---------|
| `scripts/lib/flutter-dart-defines.sh` | Shared `--dart-define` flags (incl. `WORKER_API_BASE_URL`) |
| `scripts/flutter-ios-testflight.sh` | iOS archive + ASC upload |
| `scripts/flutter-android-release.sh` | Android AAB (+ optional APK) |
| `scripts/flutter-web-build-prod.sh` | Flutter web prod build (Phase 5 web, not Step 8 store) |
| `scripts/app-build-env.sh` | `BUILD_DATE`, version from pubspec |

# Flutter TestFlight cutover (Phase 5, Stage 5)

**Status:** Flutter **1.0 (11)** VALID on TestFlight (2026-07-04 evening)  
**Goal:** Ship `org.purplelife.app` to TestFlight as a **Flutter native binary**, replacing the Capacitor WebView shell on the **same** App Store Connect app record.

**Related:** [`testflight-setup.md`](testflight-setup.md), [`LOVABLE-FLUTTER-SYNC.md`](LOVABLE-FLUTTER-SYNC.md), [`FLUTTER-WEB-CUTOVER.md`](FLUTTER-WEB-CUTOVER.md) (prod web, plan only), [`features/PHASE5_CUTOVER_ORCHESTRATOR.md`](features/PHASE5_CUTOVER_ORCHESTRATOR.md), [`flutter/README.md`](../flutter/README.md)

**Hard rules:** Same bundle ID (`org.purplelife.app`), same ASC app (`6787298041`). Capacitor `ios/` stays for rollback until Stage 6.

## How Flutter IPA replaces Capacitor on ASC

ASC keys on bundle ID, not framework. Upload Flutter IPA with a **new build number** (`flutter/pubspec.yaml` `version: 1.0.0+N`). Testers get bundled Dart UI, not WebView → `www.purplelife.org`.

| Before (Capacitor) | After (Flutter) |
|--------------------|-----------------|
| UI from prod web on launch | UI in IPA |
| Web deploy updates app instantly | Store build for UI changes |
| HealthKit via Capgo JS | HealthKit via Flutter `health` plugin |

**Luciq:** Crash reporting wired in `flutter/ios/Runner` (SPM `luciq-ios-sdk`, deferred init in `AppDelegate.swift`).

## Script: `scripts/flutter-ios-testflight.sh`

Wired as primary TestFlight path:

```bash
DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer bun run ios:testflight
# Capacitor emergency rollback:
bun run ios:testflight:capacitor
```

Pipeline:

1. `flutter analyze lib/` + `flutter test`
2. `bash scripts/check-asc-doppler.sh` + `node scripts/asc-ensure-app.mjs`
3. `flutter pub get`; `flutter config --no-enable-swift-package-manager` (CocoaPods path for mixed plugins)
4. `flutter build ios --release --no-codesign` with Doppler dart-defines (`SUPABASE_ANON_KEY` from `cursor-cloudflare/prd_cloudlfare`)
5. `xcodebuild archive` on `flutter/ios/Runner.xcworkspace` with ASC API key auth and `-derivedDataPath /tmp/purpledrw-flutter-dd` (avoids DerivedData I/O errors under iCloud Desktop)
6. `xcodebuild -exportArchive` with `flutter/ios/ExportOptions.plist` (upload to ASC)

Supporting files:

| File | Purpose |
|------|---------|
| `flutter/ios/ExportOptions.plist` | ASC upload (`destination=upload`) |
| `flutter/ios/ExportOptions-export.plist` | Local export only (unused in current script) |
| `scripts/flutter-build-dirs.sh` | iOS build output symlink to `/tmp` (xattr workaround) |
| `scripts/asc-list-builds.mjs` | `bun run ios:check-asc-builds` |

Build number: read from `flutter/pubspec.yaml` (`version: 1.0.0+N`). Must exceed latest ASC build. **Current:** **N=11** (VALID on TestFlight).

## ITMS-90683 fix — build 11 (2026-07-04 evening)

Apple rejected Flutter **1.0 (10)** with **ITMS-90683: Missing NSMicrophoneUsageDescription** in `Runner.app` Info.plist. Luciq SDK (and upcoming journal voice capture) link microphone APIs; Capacitor already had the key but Flutter `Info.plist` did not.

| Fix | Detail |
|-----|--------|
| **Root cause** | `flutter/ios/Runner/Info.plist` lacked privacy usage strings present in Capacitor `ios/App/App/Info.plist` |
| **Added keys** | `NSMicrophoneUsageDescription`, `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `ITSAppUsesNonExemptEncryption` (false) |
| **Copy** | Matched Capacitor journal strings (voice, camera, photo library) |
| **Already present** | `NSHealthShareUsageDescription`, `NSHealthUpdateUsageDescription`; `Runner.entitlements` has HealthKit |
| **Plugin audit** | Direct iOS pods: `health`, `connectivity_plus`, `flutter_secure_storage`, `sqlite3_flutter_libs`, `url_launcher_ios`, `app_links` — no additional privacy keys required beyond journal + HealthKit |
| **Version bump** | `flutter/pubspec.yaml` → `1.0.0+11` |
| **Upload** | `DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer FLUTTER_IOS_BUILD_ROOT=/tmp/purpledrw-flutter-tf11 bun run ios:testflight` |
| **ASC result** | **1.0 (11)** `processing=VALID`, `internal=IN_BETA_TESTING` (~4 min after upload) |

Build **10** remains rejected; do not promote. Testers install **11**.

## First Flutter upload (2026-07-04 evening)

| Item | Status |
|------|--------|
| Gates | `flutter analyze lib/` 0 issues; `flutter test` 20/20 |
| Command | Manual archive+export after `flutter build ios --no-codesign`; script updated to match |
| Uploaded build | **1.0 (10)** — **REJECTED** (ITMS-90683 missing `NSMicrophoneUsageDescription`) |
| xcodebuild result | `ARCHIVE SUCCEEDED` + `EXPORT SUCCEEDED` + `Upload succeeded` |
| ASC API (immediate) | Build 10 not yet in list (processing); latest listed build still **1.0 (9)** Capacitor |
| Re-check | `bun run ios:check-asc-builds` after 5–15 minutes |

### Blockers hit and fixes

| Blocker | Fix |
|---------|-----|
| `flutter build ipa --` ASC auth args parsed as target files | Use two-step: `flutter build ios --no-codesign` then `xcodebuild archive` + `-exportArchive` with `-authenticationKeyPath` |
| SPM plugins missing `Flutter/Flutter.h` | `flutter config --no-enable-swift-package-manager`; let `flutter build ios` run `pod install` |
| Missing `flutter/ios/Flutter/Generated.xcconfig` | Run `flutter pub get` before any pod/build step |
| Concurrent Xcode agents / DerivedData disk I/O | Serialize builds; `-derivedDataPath /tmp/purpledrw-flutter-dd`; wait for other `xcodebuild` processes |
| Broken `.symlinks/plugins` after `flutter clean` | `rm -rf ios/.symlinks ios/Pods` then `flutter pub get` before build |
| ITMS-90683 missing microphone plist | Add journal privacy keys to `flutter/ios/Runner/Info.plist`; bump to build 11 |

## `capacitor.config.ts` (Stage 6, after Flutter TestFlight VALID)

Remove production `server.url` block so Capacitor no longer loads `www.purplelife.org` remotely. Keep `webDir: capacitor-shell` for rollback builds only. Do not delete `ios/` until owner approves archival.

## Rollback

1. Do not promote bad Flutter build.
2. Re-point testers to last good Capacitor build in ASC.
3. `bun run ios:testflight:capacitor` with bumped `CURRENT_PROJECT_VERSION`.
4. No Supabase/schema rollback needed (shared backend).

## Pre-upload checklist

- [x] `flutter analyze lib/` + `flutter test` pass
- [ ] Stages 1–4 from [`PHASE5_CUTOVER_ORCHESTRATOR.md`](features/PHASE5_CUTOVER_ORCHESTRATOR.md) (design parity still open)
- [ ] `./scripts/flutter-web-serve.sh --rebuild` signed-in smoke
- [ ] `flutter run --release -d <iphone>` USB smoke
- [x] Build number > latest ASC Capacitor build (11 > 9; 10 rejected)
- [x] Flutter **1.0 (11)** VALID on TestFlight (ITMS-90683 fix)

**Upload:** `DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer bun run ios:check-asc && bun run ios:testflight`

**Verify ASC:** `bun run ios:check-asc-builds`

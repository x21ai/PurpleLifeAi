---
name: Native app and HealthKit
description: Capacitor hybrid shell loads production; ios/ and android/ committed; native HealthKit/Health Connect sync via /api/health/native-sync; agent runs scripts/native-ios-build.sh when Xcode.app is present.
type: feature
---
Purple ships primarily as an SSR web app on Cloudflare. Native iOS and Android
apps are a thin Capacitor shell whose WebView loads
`https://www.purplelife.org` (`capacitor.config.ts` `server.url`). Native
capabilities use the runtime `window.Capacitor` bridge in `src/lib/native/*`
without importing `@capacitor/*` into the web bundle.

## Current state (2026-07-03)

- `ios/` and `android/` Capacitor projects are committed in the repo.
- Native health bridges: `src/lib/native/health-ios.ts`, `health-android.ts`,
  `health.ts` via `@capgo/capacitor-health` (`Health` plugin).
- Server path: `src/lib/native-health.server.ts` and authenticated
  `/api/health/native-sync` upsert into `biometrics` with
  `source='apple_health'` (iOS) or `source='health_connect'` (Android).
- Migrations applied on live `xxnzmfzsjplrutrgbzxy`: `native_push_tokens`
  (RLS) and `health_connect` as a `biometrics` source.
- Local med reminders work natively via Capacitor Local Notifications (no
  backend). Push registration writes to `native_push_tokens`; remote delivery
  still needs APNs/FCM secrets in Doppler/Worker.
- UI: `apple-health-connection.tsx` uses Health Auto Export on web and native
  HealthKit Connect + `syncNativeHealthBatch` when `isNativeApp()`.

## Sync model

- **Web deploy = instant UI update** for installed apps. The shell loads
  production, so Worker deploys ship UI, routes, API, and `src/lib/native/*`
  JavaScript on next app open. No store review needed for those changes.
- **Store release only for native changes:** new Capacitor plugins, entitlements,
  permissions (`Info.plist`, `AndroidManifest.xml`), icons, splash assets, or
  `capacitor.config.ts` shell edits. After such changes: `bun run native:sync`,
  rebuild via `scripts/native-ios-build.sh` (iOS) or Android Studio, submit to
  TestFlight / Play internal testing.

See `docs/native-app-setup.md` section 8 for the full table.

## Apple Health: web vs native

| Surface | Mechanism | HealthKit prompt |
|---------|-----------|------------------|
| Web / PWA | Health Auto Export webhook `/api/public/hooks/apple-health?token=<secret>` | No (browsers cannot use HealthKit) |
| Native iOS app | Direct HealthKit read via `@capgo/capacitor-health` | Yes, in-app |
| Native Android app | Health Connect via `@capgo/capacitor-health` | Yes, in-app |

Both native paths write to `biometrics` with `source='apple_health'` (iOS) or
`source='health_connect'` (Android). Reuse existing metric naming; do not
create parallel native-only tables.

The webhook path stays for web users. Native direct read augments it; it does
not remove Health Auto Export from the web Tools copy.

## Agent-owned toolchain

- iOS simulator builds: run **`scripts/native-ios-build.sh`** when
  `/Applications/Xcode.app` exists (sets `xcode-select`, `bun run native:sync`,
  `pod install` when a Podfile exists, `xcodebuild` Debug simulator).
- **Command Line Tools only is insufficient** for iOS builds; full Xcode from
  the App Store is required.
- Agent runs native sync, schema verification, migration apply, and native-sync
  API deploy. Check Doppler for `DEVELOPMENT_TEAM` before signing-related
  steps.
- **No manual operator work** for routine native tasks: never ask the operator
  to run `native:sync`, `pod install`, `xcodebuild`, or SQL paste when the
  agent can run them.

## Operator-only exceptions

- **App Store Xcode install completion:** if only
  `/Applications/Xcode.appdownload` exists, wait for install to finish. One-time
  `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` if
  passwordless sudo is unavailable.
- **Missing Doppler secrets:** `DEVELOPMENT_TEAM`, APNs key, FCM /
  `google-services.json` for push delivery. Agent checks Doppler
  (`cursor-cloudflare` / `prd_cloudlfare`) before escalating.
- **Store submission:** Apple Developer Program and Google Play Developer
  accounts for signing, TestFlight, and Play Console upload (account gated).

## Execution checklist

Full step-by-step tables live in `docs/native-app-setup.md` section 5. Agent
owns web/server/plugin wiring, migrations, simulator builds, and live schema
verification. Physical-device HealthKit validation and store console submission
remain account gated.

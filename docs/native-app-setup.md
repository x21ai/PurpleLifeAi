# Native iOS and Android apps (Capacitor)

Purple ships as an SSR web app on Cloudflare. The native apps are a thin
Capacitor hybrid shell whose WebView loads production
(`https://www.purplelife.org`) and adds the native capabilities a WebView cannot
do well: push, local notifications, health, and a real OAuth browser.

The web app is already wired for this and is safe either way:

- `capacitor.config.ts` (repo root) configures the shell.
- `src/lib/native/capacitor.ts` talks to the runtime-injected `window.Capacitor`
  bridge, so no `@capacitor/*` package is bundled into the web build. Every
  helper is a no-op on the web.
- `src/lib/native/index.ts` runs the native setup (status bar, splash, push,
  local notifications) from `DeferredStartup` only when `isNativeApp()` is true.
- `src/lib/native/oauth.ts` completes Google/Apple sign-in in the system browser
  and finishes via a deep link.

Everything below requires a dev machine with the native toolchains and, for
shipping, paid developer accounts. None of it runs in CI or the agent sandbox.

## Prerequisites (human / account gated)

- macOS with Xcode (iOS) and Android Studio + JDK (Android).
- CocoaPods (`sudo gem install cocoapods`).
- Apple Developer Program account ($99/yr) for signing, push, and the App Store.
- Google Play Developer account ($25 one-time) for the Play Store.

## 1. Install Capacitor and generate native projects

```bash
bun run native:install      # adds @capacitor/* deps
bunx cap init Purple org.purplelife.app --web-dir capacitor-shell  # if not using capacitor.config.ts
bun run native:sync         # copies capacitor-shell/ (index.html) + config into native projects
```

`ios/` and `android/` are generated, native project directories. Commit them (or
keep them in a separate native repo). They are not generated here because the
sandbox has no Xcode/Android SDK.

## 2. Status bar, splash, safe area

Handled by config + `initNativeApp()`:

- `SplashScreen` shows the brand splash for ~600ms then `hide()` is called.
- `StatusBar` is styled dark; CSS `viewport-fit=cover` + `env(safe-area-inset-*)`
  (already in the web app) handle the notch and home indicator.

## 3. Push notifications (APNs / FCM)

Client registration is wired in `setupPushNotifications()`; it requests
permission, registers, and forwards the device token to `registerDeviceToken()`.
To deliver pushes you still need the account-gated backend:

1. iOS: create an APNs key in the Apple Developer portal; enable Push
   Notifications capability in Xcode.
2. Android: create a Firebase project, add `google-services.json`, take the FCM
   server key.
3. Backend: add a `native_push_tokens` table (RLS scoped to `user_id`, columns
   `user_id`, `token`, `platform`, `updated_at`) and a server function to upsert
   it; point `registerDeviceToken()` at that endpoint. Extend the dose-reminder
   cron (`src/routes/api/public/cron/dose-reminders.ts`) to also send via
   APNs/FCM using those tokens. Verify the migration against the live schema
   before shipping (migration safety gate).

Until that backend exists, local notifications below cover dose reminders.

## 4. Local notifications for medication reminders

Fully working with no backend. `scheduleNativeMedReminders()` reuses
`loadUpcomingScheduledDoses()` (the same schedule the web service worker uses)
and schedules native `LocalNotifications`. The web SW alarm loop does not run in
a native WebView, so the native shell owns reminders while installed.

## 5. Health (HealthKit / Health Connect)

Augments the existing Apple Health webhook by reading vitals natively. On the
web, Apple Health is push-only via Health Auto Export
(`/api/public/hooks/apple-health?token=<secret>`). The native iOS app adds a
direct HealthKit read path; Android uses Health Connect. Both land in
`biometrics` with the same `source` values the webhook uses (`apple_health`,
`health_connect`).

### HealthKit execution checklist (iOS)

Run on a Mac with Xcode after `bun run native:add` and `bun run native:sync`.
Cursor can wire the web and server code; the steps marked **human** need a local
machine, Apple Developer account, or App Store review context.

| Step | Owner | Action |
|------|-------|--------|
| 1 | Cursor | Pick a maintained Capacitor HealthKit plugin (e.g. `@perfood/capacitor-healthkit` or equivalent). Add it via `bun add`, then `bun run native:sync`. |
| 2 | Cursor | Add `src/lib/native/healthkit.ts` (or similar) that calls the plugin through `callPlugin()` / `plugin()` in `src/lib/native/capacitor.ts`, guarded by `isNativeApp()` and `nativePlatform() === "ios"`. |
| 3 | Cursor | Add an authenticated server function (standard `*.functions.ts` + `*.server.ts` split) to upsert native samples into `biometrics` with `source='apple_health'`, scoped to the authenticated `user_id`. Verify the live schema before shipping. |
| 4 | Cursor | Surface a native-only connect flow on Tools (or extend the Apple Health card when `isNativeApp()` is true) so users can grant HealthKit permission in-app. Keep the web copy that explains Health Auto Export for browser users. |
| 5 | **human** | In Xcode: enable the HealthKit capability on the app target, add `NSHealthShareUsageDescription` (and write strings if writing samples later) to `Info.plist`. |
| 6 | **human** | In Apple Developer portal: confirm the App ID includes HealthKit; rebuild and run on a physical iPhone (HealthKit does not work in Simulator for all types). |
| 7 | Cursor + **human** | Test: grant permission, trigger a read, confirm rows in `biometrics` with `source='apple_health'` and that `/vitals` shows real data (no fake metrics). |
| 8 | Cursor | Add visit-mode or pull sync consistent with wearables (`src/lib/wearable-sync.ts` pattern) so native HealthKit refresh respects the same throttle and user controls. |

### Health Connect checklist (Android)

| Step | Owner | Action |
|------|-------|--------|
| 1 | Cursor | Add a Health Connect Capacitor plugin, sync with `bun run native:sync`. |
| 2 | Cursor | Mirror the iOS server upsert path with `source='health_connect'`. |
| 3 | **human** | Declare Health Connect permissions in `AndroidManifest.xml` and satisfy Play policy for health data. |
| 4 | **human** | Test on a physical Android device with Health Connect installed. |

### Data model notes

- Reuse `biometrics` and existing metric naming (`src/lib/metric-naming.ts`). Do
  not invent parallel tables for native-only vitals.
- Native reads complement, do not replace, the webhook: users on web/PWA keep
  Health Auto Export; users on the installed app can use direct HealthKit.
- `apple_health_tokens.last_webhook_at` stays webhook-specific; track native
  sync separately (e.g. `last_sync_at` on a native health config row or reuse
  an existing tokens table column after schema review).

## 6. OAuth deep link registration

`src/lib/native/oauth.ts` uses redirect `org.purplelife.app://auth-callback`.
Register it everywhere:

- iOS: add the URL scheme to `Info.plist` (CFBundleURLTypes).
- Android: add an intent filter for the scheme in `AndroidManifest.xml`.
- Supabase: add `org.purplelife.app://auth-callback` to Auth redirect URLs.
- Google / Apple provider consoles: add the same redirect.

## 7. Signing, store assets, submission (account gated)

- iOS: signing certificate + provisioning profile in Xcode, app icons and
  launch screen, then Archive and upload to TestFlight; submit to the App Store.
- **TestFlight runbook:** `docs/testflight-setup.md` (`bun run ios:testflight` after
  App Store Connect API key is in Doppler `x21` / `prd`, `PURPLE_LIFE_APP_STORE_CONNECT_*`).
- Android: generate an upload keystore, build an AAB, upload to the Play Console
  internal testing track, then promote to production.
- App Store guideline 4.2: justify the native value (push + local notifications +
  HealthKit) so a thin WebView is not rejected.

## 8. Sync model: web deploy vs store release

The Capacitor shell loads production directly (`capacitor.config.ts`
`server.url` = `https://www.purplelife.org`). The WebView always runs the live
site, so **most product changes ship with a normal Cloudflare Worker deploy** and
users see them on next app launch without an App Store or Play Store update.

| Change type | How it ships | User action |
|-------------|--------------|-------------|
| UI, routes, copy, SSR logic, API routes, Supabase schema (web-facing) | `bun run build:prod` + Worker deploy (`docs/SYNC-AND-RELEASE.md`) | Open or background-resume the app |
| `src/lib/native/*` JS (OAuth, reminders, future HealthKit bridge) | Same web deploy (JS is served from production) | Open or background-resume the app |
| New Capacitor plugin, `capacitor.config.ts`, entitlements, permissions, `Info.plist`, `AndroidManifest.xml`, icons, splash assets | `bun run native:sync`, rebuild in Xcode/Android Studio, **store release** | Update from App Store / Play Store |
| OAuth redirect URL or deep-link scheme change | Native project edit + Supabase/provider console + **store release** if manifest/plist changed | Update app if store build changed |

**Rule of thumb:** if the diff only touches `src/`, `public/`, Worker code, or
migrations, deploy the web app. If the diff touches `ios/`, `android/`, native
plugins, or platform permissions, run `bun run native:sync`, cut a new native
build, and submit to TestFlight / Play internal testing before production.

```bash
# After any native project or plugin change:
bun run native:sync
bun run native:open:ios      # or native:open:android
# Archive (iOS) or bundle AAB (Android), then upload to the store console
```

Web deploy does **not** replace store review for native-only capabilities: Apple
still requires a binary that declares HealthKit, push, and URL schemes even when
the UI loads remotely (App Store guideline 4.2: document push, local
notifications, and HealthKit as the native value-add).

## 9. Crash reporting (Luciq, formerly Instabug)

The iOS shell integrates [Luciq](https://luciq.ai) for crash reports, session
replays, and in-app bug reports (shake, screenshot, floating button).

| Item | Value |
|------|-------|
| SPM package | `https://github.com/luciqai/luciq-ios-sdk` (product `Luciq`, import `LuciqSDK`) |
| Init | `ios/App/App/AppDelegate.swift` on `didFinishLaunchingWithOptions` |
| App token | Doppler `x21` / `prd` secret `PURPLE_LIFE_LUCIQ_APP_TOKEN` |
| Local xcconfig | `bun run ios:local-signing` writes `ios/LocalSigning.xcconfig` (gitignored) |
| Dashboard | Luciq project **Purple - Beta** |

```bash
# Before archive or local device build:
bun run ios:local-signing
bun run native:sync
```

**Notes:**

- TanStack Start does not emit `index.html` into `dist/client`. Capacitor uses
  `capacitor-shell/index.html` as the local WebView fallback; production UI
  still loads from `server.url`.
- Crashes upload on the **next** app launch, not at crash time. Debug builds
  with a debugger attached may skip dSYM upload; Release uses `dwarf-with-dsym`.
- Optional: install the Luciq MCP agent (`luciqai/luciq-agent-ios` on GitHub) in
  Cursor for AI-assisted SDK setup and crash triage.
- After native changes, bump `CURRENT_PROJECT_VERSION` in `project.pbxproj` and
  run `bun run ios:testflight` for a new TestFlight build.

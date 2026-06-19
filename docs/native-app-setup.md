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
bunx cap init Purple org.purplelife.app --web-dir dist/client  # if not using capacitor.config.ts
bun run build               # produce dist/client for the fallback web dir
bun run native:add          # cap add ios && cap add android
bun run native:sync         # copy config + plugins into the native projects
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

Augments the existing Apple Health webhook by reading vitals natively.

- iOS: add a HealthKit-capable Capacitor health plugin (e.g.
  `@perfood/capacitor-healthkit` or a maintained equivalent), add the HealthKit
  entitlement and usage strings in Xcode.
- Android: Health Connect plugin + the Health Connect permissions.
- Map the native samples into the `biometrics` table (source `apple_health` /
  `health_connect`) through an authenticated server function.

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
- Android: generate an upload keystore, build an AAB, upload to the Play Console
  internal testing track, then promote to production.
- App Store guideline 4.2: justify the native value (push + local notifications +
  HealthKit) so a thin WebView is not rejected.

## 8. Keeping native in sync

The WebView loads production, so most updates ship by deploying the web app, no
store release needed. Re-release the native app only when native code, plugins,
permissions, or the shell config change. After any such change:

```bash
bun run native:sync
```

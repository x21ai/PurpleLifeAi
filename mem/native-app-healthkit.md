---
name: Native app and HealthKit
description: Capacitor hybrid shell loads production; web deploy updates UI instantly; store release only for native project changes. Web Apple Health is push-only; native iOS adds direct HealthKit read into biometrics.
type: feature
---
Purple ships primarily as an SSR web app on Cloudflare. Native iOS and Android
apps are a thin Capacitor shell whose WebView loads
`https://www.purplelife.org` (`capacitor.config.ts` `server.url`). Native
capabilities use the runtime `window.Capacitor` bridge in `src/lib/native/*`
without importing `@capacitor/*` into the web bundle.

## Sync model

- **Web deploy = instant UI update** for installed apps. The shell loads
  production, so Worker deploys ship UI, routes, API, and `src/lib/native/*`
  JavaScript on next app open. No store review needed for those changes.
- **Store release only for native changes:** new Capacitor plugins, entitlements,
  permissions (`Info.plist`, `AndroidManifest.xml`), icons, splash assets, or
  `capacitor.config.ts` shell edits. After such changes: `bun run native:sync`,
  rebuild in Xcode/Android Studio, submit to TestFlight / Play internal testing.

See `docs/native-app-setup.md` section 8 for the full table.

## Apple Health: web vs native

| Surface | Mechanism | HealthKit prompt |
|---------|-----------|------------------|
| Web / PWA | Health Auto Export webhook `/api/public/hooks/apple-health?token=<secret>` | No (browsers cannot use HealthKit) |
| Native iOS app (planned) | Direct HealthKit read via Capacitor plugin | Yes, in-app |
| Native Android (planned) | Health Connect plugin | Yes, in-app |

Both paths write to `biometrics` with `source='apple_health'` (iOS) or
`source='health_connect'` (Android). Reuse existing metric naming; do not
create parallel native-only tables.

The webhook path stays for web users. Native direct read **augments** it; it does
not remove Health Auto Export from the web Tools copy.

## Human-gated work (not in CI or agent sandbox)

- Generate `ios/` and `android/` via `bun run native:install`, `native:add`,
  `native:sync` on a machine with Xcode and Android Studio.
- Apple Developer Program and Google Play Developer accounts for signing and
  store submission.
- Xcode: HealthKit capability, usage strings, push entitlements, URL scheme for
  `org.purplelife.app://auth-callback`.
- APNs key, FCM / `google-services.json`, and `native_push_tokens` backend for
  remote push (local notifications already work without backend).
- App Store guideline 4.2: justify native value (push, local med reminders,
  HealthKit) for a remote-loaded WebView app.

## Execution checklist

Full step-by-step tables live in `docs/native-app-setup.md` section 5. Cursor
owns web/server/plugin wiring; steps marked **human** need local Xcode, physical
devices, or store consoles.

# Native app store review checklist

Apple review context for Purple Capacitor hybrid (`org.purplelife.app`, loads
`https://www.purplelife.org`).

## Guideline 4.2 (minimum functionality)

Hybrid apps must justify native capabilities beyond a website wrapper.

**Purple native value-add (document in App Review notes):**

1. **HealthKit** direct read/sync (`src/lib/native/health-ios.ts`, Tools/Settings)
2. **Local medication reminders** (`scheduleNativeMedReminders` in `src/lib/native/index.ts`)
3. **Native OAuth** system browser + deep link (`src/lib/native/oauth.ts`)
4. **Push notifications** (registration wired; delivery needs APNs secrets)

**Implemented for review:**

- `NativeAppShell` (tab bar, no marketing chrome)
- `NativeRouteGuard` (no marketing pages in app)
- `NativeConnectivityGate` (offline retry screen)
- Account deletion in Settings → Data (`src/components/settings/data-section.tsx`)
- Privacy policy accessible (`/privacy`, mobile nav footer)

## HealthKit

| Item | Status |
|------|--------|
| `NSHealthShareUsageDescription` | PASS `ios/App/App/Info.plist` |
| `NSHealthUpdateUsageDescription` | PASS |
| HealthKit entitlement | PASS `ios/App/App/App.entitlements` |
| In-app permission UI | PASS `NativeAppleHealthPanel` |
| No HealthKit on web path | PASS webhook/HAE for browser only |

## Sign in with Apple

Required when offering Google/social sign-in. Purple offers Google OAuth;
**enable Sign in with Apple** in Supabase and `social-sign-in-buttons.tsx` before
public App Store submission if not already live.

## Export compliance

`ITSAppUsesNonExemptEncryption = false` in `Info.plist` (standard HTTPS only).

## Push

`UIBackgroundModes` / push capability: declare only when APNs delivery is live.
Registration code exists; do not claim push in metadata until send path works.

## TestFlight before public review

1. Internal testers on real devices (HealthKit requires hardware)
2. Verify Connect → Health Access sheet → sync → vitals
3. Verify offline screen (airplane mode)
4. Verify account deletion flow
5. Screenshot tab-bar home (Today), Settings, Apple Health connect

## Remote URL loading

`capacitor.config.ts` `server.url` points at production. UI updates ship with
Worker deploy; binary updates only for native project/plugin changes.

See also: `docs/testflight-setup.md`, `docs/native-app-setup.md`,
`mem/native-app-experience.md`.

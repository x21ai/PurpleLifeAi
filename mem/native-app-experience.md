---
name: Native app experience
description: Capacitor shell uses NativeAppShell, not web AppShell; route guards block marketing pages; offline gate for App Store review.
type: feature
---

Purple native iOS/Android is **not** the marketing website in a WebView. The shell
loads production (`capacitor.config.ts`) but uses a dedicated app chrome and guards.

## Shell

| Web | Native |
|-----|--------|
| `AppShell` (sidebar + responsive desktop) | `NativeAppShell` via `AppShellRouter` |
| `md:` breakpoints promote desktop layout | Always tab bar + mobile top bar |
| Marketing routes public | `NativeRouteGuard` redirects blocked paths |

Files:

- `src/components/layout/native-app-shell.tsx`
- `src/components/layout/app-shell-router.tsx`
- `src/lib/native-app-context.tsx` (`html.native-app` class)
- `src/routes/_app.tsx` uses `AppShellRouter`

## Route guards (native only)

Blocked: `/features`, `/pricing`, `/about`, `/charter`, `/research`, `/epilepsy`,
`/apple-health-import`, `/community/*`, `/trust`, `/contact`. In-app redirects:
`/` → `/today`, `/tools` → `/settings/sharing`, `/privacy` → `/settings/privacy`,
`/terms` → `/settings/terms`.

## Offline

`NativeConnectivityGate` shows retry UI when `www.purplelife.org` is unreachable
(App Store 4.2 / hybrid app expectation).

## Sheet pages

`SheetPage` uses `max-w-xl` and reduced padding when `isNativeApp` from context.
Legal copy for native lives at `/settings/privacy` and `/settings/terms` (no
`SiteFooter` or marketing chrome). Settings community row links to `/community-new`.

## Apple review notes

Document native value-add in App Store metadata: HealthKit, local med reminders,
native OAuth, push (when APNs ships). Privacy and account deletion live under
Settings → Data (`data-section.tsx`). See `docs/testflight-setup.md` and
`docs/native-app-store-review.md`.

# Flutter + Lovable workflow (durable decision)

**Date:** 2026-07-04  
**Status:** Phase 5 — Flutter-only native (Capacitor deprecated 2026-07-04)

## Decision

Purple will ship a **native Flutter client** for iOS, Android, web, macOS, and
Windows. Lovable remains the **design source** on branch `lovable/redesign`
(TanStack web). Cursor is the **Flutter implementer** and production gatekeeper
for both web and Flutter.

We do **not** generate Flutter from Lovable exports automatically. We sync
**design tokens and screen behavior** through a repo-owned bridge file and
manual/agent-guided ports.

## Rationale

- Capacitor loads production in a WebView: fast to ship, limited offline, native
  feel ceiling, and HealthKit bridged through JS plugins.
- Flutter gives offline-first control, true multi-platform binaries, and Apple-grade
  navigation without WebView scroll quirks.
- Lovable excels at rapid web UI iteration; keeping design there avoids splitting
  designer workflow while Cursor owns typed clients and store releases.

## Design bridge

| Artifact | Role |
|----------|------|
| `lovable/redesign` | Visual source of truth for layout, copy, and theme on web |
| `design/tokens.json` | Cross-platform token contract (colors, spacing, glass, radii) |
| `src/styles.css` (`--glass-*`) | Web liquid glass; values copied into tokens on merge |
| `src/i18n/locales/en.json` | String source; Flutter ARB follows web |
| `flutter/lib/design_system/` | Widget library consuming tokens |

Lovable does not edit `design/tokens.json` or `flutter/`.

## Sync trigger

After each Lovable push the user coordinates (or CI detects) a merge to
`main`:

1. Run web quality gates ([`docs/LOVABLE-REDESIGN-WORKFLOW.md`](../docs/LOVABLE-REDESIGN-WORKFLOW.md)).
2. Update `design/tokens.json` from changed web theme/layout.
3. Port affected routes to Flutter ([`docs/LOVABLE-FLUTTER-SYNC.md`](../docs/LOVABLE-FLUTTER-SYNC.md)).
4. `flutter analyze` + `flutter test`.

Cursor rule: [`.cursor/rules/flutter-lovable-sync.mdc`](../.cursor/rules/flutter-lovable-sync.mdc).

## Capacitor deprecated (operator 2026-07-04)

**Policy:** Flutter native is the only store/TestFlight path going forward. Do
not build or ship Capacitor WebView IPAs unless explicitly rolling back.

| History | Detail |
|---------|--------|
| ASC builds 1–9 | Capacitor WebView (`ios/App/`, prod TanStack at `www.purplelife.org`) |
| Build 10+ | Flutter only (`flutter/ios/`, `bun run ios:flutter-testflight`) |
| Rollback | `bun run ios:testflight:capacitor` — scripts kept in repo, not default |

Capacitor `ios/`, `android/`, and `docs/native-app-setup.md` remain for
reference. Flutter uses the same Supabase project, Worker APIs, and bundle ID
`org.purplelife.app`. Full cutover runbook:
[`docs/FLUTTER-TESTFLIGHT-CUTOVER.md`](../docs/FLUTTER-TESTFLIGHT-CUTOVER.md).

## Offline-first

Flutter app routes are offline-first (local cache + mutation queue). Web remains
online-first with PWA shell. Same HIPAA rule: no invented vitals; empty states
only.

## Phase map

0 Foundation → 1 Auth/shell → 2 Today/vitals → 3 Journal/meds/settings →
4 Health/wearables/push → 5 Flutter TestFlight (Capacitor retired 2026-07-04).

Full runbook: [`docs/LOVABLE-FLUTTER-SYNC.md`](../docs/LOVABLE-FLUTTER-SYNC.md).

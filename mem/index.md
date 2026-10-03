# Project Memory

## Core
Never use em dashes (`—`, U+2014) anywhere. Replace with `,`, `and`, `or`, `:`, `.`, or split the sentence. Enforced by `npm run check:em-dash`.
SiteFooter renders on all viewports for marketing/auth routes only. The signed-in AppShell never renders it. Do not gate the footer on `lg:` or larger breakpoints.
Metric labels always show the canonical human name from `src/lib/metric-naming.ts`; the PDF's wording is preserved as "as printed: …" unless it matches the canonical. Never delete PDF wording from the DB.

## Memories
- [Post-task documentation](mem/constraint/post-task-documentation.md) - Session start: `docs/HANDOFF.md`, `DECISIONS.md`, `OPEN-ISSUES.md`. Task done: append log + sync `CURSOR_HANDOFF.md`, runbooks, rules, `AGENTS.md`, `mem/`.
- [Footer visibility](mem://design/footer-visibility) - Footer shown on mobile/tablet/desktop for marketing pages, hidden in the signed-in app shell.
- [No em dashes](mem://constraint/no-em-dash) - Banned char `—` and the replacement table by context (comma, and/or, colon, period, ·, en dash for "no data").
- [Metric naming + as-printed rule](mem://feature/metric-naming) - Canonical name map and when to hide "as printed" subtitle on charts.
- [Liquid Glass CSS tokens](design/liquid-glass-tokens.md) - iOS 26 kit-aligned `--glass-*` values in `src/styles.css`; Figma MCP fallback to public materials spec.
- [Apple system typography](design/apple-system-typography.md) - SF Pro system stack for signed-in app; no Inter / Source Serif 4 in shell.
- [Native app and HealthKit](native-app-healthkit.md) - Capacitor shell loads production; web deploy vs store release; web push-only Apple Health vs planned native HealthKit read.
- [Native app experience](native-app-experience.md) - NativeAppShell, route guards, offline gate; not the marketing website in a WebView.
- [Native iOS: Xcode vs CLT](native-ios-xcode-vs-clt.md) - CLT cannot build Capacitor iOS; full Xcode.app, license, and xcode-select required.
- [Sync and release workflow](../docs/SYNC-AND-RELEASE.md) - How Lovable, Cursor, and production stay in step: branch flow, gates, case studies, runbooks.
- [Flutter + Lovable workflow](flutter-lovable-workflow.md) - Lovable design on `lovable/redesign`, Cursor Flutter under `flutter/`, `design/tokens.json` bridge, offline-first; **Flutter-only native** for TestFlight/store (Capacitor deprecated 2026-07-04, builds 1–9 were WebView).
- [Auth password reset](auth-password-reset.md) - Recovery email redirect URIs, web PKCE bootstrap (`auth-recovery.ts`), native `reset-password` deep link, migration accounts without password hashes.
- [Mobile crash reporting](observability/crash-reporting.md) - Luciq vs Sentry/Crashlytics/ASC; agent runbook after TestFlight upload.
- [TestFlight beta feedback](observability/testflight-beta-feedback.md) - Share Beta Feedback iOS/TestFlight requirements, external tester alternatives, ASC + Luciq triage.
- [Doppler Purple Life secrets](doppler-purple-life.md) - native iOS `x21`/`prd` `PURPLE_LIFE_*`; Worker deploy and www smoke `x21`/`prd_cloudflare`.
- [Cloudflare cutover](cloudflare-cutover.md) - D1/R2/KV bindings, DATA_BACKEND flag, Workers JWT auth, PBKDF2 cap 100000, profiles scoped by `id`; Flutter `1.0.0+33` uses that JWT by default. Runbook `docs/CLOUDFLARE-MIGRATION.md`. Mac smoke Doppler is `x21`/`prd_cloudflare`.
- [Flutter Ploy auth chrome](flutter-ploy-auth-chrome.md) - Sign-in shield and the signed-in app share the live Ploy light tokens. No dark shell.
- [Staging Ploy hybrid](staging-ploy-hybrid.md) - staging.purplelife.org uses `www-entry.ts`, live Ploy copy, shared production D1/R2/KV, no crons.
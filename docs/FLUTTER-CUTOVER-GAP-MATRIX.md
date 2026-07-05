# Flutter Stage 5 Cutover Gap Matrix

**Date:** 2026-07-05 (refreshed from ASC beta feedback + route audit)  
**Baseline:** Web `src/routes/_app/**` (55 files) + marketing `src/routes/*.tsx` (30 files) vs Flutter `flutter/lib/shell/router.dart`  
**Phase reference:** `docs/LOVABLE-FLUTTER-SYNC.md` Phase 5 exit criteria  
**Status legend:** **Parity** | **Partial** | **Stub** | **Missing**

---

## Executive summary

| Metric | Web | Flutter (2026-07-05) |
|--------|-----|----------------------|
| Signed-in `_app` route files | **55** | **28** GoRouter paths (incl. OAuth callbacks) |
| Marketing route files (TanStack-only by policy) | **30** | **1** (`/sign-in`; marketing stays on Worker) |
| Route gaps (Missing + Stub) | — | **33** of 55 signed-in paths |
| Partial implementations | — | **22** routes exist but fail design or depth bar |
| TestFlight latest VALID | Capacitor retired | **1.0 (16)** IN_BETA_TESTING (2026-07-05) |

### Stage 5 Go/No-Go: **NO-GO**

Tester feedback on TF15/16 confirms daily-use gaps (synced-data visibility, OAuth failures, settings layout before TF16 bundle, crashes). Route map grew since 2026-07-04 audit (`/meds/:id`, `/care`, reports hub, OAuth callbacks) but **30 paths still Missing**, **3 Stub**, and core screens remain **Partial** per `docs/FLUTTER-DESIGN-PARITY-CHECKLIST.md`.

---

## Why prior Luciq / browser audits did not finish migration

Prior audits scoped **visual deltas on five screens** (Today, Vitals, Meds, Journal, Settings) and **Luciq observability wiring**, not a **full 55-route inventory** or tester-driven cutover backlog. They could not close migration because **missing routes** (`/my-health`, `/insights`, reports children, chat, care inbox) and **integration depth** (OAuth console, synced-data surfaces, Worker-only account actions) were out of scope.

---

## ASC beta feedback → Flutter gap map (2026-07-05)

Source: `bun run ios:check-tf-feedback` (10 submissions, tester a@arora.net, TF15 era unless noted).

| # | Feedback (paraphrased) | Likely screen | Flutter gap | Priority | TF16 status |
|---|------------------------|---------------|-------------|----------|-------------|
| 1 | App is crashing | Global | `tf-crash-report` — Luciq SDK wired; triage dashboard after TF16 install | **P0** | Open — needs Luciq crash pull |
| 2 | Not the correct settings page design | `/settings` | Hub + inline sections shipped `fb3b018`; design parity checklist sections still P1 | **P0** | Fixed in TF16 — **device re-verify** |
| 3 | Syncing but does not say what | Sync bar | Provider labels in sync bar `2aeabd4` | **P0** | Fixed in TF16 — device re-verify |
| 4 | Sync time is wrong | Sync bar / timezone | Local TZ + relative clock `2aeabd4` | **P0** | Fixed in TF16 — device re-verify |
| 5 | Same sync button every page | Shell | Removed from Meds/Vitals; Today + Tools only `2aeabd4` | **P0** | Fixed in TF16 — device re-verify |
| 6 | NYC should show city not only timezone | `/account` | `home_city` field `9b3de42` | **P0** | Fixed in TF16 — device re-verify |
| 7 | Why is this not working | `/tools` OAuth | Oura native redirect URI not in Oura console (`oura-native-redirect-console`); connect may fail silently | **P0** | Open |
| 8 | How do I see all my synced data? | `/vitals`, `/my-health`, `/biometrics` | No `/my-health` route; vitals partial; no biometrics hub; bottom nav uses Vitals not My Body | **P0** | Open — `tf-synced-data-visibility` |
| 9 | (screenshot, no comment) | Unknown | — | P2 | Triage with Luciq session |
| 10 | (screenshot, no comment) | Unknown | — | P2 | Triage with Luciq session |

---

## Prioritized backlog (P0 / P1 / P2)

### P0 — Tester-blocking (ship before Phase 5 Go)

| ID | Item | Web route(s) | Flutter state | Evidence |
|----|------|--------------|---------------|----------|
| P0-1 | Crash triage on TF16+ | — | Luciq SDK in bundle | ASC feedback "App is crashing" |
| P0-2 | Synced data visibility | `/my-health`, `/biometrics`, `/vitals` | `/my-health` **Missing**; vitals **Partial**; nav maps Vitals not My Body | ASC "how do i see all my synched data?" |
| P0-3 | Wearable OAuth reliability | `/tools`, `/oauth/*/callback` | Routes exist; Oura console redirect gap | ASC "why is this not workibg" |
| P0-4 | Today daily-use parity | `/today`, `/today/risk` | **Partial** — no date strip, signals grid, score strip shape | Design checklist §1 P0s |
| P0-5 | Settings + Account device sign-off | `/settings`, `/account` | Settings scroll shipped; Account placeholders remain | ASC settings design + `tf16-device-verify` |
| P0-6 | Meds schedule UX | `/meds`, `/meds/$medId`, `/meds/history` | Routes exist **Partial** — missing toolbar, timeline, FAB | Design checklist §3 P0s |
| P0-7 | Chat not wired | `/chat`, `/chat-care` | **Stub** empty states | Phase 5 blocker |
| P0-8 | Care inbox + accept flow | `/care/inbox`, `/care.accept` (marketing) | `/care/inbox` **Missing**; no deep link handler | Caregiver loop incomplete |
| P0-9 | Reports depth | `/reports/*` (7 routes) | Hub only at `/settings/reports`; 6 child routes **Missing** | Settings row + labs UX |
| P0-10 | Push + dose reminders | `/tools` notifications | **Missing** notification stack | Phase 4 gate |

### P1 — Core parity (post-P0, pre-cutover)

| ID | Item | Web route(s) | Flutter state |
|----|------|--------------|---------------|
| P1-1 | Vitals / My Body design | `/vitals`, `/my-health` | Vitals **Partial**; my-health **Missing** |
| P1-2 | Journal multimodal | `/journal`, `/journal/new` | Light canvas, FAB, media, AI pipeline **Partial** |
| P1-3 | Insights tab route | `/insights` | **Missing**; bottom nav has no Insights |
| P1-4 | Biometrics drilldown charts | `/biometrics/$metric` | `/vitals/metric/:key` **Partial** stub charts |
| P1-5 | Sharing + care dashboard depth | `/settings/sharing`, `/care/$ownerId` | Sharing **Partial**; care reports sub-route **Missing** |
| P1-6 | Settings completeness | `/settings/terms`, Worker export/2FA | terms **Missing**; export/2FA UI stubs |
| P1-7 | Welcome onboarding | `/welcome` | **Partial** — conditions, wearables, notifications |
| P1-8 | Hydration + seizures | `/hydration`, `/seizures/new` | **Partial** |
| P1-9 | Shell polish | top bar sync, inbox badge | Header sync partial; inbox badge **Missing** |
| P1-10 | Global design tokens | all `_app` | Georgia/hardcoded colors — checklist §0 P0 |

### P2 — Marketing / admin / nice-to-have

| ID | Item | Notes |
|----|------|-------|
| P2-1 | Marketing pages (30 routes) | Stay TanStack on Worker; Flutter Phase 0–1 policy |
| P2-2 | Admin suite (13 routes) | Explicit mobile exclude unless owner requests |
| P2-3 | Community / friends / conditions | `/community-new`, `/friends/$id`, `/condition/$slug` **Missing** |
| P2-4 | DNA upload | `/my-health-dna` **Missing** |
| P2-5 | Apple Health XML import | `/apple-health-import` **Missing** (native sync preferred) |
| P2-6 | Timeline | `/timeline` **Missing** |
| P2-7 | Travel mode | `/settings/travel` **Stub** placeholder |
| P2-8 | Capacitor retirement | Owner decision after P0 device sign-off |

---

## Flutter route inventory (current)

From `flutter/lib/shell/router.dart` + `routes.dart`:

| Path | Screen | Status |
|------|--------|--------|
| `/sign-in` | SignInScreen | Partial |
| `/oauth/oura/callback` | WearableOAuthCallbackScreen | Partial |
| `/oauth/whoop/callback` | WearableOAuthCallbackScreen | Partial |
| `/welcome` | WelcomeScreen | Partial |
| `/today` | TodayScreen | Partial |
| `/today/risk` | TodayRiskScreen | Partial |
| `/vitals` | VitalsScreen | Partial |
| `/vitals/metric/:metricKey` | MetricDetailScreen | Partial |
| `/seizures/new` | LogSeizureScreen | Partial |
| `/hydration` | HydrationScreen | Partial |
| `/journal` | JournalScreen | Partial |
| `/journal/new` | JournalCaptureScreen | Partial |
| `/meds` | MedsScreen | Partial |
| `/meds/history` | MedsHistoryScreen | Partial |
| `/meds/:medId` | MedDetailScreen | Partial |
| `/settings` | SettingsScreen | Partial |
| `/account` | AccountScreen | Partial |
| `/tools` | ToolsScreen | Partial |
| `/care` | CareIndexScreen | Partial |
| `/care/:ownerId` | CareDashboardScreen | Partial |
| `/settings/sharing` | SharingScreen | Partial |
| `/settings/travel` | SettingsPlaceholderScreen | **Stub** |
| `/settings/reports`, `/reports` | ReportsHubScreen | Partial (hub only) |
| `/contact` | ContactScreen | Partial |
| `/settings/privacy` | PrivacyScreen | Partial |
| `/settings/how-purple-thinks` | HowPurpleThinksScreen | Partial |
| `/chat` | ChatScreen | **Stub** |
| `/chat-care` | ChatCareScreen | **Stub** |

**Flutter-only:** `/sign-in`, OAuth callbacks, `/contact` (web uses marketing `/contact`).

---

## Web `_app` routes still Missing or Stub in Flutter

### Missing (30 paths — no GoRouter entry)

| Web path | Web file |
|----------|----------|
| `/biometrics` | `biometrics.index.tsx` |
| `/my-health` | `my-health.tsx` |
| `/my-health-dna` | `my-health-dna.tsx` |
| `/apple-health-import` | `apple-health-import.tsx` |
| `/timeline` | `timeline.tsx` |
| `/insights` | `insights.tsx` |
| `/care/inbox` | `care.inbox.tsx` |
| `/care/$ownerId/reports/$reportId` | `care.$ownerId.reports.$reportId.tsx` |
| `/settings/terms` | `settings.terms.tsx` |
| `/condition/$slug` | `condition.$slug.tsx` |
| `/community-new` | `community-new.tsx` |
| `/friends/$friendshipId` | `friends.$friendshipId.tsx` |
| `/reports/metrics` | `reports.metrics.tsx` |
| `/reports/documents` | `reports.documents.tsx` |
| `/reports/medical-history` | `reports.medical-history.tsx` |
| `/reports/new` | `reports.new.tsx` |
| `/reports/$reportId` | `reports.$reportId.tsx` |
| `/reports/trends/$metricKey` | `reports.trends.$metricKey.tsx` |
| `/admin` + 12 children | `admin*.tsx` (13 routes) |

Note: `/biometrics/$metric` is covered by `/vitals/metric/:metricKey` (**Partial**, not Missing).

### Stub (3 paths)

| Path | Notes |
|------|-------|
| `/settings/travel` | Placeholder copy only |
| `/chat` | Empty state — no Worker streaming |
| `/chat-care` | Empty state — no caregiver DMs |

### Partial (22 paths)

All other Flutter routes listed above fail full web parity (data depth, design checklist, or Worker-only actions).

---

## Route gap counts

| Category | Count (of 55 `_app` web routes) |
|----------|----------------------------------|
| **Missing** | **30** |
| **Stub** | **3** |
| **Partial** | **22** |
| **Parity** | **0** |
| **Total gaps (Missing + Stub)** | **33** |

Marketing: **28** routes intentionally absent from Flutter (TanStack-only); **2** shared (`/sign-in`, OAuth callbacks).

---

## TestFlight / ASC status

| Build | Processing | Internal | External | Uploaded |
|-------|------------|----------|----------|----------|
| **1.0 (16)** | **VALID** | IN_BETA_TESTING | READY_FOR_BETA_SUBMISSION | 2026-07-05 ~09:34 PT |
| 1.0 (15) | VALID | IN_BETA_TESTING | READY_FOR_BETA_SUBMISSION | 2026-07-05 |
| 1.0 (14) | VALID | IN_BETA_TESTING | READY_FOR_BETA_SUBMISSION | 2026-07-05 |

Verify: `bun run ios:check-asc-builds`, `bun run ios:check-tf-feedback`.

---

## Recommended implementation slices (ordered)

1. **P0-2** — Add `/my-health` route + retarget bottom nav "My Body"; wire vitals/biometrics reads.
2. **P0-3** — Register Oura native redirect; surface inline Tools error (`oura-native-redirect-console`).
3. **P0-4** — Today date strip + signals grid + score strip (design checklist §1).
4. **P0-6** — Meds toolbar, 24h timeline, FAB + form sheet.
5. **P0-7** — Chat Worker streaming client.
6. **P0-8** — `/care/inbox` + `care.accept` deep link.
7. **P0-9** — Reports child routes from hub.
8. **P0-1** — Pull Luciq crashes after TF16 tester session; file fixes.

---

## Verification commands

```bash
bun run ios:check-tf-feedback
bun run ios:check-asc-builds
find src/routes/_app -name '*.tsx' ! -name '_app.tsx' | wc -l   # expect 55
cd flutter && flutter analyze lib/ && flutter test
./scripts/flutter-web-serve.sh --rebuild   # :8765 browser parity
```

Cross-reference: `docs/FLUTTER-DESIGN-PARITY-CHECKLIST.md`, `docs/OPEN-ISSUES.md`, `docs/LOVABLE-FLUTTER-SYNC.md`.

---

*Audit-only refresh 2026-07-05. No screen implementation in this pass.*

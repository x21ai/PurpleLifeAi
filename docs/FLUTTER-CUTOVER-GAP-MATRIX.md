# Flutter Stage 5 Cutover Gap Matrix

**Date:** 2026-07-05 (post-TF17 fleet route audit)  
**Baseline:** Web `src/routes/_app/**` (55 files) + marketing `src/routes/*.tsx` (30 files) vs Flutter `flutter/lib/shell/router.dart`  
**Phase reference:** `docs/LOVABLE-FLUTTER-SYNC.md` Phase 5 exit criteria  
**Status legend:** **Parity** | **Partial** | **Stub** | **Missing**

---

## Executive summary

| Metric | Web | Flutter (2026-07-05 post-TF17) |
|--------|-----|--------------------------------|
| Signed-in `_app` route files | **55** | **38** GoRouter paths (33 leaf + 3 redirects; incl. OAuth callbacks outside shell) |
| Marketing route files (TanStack-only by policy) | **30** | **6** public (`/`, `/pricing`, `/privacy`, `/about`, `/trust`, `/sign-in`; 25 stay on Worker) |
| Route gaps (Missing + Stub) | — | **23** of 55 signed-in paths (was 33 pre-fleet) |
| Partial implementations | — | **32** routes exist but fail design or depth bar |
| TestFlight latest VALID | Capacitor retired | **1.0 (17)** IN_BETA_TESTING (2026-07-05) |

### Stage 5 Go/No-Go: **NO-GO**

TF17 closes the largest route holes from the 2026-07-05 AM audit: **`/my-health`**, **`/biometrics`**, **`/care/inbox`**, full **`/reports/*` hub**, **Worker chat streaming**, and **5 core marketing paths**. **22 paths still Missing** (9 product + 13 admin), **1 Stub**, and **32 Partial** screens remain per `docs/FLUTTER-DESIGN-PARITY-CHECKLIST.md`. Tester P0s (crash triage, OAuth console, device sign-off on synced-data UX) still open.

---

## Post-TF17 fleet delta (vs pre-fleet matrix)

| Area | Pre-fleet (TF16 era) | Post-TF17 |
|------|----------------------|-----------|
| `/my-health` | **Missing** | **Partial** — narrative, coverage, vitals links |
| `/biometrics`, `/biometrics/$metric` | **Missing** / vitals alias | **Partial** — hub + drilldown |
| `/care/inbox` | **Missing** | **Partial** — invite list + accept |
| `/reports/*` (7 routes) | Hub only; 6 **Missing** | **Partial** — all 7 wired |
| `/chat`, `/chat-care` | **Stub** empty states | **Partial** — Worker streaming + care threads |
| Marketing `/`, `/pricing`, etc. | **Missing** (TanStack-only) | **Partial** — 5 public routes outside shell |
| Gap count (Missing + Stub) | **33** | **23** (−10) |

---

## Why prior Luciq / browser audits did not finish migration

Prior audits scoped **visual deltas on five screens** (Today, Vitals, Meds, Journal, Settings) and **Luciq observability wiring**, not a **full 55-route inventory** or tester-driven cutover backlog. Post-TF17 fleet work closed the highest-traffic **missing routes**; remaining blockers are **depth parity** (design checklist), **admin/community** paths, and **integration reliability** (OAuth console, push, Luciq crash triage).

---

## ASC beta feedback → Flutter gap map (2026-07-05)

Source: `bun run ios:check-tf-feedback` (10 submissions, tester a@arora.net, TF15–16 era unless noted).

| # | Feedback (paraphrased) | Likely screen | Flutter gap | Priority | TF17 status |
|---|------------------------|---------------|-------------|----------|-------------|
| 1 | App is crashing | Global | `tf-crash-report` — Luciq SDK wired; triage dashboard after TF17 install | **P0** | Open — needs Luciq crash pull |
| 2 | Not the correct settings page design | `/settings` | Hub + inline sections shipped; design parity checklist sections still P1 | **P0** | Fixed TF16 — **device re-verify on TF17** |
| 3 | Syncing but does not say what | Sync bar | Provider labels in sync bar | **P0** | Fixed TF16 — device re-verify |
| 4 | Sync time is wrong | Sync bar / timezone | Local TZ + relative clock | **P0** | Fixed TF16 — device re-verify |
| 5 | Same sync button every page | Shell | Removed from Meds/Vitals; Today + Tools only | **P0** | Fixed TF16 — device re-verify |
| 6 | NYC should show city not only timezone | `/account` | `home_city` field | **P0** | Fixed TF16 — device re-verify |
| 7 | Why is this not working | `/tools` OAuth | Oura native redirect URI not in Oura console; connect may fail silently | **P0** | Open |
| 8 | How do I see all my synced data? | `/my-health`, `/biometrics`, `/vitals` | Routes **wired Partial** TF17; bottom nav + drilldown depth still P0/P1 | **P0** | Improved — **device re-verify** |
| 9 | (screenshot, no comment) | Unknown | — | P2 | Triage with Luciq session |
| 10 | (screenshot, no comment) | Unknown | — | P2 | Triage with Luciq session |

---

## Prioritized backlog (P0 / P1 / P2)

### P0 — Tester-blocking (ship before Phase 5 Go)

| ID | Item | Web route(s) | Flutter state | Evidence |
|----|------|--------------|---------------|----------|
| P0-1 | Crash triage on TF17+ | — | Luciq SDK in bundle | ASC feedback "App is crashing" |
| P0-2 | Synced data **depth** | `/my-health`, `/biometrics`, `/vitals` | All **Partial** — routes wired TF17; nav, charts, empty states vs web | ASC "how do i see all my synched data?" |
| P0-3 | Wearable OAuth reliability | `/tools`, `/oauth/*/callback` | Routes exist; Oura console redirect gap | ASC "why is this not workibg" |
| P0-4 | Today daily-use parity | `/today`, `/today/risk` | **Partial** — date strip + signals grid shipped; score strip / day filter depth | Design checklist §1 |
| P0-5 | Settings + Account device sign-off | `/settings`, `/account` | Settings scroll shipped; Account placeholders remain | ASC settings design + TF17 device verify |
| P0-6 | Meds schedule UX | `/meds`, `/meds/$medId`, `/meds/history` | Routes **Partial** — missing toolbar, timeline, FAB | Design checklist §3 |
| P0-7 | Chat **depth** | `/chat`, `/chat-care` | **Partial** — Worker streaming wired; history, attachments, care DM parity | Was Stub pre-fleet |
| P0-8 | Care **accept deep link** | `/care/inbox`, `/care.accept` (marketing) | Inbox **Partial**; marketing `care.accept` deep link handler **Missing** | Caregiver loop incomplete |
| P0-9 | Reports **depth** | `/reports/*` (7 routes) | All 7 **Partial** — upload, trends charts, detail vs web | Was hub-only pre-fleet |
| P0-10 | Push + dose reminders | `/tools` notifications | **Missing** notification stack | Phase 4 gate |

### P1 — Core parity (post-P0, pre-cutover)

| ID | Item | Web route(s) | Flutter state |
|----|------|--------------|---------------|
| P1-1 | Vitals / My Body design | `/vitals`, `/my-health`, `/biometrics` | All **Partial** — my-health + biometrics hub wired TF17 |
| P1-2 | Journal multimodal | `/journal`, `/journal/new` | Light canvas, FAB, media, AI pipeline **Partial** |
| P1-3 | Insights tab route | `/insights` | **Missing**; bottom nav has no Insights |
| P1-4 | Biometrics drilldown charts | `/biometrics/$metric` | `/biometrics/:metricKey` **Partial** — real charts vs stub |
| P1-5 | Sharing + care dashboard depth | `/settings/sharing`, `/care/$ownerId`, `/care/$ownerId/reports/$reportId` | Sharing **Partial**; care report sub-route **Missing** |
| P1-6 | Settings completeness | `/settings/terms`, Worker export/2FA | terms **Missing**; export/2FA UI stubs |
| P1-7 | Welcome onboarding | `/welcome` | **Partial** — conditions, wearables, notifications |
| P1-8 | Hydration + seizures | `/hydration`, `/seizures/new` | **Partial** |
| P1-9 | Shell polish | top bar sync, inbox badge | Header sync partial; inbox badge **Missing** |
| P1-10 | Global design tokens | all `_app` | Georgia/hardcoded colors — checklist §0 P0 |
| P1-11 | Marketing completeness | 25 remaining TanStack routes | 5 core **Partial**; `/features`, `/charter`, `/terms`, community stubs |

### P2 — Marketing / admin / nice-to-have

| ID | Item | Notes |
|----|------|-------|
| P2-1 | Marketing pages (25 routes) | 5 core wired in Flutter; remainder TanStack on Worker until cutover |
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

### Public (outside signed-in shell)

| Path | Screen | Status |
|------|--------|--------|
| `/` | MarketingHomeScreen | Partial |
| `/pricing` | MarketingPricingScreen | Partial |
| `/privacy` | MarketingPrivacyScreen | Partial |
| `/about` | MarketingAboutScreen | Partial |
| `/trust` | MarketingTrustScreen | Partial |
| `/sign-in` | SignInScreen | Partial |
| `/oauth/oura/callback` | WearableOAuthCallbackScreen | Partial |
| `/oauth/whoop/callback` | WearableOAuthCallbackScreen | Partial |

### Signed-in (ShellRoute)

| Path | Screen | Status |
|------|--------|--------|
| `/welcome` | WelcomeScreen | Partial |
| `/today` | TodayScreen | Partial |
| `/today/risk` | TodayRiskScreen | Partial |
| `/my-health` | MyHealthScreen | Partial |
| `/biometrics` | BiometricsHubScreen | Partial |
| `/biometrics/:metricKey` | MetricDetailScreen | Partial |
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
| `/care/inbox` | CareInboxScreen | Partial |
| `/care/:ownerId` | CareDashboardScreen | Partial |
| `/settings/sharing` | SharingScreen | Partial |
| `/settings/travel` | SettingsPlaceholderScreen | **Stub** |
| `/settings/reports` | redirect → `/reports/metrics` | Partial |
| `/reports` | redirect → `/reports/metrics` | Partial |
| `/reports/metrics` | ReportsMetricsScreen | Partial |
| `/reports/documents` | ReportsDocumentsScreen | Partial |
| `/reports/medical-history` | ReportsMedicalHistoryScreen | Partial |
| `/reports/new` | ReportsUploadScreen | Partial |
| `/reports/:reportId` | ReportsDetailScreen | Partial |
| `/reports/trends/:metricKey` | ReportsTrendScreen | Partial |
| `/contact` | ContactScreen | Partial |
| `/settings/privacy` | PrivacyScreen | Partial |
| `/settings/how-purple-thinks` | HowPurpleThinksScreen | Partial |
| `/chat` | ChatScreen | Partial |
| `/chat-care` | ChatCareScreen | Partial |

**Flutter-only:** `/sign-in`, OAuth callbacks, `/contact` (web also has marketing `/contact`).

---

## Web `_app` routes still Missing or Stub in Flutter

### Missing (22 paths — no GoRouter entry)

| Web path | Web file |
|----------|----------|
| `/my-health-dna` | `my-health-dna.tsx` |
| `/apple-health-import` | `apple-health-import.tsx` |
| `/timeline` | `timeline.tsx` |
| `/insights` | `insights.tsx` |
| `/care/$ownerId/reports/$reportId` | `care.$ownerId.reports.$reportId.tsx` |
| `/settings/terms` | `settings.terms.tsx` |
| `/condition/$slug` | `condition.$slug.tsx` |
| `/community-new` | `community-new.tsx` |
| `/friends/$friendshipId` | `friends.$friendshipId.tsx` |
| `/admin` + 12 children | `admin*.tsx` (13 routes) |

Note: `/biometrics/$metric` is covered by `/biometrics/:metricKey` (**Partial**, not Missing). `/vitals/metric/:metricKey` mirrors web vitals drilldown (**Partial**).

### Stub (1 path)

| Path | Notes |
|------|-------|
| `/settings/travel` | Placeholder copy only |

### Partial (32 paths)

All other `_app` web routes have a Flutter GoRouter entry but fail full web parity (data depth, design checklist, or Worker-only actions).

---

## Route gap counts

| Category | Count (of 55 `_app` web routes) | Δ vs pre-fleet |
|----------|----------------------------------|----------------|
| **Missing** | **22** | −8 |
| **Stub** | **1** | −2 |
| **Partial** | **32** | +10 |
| **Parity** | **0** | — |
| **Total gaps (Missing + Stub)** | **23** | −10 |

Marketing: **25** routes intentionally absent from Flutter (TanStack-only); **5** core marketing paths **Partial** in Flutter; **2** shared auth (`/sign-in`, OAuth callbacks).

---

## TestFlight / ASC status

| Build | Processing | Internal | External | Uploaded |
|-------|------------|----------|----------|----------|
| **1.0 (17)** | **VALID** | IN_BETA_TESTING | READY_FOR_BETA_SUBMISSION | 2026-07-05 ~07:13 PT |
| 1.0 (16) | VALID | IN_BETA_TESTING | READY_FOR_BETA_SUBMISSION | 2026-07-05 |
| 1.0 (15) | VALID | IN_BETA_TESTING | READY_FOR_BETA_SUBMISSION | 2026-07-05 |

Verify: `bun run ios:check-asc-builds`, `bun run ios:check-tf-feedback`.

---

## Recommended implementation slices (ordered)

1. **P0-2** — My Body nav target + vitals/biometrics chart depth (routes exist; polish synced-data UX).
2. **P0-3** — Register Oura native redirect; surface inline Tools error (`oura-native-redirect-console`).
3. **P0-8** — Marketing `/care.accept` deep link into Flutter inbox.
4. **P0-6** — Meds toolbar, 24h timeline, FAB + form sheet.
5. **P0-9** — Reports upload/trends/detail parity vs web.
6. **P0-1** — Pull Luciq crashes after TF17 tester session; file fixes.
7. **P1-3** — `/insights` route + bottom nav tab.

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

*Audit refresh 2026-07-05 post-TF17 fleet. Route inventory only; no screen implementation in this pass.*

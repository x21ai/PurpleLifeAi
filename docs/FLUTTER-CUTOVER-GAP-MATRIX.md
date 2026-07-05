# Flutter Stage 5 Cutover Gap Matrix (Stage 0)

**Date:** 2026-07-04  
**Baseline:** Web `src/routes/_app/**` vs Flutter `flutter/lib/shell/routes.dart` + `router.dart`  
**Phase reference:** `docs/LOVABLE-FLUTTER-SYNC.md` Phase 1 table (marked complete 2026-07-04)  
**Status legend:** **Parity** | **Partial** | **Stub** | **Missing**

---

## Executive summary

| Metric | Web | Flutter |
|--------|-----|---------|
| Signed-in route files | 55 under `src/routes/_app/` | 18 GoRouter paths (incl. `/sign-in`) |
| Phase complete (per runbook) | Production web on TanStack | **Phase 1 only** (auth + shell + route map) |
| Capacitor interim | ASC build 1.0 (9) live | Flutter TestFlight path not ready |

### Stage 5 Go/No-Go (today): **NO-GO**

Flutter is not at Phase 5 exit criteria (*TestFlight/Play beta, optional Flutter web, owner Capacitor retirement decision*). Phase 1 route map exists; Phases 2–4 are largely open.

---

## Phase 1 cross-check (`docs/LOVABLE-FLUTTER-SYNC.md`)

| Phase 1 area | Doc status | Stage 0 reassessment |
|--------------|------------|----------------------|
| Auth + session | Done | **Partial** — email/password + Google/Apple OAuth; no sign-up/reset-password routes |
| Shell | Done | **Parity** — `NativeAppShell`, glass bottom nav, top bar, `endDrawer` menu, `OfflineBanner` |
| GoRouter map | Done | **Partial** — 18 routes vs 55 web `_app` routes |
| Loading polish | Done | **Parity** — `LoadingSkeleton` on core async screens |
| Offline UX | Done | **Partial** — Drift cache + sync queue on some tables; not all writes queued |
| Codegen (Drift) | Done | **Parity** — `database.g.dart` present |

Phase 1 "functional vs stub" table still accurate for Chat, Sharing, Travel, Reports/Contact placeholders, and Tools OAuth.

---

## Web route inventory (`src/routes/_app/**`)

55 files → signed-in URL map:

| URL path | Web file |
|----------|----------|
| `/welcome` | `welcome.tsx` |
| `/today` | `today.tsx` |
| `/today/risk` | `today.risk.tsx` |
| `/vitals` | `vitals.tsx` |
| `/biometrics` | `biometrics.index.tsx` |
| `/biometrics/$metric` | `biometrics.$metric.tsx` |
| `/my-health` | `my-health.tsx` |
| `/my-health-dna` | `my-health-dna.tsx` |
| `/apple-health-import` | `apple-health-import.tsx` |
| `/journal` | `journal.index.tsx` |
| `/journal/new` | `journal.new.tsx` |
| `/seizures/new` | `seizures.new.tsx` |
| `/timeline` | `timeline.tsx` |
| `/hydration` | `hydration.tsx` |
| `/insights` | `insights.tsx` |
| `/meds` | `meds.tsx` |
| `/meds/$medId` | `meds.$medId.tsx` |
| `/meds/history` | `meds.history.tsx` |
| `/reports` | `reports.tsx` (layout) |
| `/reports/metrics` | `reports.metrics.tsx` |
| `/reports/documents` | `reports.documents.tsx` |
| `/reports/medical-history` | `reports.medical-history.tsx` |
| `/reports/new` | `reports.new.tsx` |
| `/reports/$reportId` | `reports.$reportId.tsx` |
| `/reports/trends/$metricKey` | `reports.trends.$metricKey.tsx` |
| `/chat` | `chat.tsx` |
| `/chat-care` | `chat-care.tsx` |
| `/care` | `care.index.tsx` |
| `/care/inbox` | `care.inbox.tsx` |
| `/care/$ownerId` | `care.$ownerId.tsx` |
| `/care/$ownerId/reports/$reportId` | `care.$ownerId.reports.$reportId.tsx` |
| `/settings` | `settings.tsx` |
| `/settings/sharing` | `settings.sharing.tsx` |
| `/settings/travel` | `settings.travel.tsx` |
| `/settings/privacy` | `settings.privacy.tsx` |
| `/settings/terms` | `settings.terms.tsx` |
| `/settings/how-purple-thinks` | `settings.how-purple-thinks.tsx` |
| `/account` | `account.tsx` |
| `/tools` | `tools.tsx` |
| `/condition/$slug` | `condition.$slug.tsx` |
| `/community-new` | `community-new.tsx` |
| `/friends/$friendshipId` | `friends.$friendshipId.tsx` |
| `/admin` | `admin.tsx` (layout) |
| `/admin/` | `admin.index.tsx` |
| `/admin/users` | `admin.users.tsx` |
| `/admin/billing` | `admin.billing.tsx` |
| `/admin/community` | `admin.community.tsx` |
| `/admin/contact` | `admin.contact.tsx` |
| `/admin/feedback` | `admin.feedback.tsx` |
| `/admin/messages` | `admin.messages.tsx` |
| `/admin/migration-export` | `admin.migration-export.tsx` |
| `/admin/promo` | `admin.promo.tsx` |
| `/admin/reports/duplicates` | `admin.reports.duplicates.tsx` |
| `/admin/resources` | `admin.resources.tsx` |
| `/admin/rules` | `admin.rules.tsx` |

OAuth callbacks (outside `_app` but required for wearables): `/oauth/oura/callback`, `/oauth/whoop/callback`.

---

## Flutter route inventory

From `flutter/lib/shell/routes.dart` + `router.dart`:

| Path | Screen | In bottom nav |
|------|--------|---------------|
| `/sign-in` | `SignInScreen` | — |
| `/welcome` | `WelcomeScreen` | — |
| `/today` | `TodayScreen` | Yes |
| `/vitals` | `VitalsScreen` | Yes |
| `/journal` | `JournalScreen` | FAB |
| `/journal/new` | `JournalCaptureScreen` | — |
| `/meds` | `MedsScreen` | Yes |
| `/settings` | `SettingsScreen` | Yes |
| `/account` | `AccountScreen` | Menu |
| `/tools` | `ToolsScreen` | Menu |
| `/care/:ownerId` | `CareDashboardScreen` | Menu → sharing stub |
| `/settings/sharing` | `SharingScreen` (placeholder) | — |
| `/settings/travel` | `SettingsPlaceholderScreen` | — |
| `/settings/reports` | `SettingsPlaceholderScreen` | — |
| `/settings/contact` | `SettingsPlaceholderScreen` | — |
| `/chat` | `ChatScreen` (stub) | — |
| `/chat-care` | `ChatCareScreen` (stub) | — |

---

## Priority feature matrix (requested areas)

| Feature / route | Web | Flutter | Status | Gap notes |
|-----------------|-----|---------|--------|-----------|
| **Today** `/today` | Full dashboard | `TodayScreen` + `today_repository.dart` | **Partial** | Scores, narrative, doses, pull-to-refresh, sync bar. Missing: `/today/risk`, hydration quick-add, travel banners, weekly recap, condition tips |
| **Today risk** `/today/risk` | Risk drilldown | — | **Missing** | No route |
| **Vitals** `/vitals` | Goals + grid + insights link | `VitalsScreen` + offline biometrics | **Partial** | Real reads, empty states, sync bar. No metric drilldown |
| **Biometrics hub** `/biometrics`, `/biometrics/$metric` | Full metric browser + charts | Folded into Vitals only | **Missing** / **Partial** | No per-metric route or charts |
| **My Health** `/my-health` | Body/condition hub | — | **Missing** | |
| **Meds** `/meds` | Library + today's doses + add flows | `MedsScreen` + dose actions | **Partial** | Read/mark doses, filters, offline. No add/edit med, schedules UI, scan/voice |
| **Meds detail** `/meds/$medId` | Full med editor | — | **Missing** | |
| **Meds history** `/meds/history` | Editable dose history | — | **Missing** | |
| **Journal** `/journal` | List, archive, AI summaries | `JournalScreen` | **Partial** | Displays `ai_summary` if present; no on-device trigger for `journal-processor` |
| **Journal capture** `/journal/new` | Text, voice, photo | `JournalCaptureScreen` | **Partial** | Text + offline queue only; no voice/photo |
| **Settings hub** `/settings` | Full hub + child `<Outlet/>` | `SettingsScreen` | **Partial** | Hub navigation works; several targets are stubs |
| **Settings/sharing** | Invite, scopes, caregiver list | `SharingScreen` placeholder | **Stub** | |
| **Settings/travel** | Trip mode, ICS export | Placeholder | **Stub** | |
| **Settings/privacy** | Privacy controls | — | **Missing** | |
| **Settings/terms** | Terms link | — | **Missing** | |
| **Settings/how-purple-thinks** | AI explainer | — | **Missing** | |
| **Settings/reports** (Flutter) | N/A (web uses `/reports/*`) | Placeholder | **Stub** | Web reports tree entirely absent |
| **Settings/contact** | Contact form | Placeholder | **Stub** | |
| **Account** `/account` | Profile, 2FA, billing, export | `AccountScreen` | **Partial** | Profile read + sign out; password, 2FA, locale, subscription are UI stubs |
| **Tools** `/tools` | Wearable OAuth, Apple Health, notifications | `ToolsScreen` | **Partial** | Static device cards; Connect `onPressed: () {}`. `AppleHealthPanel` exists but is **not wired** |
| **Care index** `/care` | People you care for | Menu → `/settings/sharing` | **Missing** | No `/care` list route |
| **Care inbox** `/care/inbox` | Pending invites | — | **Missing** | |
| **Care dashboard** `/care/$ownerId` | Scoped tabs, writes, reports | `CareDashboardScreen` | **Partial** | Scoped tabs, biometrics read. Missing invite flow, inbox, reports sub-route |
| **Chat** `/chat` | Streaming AI via Worker | `ChatScreen` | **Stub** | Empty state only |
| **Chat care** `/chat-care` | Caregiver DMs | `ChatCareScreen` | **Stub** | Empty state only |
| **Welcome** `/welcome` | Name, conditions, wearables, notifications | `WelcomeScreen` | **Partial** | First name + `onboarded_at` only |
| **Health native** | Capacitor + webhook on web | `health_service.dart`, `native_health_sync.dart`, `apple_health_panel.dart` | **Partial** | iOS entitlements + Worker `/api/health/native-sync`. Panel not integrated in Tools |
| **OAuth wearables** | `/tools` + `/oauth/*/callback` + cron/edge | Static cards + `SyncStatusBar` pull if tokens exist | **Stub** | No Flutter OAuth connect |
| **Push / med reminders** | SW alarms, web push, `med-dose-action` | Notifications section placeholder | **Missing** | No `flutter_local_notifications`, FCM/APNs, or `native_push_tokens` client |
| **Reports** `/reports/*` | Full labs/reports UX | — | **Missing** | 7 web routes |
| **Seizures / timeline / hydration** | Logging surfaces | — | **Missing** | |
| **Apple Health XML import** | `/apple-health-import` | — | **Missing** | |
| **DNA** `/my-health-dna` | Pro upload | — | **Missing** | |
| **Community / friends / conditions** | Social + condition pages | — | **Missing** | |
| **Admin** `/admin/*` | 13 admin routes | — | **Missing** | Likely out of mobile cutover scope |

---

## Full route-by-route matrix (all `_app` routes)

| Web route | Flutter route | Status |
|-----------|---------------|--------|
| `/welcome` | `/welcome` | Partial |
| `/today` | `/today` | Partial |
| `/today/risk` | — | Missing |
| `/vitals` | `/vitals` | Partial |
| `/biometrics` | — (vitals overlap) | Missing |
| `/biometrics/$metric` | — | Missing |
| `/my-health` | — | Missing |
| `/my-health-dna` | — | Missing |
| `/apple-health-import` | — | Missing |
| `/journal` | `/journal` | Partial |
| `/journal/new` | `/journal/new` | Partial |
| `/seizures/new` | — | Missing |
| `/timeline` | — | Missing |
| `/hydration` | — | Missing |
| `/insights` | — | Missing |
| `/meds` | `/meds` | Partial |
| `/meds/$medId` | — | Missing |
| `/meds/history` | — | Missing |
| `/reports` + 6 children | `/settings/reports` stub only | Missing |
| `/chat` | `/chat` | Stub |
| `/chat-care` | `/chat-care` | Stub |
| `/care` | — | Missing |
| `/care/inbox` | — | Missing |
| `/care/$ownerId` | `/care/:ownerId` | Partial |
| `/care/$ownerId/reports/$reportId` | — | Missing |
| `/settings` | `/settings` | Partial |
| `/settings/sharing` | `/settings/sharing` | Stub |
| `/settings/travel` | `/settings/travel` | Stub |
| `/settings/privacy` | — | Missing |
| `/settings/terms` | — | Missing |
| `/settings/how-purple-thinks` | — | Missing |
| `/account` | `/account` | Partial |
| `/tools` | `/tools` | Partial |
| `/condition/$slug` | — | Missing |
| `/community-new` | — | Missing |
| `/friends/$friendshipId` | — | Missing |
| `/admin/*` (13 routes) | — | Missing |

**Flutter-only:** `/sign-in` (web uses marketing auth routes outside `_app`).

**Counts:** Parity 0 · Partial 12 · Stub 5 · Missing 38+ (admin/community block)

---

## Stage 5 blockers (ordered)

### P0 — Cutover gates (Phase 4–5)

1. **Wearable OAuth** — Oura/Whoop connect is noop in `tools_screen.dart`; no `/oauth/*/callback` handling in Flutter.
2. **Native health UX** — `AppleHealthPanel` built but not mounted; Tools shows static "Not connected".
3. **Push + local med reminders** — No notification stack in `pubspec.yaml`; Tools notifications row is placeholder.
4. **Chat** — `/chat` and `/chat-care` are empty-state stubs; no Worker `/api/chat` streaming.
5. **Caregiver flows** — Sharing stub; no `/care`, `/care/inbox`, invite accept, or care chat.
6. **Meds depth** — No `/meds/$medId`, `/meds/history`, add med, or reminder scheduling.
7. **Reports / labs** — Entire `/reports/*` tree missing.
8. **Store ship path** — No Flutter `ExportOptions.plist`, `flutter build ipa` pipeline, or Play internal track doc completion (Capacitor ASC 1.0 (9) is separate track).

### P1 — Phase 2–3 parity

9. **Biometrics drilldown** — `/biometrics/$metric` charts and goals.
10. **Journal multimodal** — Voice, photo, AI extraction pipeline.
11. **Today sub-routes** — Risk, hydration, travel, recap cards.
12. **Settings completeness** — Privacy, terms, how-purple-thinks, real contact form.
13. **Account** — Password, 2FA, locale persistence, Stripe subscription, data export.
14. **Welcome onboarding** — Conditions, wearables, notification prefs (web parity).

### P2 — Scope decisions

15. **Admin / community / DNA** — Explicit exclude-from-Flutter decision needed for Stage 5, or accept Missing.
16. **Capacitor retirement** — Owner decision per Phase 5; dual-ship until parity proven on device.
17. **Flutter web production** — Local preview only (`:8765`); no Worker static route or subdomain.

---

## Phase roadmap alignment

| Phase | Goal | Current state |
|-------|------|---------------|
| **0** Foundation | Scaffold, tokens, CI | Done |
| **1** Auth + shell | Route map, nav, offline banner | **Done** (per runbook) |
| **2** Core health home | Today, vitals, my-health deep parity | **In progress** — Partial Today/Vitals; my-health Missing |
| **3** Journal + meds + settings | Feature parity, local dose reminders | **Early** — Partial journal/meds; settings stubs; no reminders |
| **4** Native integrations | HealthKit, wearables OAuth, offline queue, push | **Early** — Health code exists unwired; OAuth/push Missing |
| **5** Store parity + cutover | TestFlight/Play beta, Capacitor decision | **Not started** |

---

## Verification commands (Stage 0)

```bash
# Web route count
find src/routes/_app -name '*.tsx' | wc -l

# Flutter routes
grep -E "static const|path: AppRoutes" flutter/lib/shell/routes.dart flutter/lib/shell/router.dart

# Phase 1 gates
cd flutter && flutter analyze lib/ && flutter test

# Native health code present but unwired
rg "AppleHealthPanel" flutter/lib
rg "onPressed: \(\) \{\}" flutter/lib/features/tools/tools_screen.dart
```

---

## Recommended next slices

1. Wire `AppleHealthPanel` into `ToolsScreen` device cards (iOS/Android only).
2. Port `/settings/sharing` + `/care` index from web `settings.sharing.tsx` / `care.index.tsx`.
3. Add `/meds/$medId` and `/meds/history` routes.
4. Implement Oura/Whoop OAuth via `url_launcher` + deep link callbacks.
5. Add `flutter_local_notifications` for dose reminders (Phase 3).
6. Port `/chat` streaming client against Worker `/api/chat`.

---

*Stage 0 read-only audit. See `docs/FLUTTER-STAGE1-SIGNOFF.md` for automated Stage 1 gates and `docs/features/PHASE5_CUTOVER_ORCHESTRATOR.md` for staged cutover plan.*

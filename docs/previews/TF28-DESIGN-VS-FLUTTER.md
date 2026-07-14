# TF28 Design vs Flutter (Merged Today)

**Date:** 2026-07-13T03:25:21Z  
**Build target:** Flutter `1.0.0+28` (ASC may still show **1.0.0 (27)** if upload blocked)  
**Design source:** `docs/previews/personalized-dashboard-preview.html` · `data-layout=merged` · serve `:8766`  
**Flutter source:** Flutter web release on `http://127.0.0.1:8765` · E2E user `e2e-smoke@purplelife.org`  
**Screenshot dir:** `test-results/flutter-qa-tf28/`  
**Walkthrough video:** `test-results/flutter-qa-tf28/flutter-qa-walkthrough.mp4`  
**Absolute video path:** `/Users/aa/Desktop/x21/PurpleL/Repo/purpledrw/test-results/flutter-qa-tf28/flutter-qa-walkthrough.mp4`

---

## Evidence status

| Artifact | Path | Status |
|----------|------|--------|
| Design scores / narrative / meds / hydration | `design-today-*.png` | **Present** (780×1688) |
| Flutter scores / top | `flutter-today-scores.png`, `flutter-today-top.png` | **PASS** signed-in Merged Today (greeting, date strip, scores/signals). **Not** marketing. |
| Flutter narrative / meds / hydration | `flutter-today-{narrative,meds,hydration}.png` | **PASS** signed-in expand regions (780×1688). **Not** marketing. |
| Flutter quick log / keyboard / journal | `flutter-log-expand.png`, `flutter-keyboard-*.png`, `flutter-journal.png` | **Present** (sibling QA) |
| Walkthrough video | `flutter-qa-walkthrough.mp4` | **Present** (captioned design↔Flutter slideshow) |

### Crop PASS/FAIL (Flutter web E2E, this recapture)

| Crop | Result | Notes |
|------|--------|-------|
| Auth path | **PASS** | Doppler `cursor-cloudflare`/`prd_cloudlfare` E2E password grant → session inject `sb-auth-auth-token` → `/today` (Cursor IDE browser) |
| `flutter-today-scores.png` / `top` | **PASS** | Greeting + Jul 12 date strip + Readiness/Sleep/Activity + Your signals (vitals empty —) |
| `flutter-today-narrative.png` | **PARTIAL** | Icon row + Meds expand / Last 7 stub; Maya body empty for E2E |
| `flutter-today-meds.png` | **PASS** | Meds expand; "No medications scheduled" (Taken N/A on E2E) |
| `flutter-today-hydration.png` | **PARTIAL** | Hydration selected + Open hydration CTA (inline quick-add not in this frame) |
| Marketing false-positive | **CLEARED** | Prior wrong-surface landing ("Your health, remembered.") overwritten |

**Method:** Cursor IDE browser on `http://127.0.0.1:8765/today` after E2E session restore; CDP `Page.captureScreenshot` at 780×1688. Design from `:8766` Merged preview. No TF upload from this agent.

---

## Side-by-side images

### 1. Scores / greeting / signals

| Design | Flutter (`flutter-today-scores.png`) |
|--------|--------------------------------------|
| ![design-today-scores](../../test-results/flutter-qa-tf28/design-today-scores.png) | ![flutter-today-scores](../../test-results/flutter-qa-tf28/flutter-today-scores.png) |

**Design:** Mock Readiness ~80 + catch-up + filled signals. **Flutter:** Live E2E empty vitals (—), greeting, date strip, Your signals grid. Layout contract matches; data depth differs (mock vs empty).

### 2. Narrative + icon row

| Design | Flutter (`flutter-today-narrative.png`) |
|--------|-----------------------------------------|
| ![design-today-narrative](../../test-results/flutter-qa-tf28/design-today-narrative.png) | ![flutter-today-narrative](../../test-results/flutter-qa-tf28/flutter-today-narrative.png) |

**Design:** Maya reading + Meds selected + dose chrome. **Flutter:** Signals + Meds expand empty-state + Last 7 days stub + icon row.

### 3. Meds expand

| Design | Flutter (`flutter-today-meds.png`) |
|--------|------------------------------------|
| ![design-today-meds](../../test-results/flutter-qa-tf28/design-today-meds.png) | ![flutter-today-meds](../../test-results/flutter-qa-tf28/flutter-today-meds.png) |

**Design:** Timed doses + reminders nudge. **Flutter:** Icon row; E2E has no dose rows (Taken not exercisable). Code still has Taken/Snooze/Skip + refill.

### 4. Hydration expand

| Design | Flutter (`flutter-today-hydration.png`) |
|--------|-----------------------------------------|
| ![design-today-hydration](../../test-results/flutter-qa-tf28/design-today-hydration.png) | ![flutter-today-hydration](../../test-results/flutter-qa-tf28/flutter-today-hydration.png) |

**Design:** Progress + week bars + ml/oz chips. **Flutter (this build):** Hydration selected with **"Open hydration"** CTA (partial vs design inline quick-add).

### 5. Video + Quick log

| Walkthrough | Quick log |
|-------------|-----------|
| `flutter-qa-walkthrough.mp4` | ![flutter-log](../../test-results/flutter-qa-tf28/flutter-log-expand.png) |

---

## Visual differences (design PNGs + signed-in Flutter PNGs + code)

1. **Last 7 days:** Design trend grid; Flutter stub + Open Data ›.
2. **Hydration expand:** Design inline chips/week bars; Flutter expand CTA (rebuild if `TodayHydrationPanel` tip newer than this web build).
3. **Signals:** Design Sleep time + mock values; Flutter Sleep score + — empties.
4. **Meds:** Design timeline + reminders; Flutter empty-state on E2E; Taken path code-only until meds exist.
5. **Score tap / ScoreHero / onboarding pill:** Still code-level gaps (see matrix below).

---

## Layout contract (Merged Today)


Preview `renderTodayMerged` order vs Flutter `_MergedTodayBody` (`today_screen.dart`):

| # | Design (Merged) | Flutter | Status |
|---|-----------------|---------|--------|
| 1 | Missed-dose catch-up slim + Log ▾ | `MissedDoseCatchupBanner` | **Match** (code; device UNVERIFIED) |
| 2 | Date eyebrow `EEEE, MMM d` | Same `DateFormat` | **Match** |
| 3 | Greeting `Good …, {name}.` | `_Header` + greeting | **Match** |
| 4 | Date strip | `DateStrip` | **Match** |
| 5 | Score tiles Readiness / Sleep / Activity | `TodayScoreTiles` + `ScoreTile` FittedBox | **Match** (TF27 wrap fix in code) |
| 6 | Your signals grid + View all | `TodayYourSignals` | **Partial** (metric set differs; nulls shown as —) |
| 7 | Maya "Today's reading" card | `TodayMayaCard` ~15sp body | **Partial** (size fixed in code; device UNVERIFIED `tf27-huge-narrative`) |
| 8 | Apple / team announcement → Log | `_AnnouncementBanner` | **Match** |
| 9 | Icon row Meds / Hydration / Wearables / Log | `TodayIconActionRow` (Meds default open) | **Match** |
| 10 | Expand panels (one open) | `TodayExpandPanelShell` + bodies | **Match** shell; depth varies |
| 11 | Last 7 days trend grid + week recap | `TodayLastSevenDaysCard` stub → Data | **Partial / stub** |
| 12 | Recommended compact row | `TodayRecommendedRow` (if wired) | **Partial** |
| — | Onboarding pill (`onboarding-pill`) | `TodayPersonalizationStrip` exists but **not mounted** on Today | **Missing on screen** |
| — | Dose reminders nudge | Preview `reminders-nudge` | **Missing** in Flutter Today |
| — | Meds mini timeline segments | Preview `meds-timeline` | **Missing** (`MedsMiniTimeline`) |

---

## Element gap matrix

Legend: **Match** · **Partial** · **Missing** · **Broken** (code claims fix, device pending)

### Scores and narrative

| Design element | Flutter | Status | Notes |
|----------------|---------|--------|-------|
| 3-up score tiles, serif/large numeral | `ScoreTile` 40/32sp + FittedBox | **Match** | Preview CSS `.score-tile .val` 28px; Flutter uses FittedBox to stop wrap (`tf27-score-font-wrap`) |
| Active tile ring / glass | Active glass + purple ring | **Match** | |
| Score tap → focus / ScoreHero risk | Tap → `/data` only | **Partial** | Preview `data-stat-tap`; no ScoreHero overlay (`tf27-newdesign-today-capability-gaps`) |
| Maya card tag "Today's reading" | Same tag + bodySerif 15sp | **Partial** | Compacted vs token 17sp; device QA row still UNVERIFIED |
| Duplicate narrative under greeting | Lede is condition prompt when narrative present | **Match** | `tf-today-duplicate-narrative` resolved |

### Your signals

| Design element | Flutter | Status | Notes |
|----------------|---------|--------|-------|
| HRV, Resting HR, SpO2, Stress, Steps | Present | **Match** | |
| Sleep time (duration) | **Sleep score** instead | **Partial** | Preview key `sleep_duration`; Flutter uses `sleep_score` |
| Temp Δ, Resp | Present | **Match** | |
| Hide null metrics | Always 8 tiles with — | **Partial** | Preview shows mock values; web checklist wants filter-nulls |
| Empty "Connect a device…" | Not specialized | **Partial** | Relies on — grid |

### Meds expand

| Design element | Flutter | Status | Notes |
|----------------|---------|--------|-------|
| Panel "Today's doses" + close | `TodayExpandPanelShell` + `TodayMedsSection` | **Match** | |
| Taken / Snooze / Skip inline | Wired; Taken gated by `outOfStock` | **Match** (code) | Device UNVERIFIED `tf27-taken-blocked` |
| 0 pills → Refill chip / sheet | `MedRefillSheet` via `onRefill` | **Match** (code) | Device UNVERIFIED; DB `pills_remaining` trigger still open |
| Segment timeline above doses | None | **Missing** | Preview `meds-timeline` |
| Reminders nudge Enable / Not now | None | **Missing** | Preview `reminders-nudge` |
| Time stack AM/PM | Dose time display | **Partial** | Simpler than preview `dose-time-stack` |

### Hydration expand

| Design element | Flutter | Status | Notes |
|----------------|---------|--------|-------|
| Lede "Log every drink…" | Same | **Match** | |
| Today total + % goal + progress bar | L / goal · % + `LinearProgressIndicator` | **Partial** | Preview uses oz + ml copy; Flutter liters |
| Quick-add 200/250/500 + Water + Electrolyte + Custom | `QuickAddWater` compact (250/500 + Water + Electrolytes + custom sheet) | **Partial** | No 200 ml chip; no +8/+12/+16 oz grid |
| Week capsule bars in panel | Not in Today panel | **Missing** | Only on preview hydration panel + seven-day |
| Entry list in expand | Not in compact panel | **Partial** | Day view `/hydration` has list |
| Day view › | TextButton → `AppRoutes.hydration` | **Match** | |

### Wearables / Log

| Design element | Flutter | Status | Notes |
|----------------|---------|--------|-------|
| Wearables status rows + Connect | Expand + `SyncStatusBar` fail-open | **Partial** | Preview mock device list richer |
| Quick log composer + when row | `TodayQuickLogPanel` | **Partial** | Voice/video coming soon (snackbar) |
| Aura / Seizure chips when epilepsy | Condition-gated chips if present | **Partial** | Verify against `showsSeizureFeatures` |

### Last 7 days

| Design element | Flutter | Status | Notes |
|----------------|---------|--------|-------|
| Trend metric grid (hydration, steps, activity, sleep, HRV, readiness, missed) | Stub copy + Open Data › | **Missing** depth | `TodayLastSevenDaysCard`; OPEN-ISSUES notes rich grid still sibling-owned |
| Week recap insight + chips + spark | None | **Missing** | |
| Recommended compact row | Present in widgets / screen suite | **Partial** | Depends on conditions catalog |

### Shell / TF28 P0 behaviors (not visual-only)

| Behavior | Flutter | Status |
|----------|---------|--------|
| Keyboard dismiss on Today (scroll / tap / expand) | Shell + Today unfocus | **Match** (code); device UNVERIFIED `tf27-stuck-keyboard` |
| Journal Save under status bar | `viewPadding` + nested Scaffold | **Match** (code); device UNVERIFIED |
| Journal photo attach | Camera/library → journal-media | **Match** (code); device UNVERIFIED |
| Missed-dose catch-up menu actions | I took it / missed / Review / Not now | **Match** (code); device UNVERIFIED |

---

## Notable visual differences (code-level)

1. **Last 7 days:** Preview ships a full `trend-metric-grid` with capsule bars; Flutter is a single glass stub linking to Data. Largest remaining Merged visual gap on Today.
2. **Signals metric set:** Preview "Sleep time" vs Flutter "Sleep score"; Flutter always paints empty — cells.
3. **Score interaction:** Preview tiles are stat-tap targets; Flutter routes to `/data` without ScoreHero / risk focus overlay.
4. **Hydration chrome:** Preview oz + dual quick rows (ml chips + oz grid); Flutter liter progress + compact ml chips.
5. **Meds chrome:** Preview timeline segments + reminders nudge absent in Flutter; dose actions and refill path are present in code.
6. **Onboarding pill:** Implemented as `TodayPersonalizationStrip` but not inserted into `_MergedTodayBody` build list.
7. **Typography:** Preview score val ~28px serif; Flutter 32–40sp with FittedBox (intentionally smaller active size than older 56sp wrap bug).

---

## TF28 device QA cross-links

From `docs/OPEN-ISSUES.md` **TF28 device QA** (all **UNVERIFIED** until physical TF 28):

| Row | Id | Relates to this report |
|-----|-----|------------------------|
| Taken | `tf27-taken-blocked` | Meds expand |
| Refill 0 pills | `meds-pill-stock-*` | Meds expand / refill chip |
| Keyboard | `tf27-stuck-keyboard` | Today interaction |
| Score fonts | `tf27-score-font-wrap` | Score tiles image slot |
| Narrative | `tf27-huge-narrative` | Maya card image slot |
| Journal | `tf27-journal-*` | Journal screenshot slot |
| Hydration | `tf27-newdesign-today-capability-gaps` | Hydration image slot |
| Catch-up | `flutter-missed-dose-catchup-log-dropdown` | Banner above greeting |

Standing design parity: `superpower-design-parity` (Merged approved in preview; production Partial). Capability inventory: `tf27-newdesign-today-capability-gaps`.

---

## How to refresh screenshots

1. Design: `./scripts/preview-design-serve.sh` → `?layout=merged` on `:8766` → save `design-today-*.png`.
2. Flutter: `./scripts/flutter-web-serve.sh` (rebuild only if Today tip newer than `build/web`) → **sign in** with Doppler E2E creds (`cursor-cloudflare`/`prd_cloudlfare`) → `/today` → save `flutter-today-*.png` (must show greeting / scores / Meds / Hydration, not marketing home).
3. Re-open this doc; confirm crops are signed-in Merged Today before claiming parity.

---

## Verdict

**Design PNGs: linked and usable.** **Flutter `flutter-today-*.png`: signed-in Merged Today recaptured** (greeting, date strip, scores/signals, Meds empty-state, Hydration expand CTA). Marketing wrong-surface cleared. Residual visual gaps vs design (Last 7 grid, hydration oz/week chips, meds timeline/reminders, Sleep time, ScoreHero, onboarding pill) remain. Not a TF28 device PASS.

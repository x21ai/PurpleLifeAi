## Goal

When a user taps a date in the strip on `/today`, every data section below re-queries for that day instead of always showing "latest". Selecting today keeps current behavior.

## Scope

Frontend only. Reuse existing server functions and Supabase queries; no schema changes, no new endpoints.

## Changes

### 1. `src/lib/health-scores.functions.ts`
- Add optional `date?: string` (YYYY-MM-DD) input to `getScoreSnapshot` via `.inputValidator`.
- When `date` is provided, filter biometrics to `recorded_at` within that local day and return the latest row inside that window (still 60-day lookback for `stepsAvg30/60`, which stay "trailing from today"). When absent, current behavior is unchanged.

### 2. `src/components/today/today-vitals.tsx`
- Accept optional `date?: Date` prop.
- Include the date in the react-query `queryKey` (`["score-snapshot", ymd]`) and pass it to `fetchSnapshot({ data: { date: ymd } })`.
- Empty-state copy for non-today days: "No signals recorded on {date}."

### 3. `src/components/meds/today-doses.tsx` and `src/components/meds/meds-mini-timeline.tsx`
- Accept optional `date?: Date` prop.
- When `date` is today (or omitted), keep `ensureTodayDoses` behavior.
- When `date` is a past day, use existing `getDosesForDate(userId, date)` (already in `src/lib/meds-today.ts`) and disable status-change actions with a small "Viewing {date}" note; hide the notification-permission nudge.
- Section title switches from "Today's doses" to "Doses on {date}".

### 4. `src/routes/_app/today.tsx`
- Pass `selectedDate` to `<TodayVitals>`, `<MedsMiniTimeline>` and `<TodayDoses>`.
- Compute `isToday = isSameDay(selectedDate, new Date())`.
- When `!isToday`:
  - Hide today-only nudges: `TodayInstallBanner`, `MissedDoseCatchup`, `TodayEmptyState`, `RestoreBanner`, `IncomingCareInvitesCard`, `FirstEntryNudge`, `ReEngagementNudge`, `OnboardingChecklist`, `ConditionWelcomeNudge`, admin announcement, hydration/aura quick-add, trip banner.
  - Replace the "historical stats coming soon" caption with a compact "Viewing {EEEE, MMMM d} — [Back to today]" bar just under the strip.
  - Keep the score tiles/vitals/doses cards visible and driven by `selectedDate`.
- Journal count query: when `!isToday`, also query journal entries created on that day for the "journal" quick action badge (optional; only if trivial — otherwise skip).

### 5. `BodyMeasurementsRow` (temp Δ / resp / SpO₂ inside "More for today")
- Also gate on `selectedDate`: pull the latest biometrics row within that day using the same query pattern already in `load()`, keyed by `selectedDate`.

## Out of scope

- Historical AI narrative / forecast rewrite (forecast stays today-only; hidden on past days).
- Regenerating past doses (past days remain read-only).
- Future dates (strip already blocks them).
- Wearable pull-to-refresh (still refreshes latest, not the selected day).

## Verification

Playwright at 390×844, 834×1112 and 1440×900:
1. Load `/today`, screenshot.
2. Tap yesterday's tile: assert "Viewing …" bar shows, banners hidden, vitals/doses re-render (or show empty-state for that day).
3. Tap "Back to today": assert today-only sections reappear.

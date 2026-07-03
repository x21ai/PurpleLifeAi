## Problem

The top Readiness / Sleep / Activity tiles on `/today` currently show `–` whenever the selected date is not today, so switching between dates looks like "nothing changes". They should reflect the scores for the selected date, just like the "Your signals" grid below.

## Fix (frontend only)

### `src/routes/_app/today.tsx`
- Replace the `bio` snapshot (36h `biometrics` query) as the source for the top tiles with the same date-aware `getScoreSnapshot` server function `TodayVitals` uses.
- Add a `useQuery` in `TodayPage` keyed on `["score-snapshot", ymd]` with `ymd = format(selectedDate, "yyyy-MM-dd")`, using `useServerFn(getScoreSnapshot)`. React Query will dedupe with `TodayVitals`'s identical query.
- Drive `readiness`, `sleep`, `activity` (and therefore `focusScore`) from that snapshot.
- Remove the `isToday ? … : "–"` gating on the three `ScoreTile`s and the expanded hero — the snapshot itself returns `null` when there is no data for that day, which the existing `?? "–"` already handles.
- Keep the existing `bio` fetch only for the `BodyMeasurementsRow` (Temp Δ / Resp / SpO₂) inside "More for today", since that block is not date-driven yet; no other behavior changes.

### Verification
- Load `/today`, note top tile values.
- Pick a past date with data: tiles update to that day's readiness/sleep/activity.
- Pick a day with no data: tiles show `–` (no dashes-everywhere confusion).
- Return to today: original values reappear.
- Screenshot at 390×844 and 1280×800.

## Out of scope
- Historical AI narrative rewrite.
- BodyMeasurementsRow date-driven fetch (separate follow-up).

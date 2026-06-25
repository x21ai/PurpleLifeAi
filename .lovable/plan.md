## Problem
When a medication's `pills_remaining` reaches `0`, the app still:
1. Generates pending dose rows for the next day via `regenerate_today_pending_doses`
2. Shows "Next today" or scheduled times in the medication list row
3. Shows "Taken / Snooze / Skip" action buttons for those doses on Today and Meds pages

The user wants a clear "Count zero — refill to update" indicator instead.

## Solution

### 1. Stop generating doses when stock is depleted
Update the `regenerate_today_pending_doses` database function to skip medications where `pills_remaining <= 0` (stock is tracked and depleted). This prevents new impossible pending rows from being created.

**File:** `supabase/migrations/...` (new migration)

### 2. Med list row — replace schedule with out-of-stock message
In `src/routes/_app/meds.tsx` (`MedRow`), when `med.pills_remaining === 0`:
- Replace the "Next today …" or schedule-times line with a muted "Count zero — refill to update" message
- Hide the inline "Mark taken" quick-action button for that medication
- Keep the row tappable so the user can still open the detail page to update the count

### 3. Today doses — add out-of-stock indicator
In `src/components/meds/today-doses.tsx`:
- Include `pills_remaining` in the medication data fetched with doses
- For doses belonging to a med with `pills_remaining === 0`:
  - Show an "Out of stock" label next to the medication name
  - Disable or hide the "Taken" and "Snooze" buttons (only "Skip" remains relevant)

### 4. Today panel — add out-of-stock indicator
In `src/components/meds/today-panel.tsx`:
- Pass medication stock data into the panel
- For pending doses with zero stock, show a muted dot and an "Out of stock" tooltip

### 5. i18n
Add translation keys to `src/i18n/locales/en.json`:
- `meds.outOfStock`: "Count zero — refill to update"
- `meds.zeroStock`: "Out of stock"

### 6. Verify
- TypeScript check passes
- Existing tests pass
- Visual check: a med with `pills_remaining = 0` shows the new message on `/meds` and `/today` instead of dose times

## Technical details
- The `Medication` type in `src/routes/_app/meds.tsx` already includes `pills_remaining: number | null`
- The `regenerate_today_pending_doses` function iterates `public.medications`; adding `and (pills_remaining is null or pills_remaining > 0)` to the `for med in` query is the minimal DB change
- For `today-doses.tsx`, the `ensureTodayDoses` helper in `src/lib/meds-today.ts` will need to select `pills_remaining` from the joined `medications` relation

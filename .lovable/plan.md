## Auto-decrement pill stock when a dose is marked taken

**Problem:** `medications.pills_remaining` is supposed to drop by 1 each time the user marks a daily dose as taken, but several code paths don't decrement, and the ones that do can drift on retries/edits. Today there are four "mark taken" entry points:

1. `TodayDoses` on Today page → decrements (by 1)
2. `meds.tsx` Today panel + retroactive reclassify → decrements (by 1)
3. `meds.$medId.tsx` "Add past dose" / "Edit dose" form → **does NOT decrement** (explicit "stays user-managed" comment)
4. `supabase/functions/med-dose-action` (notification action button) → **does NOT decrement**

Result: depending on where the user taps "Taken", the pill count may or may not change — inconsistent.

### Solution: single source of truth via Postgres trigger

Move pill-stock adjustment into the database so every path stays in sync. A trigger on `medication_doses` runs on INSERT/UPDATE/DELETE and adjusts `medications.pills_remaining` whenever a row's status transitions into or out of `taken`. This makes pill stock correct regardless of which UI path or edge function performed the change, and it can never double-decrement on retry.

### Migration

Add a migration that creates:

- `public.apply_dose_pill_delta(medication_id uuid, delta int)` security-definer helper that does `UPDATE medications SET pills_remaining = GREATEST(0, pills_remaining - delta) WHERE id = ... AND pills_remaining IS NOT NULL` (no-op if stock isn't tracked).
- Trigger function `public.medication_doses_pill_stock()` covering:
  - INSERT with `status='taken'` → delta = +amount (default 1)
  - UPDATE: if `OLD.status<>'taken' AND NEW.status='taken'` → delta = +NEW.amount; if `OLD.status='taken' AND NEW.status<>'taken'` → delta = -OLD.amount; if both taken and amount changed → delta = NEW.amount - OLD.amount
  - DELETE with `status='taken'` → delta = -OLD.amount
- Trigger `trg_medication_doses_pill_stock` AFTER INSERT/UPDATE/DELETE on `medication_doses` calling the function.
- Amount per dose uses `COALESCE(NEW.amount, 1)::int` so doses without a stored amount count as 1 pill (matches current client logic).

### Client cleanup

Remove the now-redundant client-side decrement calls so the trigger is the sole writer (no double-counting):

- `src/components/meds/today-doses.tsx` — drop `decrementPillCount` and the two call sites in `runAction` and `reclassify`.
- `src/routes/_app/meds.tsx` — drop `adjustPills` and its two call sites in `doseAction` and `doseReclassify`.
- `src/components/meds/reminder-alarm-sheet.tsx` — drop the inline pill-stock update after marking the dose taken.
- `src/routes/_app/meds.$medId.tsx` — leave `saveDose` as-is (it already doesn't adjust); the trigger will now correctly adjust on insert/edit. Update the "stays user-managed" comment to reflect that the DB trigger handles it.

### Acceptance criteria

- Marking a dose taken from any path (Today card, Meds list, med detail, notification action, retroactive edit, add past dose) decrements `pills_remaining` by the dose amount (default 1).
- Unmarking taken (skip, pending, delete) restores the pill count.
- Pill count never goes below 0.
- Medications with `pills_remaining = NULL` (stock not tracked) stay NULL.
- Refilling pills (user edits stock in the form) continues to work normally.

### Out of scope

- Re-counting historical dose data to reconcile current `pills_remaining` (would change existing user-set values).
- Pulling exact dose `amount` semantics into low-stock projection (`med-intelligence.functions.ts` already divides by doses/day, unchanged).
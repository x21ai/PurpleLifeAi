## Problem

Settings → "Add past history" → "Old medications" links to `/meds`, which lands on the meds list with no clue what to do next. The user has to know to click "+ Add medication" and then set past start/end dates. The intent ("I'm backfilling something old") is lost on the way.

The med form itself already supports past `start_date` and `end_date`, so the gap is purely flow + affordance, not data.

## Fix

Deep-link the Settings card so it opens the Add Medication sheet directly in a "past medication" mode, with a small banner explaining what's happening and the date fields visible.

### 1. Settings: pass intent via search param

`src/routes/_app/settings.tsx` — change the "Old medications" `<Link>`:
- `to="/meds"` → `to="/meds"` with `search={{ add: "past" }}`.
(Keep the "Past episodes" link untouched — `/seizures/new` already handles past dates correctly.)

### 2. Meds route: read the param and auto-open the sheet

`src/routes/_app/meds.tsx`:
- Add `validateSearch` to the route: `{ add?: "new" | "past" }`.
- In the component, read `Route.useSearch()`. On mount, if `search.add === "past"`, call `openAdd()` and pass an `intent: "past"` flag into `MedicationFormSheet`. Then clear the param with `navigate({ search: {}, replace: true })` so refresh doesn't re-open it.
- Pass `intent` through the existing add-sheet state.

### 3. MedicationFormSheet: "past medication" affordance

`src/components/meds/medication-form-sheet.tsx`:
- Accept new optional prop `intent?: "new" | "past"` (default `"new"`).
- When `intent === "past"` AND we're creating (not editing):
  - Show a small info banner at the top of the form: "Adding a past medication — set the start and (optional) stop dates below. Purple won't create reminders for dates in the past."
  - Default `endDate` to today (`YYYY-MM-DD`) as a hint the user can clear; leave `startDate` empty so they must pick it.
  - Scroll the Duration card into view once the sheet opens (ref + `scrollIntoView({ block: "center" })` in an effect).
- No change to save logic — existing code already handles past dates and skips today's dose generation when `end_date < today`.

### 4. Meds history page: matching entry point

`src/routes/_app/meds.history.tsx`:
- Add a secondary "Add a past medication" button in the header that links to `/meds?add=past`, so users who arrive at history looking to backfill have an obvious path.

## Out of scope

- No schema changes (start_date/end_date already exist).
- No new server function.
- No change to the existing "+ Add medication" flow on `/meds` — it stays as today.
- "Past episodes" link in Settings is unchanged.

## Verification

- Settings → "Old medications" → meds page opens with the Add sheet already up, banner visible, Duration section scrolled into view.
- Setting start_date in the past + end_date in the past saves correctly and the med appears in the list as ended; no today doses are generated.
- Refreshing `/meds` after the redirect does not re-open the sheet (param was cleared).
- Mobile (375), tablet (768), desktop (1280): banner wraps, date inputs stay on one row, sheet stays width-capped via `SheetColumn`.

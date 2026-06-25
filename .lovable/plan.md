## Problem

The medication "add/edit" form uses native `<input type="time">`, which on most desktop browsers renders in 24-hour format (depends on OS locale). Everywhere else the app displays times in 12-hour format with AM/PM (e.g. `9:00 AM`). Result: users enter `21:00` but see `9:00 PM` later — inconsistent.

The same native `<input type="time">` is also used in the shared `DateTimePicker` (used by "add past dose" on the med detail page, journal entries, etc.), so the inconsistency surfaces in multiple flows.

## Fix

Introduce one small 12-hour time picker and use it in place of every native `<input type="time">` so input and display always match.

### 1. New component `src/components/ui/time-picker-12h.tsx`

- Props: `value: string` (canonical `HH:mm` 24h, what we store), `onChange(value: string)`, optional `className`, `aria-label`.
- UI: three compact controls in a row — Hour (1-12), Minute (00-59, step 5 default but any minute accepted via select with all 60 values), AM/PM toggle. Styled to match existing `Input`/`Select` (shadcn) so it sits naturally next to the dose-amount input.
- Internally converts to/from 24h `HH:mm` so storage and the rest of the codebase are unchanged.
- Fully keyboard accessible, mobile-friendly (large tap targets, works inside bottom sheets).

### 2. Replace usages

- `src/components/meds/medication-form-sheet.tsx` (line ~728) — swap the scheduled-times `<Input type="time">` for `<TimePicker12h>`.
- `src/components/ui/date-time-picker.tsx` — swap the inline `<input type="time">` for `<TimePicker12h>`. This keeps the "add past dose" sheet on `/meds/:id` and any other date-time pickers consistent.

No changes to:
- Display helpers (`formatTime` in `meds.tsx`, `meds.$medId.tsx`) — they already render 12h AM/PM.
- Database shape — we still store `HH:mm` 24h strings and ISO timestamps.
- The 24h `hour12: false` usage inside `today-doses.tsx` (that's sleep-window math, not display).

### 3. Verify across viewports

Use Playwright to screenshot the medication form and "add past dose" sheet at mobile (375), tablet (768) and desktop (1280) widths, then read back a created med on the meds list to confirm the entered time displays identically (e.g. enter `9:00 PM` → list shows `9:00 PM`, not `21:00`).

## Out of scope

- Localized 24h preference (e.g. a user toggle). Project copy/format is already 12h AM/PM, so we standardize on that. We can add a preference later if requested.

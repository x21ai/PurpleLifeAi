# Medication system — fixes + UX additions

## A. Audit results (already live)

- IndexedDB-based dose scheduling in `public/sw.js` — already correct (60s poll, Taken/Skip/Snooze actions).
- `med-dose-action` edge function source exists; will redeploy to confirm.
- `TodayDoses` component already on Today (`src/routes/_app/index.tsx`) with one-tap **Taken**.
- Form already supports `kind` enum, `dosage_amount`, `dosage_unit` dropdown.

## B. Fixes

### 1. Redeploy `med-dose-action`
Deploy via the Supabase tool and smoke-test with a curl to confirm 200.

### 2. Notification permission — proactive flow on Today
Add a small dismissable card to `TodayDoses` (only when there's at least one pending dose today AND `Notification.permission === "default"`):
> Enable reminders so Purple can alert you when it's time to take your dose.
> [Enable reminders] [Not now]
"Enable" calls `requestPermission()` synchronously inside the click handler, then `rearmMedicationNotifications()`. Persist "Not now" per device in localStorage.

### 3. Today-screen PWA install banner (NEW, distinct from existing `InstallPrompt`)
Add `src/components/pwa/today-install-banner.tsx`. Render at top of Today (`src/routes/_app/index.tsx`), above the greeting.
- Copy: **"For reliable medication reminders, add Purple to your home screen."**
- Show only when: not in standalone, not previously dismissed, `localStorage` key `purple-today-install-dismissed` not set.
- Dismiss button (X) sets the key.
- On Android with `beforeinstallprompt` available, primary button triggers `prompt()`. On iOS Safari, primary button opens a small modal with "Tap Share → Add to Home Screen" instructions.

### 4. Service-worker bootstrap on app load
In `src/routes/__root.tsx` (or `_app.tsx`), on mount call `ensureServiceWorker()` then (if permission already granted) `rearmMedicationNotifications()`. This guarantees the SW is registered/active and IndexedDB is repopulated after every reload — covers the "must continue to work if the user reloads" requirement.

### 5. Today doses: render Skip/Snooze inline too
Add Skip and Snooze buttons next to Taken in `today-doses.tsx`, calling the same `med-dose-action` endpoint as the notification actions, so behavior matches whether the user acts in-app or from the notification.

## C. Three form UX additions (`medication-form-sheet.tsx`)

### 6. Medication name autocomplete (constant, no new table)
Create `src/lib/med-dictionary.ts` exporting a constant array of ~100 entries:
```ts
export type MedDictEntry = { label: string; aliases: string[]; kind: MedKind };
// AEDs (with brand aliases), supplements, rescue meds — exact list from the user request
```
Replace the name `<Input>` with a Command-style combobox (shadcn `Command` + `Popover`):
- As user types ≥1 char, filter by `label` or `aliases` (case-insensitive substring).
- Show top 8 matches. Selecting fills `name` with the canonical label and auto-sets `kind` from the entry.
- User can still type freely (any value accepted).

### 7. Unit dropdown with custom typing
Replace the plain `Select` with a Combobox (`Command` + `Popover`):
- Options: `mg, mcg, mL, g, IU, drops, sprays, units` (fix `ml` → `mL`), default `mg`.
- Input at top of popover allows arbitrary text; on Enter, accept as custom unit.

### 8. Refill threshold as preset select + Custom
Replace numeric input with a `Select`:
- Options: `3 days`, `7 days` (default), `14 days`, `30 days`, `Custom…`.
- Choosing `Custom…` reveals a numeric input below; persisted value is the integer days.

## D. Test plan (Part C)

After deploy, perform end-to-end:
1. Type "Lev" → autocomplete shows "Levetiracetam (Keppra)".
2. Select it → name fills, kind set to medication.
3. Enter 500 in amount → confirm "mg" selected.
4. Refill threshold → choose 14 days.
5. Times: add `now+2min` and `22:00`.
6. Save → appears in TodayDoses immediately.
7. Wait 2 min → confirm browser notification fires with Taken/Skip/Snooze actions.
8. Tap Taken → confirm `medication_doses.status` flips to `taken` in DB.

## Technical notes

- All Supabase calls use the existing browser client; no new server functions needed (edge function already handles authenticated dose actions).
- No DB migration required — `refill_threshold` is already an int column; dictionary is a TS constant.
- Permission requests are made directly inside synchronous click handlers (not after `await`) to avoid losing user-gesture context.
- All new colors/styles use existing semantic tokens.

## Files touched

- `public/sw.js` — no change (already correct)
- `src/components/meds/today-doses.tsx` — add Skip/Snooze buttons + permission nudge
- `src/components/meds/medication-form-sheet.tsx` — autocomplete name, unit combobox, refill select
- `src/lib/med-dictionary.ts` — NEW (~100 entries)
- `src/components/pwa/today-install-banner.tsx` — NEW
- `src/routes/_app/index.tsx` — render the new banner
- `src/routes/_app.tsx` or `__root.tsx` — bootstrap SW + rearm on mount
- Redeploy `med-dose-action` edge function

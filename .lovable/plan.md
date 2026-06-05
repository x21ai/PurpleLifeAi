Four phases, executed one at a time, with a pause for review between each so tone and behavior stay in-bounds.

## Phase 1 — Caregiver "confirm to write"

Goal: every caregiver-initiated write goes through one shared confirmation step, and the audit row makes the source obvious.

Current state: `AddJournalSheet`, `AddBiometricSheet`, `LogSeizureSheet`, the propose-change paths, and the dose-mark-taken row on `care.$ownerId.tsx` all call their server functions directly. `ProposeChangeDialog` already exists but is only used in two spots. There is no single confirm component.

What I'll build:
- New `src/components/care/confirm-write-dialog.tsx` — a single AlertDialog component with consistent copy: "You're writing to {ownerName}'s record. They'll see this in their audit log. Continue?" Accepts `summary` (what the write does, one line), `onConfirm`, and an optional `destructive` flag.
- Wire it into the four caregiver write paths in `src/components/care/`:
  1. `add-journal-sheet.tsx`
  2. `add-biometric-sheet.tsx`
  3. `log-seizure-sheet.tsx`
  4. dose-mark-taken in `care.$ownerId.tsx` (and any other inline writes I find while threading it through)
- Verify each caregiver server fn in `src/lib/care.functions.ts` already writes a `care_audit_log` row; if any path is missing one, add it server-side (audit is the security record — the dialog is the UX layer).
- Quick visual QA: open `/care/$ownerId` as a caregiver viewport, confirm dialog appears, copy reads calmly (not alarming), and an entry persists with `created_by_kind = "caregiver"`.

Out of scope here: changing the propose-change flow (already has its own dialog), or touching owner-initiated writes.

## Phase 2 — Travel: trip-wrapup + pre-trip checklist wiring

Goal: the two existing Today cards (`pre-trip-checklist.tsx`, `trip-wrapup-card.tsx`) drive real state — schedule regenerates cleanly when a trip is created, edited, or ended.

What I'll verify and finish:
- `pre-trip-checklist.tsx`: confirm it appears when a trip with `start_date` in the next 14 days exists and has unmet items (meds packed flag, itinerary complete, rescue meds noted). If any items are mocked, wire to real fields on `trips` or compute from `medications`/`medication_doses`.
- `trip-wrapup-card.tsx`: confirm it appears when `now > trip.end_date` for the active trip. The "End trip" action must (a) mark trip inactive, (b) delete future `medication_doses` rows where `trip_id = trip.id`, (c) regenerate the home-schedule doses from `medications.schedule` using `src/lib/travel-scheduler.ts`.
- Re-run schedule regeneration on trip edits via `src/lib/travel.functions.ts` — confirm the existing serverFn already drops `trip_id`-tagged future doses before re-inserting (this is the clean-regeneration invariant from project knowledge).
- Smoke test via browser: create a short trip, accept the schedule, end it from the wrap-up card, confirm the timeline shows home-schedule doses again.

## Phase 3 — Weekly recap email end-to-end

Goal: prove the weekly-recap path actually delivers a rendered email, and the layout doesn't have any visual breakage.

What I'll do:
- Read `src/lib/email-templates/weekly-recap.tsx`, `src/routes/api/public/cron/weekly-recap.ts`, and `src/lib/email/render-and-enqueue.server.ts` to confirm shapes line up.
- Trigger the cron route once via `invoke-server-function` against a test user that has a week of seed data; check `email_send_log` for a `sent` row with `template_name = "weekly_recap"`.
- Use the `/lovable/email/transactional/preview` route (or the renderer directly) to render the email to HTML, capture as image via headless preview, and visually QA — checking the header lockup, stat blocks, journal-moment block, footer/unsubscribe.
- Fix any rendering issues (most likely: empty-state when a user has no journal entries; long medication-name overflow; dark-mode-only colors that fail in email clients).

## Phase 4 — Apple Health import polish

Goal: the import UX feels finished — clear states, no orphaned spinners, accurate counts.

What I'll review in `src/routes/_app/apple-health-import.tsx` and `src/components/connections/apple-health-connection.tsx`:
- Upload progress: bytes shown, parse step shown, write step shown — no single "Loading..." that hides everything.
- Result summary: counts per metric category (sleep, HR, HRV, workouts, etc.), with a "View in biometrics" link.
- Error handling: corrupt zip or wrong file type fails with a calm message, not a stack trace.
- Idempotency: re-importing the same export does not duplicate rows (verify the dedupe key in `src/lib/apple-health.server.ts`).
- Settings card (`src/components/settings/apple-health-card.tsx`): last-import date + size, "Import again" CTA, "Remove all imported data" with confirm.

## Execution order and check-ins

I'll do Phase 1 end-to-end first and pause for your reaction (the confirm dialog copy is the most opinionated piece). Then Phase 2, then 3, then 4 — pausing briefly after each so you can redirect if anything feels off.

## Out of scope

- New features (no new caregiver scopes, no new travel modes, no new email types).
- Marketing pages (done in previous plan).
- Native mobile or condition-specific SDK work.
- Multi-trip overlap (project knowledge: one active trip).

Approve and I'll start with Phase 1.
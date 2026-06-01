# Phase 1.5 — Make the caregiver view feel like the patient view (and actually let caregivers help)

Before continuing to the bigger Phase 2 plan, fix what's broken in the caregiver dashboard pmt sees today. Devyn is live; everything below is additive.

## What the screenshots show vs. what's true

| Screenshot | What you see | What's actually going on |
|---|---|---|
| Seizures tab "None logged" | Looks broken | DB confirms 0 rows in `seizure_events` for Devyn. Nothing to display. Phase 2 will add seizure logging from the caregiver side. |
| Reports — missing entirely | No tab | There's no `reports:read` scope, no caregiver-read serverFn, no tab. DB also has 0 rows. Both need building. |
| Journal "5/31/2026, 5:45:00 PM · text" | "text" looks like a bug | It's the journal `kind` enum (`text` / `voice` / `photo`) printed raw. Cosmetic. |
| Meds "Levetiracetam (Keppra)er · mg · 10:30" | No dosage, weird name | The medication row has `dosage_amount` null and a typo in `name`. Data, not display. |
| Meds dose chips | Just colored "taken/missed" pills, no time | The chip only renders status text; the timestamp is in a `title` tooltip. Needs to show the actual time. |
| No "Add" anywhere | Caregiver can only "Propose" | Today's caregiver dashboard is read-only by design; direct writes are Phase 2. |

## What Phase 1.5 ships

### 1. Same look-and-feel as the patient

Caregiver dashboard today uses bespoke tables. Replace each panel's body with the same components Devyn sees on her own pages, scoped by `ownerId`:

- **Today** → reuse `<HeroScoreCard>` + `<TodayBiometrics>` + alerts list from `routes/_app/today.tsx`.
- **Meds** → reuse `<TodayDoses>` + the medications list card from `routes/_app/meds.tsx`.
- **Biometrics** → reuse `<MetricCard>` grid from `routes/_app/biometrics.index.tsx` (not a raw table).
- **Journal** → reuse `<EntryCard>` from `components/journal/entry-card.tsx`. Drop the literal "· text" suffix; keep date + a small icon for voice/photo.
- **Seizures** → reuse the seizure list rendering from `routes/_app/today.tsx` / wherever seizures render today.
- **Reports** (new tab) → reuse the report list card from `routes/_app/reports.tsx`.

Each reused component takes a `targetUserId` prop (or reads from a context) so the same UI fetches Devyn's data when pmt is viewing her account.

### 2. Add the missing Reports tab

- New scope `reports:read` (+ `reports:comment`, `reports:write`, `reports:receive`) in `lib/care.scopes.ts`.
- Backfill the scope rows for the existing pmt→Devyn relationship so it's there today.
- New `caregiverReadReports` server function in `lib/care.functions.ts` returning `report_documents` + `report_metrics`.
- New `Reports` tab in `routes/_app/care.$ownerId.tsx`.
- `/care/$ownerId/reports/$reportId` route reusing `routes/_app/reports.$reportId.tsx` rendering for caregivers.

### 3. Caregiver write — direct, audited, notify the patient

Per your last call: caregivers can add directly. Show name/initials avatar on every caregiver entry, patient can edit/archive, patient gets notified.

Surfaces added:
- "Add journal entry" on Journal tab (reuses `CaptureSheet` with `targetUserId`).
- "Log a dose now" / "Mark taken" on Meds tab — writes to `medication_doses` with `targetUserId`.
- "Log a seizure" on Seizures tab (reuses `routes/_app/seizures.new.tsx`).
- "Upload a report" on Reports tab (reuses `routes/_app/reports.new.tsx`).

Every write:
- Server function takes optional `targetUserId`; if it differs from `auth.uid()`, verify scope, insert as the target user, write a `care_audit_log` row with `actor_id` (caregiver) and the snapshot.
- New columns on the affected tables (all nullable, additive): `created_by_id uuid`, `created_by_kind text` ('self'|'caregiver').
- Entry cards show a small colored-initial avatar + "PM added this" when `created_by_id !== user_id`.
- Patient can edit/archive caregiver entries (soft-delete via existing `archived_at`).
- Push + in-app notification on every caregiver write, controlled by a new `notification_preferences` table (default ON for all caregiver events; toggle per type in `/settings/sharing`).

### 4. Cosmetic + data fixes

- Journal cards: stop printing the raw `kind` enum.
- Dose chips: show `HH:mm` next to status, not just color.
- Meds list: when `dosage_amount` is null, show only what we have (no orphan "mg ·").
- Fix Devyn's "Levetiracetam (Keppra)er" typo — Settings → Medications already lets her rename. Mention it; don't auto-edit her data.

### 5. Why seizures look empty

Not a bug — `seizure_events` is empty for Devyn. Once write surfaces from #3 ship, pmt can log the Uber seizure on her behalf and it'll appear in both views.

## Order of work (each step ships, you test, then next)

1. Add `reports:*` scope + grant on existing relationship, add `caregiverReadReports` + Reports tab, reuse patient report list UI. **Gate:** pmt sees a Reports tab (empty for now).
2. Refactor existing 5 tabs to reuse patient components with `targetUserId`. Fix cosmetic "text" suffix, dose-chip time, dosage rendering. **Gate:** pmt's view visually matches Devyn's.
3. Add `created_by_id` / `created_by_kind` columns, extend serverFns with `targetUserId`, wire `care_audit_log` writes. **Gate:** schema change reviewed before any UI.
4. Add caregiver-side "Add journal", "Log dose", "Log seizure", "Upload report" — each behind its existing scope. **Gate:** pmt logs the Uber seizure on Devyn's account; Devyn sees it on her Today.
5. Add `notification_preferences` table + push/in-app on caregiver write. **Gate:** Devyn gets a notification when pmt adds something.

## Non-negotiables (unchanged)
- Snapshot Devyn's data before step 3 and step 5.
- Additive migrations only.
- Mobile + tablet + desktop verified each step.
- No new Edge Functions.

Approve and I'll start with step 1.

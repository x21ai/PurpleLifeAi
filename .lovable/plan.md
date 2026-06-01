# Phase 1.5 · Step 3 — Caregiver writes (foundations + Meds tab)

Step 2 shipped read-only caregiver views with patient-grade components. Step 3 adds the write story: provenance columns on every patient-data table, a new `write` verb in the scope catalog, four scope-guarded caregiver-write serverFns, and end-to-end wiring on the **Meds** tab so pmt can mark Devyn's doses taken/skipped today.

## What shipped

1. **Migration** — `created_by_id uuid` + `created_by_kind text default 'self'` (validated by trigger to `self|caregiver|system`) on: `journal_entries`, `medication_doses`, `seizure_events`, `medications`, `biometrics`, `report_documents`. Existing rows backfilled to `self`.
2. **Scope catalog** — added `write` verb + per-resource labels in `src/lib/care.scopes.ts`. Added `meds:write`, `journal:write`, `seizures:write`, `biometrics:write` to the caregiver role defaults. Existing pmt→Devyn relationship was upgraded with the four write scopes.
3. **serverFns** in `src/lib/care.functions.ts`, all guarded by `requireSupabaseAuth` + `assertScope(<resource>:write)` + active-relationship check, all writing to `care_audit_log`:
   - `caregiverMarkDose({ owner_id, dose_id, action: 'taken'|'skip'|'reset_pending' })`
   - `caregiverLogSeizure({ owner_id, started_at, ... })`
   - `caregiverAddJournalEntry({ owner_id, text, captured_at? })`
   - `caregiverAddBiometric({ owner_id, recorded_at, ... })`
4. **Meds tab wiring** — `DoseRowsReadOnly` accepts an optional `onAction` handler and `pendingId`; `MedsPanel` passes a `markDose` mutation when the caregiver has `meds:write`. Toasts on success/error; cache invalidates on success. Other tabs unchanged.

## Gate

Sign in as `pmt@eigital.com` → `/care/d7d17e54-b6e5-4775-877b-e77ce661fc54` → **Meds** tab → "Taken" / "Skip" buttons appear next to pending doses → tapping one updates the dose and shows a toast. Devyn's own `/meds` view is unchanged.

## Step 4 — done

- Write UI wired: `LogSeizureSheet`, `AddJournalSheet`, `AddBiometricSheet` mount on `/care/$ownerId` (Seizures, Journal, Biometrics tabs), gated by `*:write` scopes.
- `CaregiverBadge` rendered on `JournalEntryReadOnly`, `SeizureListReadOnly`, and `DoseRowsReadOnly` rows where `created_by_kind === 'caregiver'`.
- Owner notifications wired via `notifyOwnerOfCaregiverWrite` (throttled push + email) inside every `caregiverWrite*` serverFn.

## Step 5 + Phase 2 — done

- Caregiver notified on owner decision: new `caregiver-proposal-decision` email template + `notifyCaregiverOfDecision` helper, called from `decidePendingChange`.
- Per-caregiver audit log: `listCareAuditLog({ relationship_id })` serverFn + "Recent activity (last 30 days)" section inside `ManageRelationshipSheet`.
- Caregiver mobile polish: sticky tab nav on `/care/$ownerId` (desktop tabs row pins to top of scroll).

### Gate
Sign in as `pmt@eigital.com` → `/care/d7d17e54-...` → confirm "Log seizure", "Add note", and "Add biometric" buttons appear on the matching tabs and that submissions land on Devyn's account with a caregiver badge + owner notification.

## Approach

Add an optional `targetUserId?: string` prop to the patient components below. When set, they query that user's data via the matching `caregiverRead*` server function instead of the self-scoped one. Default behavior (no prop) is unchanged for Devyn's own pages.

## Components to extend

| Component | File | Caregiver fn |
|---|---|---|
| HeroScoreCard | `src/components/today/hero-score-card.tsx` | `caregiverReadToday` |
| TodayBiometrics | `src/components/biometrics/today-biometrics.tsx` | `caregiverReadBiometrics` |
| TodayDoses | `src/components/meds/today-doses.tsx` | `caregiverReadMeds` |
| MetricCard grid | extract from `routes/_app/biometrics.index.tsx` into `components/biometrics/metric-grid.tsx` | `caregiverReadBiometrics` |
| EntryCard list | `src/components/journal/entry-card.tsx` + new `components/journal/entry-list.tsx` | `caregiverReadJournal` |
| Seizure list | extract from `routes/_app/today.tsx` into `components/seizures/seizure-list.tsx` | `caregiverReadSeizures` |
| Report list | extract from `routes/_app/reports.tsx` into `components/reports/report-list.tsx` | `caregiverReadReports` |

For each: keep all existing call sites working with no prop; when `targetUserId` is set, route through the caregiver fn and hide any self-only affordances (edit, delete, FAB).

## care.$ownerId.tsx rewrite

Replace each panel's body:

- **Today** → `<HeroScoreCard targetUserId={ownerId} />` + `<TodayBiometrics targetUserId={ownerId} />` + alerts list (already caregiver-scoped).
- **Meds** → `<TodayDoses targetUserId={ownerId} />` + medications list card (extract into `components/meds/medications-list.tsx`).
- **Biometrics** → `<MetricGrid targetUserId={ownerId} />`.
- **Journal** → `<EntryList targetUserId={ownerId} />` (drops the raw `· text` suffix; voice/photo get a small icon).
- **Seizures** → `<SeizureList targetUserId={ownerId} />`.
- **Reports** → `<ReportList targetUserId={ownerId} />`.

Tab nav, scope gating, and the Propose-change action stay where they are.

## Server-function checks

Each `caregiverRead*` fn already validates the relationship + scope via `requireSupabaseAuth` + `assertScope`. No new migrations. Confirm each fn returns the same shape its patient counterpart expects (e.g. biometrics: array sorted by `recorded_at desc`, meds: `{ medications, doses }`). Where shapes differ, add a thin adapter inside the component (not the server fn).

## Cosmetic carry-overs (verify Step 1 didn't miss any)

- Journal kind suffix: only render when `kind !== 'text'`, as an icon, not the word.
- Dose chip: show `HH:mm` next to status.
- Meds row: drop orphan "mg ·" when `dosage_amount` is null.

## Non-negotiables

- No schema changes this step.
- No new Edge Functions.
- Existing self-view (Devyn's own routes) must render identically — verified by visiting `/today`, `/meds`, `/biometrics`, `/journal`, `/reports` before claiming done.
- Mobile (390px) + tablet + desktop checked on caregiver view.

## Gate

Sign in as `pmt@eigital.com` → `/care/{devyn-id}` → every tab visually matches what Devyn sees on her own pages, with the data pulled correctly. Then Step 3 (caregiver-write columns + `targetUserId` on write serverFns).

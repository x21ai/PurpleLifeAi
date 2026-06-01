# Phase 1.5 · Step 2 — Make pmt's view look exactly like Devyn's

Step 1 shipped the Reports tab + cosmetic fixes. Step 2 swaps the bespoke caregiver tables for the same components Devyn sees, scoped by `ownerId`. Read-only this step; caregiver writes are Step 3.

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

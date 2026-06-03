
# Personalize Purple by condition

Goal: stop showing every user every tracker. Each person's conditions decide what's visible by default; the user can flip anything on or off; reports turn into trend charts over time.

---

## Phase 0 — Hide aura now (small, ships first)

Aura/déjà vu currently shows for everyone. Gate it immediately by `profiles.conditions.includes('epilepsy')`:

- Hide the aura "Log aura" action on `/hydration` and Today for users without epilepsy in `conditions`.
- Keep the data and route reachable for existing epilepsy users (no destructive change).

This is a 10-minute fix and unblocks the inconsistency you saw. Full flag system comes in Phase 1.

---

## Phase 1 — Feature flags driven by conditions, user-overridable

### Data
- New column: `profiles.feature_overrides jsonb default '{}'::jsonb` (e.g. `{ "aura": false, "bp_trend": true }`).
- New file `src/lib/feature-catalog.ts` — the source of truth mapping each feature to:
  - `key` (e.g. `"aura"`, `"seizure_log"`, `"hydration"`, `"bp_trend"`, `"glucose_trend"`, `"lipid_trend"`, `"oura_sync"`)
  - `defaultFor: Condition[]` (e.g. aura → `["epilepsy"]`, bp_trend → `["hypertension"]`, hydration → all)
  - `requiresDevice?: boolean` (Oura, etc.)
  - `label`, `description`, `icon`

### Hook
- `useFeatureFlags()` resolves: `defaults from conditions ⨁ feature_overrides`. Returns `{ enabled(key), all() }`.
- Server equivalent for serverFns that need to filter caregiver views.

### Gates
- `src/components/layout/nav-items.ts` — filter nav by flags.
- Today route — only show cards for enabled features.
- `/hydration`, `/vitals`, aura sheet, seizure log, rescue meds — gated.
- Caregiver route mirrors the owner's enabled set (you only see what the owner tracks).

### Settings → new "What I track" section
- Grouped by category (Neuro, Cardio-metabolic, Hydration, Sleep & recovery, Reports).
- Each row: toggle, label, "default for {condition}" badge.
- "Reset to defaults" button.
- Honors the "stays as-is for existing users" requirement: we **never** write defaults retroactively. Existing users keep what they have; flags only resolve at read-time.

### Onboarding ("ask during onboarding" path)
- After the conditions step, add a "What would you like to track?" review step.
- Each suggested feature is pre-checked based on the conditions just picked, with a one-line "why".
- User can uncheck anything. Saves to `feature_overrides`.
- "I'll decide later" skips and uses pure defaults.

---

## Phase 2 — Conditions you can grow into

Match how `devynrosewalker@gmail.com` and `pmt@eigital.com` actually live: conditions evolve.

- Settings → "My health" section already exists; extend it:
  - Add conditions: free multi-select with the standard set + free-text additions saved to `conditions_note`.
  - Mark as **resolved / in remission**: don't delete, archive with `resolved_at`. Add `profiles.conditions_archived jsonb` (`[{ key, resolved_at }]`). Trend charts can still pull historical data for an archived condition (e.g. gout history matters even if currently in remission).
  - Family history: new optional jsonb `profiles.family_history` (`[{ condition, relation, notes }]`) — used by Ask-Purple context, never by feature gates.
- When the user adds a condition mid-life, prompt: "Turn on the trackers for this? [Review] [Skip]".
- AI-suggested conditions from reports: when the lab extractor sees, e.g., HbA1c ≥ 6.5% twice or LDL ≥ 160, surface a non-pushy "Want to add 'diabetes' / 'high cholesterol' to your profile?" card on `/reports`. Never auto-write.

---

## Phase 3 — Reports become a real medical history

The data model (`report_documents`, `report_metrics`) already captures what we need. The UI doesn't surface it.

### Reports list (`/reports`)
- Show **report date** (when the test was taken), source/lab name, and number of metrics extracted — not just upload time.
- Group by `report_type` (already exists) with counts.
- Search by metric ("show me all reports with LDL").

### New: Trends tab on `/reports`
- Top: pinned/important metrics as draggable tiles (BP, HbA1c, LDL, eGFR — driven by user's conditions, but user can reorder via drag-and-drop and pin/unpin).
- Below: every `metric_key` that appears in ≥2 reports gets a sparkline row.
- Status badges: `active` / `inactive` (user toggle) and `pinned`.
- New table `report_metric_preferences` (`user_id`, `metric_key`, `pinned`, `sort_order`, `active`) — drives the layout.

### New route `/reports/trends/$metricKey`
- Recharts line chart over time using `report_metrics.measured_at`.
- Reference range band (from `reference_low`/`reference_high`).
- Annotations: medication changes (from `medications.start_date`/`end_date`), trip periods (from `trips`), so user can see "my BP dropped when I started losartan".
- Date range filter (3m, 6m, 1y, all).
- Export CSV.

### Report detail page (`/reports/$reportId`)
- Already shows extracted metrics; add "View trend →" link next to each metric that appears in other reports.
- Show `report_date`, source, file preview, AI confidence per metric.

---

## Phase 4 — Caregiver mirrors owner's choices

- Caregiver tabs on `/care/$ownerId` filter by the **owner's** resolved flags, not the caregiver's.
- Caregiver cannot enable features the owner has turned off (respects autonomy).
- Caregiver-of-epilepsy-patient who wants aura off for themselves: separate `care_caregiver_visits.hidden_features` jsonb — caregiver-local visibility preference, doesn't affect the owner.

---

## Order of work

1. **Today**: Phase 0 (hide aura for non-epilepsy). ~10 min.
2. Phase 1 — feature catalog, hook, settings UI, onboarding review step. Bulk of the work.
3. Phase 3 — reports trends (Trends tab + per-metric chart route + drag-to-reorder).
4. Phase 2 — condition lifecycle (resolve, family history, AI suggestions from reports).
5. Phase 4 — caregiver mirroring.

---

## Technical notes

- All gates resolve at read-time from `profiles.conditions` + `feature_overrides`. No data migration for existing users — their current visibility is preserved because defaults only kick in for the *resolution function*, not for stored state.
- `feature-catalog.ts` is the single source of truth; both client (`useFeatureFlags`) and server (`resolveFlags(userId)` in a serverFn helper) read from it.
- Drag-to-reorder uses `@dnd-kit/sortable` (already a TanStack-friendly small lib; add via `bun add`).
- Trend charts use the existing Recharts dependency.
- Two migrations total:
  1. `profiles.feature_overrides jsonb`, `profiles.conditions_archived jsonb`, `profiles.family_history jsonb`.
  2. `report_metric_preferences` table with RLS scoped to `auth.uid()`.
- No new Supabase Edge Functions; everything via `createServerFn`.

---

## Out of scope (ask before adding)

- AI auto-diagnosing conditions from reports (we *suggest*, never auto-add).
- Native device SDKs beyond Oura (kept "light tailoring" per project knowledge).
- Sharing trend charts publicly.

## What's left from the personalization plan

Reviewed `.lovable/plan.md` against the codebase:

- Phase 0 (hide aura): done
- Phase 1 (feature catalog + flags + Settings "What I track" + onboarding step): done
- Phase 3 (reports list search + metric counts + Trends tab + per-metric chart route): done
- Phase 4 (caregiver mirrors owner flags + local hide): done
- Phase 2 (condition lifecycle):
  - DB columns `conditions_archived`, `family_history`: done
  - Settings "Condition history" UI (archive/remission, family history): done
  - **Not done**: AI suggestion card on `/reports` ("Want to add 'diabetes' to your profile?")
  - **Not done**: "Turn on trackers for this?" prompt after adding a new condition mid-life

Plus polish: add "X21 Ai" to the footer copyright line.

## Plan

### 1. Footer copyright — add "X21 Ai"

`src/components/layout/site-footer.tsx` line 29: change

```
© {year} Purple · Free forever. Your data stays yours.
```

to

```
© {year} Purple · Free forever. Your data stays yours. · Built by X21 Ai
```

(Single line; same `text-xs text-muted-foreground`. Wording — "Built by X21 Ai" — is my proposal; tell me if you'd rather have "by X21 Ai", "X21 Ai", or a link target.)

### 2. Phase 2a — AI condition suggestion card on `/reports`

Rule-based, not LLM (cheap, deterministic, never auto-writes):

- New helper `src/lib/condition-suggestions.ts` with thresholds:
  - HbA1c ≥ 6.5 in ≥2 reports → suggest `diabetes`
  - LDL ≥ 160 in ≥2 reports → suggest `high_cholesterol`
  - Fasting glucose ≥ 126 in ≥2 reports → suggest `diabetes`
  - Systolic ≥ 140 or diastolic ≥ 90 in ≥2 reports → suggest `hypertension`
  - eGFR < 60 in ≥2 reports → suggest `ckd`
- New serverFn `suggestConditionsFromReports` reads `report_metrics` for the user, applies thresholds, excludes anything already in `profiles.conditions` or `conditions_archived`, returns `[{ conditionKey, label, reason, sampleMetric }]`.
- New `ConditionSuggestionsCard` on top of `/reports` (collapsible, dismissible). Two actions per suggestion:
  - "Add to my profile" → appends to `profiles.conditions`, then opens the Phase 2b "turn on trackers?" sheet
  - "Not now" → writes the suggestion key to a new `profiles.suggestions_dismissed jsonb default '[]'` so it doesn't reappear
- Migration adds `profiles.suggestions_dismissed jsonb default '[]'` (read-only RLS already covers profiles).

Always-visible disclaimer line: "Suggestions only — not a diagnosis."

### 3. Phase 2b — "Turn on trackers?" prompt

Reusable `<EnableTrackersSheet condition={...} />`:
- Reads `FEATURE_CATALOG`, lists every feature where `defaultFor.includes(condition)` and currently not enabled in the user's resolved flags.
- Each row: checkbox (pre-checked) + label + one-line "why".
- "Turn on" merges those keys into `profiles.feature_overrides` set to `true`. "Skip" closes.

Triggered from:
- The new suggestions card (after "Add to my profile")
- The existing `ConditionHistorySection` "Add condition" path in Settings (when a user adds a condition mid-life)

### 4. Smoke testing

After the edits I'll:
- Read worker logs (`stack_modern--server-function-logs`) for any runtime errors from the recent serverFns (`listReports`, `caregiverReadOverview`, `setCaregiverHiddenFeatures`, `reportTrends`).
- Open the preview at `/` (footer), `/settings` (What I track + Condition history), `/reports` (search + suggestions card), `/reports/trends/$metricKey`, `/welcome` step 4, `/care/$ownerId` (Customize tabs dropdown) — screenshot each and visually verify.
- Run `supabase--linter` after the migration.

### 5. Technical notes

- One new migration: `profiles.suggestions_dismissed jsonb default '[]'`.
- No new edge functions; everything via `createServerFn`.
- All thresholds live in `condition-suggestions.ts` so they're easy to tune.
- Suggestions card uses `useQuery` with the existing query client; stale time 5 min.

## Files

- Edit: `src/components/layout/site-footer.tsx`
- Create: `supabase/migrations/<ts>_add_suggestions_dismissed.sql`
- Create: `src/lib/condition-suggestions.ts`
- Create: `src/lib/condition-suggestions.functions.ts` (serverFn)
- Create: `src/components/reports/condition-suggestions-card.tsx`
- Create: `src/components/conditions/enable-trackers-sheet.tsx`
- Edit: `src/routes/_app/reports.tsx` (mount suggestions card)
- Edit: `src/components/settings/condition-history-section.tsx` (open EnableTrackersSheet after add)

## Out of scope

- Replacing the rule-based suggester with an LLM call (can swap later behind the same serverFn).
- Real medical thresholds review by a clinician — the values above are common screening cutoffs, not clinical advice; we keep the "not a diagnosis" disclaimer.
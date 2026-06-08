## Goal

Close out the open threads from the last few rounds: a real admin UI for Platform Rules, consistent dropdown/theme tokens across pages, a clean Run-AI-Insights flow with a "Why" explainer, and a duplicate-report decision that sticks across future uploads.

## 1. Super admin Platform Rules page

New route `src/routes/_app/admin.rules.tsx` (gated by `is_super_admin`, linked from `admin.index.tsx`).

- List all rows from `platform_rules` grouped by scope (Platform / Role / User).
- Each row: `key`, `value` (JSON editor with validation), `enabled` toggle, `description`, scope_value picker (role select or user search when scope ≠ platform).
- Actions: Add rule, Edit, Enable/Disable, Delete. Save writes through new server fns in `src/lib/platform-rules.functions.ts` (`listRules`, `upsertRule`, `deleteRule`) — all guarded by `requireSupabaseAuth` + `is_super_admin` check.
- Audit logging: new table `platform_rule_audit` (`id, rule_id, actor_id, action, before jsonb, after jsonb, at`). Every mutation inserts a row. Audit list shown at the bottom of the page (latest 50).
- Seed known rule keys with friendly labels/descriptions in a small registry (`require_identity_match_for_metrics`, `require_dob_for_metrics`, `dedupe_overlap_threshold`) so admins see them even before first edit.

DB migration: create `platform_rule_audit` + RLS (super_admin only) + grants.

## 2. Dropdown + theme color audit

Sweep every native `<select>` and any hand-rolled menus that still use light-mode defaults; replace with shadcn `Select` (or `DropdownMenu`) using semantic tokens. Files to check based on prior grep:

- `src/routes/_app/community-new.tsx`, `reports.documents.tsx`, `reports.metrics.tsx`, `reports.new.tsx`, `meds.tsx`, `settings.*.tsx`, `admin.*.tsx`, `journal.new.tsx`, `today.tsx`.
- Also audit any `bg-white`, `text-black`, `border-gray-*` literals in those files and replace with `bg-card / bg-popover`, `text-foreground / text-muted-foreground`, `border-border`.
- Add a focused visual pass on the trends page (where the issue was first reported) and admin pages.

No design changes — token replacement only.

## 3. Run AI insights — never a dead end

In `src/routes/_app/reports.trends.$metricKey.tsx`:

- If a cached `metric_insights` row exists for `(user_id, metric_key, latest_at)` → render it.
- Else render an empty state with: short "Why" explainer + **Run AI insights** button (always visible, never the bare "Insights unavailable" text).
- On error (credits, rate-limit, network), keep the button and show the specific reason inline with a Retry.
- Remove any path that renders "Insights unavailable right now." without the button.

Server fn `getMetricInsight` already returns cached; add `runMetricInsight` mutation that forces a fresh run for the latest reading only and writes to cache.

## 4. "Why" explainer under AI insights

Small collapsible block above the Run button:

> AI insights look only at your **latest reading** for this metric, plus your profile conditions and reference range. They do not reanalyze older entries — those are already on the chart. Running costs a small amount of AI credits.

Copy lives in a constant so it's easy to tune. Same block shown in cached state (collapsed by default) so users always know the scope.

## 5. Duplicate report decision memory

Today duplicates are flagged via `report_documents.duplicate_of` and a banner offers Approve/Delete. Problem: a future re-upload of the same file re-creates the row and re-flags.

Changes:

- Add `report_documents.content_hash text` (sha256 of normalized OCR text + report_date + key metrics) and `user_decision text` (`'kept' | 'rejected' | null`) with index on `(user_id, content_hash)`.
- During upload (`src/lib/reports.functions.ts`):
  1. Compute `content_hash` after OCR.
  2. If a prior row with same `(user_id, content_hash)` exists and `user_decision = 'rejected'` → reject upload immediately with a clear message ("You previously rejected this report on <date>.") and do not insert metrics.
  3. If prior `user_decision = 'kept'` → mark new upload as `duplicate_of` that row automatically, no banner needed.
  4. Otherwise behave as today (run identity + overlap check, show banner).
- Banner Approve / Reject buttons set `user_decision` accordingly so the decision sticks.
- `listTrendMetrics` / `getMetricSeries` already exclude `duplicate_of IS NOT NULL` — no change needed.

DB migration: add the two columns + index.

## Files

**New**
- `src/routes/_app/admin.rules.tsx`
- `src/lib/platform-rules.functions.ts`
- `src/components/admin/rule-editor.tsx`
- Migration: `platform_rule_audit` table; `report_documents.content_hash`, `user_decision` columns.

**Modified**
- `src/routes/_app/admin.index.tsx` (link to Rules)
- `src/routes/_app/reports.trends.$metricKey.tsx` (button always present, Why block)
- `src/lib/report-trends.functions.ts` (add `runMetricInsight`)
- `src/lib/reports.functions.ts` (hash + decision-aware upload)
- `src/routes/_app/reports.$reportId.tsx` (Approve/Reject writes `user_decision`)
- Dropdown/theme sweep across the files listed in section 2.

## Out of scope

- No changes to the metric card layout, brand, or nav.
- No new AI providers — still Lovable AI Gateway / Gemini.
- No retroactive hashing of old reports (hash only set on new uploads; old duplicates still resolvable via the banner).

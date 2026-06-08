## Status check

I went through the three asks. Items 1 and 2 are already implemented; item 3 has a small gap worth closing. Plan below covers a quick polish pass + an end-to-end verification.

### 1. Theme/color tokens on native dropdowns — DONE

Every native `<select>` in the repo (admin.promo, settings.travel, settings.sharing, reports.medical-history, trip-edit-dialog, itinerary-editor) now carries `bg-background text-foreground` plus `[&>option]:bg-popover [&>option]:text-popover-foreground` so the dropdown list reads correctly in both themes. Nothing left to change here — no action needed unless you spot a specific page still looking wrong.

### 2. Run AI insights — DONE, verify only

`reports.trends.$metricKey.tsx` already:
- Loads cached insight without calling the model.
- Always shows a "Run AI insights" / "Re-run" button (never a dead-end "Insights unavailable").
- Shows specific copy for `credits_exhausted`, `rate_limited`, `not_enough_data`.
- Limits scope to the latest reading + profile conditions + reference range (per the "Why" explainer).

Verification only — I'll click through `/reports/trends/<key>` for a metric with no cached insight, confirm the button is visible, run it, and confirm the cached card renders after.

### 3. Duplicate report decision memory — small gap to close

The upload path in `src/lib/reports.functions.ts` already:
- Computes a `content_hash` (report_date + sorted metric=value pairs).
- Blocks re-uploads when a prior row for the same `(user_id, content_hash)` has `user_decision = 'rejected'`.
- Auto-links to the kept original when prior `user_decision = 'kept'`.
- Persists Approve → `user_decision: 'kept'` / Reject → `user_decision: 'rejected'` via `setReportIdentityDecision`.

Two small gaps to close before testing:

a) **Surface the "previously rejected" block to the user.** Today `processReport` returns `{ blocked: "previously_rejected" }` but `reports.new.tsx` ignores the field, so the upload looks successful. Add a toast/inline message ("You previously rejected a report with these readings — it wasn't re-added.") on upload completion when `blocked === "previously_rejected"`, and surface the same message in the report detail page for that tombstoned row (currently it just shows `error_message`, which is fine — verify it renders).

b) **Backfill `content_hash` for existing kept/rejected rows.** Without this, a user who already rejected a report before this feature shipped won't get the sticky behaviour. One-time migration: after `processReport` finishes a successful extraction, if `content_hash IS NULL` on the row, compute and write it. (Already covered by line 388–391, so this only matters for rows that never get re-processed. Acceptable to leave as-is — flag for follow-up only.)

### Verification steps (end-to-end)

1. **Insights:** open `/reports/trends/iron_saturation` (current route). Confirm: button visible when no cached insight, click runs, result caches, "Re-run" appears after.
2. **Duplicate — reject:** upload a report, open it, click "Not me — delete" on the identity banner. Re-upload the same file. Confirm: upload finishes with the new toast, no metrics added, report row exists with `status='rejected'`.
3. **Duplicate — approve:** upload a report flagged as duplicate, click "This is me — approve". Re-upload. Confirm: new row auto-linked as `duplicate_of`, no banner shown, metrics excluded from trends.

### Files touched in this plan

**Modified**
- `src/routes/_app/reports.new.tsx` — handle `blocked: "previously_rejected"` from upload response, show toast.

**Read-only verification**
- `src/routes/_app/reports.trends.$metricKey.tsx`
- `src/lib/reports.functions.ts`
- `src/lib/report-trends.functions.ts`

### Out of scope

- No new migrations.
- No retroactive hashing of pre-feature reports.
- No further dropdown sweeps — all native selects are already token-safe.
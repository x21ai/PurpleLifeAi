## Remaining scope

Phase 2 shipped panels, AI summaries, and clinician share links. This plan closes out the three items still on the list.

### 1. Monthly auto-send cron

- New public route `src/routes/api/public/cron/medical-reports.ts` (apikey-gated, no PII in response).
- Iterates `medical_report_schedules` where `active = true` and `day_of_month` matches today (in the schedule's timezone) and `last_run_at` is null or older than ~25 days.
- For each schedule: call the existing `generateMedicalReport` server helper for a `window_days` window, then email each recipient using the existing `medical-report-share` template via the standard transactional email path. Writes `last_run_at` / `last_error`.
- pg_cron job (daily at 13:00 UTC) → posts `{}` to that route with `apikey` header. Registered via the supabase insert tool (not migration) since it carries the project URL + anon key.
- Settings UI on `/reports/medical-history`: small "Monthly auto-report" card to toggle active, pick day-of-month (1–28), window (30/60/90 days), and recipient list (chips). Backed by `medical_report_schedules` (table already exists).

### 2. Journal → report auto-routing

- Extend `journal-entries` AI extraction (`src/lib/journal.functions.ts` / the existing extractor) so when attached media looks like a clinical document (PDF or image with lab/imaging keywords from `metric_dictionary` aliases), it:
  1. Copies the file from `journal-media` to the `reports` bucket under the same user.
  2. Inserts a `report_documents` row and triggers the existing extraction pipeline from phase 2.
  3. Tags the journal entry with `ai_tags += ['auto-routed-to-reports']` and links via `ai_extracted.report_document_id` so the journal still shows it.
- Classifier is a lightweight Gemini call reusing the panel-aware prompt from phase 2; runs only when the entry has at least one attachment and the user has not already flagged it as "not medical".
- Add an "Undo / this isn't a report" action on the journal entry that removes the `report_documents` row and clears the tag.

### 3. Richer PDF charts (multi-source overlays + event markers)

In `src/lib/medical-report.server.ts`:

- Replace the single-series line chart helper with a small SVG renderer that supports:
  - Multiple series in one chart (Oura / Whoop / Apple Health) with a legend and distinct dash patterns (no new deps; pure SVG → embedded in PDF via the existing pdf-lib path).
  - Per-day seizure markers as vertical ticks along the x-axis when a seizure occurred that day.
  - Optional reference band (e.g., resting HR normal range) when `metric_dictionary` has `default_ref_low/high`.
- Apply to the four headline panels in the PDF: Sleep score, Resting HR, HRV (RMSSD), and Readiness/Recovery. Each section renders one overlay chart instead of three stacked single-source ones.
- Update the report's "Summary" page to mention which sources contributed for each chart.

## Technical details

```text
src/routes/api/public/cron/medical-reports.ts   (new)
src/lib/medical-report-schedules.functions.ts   (new — list/upsert/toggle)
src/routes/_app/reports.medical-history.tsx     (add schedule card)
src/lib/medical-report.server.ts                (chart upgrades)
src/lib/journal.functions.ts                    (auto-route hook)
src/lib/reports.functions.ts                    (reuse classifier + extract)
```

No schema changes needed — `medical_report_schedules` and `report_documents` already cover this. pg_cron registration is one insert-tool call after the route is live.

## Out of scope for this pass

- Per-recipient delivery preferences (HTML body vs link only)
- Editable per-panel chart selection in the PDF
- Reading non-PDF DICOM imaging files

Approve and I'll build all three.
# Fix Trends: duplicates, missing year, % Saturation label

## 1. Collapse same-day duplicate readings (the Oct 18 ×2 / Nov 8 ×2 dots)

**Root cause:** Several of your existing lab reports were uploaded twice. Both copies live in `report_documents` without `duplicate_of` set, so `report_metrics` has two identical rows per metric per date. The Trends chart plots both, creating the doubled dots.

**Two-part fix (data + code), no deletions:**

**a. Mark the duplicate uploads in the DB (one-time migration, safe & reversible)**
- For every group of `report_documents` belonging to the same user where `report_date` is identical AND the set of `(metric_key, value)` extracted is identical, keep the earliest-created one and set `duplicate_of = <earliest>.id` on the rest.
- Nothing is deleted. `report_metrics` rows stay intact. The existing trends query already filters out reports where `duplicate_of IS NOT NULL`, so the chart will immediately stop double-plotting.
- The Documents page can later show "duplicate of …" with an unmark button if you ever want one back.

**b. Defensive dedupe in `listTrendMetrics` (`src/lib/report-trends.functions.ts`)**
- Even after the DB cleanup, collapse same-day points within a metric by averaging (or taking the most recent `created_at` if values differ slightly) before pushing to `row.series`. This prevents future duplicates from re-creating the visual issue if two PDFs slip through.

## 2. Show the year on the X axis

In `src/components/reports/trends-section.tsx`:
- Update `formatTick()` to include a 2-digit year when the series spans more than one calendar year, e.g. `"Nov 8 '25"`. When all points are within one year, keep the compact `"Nov 8"` form to save horizontal space on small cards.
- The "Latest …" footer line already includes the year (uses `formatDate` with `year: "numeric"`), so no change there.

## 3. "% Saturation" vs "iron Saturation"

The card title uses whatever `display_name` the lab PDF printed (`"% Saturation"`, `"% SATURATION"`). Our internal `metric_key` is `iron_saturation`, hence the URL.

**Fix in `src/components/reports/trends-section.tsx`:**
- When the `display_name` is non-descriptive on its own (starts with `%`, or is just a unit/abbreviation), fall back to a humanized `metric_key` instead — so this card reads **"Iron Saturation"** with `% Saturation` shown as a small subtitle/secondary label. For all other metrics that already have a clear name (e.g. `"HDL CHOLESTEROL"`), keep the PDF wording but Title Case it.
- This way the route, the chart title, and what's printed on the PDF are all reconciled visually.

## 4. Where the data comes from (no code change, FYI)

`report_metrics` is populated by the lab-PDF extractor when you upload via `/reports/new`. Each metric becomes one row keyed to one `report_documents` row. The extractor doesn't currently check whether the same file was already uploaded, which is why duplicates accumulated. A separate follow-up could add an upload-time SHA hash check on the PDF bytes — out of scope for this fix but happy to plan it next if you want.

---

## Files touched

- New migration `supabase/migrations/<ts>_dedupe_report_documents.sql` — sets `duplicate_of` on duplicate uploads. No data deleted.
- `src/lib/report-trends.functions.ts` — defensive same-day dedupe inside the series builder.
- `src/components/reports/trends-section.tsx` — smarter `formatTick` (year when needed), smarter title label.

## Out of scope (ask if you want any of these next)

- Upload-time PDF hash to prevent future duplicates.
- A "Mark as duplicate" / "Restore" button on the Documents page.
- Re-running the extractor on existing reports to fill in missing reference ranges.


# Reports & App Polish — Plan

A lot to fix. Grouped by area so it's easy to approve or trim. Nothing here deletes user data.

---

## 1. Metric naming map (with "as printed" preserved)

**Rule (will also save to project memory):**
> Every chart/card shows the canonical human name as the primary label.
> The PDF's exact wording is always preserved underneath as "as printed: …".
> If the PDF wording already matches the canonical name (case-insensitive), the "as printed" line is hidden — never duplicate.

Implementation:
- New `src/lib/metric-naming.ts` — a JSON map of `metric_key → { canonical, aliases[] }` seeded with the common labs we already have ("% Saturation" → "Iron Saturation", "PSA, Total" → "PSA Total", "MCV" → "MCV (Mean Corpuscular Volume)", etc., ~60 entries pulled from the current `report_metrics` rows).
- `metricLabel()` in `trends-section.tsx` and the metric detail page both read from this map. Falls back to humanized `metric_key` if not mapped.
- Store the raw PDF wording on every reading so per-reading provenance still shows what the lab actually printed.

## 2. Duplicate ingestion admin

New screen: `/admin/reports/duplicates` (admin-gated via existing `has_role`).

- Server fn `listSuspectedDuplicates()` groups `report_documents` by `(user_id, report_date, fingerprint)` where fingerprint = sorted `metric_key:value` hash. Returns groups with 2+ rows.
- UI: one row per group, expandable to show each report (filename, uploaded_at, identity status). Actions per row: **Keep this one** (sets `duplicate_of` on the others) / **Exclude from trends** (sets `duplicate_of = self-loop sentinel` or new `excluded_from_trends boolean`) / **Restore**.
- All actions are reversible (clear `duplicate_of`). No DELETE.

## 3. Datapoint provenance tooltip

On every Trends chart point:
- Tooltip already shows value+date. Extend to include report title and a "View source" link to `/reports/$reportId`.
- On the metric detail page, the Readings list already lists contributing reports — add a small chevron that expands to show the raw extracted snippet (`source_text` column we'll add to `report_metrics` if missing; if not feasible without re-extraction, show "PDF wording: <display_name>" + link).

## 4. Year on X axis when range crosses years

Already partially done last turn (`formatTickWithYear` when series spans >1 year). Extend to the metric detail page chart (`/reports/trends/$metricKey`) which currently uses its own formatter. Also include year in the tooltip label on both views.

## 5. Theme parity (dark vs light)

Audit: the metric detail page (`reports.$reportId.tsx` / `biometrics.$metric.tsx`) uses hardcoded light styles in a few cards, while Trends uses the dark `report-card` tokens. Fix: replace hardcoded `bg-white text-black` with semantic tokens (`bg-card text-foreground`) so the theme provider (already global) controls all pages uniformly. Verify Account, Settings, Reports, Trends, Metric detail all respect `dark | light | system`.

## 6. Sort preference persists across sessions

- Today: sort mode is stored in `sessionStorage` (lost on logout).
- Move to `profiles.preferences jsonb` (key `trends_sort_mode`) via server fn `setUserPreference` / `getUserPreference`. Hydrate on mount from the user row, write on change. Fall back to localStorage for signed-out preview.
- Sort options stay: Alphabetical · Needs attention · Most recent · Most readings · Custom. "Needs attention" already exists in the Select — confirm it's visible (it is in the current code, screenshot likely pre-deploy).

## 7. Reports tab: filters → dropdowns + default sort

Replace the long inline Year / Type / Status pill rows with three compact `Select` dropdowns. Default sort: **most recent first, grouped by Year → Month** (2026 → June → May → …). Add a "Sort" dropdown next to filters (Newest, Oldest, A–Z, Type).

## 8. Bulk re-run failed extractions

On Reports tab when any row has `status='failed'`:
- Banner: "10 reports failed extraction. [Re-run all failed]".
- Server fn `rerunFailedExtractions()` iterates the user's failed reports and re-enqueues them (same code path as the single-row "Re-run extraction"). Shows toast progress.

## 9. Clinical Report "View file" broken

Currently the button opens a signed URL that 404s for some legacy rows. Fix:
- Server fn `getReportFileUrl(reportId)` returns a fresh `createSignedUrl` (60 min) from the `reports` bucket. If the storage object is missing, return `{ status: 'missing' }` and the UI shows "Original file no longer available" instead of a broken link.
- Add a **Share** button next to View file: copies a signed URL valid for 7 days (uses existing `share-codes` infra).

## 10. DNA raw file uploads

New section under Reports: **Genetics**.
- New private bucket `genetics` (RLS: owner-only).
- New table `genetic_files (id, user_id, filename, size, mime_type, uploaded_at, source ENUM: 23andme|ancestry|nebula|other, notes)`.
- New route `/reports/genetics`: upload `.txt`, `.zip`, `.vcf`, `.vcf.gz` up to 200 MB. List + delete + download (signed URL).
- No parsing yet — just secure storage and listing. Parsing is a future plan.

## 11. Navigation polish

- **Icon alignment**: the left rail icons are inconsistent sizes/strokes. Normalize all to `h-5 w-5 stroke-[1.5]` lucide icons, same vertical spacing.
- **Duplicate icons**: replace duplicates (two heart-style icons for My Body vs Caregiver) with distinct icons (My Body → `HeartPulse`, Caregiver → `Users`/`HandHeart`).
- **Tooltips on collapsed rail / mobile**: wrap each rail item in shadcn `Tooltip` showing the label + (if a section) the child links. On mobile (`<sm`), tapping a section opens a sheet listing children rather than collapsing inline.
- **Pink dot top-left**: that's the unread notification badge on the Purple wordmark area — it violates the "wordmark stands alone" memory rule. Move the badge to the account menu (top-right) where notifications already live.

## 12. Footer parity on web/tablet

The marketing footer is only rendered on the landing/marketing routes. Per existing `mem://design/footer-visibility`, the app footer should appear on every app route at `md+`. Add `<AppFooter />` to `_app.tsx` layout below `<Outlet />`, hidden on `<md` (mobile uses bottom nav).

## 13. Automated tests (Vitest + Playwright)

- `tests/unit/metric-naming.test.ts`: canonical map round-trips (`% Saturation` → `Iron Saturation`, unknown keys → humanized fallback, "as printed" hidden when match).
- `tests/unit/trends-format.test.ts`: `formatTick` vs `formatTickWithYear` for single-year and multi-year series; same-day dedupe averaging.
- `tests/unit/dedupe.test.ts`: `listTrendMetrics` with a fixture of duplicated rows produces single points per day.
- `tests/e2e/reports-duplicates.spec.ts`: admin sees the duplicates page, can mark Keep/Restore.

---

## Technical notes

- Migrations needed: `genetic_files` table + bucket, `report_documents.excluded_from_trends boolean default false`, `profiles.preferences jsonb default '{}'`, optional `report_metrics.source_text text` (only if cheap to backfill from existing extractor output; otherwise skip).
- All public.* tables get the required `GRANT` block and RLS policies.
- No new edge functions. Everything is `createServerFn`.
- No data deletion anywhere.

## Out of scope (call out so you can add if you want)

- Auto-parsing 23andMe / VCF into traits — storage only for now.
- A fuzzy "same lab report uploaded twice with slightly different values" detector — current fingerprint is exact-match on `(date, metric_key, value)` set.
- Re-running the extractor on already-successful reports to backfill missing reference ranges.

---

Reply **approved** and I'll execute. If any item should be dropped or split into a smaller first pass (e.g. ship items 1, 5, 6, 7, 8, 9, 11 first; defer DNA + admin duplicates), say which.

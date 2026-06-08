# Deferred Items - Sequenced Execution Plan

Working through the 7 deferred items in order. Each is shipped independently so you can review/approve after each wave. Em-dash cleanup runs first because it currently breaks CI.

---

## Wave 0 — Em-dash cleanup (unblocks CI)

Run `npm run check:em-dash`, replace every `—` per the project rule (`,`, `and`, `or`, `:`, `.`, or `·` for title separators). Touches only comments/copy added last turn. No behavior changes.

---

## Wave 1 — Navigation polish

Files: `src/components/layout/app-shell.tsx`, sidebar/rail components, mobile nav.

1. **Icon normalization**: every rail icon → `h-5 w-5 stroke-[1.5]` lucide. Replace duplicate hearts: My Body → `HeartPulse`, Caregiver → `Users`.
2. **Tooltips on collapsed rail**: wrap each rail item in shadcn `Tooltip` showing the label.
3. **Mobile sub-link sheet**: on `<sm`, tapping a section row opens a `Sheet` listing children instead of inline expand.
4. **Pink dot relocation**: move unread badge OFF the Purple wordmark (violates core memory rule) to the account avatar (top-right).

---

## Wave 2 — Footer parity audit on app routes

Per `mem://design/footer-visibility`, marketing footer renders on marketing/auth only and AppShell renders nothing. Audit current state, confirm no app route accidentally renders `SiteFooter`, and add a minimal `AppFooter` (legal links + version) to `_app.tsx` at `md+` only if you confirm you want it. Default of this wave: **audit + confirm rule still holds**, no new footer unless you say yes.

Question: do you want a small in-app footer at md+, or just verify the existing rule is intact?

---

## Wave 3 — Datapoint provenance tooltip

1. Migration: add `report_metrics.source_text text` (nullable). No backfill (existing rows show "PDF wording: <display_name>" fallback).
2. Update extractor server fn to populate `source_text` going forward (raw snippet from PDF page).
3. Trends chart tooltip: extend to show contributing report title + "View source" link to `/reports/$reportId`.
4. Metric detail page Readings list: add chevron, expand to show `source_text` or fallback.

---

## Wave 4 — Admin duplicate-ingestion screen

Route: `/admin/reports/duplicates` (gated by `has_role(auth.uid(), 'super_admin')`).

1. Migration: add `report_documents.excluded_from_trends boolean default false`. GRANTs preserved.
2. Server fns: `listSuspectedDuplicates()` (groups by `(user_id, report_date, fingerprint)`), `markDuplicate(id, keeperId)`, `excludeFromTrends(id)`, `restoreReport(id)`. All set flags, no DELETE.
3. UI: expandable group rows, per-report actions Keep / Exclude / Restore. Reversible.
4. Trends queries filter `excluded_from_trends = false`.

---

## Wave 5 — DNA / genetics raw-file uploads

1. New private bucket `genetics` (via storage tool, RLS owner-only on `storage.objects`).
2. Migration: `genetic_files (user_id, filename, size, mime_type, source enum 23andme|ancestry|nebula|other, notes, uploaded_at)` with GRANTs + RLS scoped to `auth.uid()`.
3. Route `/reports/genetics`: upload `.txt`, `.zip`, `.vcf`, `.vcf.gz` up to 200 MB. List + download (signed URL) + delete (sets `deleted_at`, no hard delete per project rule).
4. Add "Genetics" tab to Reports section.

No parsing. Storage + listing only.

---

## Wave 6 — Automated tests

Vitest + Playwright additions:
- `tests/unit/metric-naming.test.ts` — `resolveMetricLabel` canonical + as-printed hiding.
- `tests/unit/trends-format.test.ts` — `formatTick` vs `formatTickWithYear` single/multi-year.
- `tests/unit/dedupe.test.ts` — `listTrendMetrics` collapses same-day duplicates.
- `tests/e2e/reports-duplicates.spec.ts` — admin sees duplicates page, Keep/Restore round-trip.

---

## Execution order and approval

I'll ship one wave per turn, stopping after each so you can verify in preview before the next. Migrations (Waves 3, 4, 5) each go through the standard migration approval step.

**Reply with one of:**
- "go" - start Wave 0 then Wave 1
- "go all" - run waves back-to-back without pausing
- "skip N" / "do N first" - reorder
- Answer the Wave 2 question (footer yes/no) so I can lock the scope

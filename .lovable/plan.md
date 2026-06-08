
## Why the earlier 504 errors

The blank screen + `504 for /node_modules/.vite/deps/chunk-…js` was not an app bug. It was Vite's dep-optimization cache going stale after we installed three new packages (`ai`, `@ai-sdk/react`, `@ai-sdk/openai-compatible`) for the Ask Purple rewrite. Vite re-bundles `node_modules/.vite/deps` on the next request; the in-flight request for an old chunk hash 504s until the new bundle is ready. Restarting the dev server + reloading clears it. There is nothing left to fix in code, but to prevent it next time I'll restart the dev server immediately after adding deps.

## What's left from prior phases

1. **Reports surface split** (this plan, biggest item).
2. **Responsive QA sweep** of `/reports`, `/reports/$id`, `/biometrics/$metric`, `/chat`, `/timeline` at 375 / 390 / 414 widths. Fix-as-found, no big rewrites.
3. **Maya provider** — still blocked on you sharing endpoint URL + auth scheme. Skipping unless you drop the details.
4. Everything else from earlier phases (Ask Purple AI-SDK rewrite, provider routing across care-chat / insights / journal-recap / med-intelligence / condition-suggestions / feature-suggestions / medical-report, dark report shell, light metric drilldown) is done.

---

## Reports surface split

Today `/reports` mashes upload, report list, the clinician PDF box, and the giant "Trends" metric list onto one dark scroll. You want a clean two-tab structure: **Reports** (the documents themselves) and **Metrics** (the trended data points across all reports).

### New routes

```text
/reports                    → redirect to /reports/documents
/reports/documents          → list of uploaded reports + upload + clinician PDF
/reports/$reportId          → existing report detail (unchanged)
/reports/metrics            → searchable list of all tracked metrics (was the "Trends" section)
/reports/trends/$metricKey  → existing drilldown (already shows graph + range + history)
```

`reports.tsx` becomes a thin layout that renders an `<Outlet />` plus a top tab bar (Reports · Metrics). Both child routes inherit the dark `ReportShell` theme already in place.

### `/reports/documents` (tab 1)
Pulls the existing pieces out of `reports.tsx`:
- Upload card
- "One-tap PDF for your next visit" clinician card (`QuickClinicianPdf`)
- Search input
- Report list with status pill, metric count, panel chips
- Each row links to `/reports/$reportId`
- Row action menu: **View PDF** (opens existing signed-URL viewer), **Share** (existing share-token flow via `medical-report-share.functions`), **Download** (signed URL with `download` attr). Today this is only available inside the detail page; we surface it on each list row as a kebab menu.

### `/reports/metrics` (tab 2)
- Reuses `TrendsSection` content but as its own page (header, search, sort by name / latest date / # readings, "pinned" toggle).
- Each row shows: metric name, # readings, latest value + unit, mini sparkline, in/out-of-range pill.
- Row click → `/reports/trends/$metricKey` (already implemented; that page already shows the full-history line chart with reference range band, value + date per reading, CSV export). No changes needed there beyond a small responsive tweak below.

### Responsive fixes bundled in
While moving things around:
- `ReportShell` header: stack title + actions under 480px (currently overflows on 375).
- Report row meta line: switch to 2-line layout on narrow screens so panel chips don't squeeze the chevron off-screen.
- `/reports/trends/$metricKey` range pill row + CSV: wrap to a second row under 380px (already mostly fine, one `flex-wrap` tweak).
- `/chat`: bottom composer safe-area padding on iOS PWA (your screenshots are 375×550-ish).
- `/timeline`: filter pills wrap, currently they do; just verify.

### Out of scope
- No schema changes (metrics + `report_documents` + `report_metrics` already power this).
- No new server fns; reuse `listReports`, `getMetricSeries`, existing share/download.
- No changes to the `/reports/$reportId` detail page beyond linking back to `/reports/documents`.

### Verification
- Tab bar switches without full reload, URL updates.
- Kebab on a report row: View PDF opens in a new tab, Share copies a link + toast, Download saves the PDF.
- `/reports/metrics` shows the same metrics the old Trends section did; clicking HDL Cholesterol opens the multi-year graph with the reference band and per-reading dates.
- All four mobile viewports (375 / 390 / 414 / 320) render without horizontal scroll on `/reports/documents`, `/reports/metrics`, `/reports/trends/$metricKey`, `/chat`.

### Technical notes
- `reports.tsx` already gates content with `pathname !== "/reports"` → `<Outlet />`. I'll change that to: if pathname is exactly `/reports`, `throw redirect({ to: "/reports/documents" })` in `beforeLoad`; otherwise render the tab shell + outlet.
- New files: `src/routes/_app/reports.documents.tsx`, `src/routes/_app/reports.metrics.tsx`, `src/components/reports/report-row-actions.tsx` (the kebab menu).
- `TrendsSection` gets a `variant="page"` prop so it can render full-bleed inside the new metrics route without the "section header" it currently uses on the dashboard.

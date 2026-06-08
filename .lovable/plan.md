# Fix Reports & Metrics issues

Four targeted fixes — UI/wiring only, no DB changes.

## 1. Retry actually retries (report detail page)
`src/routes/_app/reports.$reportId.tsx` — the "Retry" button on a failed report currently calls `refetch()`, which just re-reads the same failed row. Wire it to the existing `processReport` server fn (already used by `ReportRowActions`):
- Add `const reprocess = useServerFn(processReport);` and a `retrying` state.
- On click: `await reprocess({ data: { reportId } })`, then `refetch()` and toast.
- Show a spinner while in-flight; disable button.

## 2. Back link goes back to where the user came from
- `ReportShell` `back` on the detail page currently points to `/reports` which redirects to `/reports/metrics`. Change the back target on `reports.$reportId.tsx` to `/reports/documents` (label "Reports") so it lands on the documents tab.
- Sweep other "back to /reports" links (`reports.new.tsx`, `reports.medical-history.tsx`, `reports.trends.$metricKey.tsx`) and point each to the tab they came from (`/reports/documents` or `/reports/metrics`).

## 3. Contributing reports — filters / categorization
`src/routes/_app/reports.documents.tsx` — keep the current `report_type` grouping, but add a filter bar above the list with:
- **Year** chips (derived from `report_date ?? created_at`, distinct, newest first, plus "All").
- **Type** chips (distinct `report_type`, plus "All").
- **Status** chips (All / Ready / Failed / Processing) — lets the user find broken ones fast.
- Free-text search (already exists).

Filters compose (AND). Empty state when filters exclude everything. "Lab" and "Country" aren't reliably extracted today; we'll skip those rather than show empty filters. If you want them later, we'd need to extend extraction + DB columns — call that out as a follow-up.

## 4. Metrics page — real dates, sort modes, drag
`src/components/reports/trends-section.tsx` + the existing `reorderMetrics` server fn (still in `report-trends.functions.ts`).

- **Show latest date** on every card: under "N readings · latest <value> <unit>" add `· <formatted latest_at>` using `latest_at` already on `TrendMetricRow`. This means dates show without clicking.
- **Sort dropdown** at the top of the section with options:
  - Alphabetical (A→Z) — current default
  - Needs attention (out-of-range first: `latest_flag` high/low before normal/null, then A→Z)
  - Most recent (by `latest_at` desc)
  - Most readings (by `count` desc)
  - Custom (drag) — only enabled when user has dragged at least once; respects `sort_order`
- Pinned metrics always float to the top within the chosen sort.
- **Drag to reorder** (Custom mode only): reintroduce `@dnd-kit` `DndContext` + `SortableContext` around the grid, persist via `reorderMetrics`. When the user starts dragging, auto-switch sort to "Custom".
- Sort choice is local state (sessionStorage) — no schema change.

## Files touched
- `src/routes/_app/reports.$reportId.tsx` — wire Retry to `processReport`, change back target.
- `src/routes/_app/reports.documents.tsx` — add Year / Type / Status filter chips.
- `src/components/reports/trends-section.tsx` — latest date, sort dropdown, optional drag.
- `src/routes/_app/reports.new.tsx`, `reports.medical-history.tsx`, `reports.trends.$metricKey.tsx` — back-link sweep.

No DB migrations, no server-fn signature changes (everything we need already exists: `processReport`, `reorderMetrics`, `latest_at`).

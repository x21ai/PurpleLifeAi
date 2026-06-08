## Reports → Metrics-first, responsive grid

### 1. Tab order + default landing
- `src/components/reports/reports-tabs.tsx` — swap order to **Metrics** (first) then **Reports**.
- `src/routes/_app/reports.tsx` — change the index redirect from `/reports/documents` → `/reports/metrics` so `/reports` lands on Metrics.
- Keep `/reports/documents` working unchanged.

### 2. Metrics list → responsive card grid (in `src/components/reports/trends-section.tsx`)
Replace the current single-column `<ul>` with a responsive grid:
- `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3`
- Each `MetricRow` becomes a card tile (same dark `report-card` look as today, same `#5CE0AC` line color):
  - Top: metric name (capitalized, truncated, 2-line clamp)
  - Sub: `N readings · latest <value> <unit>` with the existing `flagTone` color (green/pink/yellow)
  - Bottom: the same sparkline chart, full card width, height ~56px, same Recharts `LineChart` config as the detail page sparkline (monotone, no dots, `dataMin/dataMax` Y domain) so it matches the click-through chart visually
  - Pin / hide buttons move to a small top-right cluster (icon-only, show on hover, always visible on touch)
  - Drag handle stays top-left
  - Whole card remains a `<Link>` to `/reports/trends/$metricKey`

### 3. Alphabetical ordering
- Sort `metrics` by `display_name ?? metric_key` (case-insensitive) before rendering.
- **Keep pinned items first** (pinned block sorted A→Z, then unpinned A→Z) — preserves the existing pin feature.
- Drag-to-reorder: since the list is now alphabetical, remove the drag handle + `DndContext` + `reorderMetrics` call from this view (ordering is derived, not manual). Pin/hide still work. This is the cleanest reconciliation; alternative is to keep drag but it fights the alphabetical rule.

### 4. Page header copy
- `src/routes/_app/reports.metrics.tsx` — drop the duplicate "All your metrics" header block (TrendsSection has its own header). Keep the page title + ReportsTabs only, so the grid gets full vertical space.

### Files touched
- `src/components/reports/reports-tabs.tsx` (tab order)
- `src/routes/_app/reports.tsx` (index redirect)
- `src/routes/_app/reports.metrics.tsx` (trim header)
- `src/components/reports/trends-section.tsx` (grid layout, alphabetical sort, remove DnD, card chart styling)

No DB changes, no server-fn changes, no new routes.

### Open question
Drag-to-reorder vs strict alphabetical — confirm you're OK dropping manual reorder in favor of A→Z (pinned first). If you want to keep drag, I'll keep DnD and only sort newly-seen metrics alphabetically on first insert.

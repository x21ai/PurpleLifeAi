## 1. Collapsible sidebar with right-edge toggle

Honors the memory rule: PURPLE wordmark stays untouched. The toggle lives on the sidebar's right edge, far from the wordmark.

**State**
- Add `purple-sidebar-collapsed` boolean in `localStorage` (default `false` on lg+).
- New hook `useSidebarCollapsed()` in `src/components/layout/sidebar-nav.tsx` returns `[collapsed, toggle]` and syncs to `localStorage` + dispatches a `storage`-style custom event so `AppShell` can react.

**Visual behavior**
- Expanded (lg+, not collapsed): current `lg:w-64` rail with labels.
- Collapsed (user toggled, any viewport ≥ md): force the existing `md:w-16` icon-only rail (reuses current collapsed styling, popovers, and `RailTooltip` hover labels — that already exists today on iPad widths).
- Below md: bottom nav as today, toggle hidden.

**Toggle button**
- Small 28×28 ghost button pinned to the sidebar's right edge, vertically centered on the header strip (top: ~40px). Uses `PanelLeftClose` / `PanelLeftOpen` from lucide (industry-standard collapse glyph, clearer than a burger and what shadcn uses).
- `aria-label="Collapse sidebar"` / `"Expand sidebar"`, wrapped in `Tooltip` so hover shows the label.
- Positioned `absolute -right-3 top-9` with `rounded-full border bg-background shadow-sm` so it overlaps the border like a tab pull, never crowding the wordmark.
- Hidden on `< md` (mobile uses bottom nav).

**Layout sync**
- `AppShell` reads the same collapsed state and switches main padding: collapsed → `md:pl-16` always; expanded → existing `md:pl-16 lg:pl-60`.

## 2. Consistent hover tooltip on every metric detail chart

Goal: on `/biometrics/$metric` and `/reports/trends/$metricKey`, hovering the line shows a clean card with the full date and the value(s) per source.

**Changes**
- `src/routes/_app/biometrics.$metric.tsx`:
  - Add `labelFormatter={(_, payload) => format(new Date(payload?.[0]?.payload?.x), "EEE, MMM d, yyyy")}` to the existing `<Tooltip>`.
  - Add `activeDot={{ r: 4 }}` to each `<Line>` so the hover point is visible.
  - Filter null series out of the tooltip via a small custom `content` renderer so empty sources don't render blank rows.
- `src/routes/_app/reports.trends.$metricKey.tsx`: apply the same Tooltip props (full-date label, styled card, source-aware formatter, activeDot) so both detail surfaces match.
- No styling changes to the metric-canvas; tooltip uses existing `--card` / `--border` tokens.

## 3. Out of scope
- No changes to PURPLE wordmark, mobile bottom nav, or the chart colors/lines themselves.
- No new memory edits (the wordmark rule stays as-is).

## Files
- `src/components/layout/sidebar-nav.tsx` — add collapse state, toggle button, force-collapsed mode.
- `src/components/layout/app-shell.tsx` — react to collapsed state for main padding.
- `src/routes/_app/biometrics.$metric.tsx` — tooltip polish.
- `src/routes/_app/reports.trends.$metricKey.tsx` — tooltip polish (same pattern).

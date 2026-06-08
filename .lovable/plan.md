## Why the sparkline looks "empty"

`MetricCard` currently renders a Recharts `LineChart` with no XAxis, no YAxis, no tooltip, no dots, no reference band. It's pure "shape only". So even though values + dates are loaded, the user sees only a curve — no numbers, no time axis, no high/low markers. That's the core complaint.

Each `TrendMetricRow` already carries everything we need (series of `{at, value}`, unit, reference_low/high, latest_value, latest_flag, latest_at, count). No DB or server-fn changes are required for the card upgrade.

---

## 1. Make each metric card readable at a glance

Rewrite `MetricCard` in `src/components/reports/trends-section.tsx` so the chart itself carries the story. No click needed for the basics.

Card layout (taller, ~180–200px):

```text
┌───────────────────────────────────────────────────────┐
│ % SATURATION                  [⤴ share] [⤓] [📌] [👁] │
│ 4 readings · normal range 95–100 %                    │
│                                                       │
│   100 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  (ref band)      │
│    98  •────•                                         │
│    96         \                                       │
│    94          •─────•                                │
│    92                                                 │
│      Jul 12   Aug 30   Oct 4    Nov 8                 │
│                                                       │
│ Latest 28 % · Nov 8, 2025  ↓ −4 vs prev               │
└───────────────────────────────────────────────────────┘
```

What changes in the chart:
- Add `XAxis` with date ticks (compact `MMM d`, only first/last/middle tick to avoid clutter on small cards).
- Add `YAxis` with 2–3 ticks, including unit suffix.
- Add a `ReferenceArea` for `reference_low`/`reference_high` when present (soft green band) so out-of-range readings visually pop.
- Add small dots per reading, color-coded by `flag` (high=pink, low=amber, normal=green).
- Add `Tooltip` on hover showing date + value + report title.
- Use `flagTone` to color the latest reading.
- Show "↓ −4 vs prev" delta line under the chart when ≥2 numeric readings exist.
- Keep an empty-state pill if `< 2` numeric points.

Two-per-row default (already in place), three on very wide screens, with a comfortable min height so the axes are legible. Drag handle stays in custom mode.

## 2. Per-card actions: share + download

Add a small action cluster to the top-right of every card:
- **Pin / Hide** (already there)
- **Download** — exports just this metric's series as CSV (reuse the `downloadCsv` helper pattern from `reports.trends.$metricKey.tsx`; lift it into a shared `src/lib/metric-export.ts`).
- **Share** — uses `navigator.share` when available with a generated PNG of the card chart + a short text summary ("My % Saturation — 4 readings, latest 28% on Nov 8, 2025"). Falls back to copying a link to the metric detail page when Web Share isn't available. Image is generated client-side via `html-to-image` (already small dep — add only if not present) of the card's chart node.

A single "Download all (CSV)" / "Share all" pair lives in the Trends header for the whole dashboard.

## 3. Refocus the detail page on AI insights

`reports.trends.$metricKey.tsx` keeps the bigger chart + readings table, but the hero block becomes **AI Insights**, not just stat cards:

- Add an "Insights" panel above the chart that calls a new server fn `getMetricInsight({ metricKey })` which:
  - Pulls the user's series for that metric (already available via `getMetricSeries`).
  - Pulls the user's `profiles.conditions` for context.
  - Calls Lovable AI Gateway (default `google/gemini-3-flash-preview`) with a tight system prompt: trend direction, notable spikes/drops with dates, possible patterns relative to their conditions, suggested questions to discuss with their clinician. Always appends `MedicalDisclaimer` copy.
  - Returns `{ summary, bullets[], suggestedQuestions[] }`. Cached server-side per `(userId, metricKey, latest_at)` so we don't re-bill for unchanged data.
- The existing "Ask Purple" prompt rail stays underneath, pre-filled from `suggestedQuestions`.
- Keep stat cards (Latest / Optimal range) but de-emphasize — they're a sidebar, not the hero.
- Add the same Share / Download buttons used on the dashboard cards.

## 4. What else can be added (small, intelligent extras)

Implement these now since they're cheap and directly serve "see at a glance":
- **Status chip** on each card: `In range` / `Out of range` / `Trending up` / `Trending down`, derived from the last 3 points vs the reference band.
- **Sparkline color** follows the *latest* `flagTone` (green/amber/pink), not always green — so a glance at the wall of cards immediately surfaces concerns.
- **Sort: "Needs attention"** already exists; promote it to default when at least one metric is out of range.

Skipped for now (mention only): annotating the chart with medication/journal events (would need a join across `medication_doses` and `journal_entries` — worth a follow-up).

---

## Files to touch

- `src/components/reports/trends-section.tsx` — rewrite `MetricCard` (axes, dots, ref band, tooltip, delta, status chip, share/download, color from latest flag). Add header-level "Download all" / "Share all".
- `src/lib/metric-export.ts` *(new)* — shared CSV helper + share-image helper.
- `src/lib/report-trends.functions.ts` — add `getMetricInsight` server fn (AI Gateway call), plus a tiny `getAllMetricsCsv` server fn for the dashboard-wide CSV.
- `src/routes/_app/reports.trends.$metricKey.tsx` — add Insights panel at the top, wire suggested questions into the Ask Purple rail, add Share/Download buttons, demote stat cards.
- `src/components/reports/metric-shell.tsx` — minor: a new `MetricInsightsPanel` component.

No DB migrations. No new tables. Uses existing `report_metrics`, `report_metric_preferences`, `profiles.conditions`, and Lovable AI Gateway.

## Technical notes

- For per-card Recharts: keep `isAnimationActive={false}` for grid performance; lazy-render charts below the fold with `IntersectionObserver` to avoid jank on long lists.
- Web Share API requires HTTPS + user gesture — already true in the preview/published environment. Feature-detect `navigator.canShare?.({ files: [...] })` before offering image share; fall back to text+url share, then to clipboard copy.
- AI insights server fn uses `try/catch` and returns `{ summary: null, bullets: [], error }` on failure so the panel degrades gracefully (no blank screen).
- Caching: insights cached in a new lightweight `metric_insights` table keyed by `(user_id, metric_key, latest_at)` — actually, to avoid a migration, cache in memory per request and rely on TanStack Query's `staleTime: 5min` on the client; regenerate when `latest_at` advances. Confirmed simpler — no schema change needed.

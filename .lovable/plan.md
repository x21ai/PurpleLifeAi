# Wave 6 — Polish & Launch

Three concrete issues in your screenshots + a launch checklist for "what's left."

## 1. Reports → Metrics (Trends) — the main fix

### a. Numbers clipping ("4000" rendering as "1000")
Cause: `YAxis width={30}` in `src/components/reports/trends-section.tsx` (line 290). 4-digit values overflow the axis gutter so the leading digit is clipped by the chart area.

Fix:
- Bump `YAxis width` to `44` (auto-sized to the widest tick).
- Add `tickFormatter` that compacts ≥1000 to `1k`, `3.9k`, etc. — keeps the axis narrow AND legible.
- Add left chart margin (`margin.left: 4`) so the leftmost dot doesn't kiss the axis.

### b. All values look similar (everything mint-green, no hierarchy)
- Stroke color currently driven only by `latest_flag`. When the flag is null (most user labs), every line is `#5CE0AC`. Switch the fallback to a calmer neutral (`rgba(255,255,255,0.55)`) so only truly normal/high/low lines carry semantic color.
- "Latest" number gets the same neutral when there is no flag (today it's mint regardless).
- Increase numeric weight: `font-variant-numeric: tabular-nums` + slightly bigger latest value.

### c. Spacing / card rhythm
- Title row currently reserves `pr-32` for 5 action buttons → on narrow widths the title wraps to 2 lines and crowds the chip row. Reduce action set on the card to **Pin + Hide** only; move Share / Download / "View source" into the metric detail page (they already exist there). Drop `pr-32` to `pr-20`.
- Bump card vertical padding from `p-4` to `p-5` and gap between cards from `gap-3` to `gap-4`.
- Move the "as printed:" line below the chip row so the title is always one line; hide it entirely when it's just `mg/dL` style noise (already partly handled, tighten the rule to `raw.length < 4`).

### d. "Out of range" should drive the default
- Make `attention` (Needs attention) the **default sort** (already is in your screenshot, good). On top of that, render a thin **"Out of range" section header** above the first non-flagged card so users see the boundary visually. No new query — derive client-side.
- Add a one-tap **"Only out of range" filter** chip next to the Sort dropdown.

### e. Group by body system (the big one)
Add a `category` field to `METRIC_CANONICAL` in `src/lib/metric-naming.ts`:

```
CBC, Lipids, Metabolic, Kidney, Liver, Thyroid, Iron,
Vitamins, Hormones, Inflammation, Electrolytes, Other
```

In `TrendsSection`, when sort is `attention` or `alpha`, render cards in **collapsible category sections** (Lipids → LDL, HDL, Non-HDL, Triglycerides, Total Chol, LDL/HDL Ratio; CBC → WBC, RBC, Hemoglobin, Hematocrit, Platelets, MCV/MCH/MCHC/RDW/MPV, all Absolute differentials; etc.). Each section header shows the category + count + a small "X out of range" pill. `recent` / `count` / `custom` sorts stay flat (they're explicitly ordered by the user).

Pinned cards still float to the top in their own "Pinned" section regardless of category.

## 2. Today screen clipping (screenshot 1)

Two real bugs:
- **TEMP Δ / RESP /MIN / SPO₂ labels** at the top are getting cut off by the safe-area / sticky header. The vitals strip needs `pt-[env(safe-area-inset-top)] + mt-2` and the page container needs matching `pt`.
- **Bottom tab labels** ("Journal", "Patterns") are obscured by the floating capture FAB toolbar. Either:
  - shift the FAB up by `bottom-20` (above the tab bar), OR
  - hide the tab-bar labels when the FAB is open.
  Recommended: shift the FAB up — it already collapses; keep the labels always readable.

## 3. Launch checklist — what's left

Read-only sweep, then publish. Order:

1. Reports/Metrics fixes above (this plan).
2. Today vitals + FAB clipping fix (this plan).
3. Re-run guards: `check-no-em-dash`, `check-no-test-data`, `check-unique-route-images`.
4. Walk the 13 surfaces at 390 / 820 / 1440 — log ✓ / ⚠ / ✗.
5. Re-publish.

Everything from prior waves (Wave 4 admin duplicate-reports, Wave 5 DNA, Care-Profile dedupe, image 404 fix, marketing sizing) is already shipped. Nothing else is open from the plan file.

## Files I'll touch

- `src/components/reports/trends-section.tsx` — axis width + tick formatter, color fallback, action buttons, category sections, "Only out of range" chip, "Out of range" boundary header.
- `src/lib/metric-naming.ts` — add `category` to `CanonicalEntry` and tag every existing key; new helper `getMetricCategory(metricKey)`.
- `src/routes/_app/today.tsx` (or the vitals strip + FAB components it composes) — safe-area top padding, FAB `bottom-20`.
- `src/components/today/` — capture FAB position only.

No DB migrations, no server function changes, no new routes. UI only.

## Out of scope (ask before doing)

- Reordering categories per user.
- Per-category color themes.
- AI-suggested groupings beyond the static taxonomy.

Reply **go** to build, or tell me what to drop.
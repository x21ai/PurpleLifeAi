## Goal
Improve `Today's doses` mini timeline so users can:
1. See each dose's scheduled time directly on the bar (not only via hover tooltip).
2. See all individual doses when 2+ are scheduled at the same (or very close) time, with distinct colors per medication instead of a single overlapping dot.

## File
`src/components/meds/meds-mini-timeline.tsx` (presentation only — no backend/data changes)

## Changes

### 1. Per-medication color
- Build a stable color map from medication name → one of ~6 palette tokens (e.g. emerald, sky, violet, amber, rose, teal) using a small hash so the same med always gets the same color across renders.
- Keep status semantics: `taken` uses the med color at full opacity, `pending` uses med color with reduced opacity + dashed ring, `missed` overrides to destructive, `skipped` overrides to muted. (Color still encodes the medication; status encodes the visual treatment.)

### 2. Group near-simultaneous doses
- Cluster doses whose `scheduled_at` falls within a small window (~15 min / ~1% of axis) into one group at the same x position.
- Render the group as a horizontal row of small dots side-by-side (slightly offset above the axis), one dot per dose, each in its medication color. Single-dose groups render exactly as today.
- Hover/title on each dot stays as `name · time · status`. Group also gets an `aria-label` listing all meds + the shared time.

### 3. Show the scheduled time on the bar
- Under (or just above) each dose group, render a tiny time label like `8:00a` in `text-[10px] text-muted-foreground tabular-nums`, centered on the group's x position.
- Skip the label if it would visually collide with the 6a/12p/6p axis labels (simple distance check against those fixed positions) to avoid clutter.
- Increase the timeline row height from `h-10` to roughly `h-14` to fit the time labels without overlapping the existing 12a/6a/12p/6p/12a axis row.

### 4. Legend (small)
- Below the axis labels, add a compact wrap-row legend: a tiny colored dot + medication name for each med that has a dose today. Hidden when there are 0 or 1 distinct meds.

## Out of scope
- No changes to data fetching, dose generation, or the Today route layout.
- No changes to the full Timeline tab.
- Mobile/tablet/desktop all use the same component; the new labels use clamped font sizes and the cluster offset stays inside the existing card padding.

## Verification
- Visual check at mobile (375), tablet (768), desktop (1280) that:
  - Time labels render under each dose without overlapping the hour labels.
  - Two doses scheduled at the same time appear as two adjacent colored dots, not one.
  - Each medication keeps a consistent color across reloads.

## Problem
Opening any "My Health" section (Sleep, Stress, Heart, Activity, Readiness) navigates to `/biometrics/$metric`, which uses `MetricShell` → `.metric-canvas`. That surface is hardcoded light (warm white #f4f2ee, white cards, light shadcn token overrides) and the route also forces `useRouteTheme("light")`. Result: app is dark, the drilldown opens light.

## Fix
Make the metric drilldown theme-aware so it matches the rest of the app.

### 1. `src/routes/_app/biometrics.$metric.tsx`
- Remove `useRouteTheme("light")` so the page no longer forces the document into light mode.

### 2. `src/styles.css` — add `.dark .metric-canvas` overrides
Keep current light values as the default. Under `.dark`, redeclare the shadcn tokens to dark values matching the rest of the app, and swap the page background:

```css
.dark .metric-canvas {
  --background: 240 10% 4%;
  --foreground: 0 0% 96%;
  --card: 240 6% 10%;
  --card-foreground: 0 0% 96%;
  --popover: 240 6% 10%;
  --popover-foreground: 0 0% 96%;
  --muted: 240 5% 14%;
  --muted-foreground: 240 5% 65%;
  --secondary: 240 5% 14%;
  --secondary-foreground: 0 0% 96%;
  --accent: 240 5% 14%;
  --accent-foreground: 0 0% 96%;
  --border: 240 5% 18%;
  --input: 240 5% 18%;
  background-color: #0a0a0d;
}
.dark .metric-sheet {
  background-color: rgba(255, 255, 255, 0.04);
  box-shadow: none;
}
.dark .metric-card {
  background-color: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.06);
}
.dark .metric-prompt {
  background-color: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
}
.dark .metric-prompt:hover {
  background-color: rgba(255, 255, 255, 0.06);
}
.dark .metric-pill-alert { background-color: rgba(255, 138, 168, 0.18); color: #ffa8bd; }
.dark .metric-pill-warn  { background-color: rgba(235, 196, 110, 0.20); color: #f3d58b; }
.dark .metric-pill-good  { background-color: rgba(52, 199, 145, 0.20); color: #5ce0ac; }
.dark .metric-value-alert { color: #ffa8bd; }
.dark .metric-value-warn  { color: #f3d58b; }
.dark .metric-value-good  { color: #5ce0ac; }
```

Update the comment above `.metric-canvas` to note it's now theme-aware.

## Out of scope
- No layout or component changes; only theming.
- `.report-canvas` already handles dark — untouched.
- DNA / conditions detail pages — untouched unless a similar issue is reported.

## Verification
Across mobile (375), tablet (768), desktop (1280):
- In dark mode, open My Health → tap each row (Sleep, Stress, Heart, Activity, Readiness/Sleep Regularity). Drilldown renders dark: dark background, dark sheet/cards, readable text, dark Ask Purple prompts.
- In light mode, drilldown still looks like the current warm-white design.
- Toggle theme on the drilldown page: surface flips without a reload.

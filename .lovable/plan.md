# Oura-inspired redesign of Purple

A platform-wide visual reset. Same features, same data, same routes — recalibrated to feel like Oura: calm, premium, oversized serif numerics, soft pastel progress bars, smooth wave trends, and a 3D landscape hero anchoring the headline score.

## Design system reset

Rewrite `src/styles.css` tokens end to end. Old purple-primary palette retires; purple becomes a single reserved accent for "alive" moments (alerts, the Log Seizure button, brand mark).

New token direction (oklch values picked to match Oura's screenshots):

- `--background` — warm off-cream, `oklch(0.985 0.005 85)`
- `--foreground` — deep ink navy, `oklch(0.22 0.04 250)`
- `--card` — pure cream, slightly lighter than background
- `--muted` / `--muted-foreground` — soft slate against navy
- `--primary` — navy (`oklch(0.32 0.07 250)`), foreground cream
- `--accent` — Purple (`#5B2C82`) preserved as reserved highlight
- `--data-1` … `--data-5` — Oura blue family for charts (deep navy, mid blue, sky, ice, coral for "needs attention")
- `--ring-track` / `--ring-fill` — pastel blue track + saturated navy fill for progress arcs and pills
- Dark mode: deep navy surfaces, cream type — mirrors Oura's mobile dark mode

Typography
- Headline numerics: Source Serif 4 (already loaded), bumped up to display sizes
- Tiny uppercase labels under each metric: tracked-out Inter at 10–11px
- Body unchanged

Shared primitives added under `src/components/ui-oura/`
- `<MetricNumber>` — huge serif number + tiny uppercase label
- `<ProgressPill>` — full-width pastel pill with value chip on the right
- `<ScoreArc>` — SVG curved arc with score endpoint dot, used inside the hero
- `<WaveTrend>` — overlapping smooth lines with endpoint dots and value labels, no axis chrome
- `<StageBar>` — horizontal stacked bars for sleep stages (Awake/REM/Light/Deep)
- `<SectionLabel>` — small navy heading like "Resting Heart Rate"

All hand-rolled SVG, no chart library. Animations: fade-in + path draw on mount, nothing busy.

## Hero artwork

Generate three calm, low-saturation landscape renders to back the headline score (Today screen + risk forecast):

- Dawn ridgeline (high readiness)
- Misty valley (mid readiness)
- Overcast coast (low readiness / needs attention)

Saved as `src/assets/hero-readiness-{dawn,mist,coast}.jpg`. The `<ScoreArc>` sits over the image with the curved track tracing the ridge line, big serif score number, and a one-line plain-English caption ("Doing alright", "Take it gentle today", etc.). Image is chosen by the score band.

## Screen-by-screen pass

### Today (`/`)
- Greeting block: smaller, more whitespace
- New hero card: landscape image + score arc + big serif risk score + caption. Replaces the "Nothing yet today" placeholder as the top emotional anchor.
- Capture row (Write / Speak / Photo / Log seizure) becomes a single quiet row of icon chips under the hero
- Today's doses: each row gets the new `ProgressPill` treatment for time-of-day
- Biometric snapshot: replaced with Oura-style stacked tiles — Sleep / Readiness / HRV / Steps — each a big serif number, tiny label, soft pill underneath showing where you sit in your personal range
- Empty/connect-Oura state keeps copy from the previous polish pass

### Sleep detail (new, `/_app/sleep`)
- Hero: Total sleep big serif + bedtime → wake row
- `StageBar` for Awake/REM/Light/Deep with minutes on the right
- `ProgressPill` rows for Total, REM, Deep, Efficiency, Restfulness, Latency, Timing
- `WaveTrend` of last 14 nights total sleep
- Linked from the Today sleep tile

### Insights / Patterns (`/insights`)
- Top: three big metric numbers (Readiness / Sleep / Activity averages, 7-day) — direct echo of Oura's three-column header
- "Resting Heart Rate" `WaveTrend` with min/avg endpoint labels
- "Body measurements" row: Temperature deviation, Respiratory rate, SpO2 — each as a serif number with tiny label, no card chrome
- Seizure tab keeps its calendar heatmap but recolored to the new palette (navy intensities, coral for high-frequency days)

### Journal (`/journal`)
- Entry cards lose the heavy borders; switch to cream surface, thin divider, serif date heading, body in sans
- Tag chips become tiny uppercase pills in navy/cream
- Empty state copy unchanged, new typography only

### Meds (`/meds`, `/meds/$medId`)
- List rows: cream cards, serif med name, dose as a quiet caption, time pills in pastel blue
- Detail view: adherence percent becomes a big serif number with a `ProgressPill` underneath showing 14-day fill; weekly grid uses the new data palette

### Ask / Chat (`/chat`)
- Messages reflowed: AI bubbles on cream, user bubbles on a soft navy tint
- Suggestion chips: cream with thin navy outline, serif first word
- Input bar: bottom-anchored cream with navy focus ring

### Seizure log (`/seizures/new`)
- The big "Log right now" CTA keeps Purple accent (the one place purple stays loud — intentional emotional anchor)
- Form below reflowed in the new token system

### Welcome onboarding (`/welcome`)
- Step indicator: navy pills instead of purple
- Step 1: a small landscape thumbnail next to the headline
- Connect cards reflowed to match the new card style

### Settings (`/settings`)
- Section cards switch to cream surfaces with thin dividers
- Connections row uses the new metric typography for "Connected · last sync 4m ago"
- Data and About sections inherit automatically

### Auth (`/sign-in`)
- Page rebalanced with a wide cream surface, serif headline, navy form

## Bottom nav + shell
- Active tab indicator becomes a thin navy underline instead of a purple pill
- Inactive icons: soft slate, active: deep navy + tiny serif label
- Sidebar (desktop) gets the same cream-on-cream treatment

## Accessibility
- All new tokens verified for WCAG AA contrast in both modes
- Score arc and wave trends include `aria-label` summaries (e.g. "Readiness 79, doing alright. Trend over 7 days: 74, 76, 80, 79, 81, 77, 79.")
- The hero landscape gets `role="img"` with the caption as its label
- Focus rings rebuilt around the navy ring token so keyboard nav stays visible against cream

## Technical notes (for the engineer reading this)

- All work stays in client/presentation code: token rewrite + new components + screen reflows. No schema, no server functions, no edge logic.
- New folder: `src/components/ui-oura/` for the shared primitives. Existing `src/components/ui/` shadcn primitives stay; oura ones compose them.
- New folder: `src/components/today/` for the hero score card so `index.tsx` stays short.
- New route file: `src/routes/_app/sleep.tsx`.
- Hero images via `imagegen` premium tier, transparent_background=false, jpg. Three renders, ~50KB each after compression.
- No chart library added. `WaveTrend` and `StageBar` implemented as ~150 LOC SVG components with cubic-bezier smoothing and `prefers-reduced-motion` guards.
- `tailwind` `@theme` block in `styles.css` extended with the data palette so chart components can use `text-data-1`, `bg-data-2`, etc.
- Build expected to stay TS-clean; no new npm deps.

## Out of scope (call out explicitly)

- No feature changes, no copy changes beyond the design pass
- No new data sources or AI behavior
- No reskin of the legacy purple in marketing/published meta (theme-color stays purple in manifest so the home-screen splash matches the installed-app accent)


# Purple Design System v2 — Implementation Plan

The previous redesign passes touched surfaces but didn't install a real system. This pass rebuilds the foundation (tokens + primitives), then re-skins every screen against the spec. Mobile, tablet, and desktop are all in scope per workspace rules.

## 1. Foundation: tokens + typography

Rewrite `src/styles.css` as the single source of truth.

- Add fonts: `Source Serif 4` (display) + `Inter` (UI/numeric) via Google Fonts `@import`.
- Replace color tokens with the full v2 palette in **two themes**:
  - Light: `bg.primary/secondary/tertiary`, `text.primary…quaternary`, `divider`, `purple.primary/soft/deep`.
  - Dark (hero mode, default for Today/Vitals/Detail): `#0A0710` base with purple undertone, lifted `purple.primary #B084D1`, `accent.warm #E8C39E`.
- Add **score band gradients** as CSS vars: `--grad-excellent`, `--grad-good`, `--grad-fair`, `--grad-attention`.
- Add spacing scale (`--space-xs…4xl`) and radius scale (`--radius-sm…xl`, `--radius-full`).
- Global rules: `font-variant-numeric: tabular-nums` on `.numeric`; `prefers-reduced-motion` disables count-ups.
- Theme controller: dark default on Today/Vitals/Ask; light default on Journal/Patterns/Settings. Add a theme toggle in Settings + header that writes to `localStorage` and a `data-theme` attribute on `<html>`.

## 2. Primitive components (rebuild `src/components/ui-oura/`)

Each is responsive (mobile/tablet/desktop variants noted):

- **ScoreHero** — full-bleed gradient card, 120px (desktop) / 96px (mobile) number, count-up 0→value 800ms, decorative SVG silhouette at 30% opacity, Source Serif 4 phrase + AI narrative paragraph. `radius-xl`, min-h 400px (480px tablet+).
- **MetricCard** — 1:1.2 aspect, paired 2-col on mobile, 3-col on tablet, 4-col on desktop. Chevron, band-colored status text, large value bottom-left.
- **MetricRow** — horizontal scroll of small score chips; active item gets purple ring; tap → expands to ScoreHero modal.
- **NarrativeBlock** — Sparkles marker, `purple.soft` bg, Source Serif 4 body, max-w 600px.
- **LargeChart** — Recharts line, 2.5px stroke, `monotoneX`, dashed average line, anchor labels at right end, animated draw 600ms, 280px desktop / 240px tablet / 200px mobile.
- **BodyMeasurementsRow** — flex equal-width, 64px values (48px mobile), uppercase tracked labels, 64px vertical section padding.
- **CompactStatCard** — icon + value inline.
- **BottomSheet** — drag handle, 32px top radius, 350ms cubic-bezier open, backdrop dismiss, swipe down dismiss. Wrap shadcn `Sheet`.
- **NumberCountUp** — hook respecting `prefers-reduced-motion`.

Delete legacy `hero-score-card`, `metric-number`, `progress-pill`, `stage-bar`, `wave-trend`, `score-arc` and replace call sites with new primitives.

## 3. Navigation rebuild

- **Mobile bottom nav** (`bottom-nav.tsx`): 5 tabs — Today (Sun), Journal (BookOpen), Ask (MessageCircle), Patterns (TrendingUp), Settings (Settings2). 84px tall, 24px icons, 11px labels, 4×4 purple dot under active, top hairline divider.
- **Desktop sidebar** (`sidebar-nav.tsx`): 240px / 64px collapsed. "PURPLE" wordmark Inter SemiBold, tracking 6px, 14px. Items at 16px row height, hover bg, settings sticks to bottom, avatar circle below.
- **Tablet**: sidebar collapses to icon-only by default (≥768px <1024px), expands on hover.
- Route renames: `/insights` → `/patterns`, `/chat` → `/ask`, `/meds` stays accessible from Today + Settings (no longer top-level tab).

## 4. Screen rebuilds (mobile + tablet + desktop)

### Today (`/`) — dark default
Status bar → "Good morning, Devyn" (Source Serif 4 32px) → AI narrative (3 lines max) → **hero score row** (Readiness | Sleep ×1.4 | Activity) tappable to ScoreHero modal → NarrativeBlock → 3 quick actions (Journal/Meds/Seizure) 80px tall → BodyMeasurementsRow (Temp/Resp/SpO2) → today's medication doses → last-sync footer.

### Journal (`/journal`) — light default
Headline "Journal" → filter chips (All/Voice/Photo/Video/Mixed) → date-grouped feed (Today/Yesterday/<date>) → entry cards with time+kind icon, content, AI summary chip, tag pills → FAB bottom-right (purple circle, 56px, +).

### Journal capture sheet — dark, full-screen sheet
Cancel/Save header → autofocus textarea ("What's happening, or what just happened?" Source Serif 4 17px) → live transcript in `purple.soft` container → media row → bottom toolbar with 56px mic button (turns red + waveform when recording).

### Ask (`/ask`) — dark default
Empty: "I know your patterns." (Source Serif 4 large) + subtitle + 4 vertical suggestion chips. Conversation: user bubbles right-aligned purple, AI left-aligned `bg.secondary`, 3-dot thinking indicator, sticky input with mic + send.

### Patterns (`/patterns`) — light default
Headline → time range pills (7d/30d/90d/1y/All) → "Sleep and your patterns" LargeChart (seizures overlaid on sleep) → "Heart rate variability" LargeChart with shaded baseline → "What I'm noticing" pattern list with confidence % → calendar heatmap.

### Vitals (bottom sheet from Today) — dark
Date tabs (Yesterday/Today/<date>) underlined active → sections (Readiness/Sleep/Activity/Stress/Heart Health) each with 2 MetricCards.

### My Health (`/today/risk` → rename `/health`) — long scroll
Hero "Strong overall balance…" Source Serif 4 + paragraph → NEEDS CARE / THRIVING status pills (band gradient bg) → section list with expand → Step Average detail card with progress bars to baseline.

### Settings (`/settings`) — light
Profile card → Connections (Oura/Whoop/Apple Health) → Care team → Your data (Export everything, Delete everything with confirm) → About (Charter, Privacy, Open source, Version) → Sign out.

### Sign-in (`/sign-in`)
Keep current split layout but rebuild typography against v2 tokens (Source Serif 4 headline at `headline.large` 32px scale rules, Inter labels with tracked-out spacing, dark default).

### Onboarding (first sign-in)
3-step welcome sheet:
1. "Welcome to Purple. This is your space."
2. Name + emergency contact form
3. Optional Oura/Whoop/notifications cards.
Skip available every step. Gated by `profiles.first_name IS NULL`.

## 5. Empty states (component `<EmptyState>`)
Journal, biometrics, medications, risk forecast each get the spec'd copy in Source Serif 4 with appropriate Lucide icon at 48px.

## 6. Motion
- Count-ups 0→value 800ms ease-out (skip if `prefers-reduced-motion`).
- Card mount: fade + 8px translateY over 400ms, 50ms stagger.
- Charts: draw 600ms.
- Screen transitions: mobile push 300ms ease-out, desktop cross-fade 200ms.
- Sheets: 350ms cubic-bezier(0.32, 0.72, 0, 1).
- No spring physics anywhere.

## 7. Accessibility
- WCAG AA contrast verified for both themes.
- 44×44 min touch targets.
- 2px purple focus ring + 2px offset on keyboard nav.
- `aria-label` on every icon-only button; chart `aria-description` mirrors AI narrative.
- Numbers wrapped with `aria-label="seventy nine"` style readable string.

## 8. PWA polish
- `public/manifest.json`: name "Purple", short "Purple", theme `#5B2C82`, bg `#FFFFFF`, display `standalone`, 192/512 icons.
- Service worker caches app shell (already wired in `sw.js` — verify against spec, keep kill-switch safety).
- Install prompt component shows after 3 active sessions (track in `localStorage`).

## 9. Out of scope (this pass)
- Risk forecaster logic changes (already shipped — just re-skin its surfaces).
- Auth flow changes beyond visual.
- New backend tables.
- The logout-loop debug (separate thread — `console.log` already in place; will revisit once user pastes output).

## Technical notes
- Recharts already installed; reuse for LargeChart.
- All new primitives go in `src/components/ui-oura/v2/` to avoid breaking imports mid-refactor; old files deleted at end.
- Theme toggle uses `next-themes`-style controller written in-house (no new dep) — `<html data-theme="dark|light">` + `localStorage`.
- Responsive breakpoints: mobile <640, tablet 640–1024, desktop ≥1024.
- Every screen tested at 375px, 768px, 1280px viewports before close.

## File map (high level)
- **Rewrite**: `src/styles.css`, `src/components/layout/{bottom-nav,sidebar-nav,app-shell}.tsx`, all `src/routes/_app/*.tsx`, `src/routes/sign-in.tsx`.
- **New**: `src/components/ui-oura/v2/{score-hero,metric-card,metric-row,narrative-block,large-chart,body-measurements-row,compact-stat-card,bottom-sheet,number-countup,empty-state,theme-toggle}.tsx`, `src/components/onboarding/welcome-sheet.tsx`, `src/lib/theme.ts`, `src/routes/_app/patterns.tsx` (rename insights), `src/routes/_app/ask.tsx` (rename chat), `src/routes/_app/health.tsx`.
- **Delete (after migration)**: old `ui-oura/*` primitives, `today/hero-score-card.tsx`.

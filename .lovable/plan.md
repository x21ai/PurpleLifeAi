
# Purple — Foundation Setup

This first pass establishes the visual system and app shell only. No features, no backend yet — those land in follow-up prompts.

## Scope

1. Brand design tokens (light + dark) in `src/styles.css`
2. Typography: Source Serif 4 (display) + Inter (UI) via Google Fonts
3. Responsive app shell:
   - Desktop (≥ md): left sidebar with Purple wordmark + nav
   - Tablet: same sidebar, collapsible
   - Mobile: bottom navigation bar, no sidebar
4. Placeholder Today landing page with warm, calm copy
5. Route scaffolding for future sections (placeholders only)
6. Root `head()` metadata (title "Purple — a calm health journal", description, theme-color)

Not in scope this turn: Supabase, auth, AI, journal capture, meds, seizure log, wearables, forecast, insights. Stack libs (TanStack Query, date-fns, zustand) are already partly present or will be added as features arrive — not pre-installed speculatively.

## Design tokens

Map the brand palette to oklch in `src/styles.css`:

- `--primary` ← #5B2C82, `--primary-foreground` white
- `--accent` ← #8B5FAB
- `--secondary` / soft surface ← #EDE4F4
- `--background` ← #FAF8FB, `--foreground` ← #1A1A1A
- `--muted-foreground` ← #555555, `--border` ← #EAEAEA
- Semantic: `--success`, `--warning`, `--danger`, `--info` registered in `@theme inline`
- Dark mode: surface #0E0A12, alt #181321, ink #FAFAFA, muted #BABABA, divider #2A2330, primary lifted to accent purple for contrast
- `--radius` set to a calm 0.75rem
- Font tokens: `--font-serif` (Source Serif 4), `--font-sans` (Inter); register `font-serif` / `font-sans` Tailwind utilities via `@theme inline`

Body defaults to Inter; a `.font-display` / `font-serif` utility used for hero/headline text.

## Files

- `src/styles.css` — replace token blocks, add Google Fonts `@import`, register semantic + font tokens in `@theme inline`
- `src/routes/__root.tsx` — add Inter as default body class, keep existing shell, update meta (title, description, theme-color #5B2C82)
- `src/components/layout/AppShell.tsx` — new; wraps `<Outlet />` with responsive sidebar + bottom nav, uses `useIsMobile`
- `src/components/layout/SidebarNav.tsx` — new; desktop/tablet left sidebar (Purple wordmark in serif, nav items with lucide icons, active state via `useRouterState`)
- `src/components/layout/BottomNav.tsx` — new; mobile bottom tab bar (fixed, safe-area aware)
- `src/components/layout/NavItems.ts` — shared nav config: Today, Journal, Chat, Meds, Insights, Settings
- `src/routes/_app.tsx` — pathless layout route rendering `<AppShell><Outlet /></AppShell>`
- `src/routes/_app/index.tsx` — placeholder Today page (warm greeting, date, empty-state card "Nothing yet today. When you're ready, write, speak, or snap something.")
- `src/routes/_app/journal.tsx`, `chat.tsx`, `meds.tsx`, `insights.tsx`, `settings.tsx` — minimal placeholder routes so nav links resolve at typecheck

Note: existing `src/routes/index.tsx` will be deleted in favor of `_app/index.tsx` so `/` renders inside the shell. (`_app` pathless layout is the TanStack pattern; not a Next.js convention.)

## Responsive behavior

- `< 768px`: no sidebar, content full-width with `pb-20` to clear bottom nav; bottom nav fixed, 5 icons + labels
- `768px – 1024px`: sidebar in icon-collapsed mode (64px), main content beside it
- `≥ 1024px`: sidebar expanded (240px) with labels
- All three breakpoints get the same nav items, same active states, same Today placeholder — verified per workspace rule.

## Voice in placeholder copy

Today page hero (serif): "Hi. How's today feeling?"
Sub (sans, muted): "Write a line, hold to speak, or tap to add a photo. I'll remember the rest."
No CTAs styled as marketing buttons; quiet, journal-like.

## Verification

After build: confirm `/` renders Today inside shell, sidebar appears at desktop width, bottom nav appears at mobile width, fonts load (Source Serif 4 + Inter), primary color matches #5B2C82, dark mode tokens applied when `.dark` is on the html.

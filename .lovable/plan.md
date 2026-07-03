## Sign-in left panel — dark mode background

Rebuild only the LEFT brand panel background in `src/routes/sign-in.tsx` to match a dark aesthetic. Right form panel, layout, wordmark, headline, and copyright stay unchanged.

Chosen direction: **Midnight Aura Mesh** — deepest obsidian base with soft purple + indigo aura glows and a fine grain overlay. Calm, premium, Apple-grade restraint.

### Changes (single file: `src/routes/sign-in.tsx`)

1. Left panel wrapper: replace `bg-primary text-primary-foreground` with a near-black surface token (use `bg-[#050505]` fallback wrapped in a semantic class if a token exists; otherwise inline the dark base) and keep `text-primary-foreground`/white text.
2. Add three absolutely-positioned ambient blur orbs behind content:
   - top-left: purple 600 @ 10% opacity, ~70% size, `blur-[120px]`
   - bottom-right: indigo 600 @ 10% opacity, ~60% size, `blur-[100px]`
   - subtle center-mid fuchsia @ 5% for depth
3. Add a low-opacity noise overlay (`opacity-[0.03] mix-blend-overlay`) using an inline SVG data-URI so we don't depend on external hosts.
4. Keep the existing concentric arc SVG but drop its stroke opacity so it reads as a whisper against the aura.
5. Wrap content (wordmark, headline block, copyright) in `relative z-10` so it stays above the aura layers.
6. Headline: no color change; add a faint 1px `w-12 bg-white/20` divider under it for editorial rhythm.
7. Ensure the panel remains `overflow-hidden` and `h-dvh` compatible — no layout shifts.

### Verification

- Playwright screenshots at 390×844, 834×1112, 1280×800, 1440×900 of `/sign-in`. Confirm:
  - No vertical scroll.
  - Left panel reads as dark with soft purple aura, not flat purple.
  - Right form panel unchanged.
  - Wordmark, headline, copyright still legible with sufficient contrast.

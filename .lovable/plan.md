
## Goal
Redesign `/sign-in` so it fits in one viewport (no scroll on desktop/tablet), uses the empty left column, and cleanly separates password sign-in from Google/Apple. Keep the existing brand (calm hero photo, PURPLE wordmark, serif headline, dark form panel).

## Layout at a glance (desktop / tablet ≥ 1024px)

```text
┌──────────────────────────────┬────────────────────────────────────┐
│ LEFT — brand / social         │ RIGHT — email + password           │
│                               │                                    │
│  PURPLE                       │  SIGN IN                           │
│                               │  A quiet intelligence              │
│  A quiet intelligence         │  for your health.                  │
│  for your health.             │                                    │
│  (serif headline, 2 lines)    │  [ Sign in | Create account ]      │
│                               │                                    │
│  Two calm tag lines.          │  Email                             │
│                               │  [ you@example.com           ]     │
│  ── Continue with ──          │  Password                          │
│  [  Continue with Google  ]   │  [ ••••••••••••••          👁 ]    │
│  [  Continue with Apple   ]   │  [        Sign in           ]      │
│                               │  Forgot password?                  │
│  Free forever · Private       │                                    │
└──────────────────────────────┴────────────────────────────────────┘
```

- Full-height 50/50 split, `min-h-dvh`, `overflow-hidden`, no page scroll.
- Left panel keeps the hero photo with a left-to-right dark gradient so PURPLE + copy + social buttons read cleanly on the image.
- Right panel is the dark form card (as today) but tightened: smaller headline on this screen (headline lives on the left now), tighter vertical rhythm, form fits without scroll at 1024×640 and up.
- Social buttons move OUT of the form column into the left panel — clear separation between "password path" (right) and "one-tap identity" (left), which is the standard split-auth pattern used by Linear, Stripe, Vercel.

## Layout at a glance (mobile & small tablet < 1024px)

- Single column, stacked (this is how it works today).
- Order: PURPLE wordmark → serif headline (smaller) → tabs → form → divider → Google/Apple → footer line.
- Reduce vertical spacing (headline goes from `text-6xl/7xl` down to `text-4xl`, form gaps from `space-y-4` → `space-y-3`, inputs `h-12` instead of `h-14`) so mobile fits in roughly one viewport too.
- Keep native mobile scroll if the software keyboard opens (do not lock `overflow-hidden` on `<body>`).

## What changes in code

Only `src/routes/sign-in.tsx` (presentation). No changes to auth logic, `SocialSignInButtons`, or any server function.

1. Wrap the page in `h-dvh overflow-hidden` on `lg:` (not on mobile — mobile keeps scroll for keyboard safety).
2. Replace the current `lg:grid-cols-[1fr_minmax(420px,560px)]` with a balanced `lg:grid-cols-2` split. Left column becomes an active brand + social panel, right column becomes the form.
3. Move `<SocialSignInButtons />` and the "Continue with" divider from the right column into the left column, below the tagline copy. Keep the same component, just relocate.
4. Tighten the right column:
   - Headline shrinks on `lg:` (only shows small "Welcome back / Create your account" heading — the big serif headline lives on the left).
   - Inputs: keep `h-14` on `<lg`, use `h-12` on `lg:` to save vertical space.
   - Form spacing: `space-y-4` on `<lg`, `space-y-3` on `lg:`.
   - "Forgot password?" moves inline next to the Password label (right-aligned) instead of below the button, saving one row.
5. Ensure the right column vertically centers its content (`flex items-center`) so the form sits at optical center regardless of tab (Sign in vs Create account).
6. Left column footer line: keep "Free forever · Private by design" (existing copy, no period per prior fix) pinned to bottom-left with `mt-auto`.
7. Preserve all existing behavior: OAuth callback handling, invite capture, locale prefill, verify-sent / reset-sent states (those states render inside the right column and stay scrollable if content grows).
8. Respect the workspace rule "do updates for all versions": verified against mobile / tablet / desktop breakpoints above.

## Out of scope
- No changes to auth flow, Supabase calls, translations keys, or the `SocialSignInButtons` component itself.
- No new colors, fonts, or design tokens.
- No changes to `/reset-password` or the marketing footer beyond what's already on this page.

## Verification after build
- Playwright screenshots at 390×844 (mobile), 834×1112 (tablet), 1280×800 (desktop), 1440×900 — confirm no vertical scrollbar on `lg:` widths and form is fully visible.
- Manually confirm: tabs switch, Google/Apple buttons live on the left, forgot-password link works, verify-sent and reset-sent states still render inside the right column.

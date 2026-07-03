## /sign-in — compact, background image restored, socials below primary

Scope: frontend only, `src/routes/sign-in.tsx`. No auth/logic/translation changes. Card visual style stays; layout tightens and reorders.

### Restore background hero
- Re-add the fixed full-bleed `ResponsiveImage` (`signInImages.hero`) with an overlay gradient behind everything (`fixed inset-0 -z-10`).
- Overlay tuned for card readability: soft `bg-gradient-to-br from-background/70 via-background/55 to-background/70` so the card sits on a calm, slightly translucent field with the photo showing through the outer margin.
- Card gets subtle translucency: `bg-card/95 backdrop-blur-sm` so it still reads as solid but the photo peeks at edges.

### Fit-to-screen (no scroll) on every breakpoint
- Outer wrapper: `h-dvh overflow-hidden` (was `min-h-dvh`). Use `flex items-center justify-center px-4 py-4 sm:py-6`.
- Card sized to viewport, not a fixed 720px:
  - Desktop (`lg`): `w-full max-w-5xl h-[min(680px,calc(100dvh-3rem))]`, `grid-cols-[42%_1fr]`.
  - Tablet/mobile: `h-[calc(100dvh-2rem)] max-h-[720px]`, single column, right (auth) column scrolls internally only if truly needed via `overflow-y-auto` inside the auth panel — outer page never scrolls.
- Remove the separate mobile `SiteFooter` block (was pushing scroll). Keep the "No ads. No trackers…" trust line inside the card instead.

### Compact spacing
- Left brand panel: `p-10 xl:p-12` (was `p-14`), headline `text-4xl xl:text-5xl` (was 5xl), tagline `text-sm`.
- Right auth panel: `p-6 sm:p-10 lg:p-10` (was 14), inner column `max-w-[340px]`.
- Form: `space-y-2.5`, inputs `h-11 rounded-xl` (were h-12), primary button `h-11 rounded-xl`.
- Tab strip: `mb-4` (was 6). Divider: `my-4` (was 6).
- Mobile brand header inside card: `pt-6 pb-2 px-6`, headline `text-2xl sm:text-3xl`, tagline single line clamp.

### Reorder: Sign in FIRST, socials below
- Inside the auth flow (per `TabsContent`):
  1. Segmented Sign in / Create account tabs
  2. Email + Password + Forgot link + primary Sign in button
  3. Divider row: "or continue with"
  4. `SocialSignInButtons` (Apple + Google) — visually secondary, still full-width stacked
  5. Trust line "No ads. No trackers…" + link to /trust
- Rationale: primary email flow leads; social becomes an alternate path underneath.

### Behavior unchanged
- All state, handlers, useEffects (`invite`, `locale prefill`, `oauth error`, `verify-sent` polling), verify/reset status panels, error styling, disabled states, translations, tab-switch behavior. `SocialSignInButtons` component unchanged.

### Files
- Edit: `src/routes/sign-in.tsx` (restore `ResponsiveImage` + `signInImages` imports; rewrite return JSX per above; drop the outer `<SiteFooter />` block).

### Verification
- Playwright screenshots at 390×844, 834×1112, 1280×800, 1440×900. Assert `document.documentElement.scrollHeight <= innerHeight` (no vertical scroll) and card fully visible; confirm Sign in button appears above the Apple/Google buttons; confirm hero photo visible around the card.

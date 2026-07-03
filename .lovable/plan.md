## /sign-in — SaleSkip-style split layout

Restructure `/sign-in` to match the reference: full-bleed 50/50 split, colored brand panel on the left, clean form on the right. Fits the viewport (no scroll), all breakpoints.

Scope: frontend only, `src/routes/sign-in.tsx`. No auth/logic/translation changes. `SocialSignInButtons` unchanged.

### Layout

- Outer wrapper: `h-dvh overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-background text-foreground`. No card, no rounded container — full bleed like the reference.
- Drop the fixed hero background image and its overlay (the left panel is the visual anchor now, matching the reference).

### Left panel (brand)

- `hidden lg:flex flex-col justify-between p-14 xl:p-16 bg-primary text-primary-foreground relative overflow-hidden`.
- Subtle line motif (concentric arcs) rendered as an inline SVG in the top-right corner at low opacity (matches the reference's decorative curves).
- Top: PURPLE wordmark (`text-primary-foreground/90 tracking-[0.3em] text-xs uppercase font-semibold`).
- Middle: serif headline "Hello, welcome" + "PURPLE 👋" — reuse existing `t("signIn.title")` if it maps cleanly; otherwise render "Welcome to Purple" + waving-hand emoji. Font: `font-serif text-6xl xl:text-7xl leading-[0.95]`.
- Sub-tagline paragraph (existing `t("signIn.tag1")`), `max-w-md text-primary-foreground/80`.
- Bottom: `© {year} Purple. All rights reserved.` in muted primary-foreground.

### Right panel (form) — desktop and mobile

- `flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-8 lg:py-10 bg-background overflow-y-auto`.
- Inner column `w-full max-w-[400px] mx-auto space-y-6`.
- Top: small "PURPLE" wordmark (mobile-only, since left panel handles it on desktop).
- Heading: `font-serif text-3xl lg:text-4xl` — "Welcome back" (existing `t("signIn.signIn")` copy) OR "Create your account" when in register mode.
- Sub-line: "Don't have an account? [Create a new account now](toggle)" as an inline link that swaps the Tabs value to `register`. In register mode, flips to "Already have an account? Sign in".
- Remove the segmented Tabs pill (redundant with the inline link, matches reference).
- **Underlined inputs** matching the reference:
  - Email: no border, only `border-b border-border`, `bg-transparent rounded-none h-11 px-0 text-base focus:border-primary focus:ring-0`.
  - Password: same styling; eye toggle stays via `PasswordInput` (we'll pass a className override that neutralizes the box).
  - Floating "Password" label sits above; forgot link kept inline right of the password label (unchanged handler).
- Primary button: `w-full h-11 rounded-md bg-foreground text-background` → "Login Now" style. Uses existing text `t("signIn.signIn")` / `t("signIn.createAccount")`.
- Google + Apple stacked BELOW primary (order preserved from previous turn):
  - Divider is dropped in favor of a subtle spacing block.
  - `SocialSignInButtons` component reused as-is.
- Bottom link: "Forgot password? [Click here]" wired to existing `handleForgotPassword`.

### Mobile / tablet (<lg)

- Left panel hidden. Right panel becomes single centered column with `pt-8 pb-6`.
- Mobile brand block above the heading:
  - PURPLE wordmark
  - Compact serif headline `text-3xl`
- Same inline "Don't have an account?" toggle. Same underline inputs and button order (primary → Google → Apple → forgot).
- Uses `h-dvh` container with `overflow-y-auto` inside the right panel — outer page never scrolls; only the form column scrolls internally if a device is exceptionally short.

### Preserved behavior

- All state (`mode`, `email`, `password`, `status`, `errorMsg`), all `useEffect`s (invite capture, locale prefill, oauth error toast, verify-sent poll), verify-sent / reset-sent status panels (rendered in the right column with the same copy), disabled states, `friendlyAuthError`, invite redeem on sign-up.
- Sign in vs Create account still governed by `mode`; the inline link toggles it instead of the tab pill.
- Translations reused where copy maps 1:1; new bits ("Don't have an account? Create a new account now", "Already have an account? Sign in", "Forgot password? Click here", "© {year} Purple. All rights reserved.") added as plain strings for now (no i18n key churn this turn).

### Files

- Edit: `src/routes/sign-in.tsx` (rewrite JSX return; remove `ResponsiveImage` + `signInImages` + `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` imports if unused; keep everything else).

### Verification

- Playwright screenshots at 390×844, 834×1112, 1280×800, 1440×900.
- Assert no vertical scroll on the outer page at each viewport.
- Confirm left brand panel visible only on `lg+`, form column readable on all sizes, primary Sign in above social buttons, forgot link at the bottom.

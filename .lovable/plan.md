## Redesign /sign-in — Editorial Card Split (selected direction)

Replace the current full-bleed two-column layout with a single centered rounded card that combines an editorial brand panel (left) and the auth form (right). Applies to desktop, tablet, and mobile.

### Scope
- Frontend only: `src/routes/sign-in.tsx`.
- No changes to auth flow, Supabase calls, translations, `SocialSignInButtons`, or `PasswordInput`.
- All colors continue to use existing design tokens (no hardcoded hex added to CSS). We map the prototype's cream/violet palette to existing tokens: cream page background → `bg-background`, card → `bg-card`, panel → `bg-secondary`, accent copy → `text-primary`, border → `border-border`, muted copy → `text-muted-foreground`.

### Desktop / large tablets (`lg+`, ≥1024px)
- Full-viewport wrapper: `min-h-dvh flex items-center justify-center bg-background px-6 py-10`.
- Hero photo REMOVED behind card and REPLACED by a calm background token; the photo currently competes with the form and forces the shadowed text hack. Keeps brand quiet.
- Centered card: `w-full max-w-5xl h-[720px] rounded-[40px] border border-border bg-card shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] overflow-hidden grid grid-cols-[42%_1fr]`.
- Left panel (`bg-secondary/60 border-r border-border p-14 flex flex-col justify-between`):
  - Top: PURPLE eyebrow (`label-eyebrow text-primary`).
  - Middle: serif headline (`font-serif text-5xl leading-[1.05] text-foreground`) + short muted tagline paragraph (existing `t("signIn.tag1")`).
  - Bottom: privacy line with small green dot: "No ads. No trackers. Your data is yours." (existing `t("signIn.trustLine")` variant).
- Right panel (`p-14 flex flex-col justify-center`):
  - Inner column `w-full max-w-[380px] mx-auto`.
  - Segmented Sign in / Create account pill (reuse `Tabs` component styled via existing `TabsList` — no new component). Centered above form with `mb-10`.
  - **Social buttons FIRST** (`SocialSignInButtons` unchanged) — Apple then Google, stacked, full width.
  - "or" divider (thin border + centered uppercase micro-label).
  - Email + password form; forgot link right-aligned inside password label row (existing behavior).
  - Primary Sign in button `h-12 rounded-2xl`.
- Verify-sent / reset-sent status blocks stay inside the right panel.

### Tablet (md 768–1023px)
- Same centered card but stacked: `grid-cols-1`, left panel becomes a compact top band (`p-8`, headline text-3xl, hides bottom privacy line — moved to footer of card).
- Card height auto (`h-auto`, `min-h-[640px]`).

### Mobile (<768px)
- No card chrome. `bg-background px-6 py-10`.
- Order: PURPLE eyebrow → serif headline → tagline → segmented tab → social buttons → divider → form → trust line.
- Same spacing tokens as before (space-y-3 form rows, h-12 inputs).

### Behavior kept identical
- All state, handlers, `useEffect`s, invite/locale prefill, verify-sent + reset-sent screens, oauth error toast, error styling, disabled states, translations — unchanged.
- `SiteFooter` continues to render on mobile only; hidden on `lg`.

### Tokens & CSS
- No new tokens required. Uses existing `--background`, `--card`, `--secondary`, `--border`, `--primary`, `--muted-foreground`, `--foreground`, and `label-eyebrow` utility.
- Remove the fixed hero photo layer and its dark gradient overlay from this route (the calm card is the composition now).

### Verification
- Playwright screenshots at 390×844, 834×1112, 1280×800, 1440×900. Confirm:
  - Desktop: single card, no scroll, both auth methods visible, headline balanced.
  - Tablet: stacked card, no scroll.
  - Mobile: no card, no scroll beyond expected form length.
- Confirm no console/network regressions on `/sign-in`.

### Files
- Edit: `src/routes/sign-in.tsx` (only the JSX inside `SignInPage` return + remove the ResponsiveImage/signInImages imports if unused).

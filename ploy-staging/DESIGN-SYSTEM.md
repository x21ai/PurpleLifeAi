# PurpleLife design system

## Direction

PurpleLife uses a light-only system with pale canvases, white app surfaces, fine dividers, soft lavender support panels, purple actions, and bright health graphics. Public pages use warm editorial layouts. App pages use focused task panels and original health graphics.

Dark mode is not part of this prototype.

## Color tokens

Authoritative values live in `src/styles/globals.css`.

### Product roles

- `purplelife-canvas` for the app canvas
- `purplelife-surface` for primary panels
- `purplelife-rail` for quiet controls and segmented-control tracks
- `purplelife-tint` for contextual support panels
- `purplelife-line` for borders and dividers
- `purplelife-ink` for primary text
- `purplelife-muted` for secondary text
- `purplelife-accent` for primary actions and selected states

### Health accents

- `purplelife-pink`
- `purplelife-coral`
- `purplelife-yellow`
- `purplelife-mint`
- `purplelife-blue`
- `purplelife-indigo`
- `purplelife-orchid`
- `purplelife-peach`

Use token utilities rather than raw color values in new components.

## Typography

The product uses the Apple system stack with SF Pro fallbacks where available.

- App page titles use 31 to 34px, weight 600, and tight negative tracking.
- App section titles use 22 to 28px, weight 600.
- Body text uses 14 to 16px with generous line height.
- Eyebrows use 10 to 12px uppercase text with restrained tracking.
- Public editorial headlines use responsive display sizing and tight line height.

## Spacing

The app follows a compact 4px-based rhythm.

- 8 to 12px for icon and control gaps
- 16 to 20px for card padding
- 20px page gutters on mobile
- 28 to 34px between major app sections
- 42 to 48px for large public panels

## Shape and depth

- Compact controls use 14 to 18px radii.
- Cards use 22 to 32px radii.
- Large public panels use 38 to 48px radii.
- Borders use `purplelife-line`.
- Shadows remain soft and secondary to surface contrast.
- Mobile navigation and sheets use translucent white surfaces with restrained blur.

## Components

### Buttons

`src/components/ui/button.tsx` provides primary, secondary, outline, ghost, and link variants. App-specific actions may use PurpleLife product tokens directly when they match the app shell.

### Cards

`PrototypeCard` in `src/components/ui/prototype-primitives.tsx` provides the shared white card and tinted support-card treatments.

### Navigation

`PilotAppShell` owns Today, Journal, Browse, and the More utility layer. Desktop uses top navigation. Mobile and tablet use the floating tab bar.

Public pages reuse the navigation and footer under `src/components/pages/about/layout/`.

### Forms

Forms use white or rail-colored fields, 16 to 18px radii, visible labels, and a PurpleLife accent focus ring. Prototype forms use local state and clearly state that nothing was sent or saved.

### Empty states

`PrototypeEmptyState` provides the icon, title, and explanatory copy pattern. Empty-state copy must say what will appear and what production action would create it.

### State controls

`PrototypeStateToggle` supports reviewer-facing switches between empty and sample data. These controls are part of the prototype, not the production product model.

### Toasts

`PrototypeToast` provides neutral, success, and error status messages with `role="status"`. Toasts must describe local prototype outcomes rather than claim production persistence.

## Motion

- Use crisp staged entrances and press feedback.
- Keep content visible without animation.
- Respect reduced-motion preferences.
- Do not use route-entry blur.
- Never let animation hide fixed sheets or navigation.

## Content and safety

- Use PurpleLife consistently in UI and marketing copy.
- Do not present observations as diagnoses.
- Keep sources visible beside health measurements and extracted information.
- State when an interaction is a sample, preview, prototype, or local state.
- Do not imply that OAuth, uploads, sharing, billing, or health APIs are connected.

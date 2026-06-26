# Fix intermittent missing images on the home page

## What's happening

The home page sections wrapping the images (`HumanMoment`, `StillLife`, `QuietStat`, `CalmBand`) are marked with `data-reveal`. CSS in `src/styles.css` sets them to `opacity: 0` until JS toggles `data-revealed="true"` via an `IntersectionObserver` in `src/hooks/use-reveal-on-scroll.ts`.

This is the root cause of "sometimes images show, sometimes not":

1. The hook runs once on mount with `useEffect`. If the component hydrates after SSR while a section is already partially in view, the observer is created after the browser has already painted, and the initial `observe()` call only fires `IntersectionObserver` callbacks *asynchronously*. During a fast scroll or quick route change the callback can be missed/stalled, leaving sections stuck at `opacity: 0` (image present in DOM, invisible to the user).
2. The hook also runs only on first mount. Anything that mounts later (e.g. images that haven't loaded yet, late hydration of a section) never gets observed.
3. Reduced-motion is the only escape hatch; in normal motion mode there is no safety net.

The image files and `ResponsiveImage` markup are fine. The bug is purely the reveal gating.

## Fix

Make the reveal effect robust so images are guaranteed visible, while keeping the subtle fade-in when it works.

### `src/hooks/use-reveal-on-scroll.ts`

- Keep the IntersectionObserver, but:
  - Immediately mark any element already intersecting the viewport on mount as revealed (don't wait for the observer's first async tick). Use `getBoundingClientRect()` + `window.innerHeight` to check on mount, then `setAttribute("data-revealed", "true")` synchronously for those.
  - Add a `MutationObserver` on `document.body` to pick up `[data-reveal]` elements added after mount, observing each new one.
  - Add a hard fallback timer (e.g. 1200ms) that flips every remaining `[data-reveal]` to `data-revealed="true"`. Guarantees images are never permanently hidden even if IO never fires.
  - Cleanup all observers and the timer on unmount.

### `src/styles.css` (reveal block, lines 648–661)

- Keep the fade-in transition.
- Add a `@supports` guard or simply reduce the initial hidden state so that if JS is delayed, the element is still mostly visible: change initial `opacity: 0` to `opacity: 0.001` is not enough — instead, add a CSS `@starting-style`-free safety: keep `opacity: 0` for the animation but rely on the JS fallback timer above to flip it. No CSS structural change required if the JS fallback is in place; only add a comment noting the JS contract.

(If we prefer zero JS risk, an alternative is to drop the `opacity: 0` default entirely and animate from `opacity: 0` only via a `.reveal-pending` class added by JS on mount. This eliminates the "no-JS = invisible" failure mode. I'll go with this safer variant.)

Concretely:
- Replace the bare `[data-reveal] { opacity: 0; ... }` rule with `[data-reveal].reveal-pending { opacity: 0; transform: translateY(12px); ... }` and `[data-reveal].reveal-pending[data-revealed="true"] { opacity: 1; transform: none; }`.
- In the hook, on mount, add `reveal-pending` to each `[data-reveal]` element *before* observing. Elements never touched by JS therefore stay fully visible.

## Scope of changes

- `src/hooks/use-reveal-on-scroll.ts` — rewrite with initial-in-view check, MutationObserver, fallback timer, and `reveal-pending` class management.
- `src/styles.css` — scope the hidden state to `.reveal-pending` so images are visible by default without JS.

No changes to `src/routes/index.tsx`, `src/components/marketing/calm-scene.tsx`, `src/components/marketing/responsive-image.tsx`, or any image assets.

## Verification

- Hard reload `/` several times and on slow network throttling — all four image sections (mug, nightstand, shoulder, privacy band) must always appear.
- Navigate away to `/features` and back to `/` — images still appear.
- `prefers-reduced-motion: reduce` — images appear immediately, no transition.

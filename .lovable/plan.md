# Plan

Four related changes. Image-quality work (alt text, responsive sizing, dedupe check) is mostly mechanical; the sign-in changes need one decision from you before I build.

## 1. Sign-in / sign-up: cut the noise, fix the layout

**Strip the sign-up form down to the essentials.** Country, time zone, language, and invite code all move off the create-account form. They're auto-detected or asked later in `/welcome`, which already collects them.

Create-account form keeps: **email + password** only. We still:
- detect browser locale and write it to `LOCALE_PREFILL_KEY` so `/welcome` shows it pre-filled
- detect timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone` and stash it the same way
- keep invite-code capture from URL (`captureInviteFromUrl`) silently — `/welcome` can show a small "Have an invite code?" field

This matches the brand voice (quiet, low-friction) and gets people into the app faster.

**Sign-in hero layout.** Today the image is locked to the left half of the page (`lg:grid-cols-[1.1fr_1fr]`). You're asking why. I'd like to confirm which direction before I rebuild:

- **A. Full-bleed background**, form floats in a translucent card on the right. Most immersive, photo dominates.
- **B. Wider image (≈60/40)**, form stays in its own column. Smallest change, just rebalances.
- **C. Keep split but make the image taller / full-height on all breakpoints** and remove the dead dark area under it.

If you don't pick, I'll go with **A** (full-bleed) since the night-coast photo is strong enough to carry the page.

## 2. Descriptive alt text on every marketing/moment image

Right now every `<img>` in `CalmHero`, `HumanMoment`, `StillLife`, etc. either has `alt=""` or a generic alt. I'll:

- Add an `alt` prop to `CalmHero` (currently defaults to `""`) and require it from every caller.
- Write specific alt text per route image (e.g. *"Misty coastal cliffs at dawn under a deep blue sky"* for the sign-in hero, *"A warm mug held by both hands at a sunlit window"* for the home moment).
- Keep `alt=""` only for purely decorative thumbnails (e.g. attachment previews in `journal.new.tsx`).

Alt text lives next to the image map in `src/lib/calm-images.ts` so each asset ships with its description:

```ts
export const signInImages = {
  hero: { src: signInHero, alt: "Misty coastal cliffs at dawn under a deep blue sky" },
} as const;
```

Callers change from `image={signInImages.hero}` to `image={signInImages.hero.src} alt={signInImages.hero.alt}`.

## 3. Responsive sizes + lazy-loading

- Add `vite-imagetools` and import each marketing image as a `?w=640;1024;1600;1920&format=avif;webp;jpg&as=picture` source set. Vite generates the variants at build time.
- Replace the bare `<img>` in `CalmHero` / `HumanMoment` / `StillLife` with a `<ResponsiveImage>` wrapper that renders `<picture>` + `<source>` + `<img sizes="...">`.
- `loading="lazy"` + `decoding="async"` on everything except the LCP image on each route (sign-in hero, home hero, etc.), which gets `fetchpriority="high"` and a `<link rel="preload" as="image" imagesrcset=...>` in that route's `head().links`.
- Mobile-first `sizes`: heroes `(min-width: 1024px) 60vw, 100vw`; moment images `(min-width: 1024px) 50vw, 100vw`.

Net effect on mobile: hero drops from ~1.5 MB JPG to ~120 KB AVIF; below-the-fold moments don't download until scrolled near.

## 4. Build-time check: no shared hero / moment assets across routes

A small script wired into the existing build:

- `scripts/check-unique-route-images.mjs` parses each `src/routes/*.tsx` (skip `_app/*`), extracts every image import that resolves under `src/assets/`, and builds a `{ route → [assetPath...] }` map.
- For any asset that appears under more than one route, fail the script with a readable error listing the duplicate routes.
- Added to `package.json` as `"check:images"` and invoked from `"build"` (`bun run check:images && vite build`). Also runs in lint step so the agent catches it before commit.
- The home page is allowed to keep `sign-in-hero.jpg` only if we explicitly rename it; otherwise the check will flag it (good — it's a leftover).

## Technical notes

- `LocaleFields` import + `inviteCode` UI block in `src/routes/sign-in.tsx` gets removed; the state for `localeValues` shrinks to just the auto-detected prefill write on submit.
- `CalmHero` `alt` becomes required (TS will surface every caller that needs updating).
- `vite-imagetools` is Worker-safe (build-time only, no runtime). No effect on SSR.
- The build-time check is plain Node (`node:fs`, `node:path`) — no extra deps.

## Out of scope

- Changing `/welcome` itself beyond making sure locale prefill still lands there.
- Re-cropping or regenerating any existing image.
- In-app routes under `/_app/*`.

---

**One decision needed:** sign-in hero layout — A (full-bleed), B (60/40 split), or C (taller split)?

## Goal

Both `/sign-in` and `/home2` should breathe the same calm-nature visual system: a soft landscape underneath, a quiet gradient that fades the image into the page, a small PURPLE/eyebrow label, and the headline sitting in the lower-left. Today `/sign-in` does this inline; `/home2` uses a different (busier) photo treatment. Extract the shared system into two reusable components and have both routes consume them.

## What I'll build

### 1. Shared "calm scene" components — `src/components/marketing/calm-scene.tsx`

Two small, presentation-only React components built from the existing sign-in markup:

- **`<CalmHero>`** — full-bleed landscape with the sign-in-style gradient (`from-background/0 via-background/0 to-background/85`, switching axis at `lg:` for split layouts). Props: `image`, `alt`, `eyebrow`, `headline`, `body?`, `children?` (for CTAs), `height` (`full` for hero pages, `tall` for sign-in's split layout, `band` for mid-page bands), `align` (`bottom-left` default, `center` for bands), `overlay` (`fade` for sign-in style, `dim` for headline-over-photo bands).
- **`<CalmBand>`** — a thinner version meant to live between text sections (e.g. the "Your data stays yours" moment). Same image + overlay system, smaller height, centered type.

Both render the eyebrow with the existing `.label-eyebrow` token and headline in `font-serif` so the system stays tied to the design tokens already in `src/styles.css`. No new colors, no new spacing scale.

### 2. Calm image library — `src/lib/calm-images.ts`

A small typed registry that imports the existing on-brand landscape assets (`sign-in-hero.jpg`, `hero-readiness-coast.jpg`, `hero-readiness-mist.jpg`) and re-exports them under semantic names (`dawn`, `coast`, `mist`). One place to swap or add images later. No new image generation in this pass — we reuse what's already on-brand.

### 3. Refactor `/sign-in` to use `<CalmHero>`

Replace the inline hero `<div>` (lines ~197–217) with `<CalmHero image={calmImages.dawn} eyebrow="PURPLE" headline={t("signIn.freeForever")} variant="split" />`. The form panel on the right is untouched. Visual output stays identical — this is a structural extraction, not a redesign.

### 4. Rebuild `/home2` on the calm system

Replace the current image-heavy `/home2` body (lifestyle photo of hands + phone, zigzag FeatureScenes, device showcase) with a layout built from `<CalmHero>` and `<CalmBand>`:

- `<CalmHero>` hero — landscape (`dawn`), eyebrow "A quiet companion for your health", headline "Your health, remembered.", body line, two CTAs.
- Typographic "Epilepsy. Migraine. Diabetes…" promise section (no image).
- Three pillar text blocks (no images) — same content as the reverted `/`.
- `<CalmBand>` — `coast` image behind "Your data stays yours."
- Typographic final CTA — "Begin where you are."

Result: `/home2` matches the calm, quiet feeling of sign-in. Imagery only appears as atmospheric backgrounds with type laid over them. No staged lifestyle photos, no zigzag scenes.

### 5. Retire the unused lifestyle assets (from `/home2` only)

Stop importing `home-caregiver.jpg`, `home-walk.jpg`, `home-device.jpg`, `home-hero-morning.jpg`, `about-craft.jpg` from `/home2`. Leave the files on disk for now (they're still referenced from `/about` and may be wanted later); we can delete after the system is approved.

## Out of scope this turn

- No changes to `/`, `/features`, `/about`, `/pricing`, `/contact`. Once `/home2` is approved we can roll the same `<CalmHero>` / `<CalmBand>` into them in a follow-up.
- No new image generation. We'll add fresh calm landscapes only after the system shape is locked.
- No copy changes beyond what's needed for the new layout.

## Files touched

- **add** `src/components/marketing/calm-scene.tsx`
- **add** `src/lib/calm-images.ts`
- **edit** `src/routes/sign-in.tsx` (swap the inline hero block for `<CalmHero variant="split">`)
- **edit** `src/routes/home2.tsx` (rebuild on `<CalmHero>` + `<CalmBand>`)

## The shift

Calm landscapes alone are pretty but distant. Apple's depth comes from **people** — a hand, a face, a quiet moment of use — paired with restraint. We add a human layer to the calm system, then roll it across every marketing page with intent, not as a template.

Each page gets one **human anchor moment** (a person, a hand, a small real detail) plus the calm landscape language we already have. Copy gets shorter, more specific, more first-person. Less "feature." More "this is what it feels like at 2am when you can't sleep and you remember to log it."

---

## Step 1 — Extend the calm system with a Human layer

Add to `src/components/marketing/calm-scene.tsx`:

- **`<HumanMoment>`** — a portrait/hand/detail image with a single sentence of testimonial-style copy or a quiet caption. Two layouts: `portrait` (image left, caption right, generous whitespace) and `quote` (image as backdrop, pull-quote centered, small attribution).
- **`<QuietStat>`** — a single number/word treated like Apple's "1 trillion" moments. Serif, oversized, one line of context. Used sparingly (once per page max).
- **`<StillLife>`** — a small detail shot (a pill bottle on a windowsill, a phone on a nightstand, a hand holding a mug) used as a punctuation mark between sections. No headline required.

All three reuse the same overlay/typography vocabulary as `<CalmHero>` so the system stays coherent.

## Step 2 — Generate the human imagery

Generate ~6 on-brand human/detail photos (premium quality, since these carry the brand). All shot in the same calm palette as the landscapes — soft natural light, muted tones, never stocky, never smiling-at-camera.

Proposed shots:
1. Hands holding a warm mug at a kitchen window, morning light
2. A person sitting on a bed at dusk, phone in hand, face soft/unreadable
3. A caregiver's hand resting on someone's shoulder, both blurred slightly
4. A pill organizer on a wooden table, late afternoon light
5. A walk through tall grass, back of figure, golden hour
6. A phone on a nightstand beside a glass of water, lamp glow

Stored in `src/assets/human-*.jpg`, registered in `src/lib/calm-images.ts` under a new `humanImages` export.

## Step 3 — Rewrite each marketing page around one human truth

Each page gets a single human anchor, tighter copy, and one quiet stat.

**`/` (home)** — Anchor: hands/mug at window. Headline stays calm-landscape; first scroll reveals `<HumanMoment>` "Last night I wrote three sentences. That was enough." `<QuietStat>` "Free. Forever. For the people who need it most."

**`/features`** — Already has the calm hero. Add `<StillLife>` (pill organizer) between Capture and Ask Purple. Replace the generic "And the rest" grid intro with a `<HumanMoment>` (caregiver hand) — "For the people who help you carry it."

**`/about`** — Lead with `<CalmHero>` (mist) → `<HumanMoment>` portrait → the founder/why-we-exist story in the voice of the charter page (it already nails the tone — borrow from `_app/charter.tsx`). One `<QuietStat>`: "Named for the color of epilepsy awareness. Built for anyone carrying something heavy."

**`/pricing`** — Anchor: the nightstand still life. Hero is a `<CalmBand>` with "Free. Always." Below: one short paragraph on *why* it's free (not a feature table). `<HumanMoment>` closes the page — "Because nobody should pay to remember their own life." JSON-LD `Product` + `Offer` (price 0).

**`/contact`** — Quiet `<CalmHero variant="band">` over a small human detail (walk-through-grass). Form stays as-is but gets a one-line human intro: "A real person reads every message. Usually within a day."

## Step 4 — Tighten the typography & motion

- Marketing pages: bump body line-height, widen letter-spacing on eyebrows, add subtle fade-in-on-scroll for `<HumanMoment>` (CSS-only `@starting-style` or a tiny IntersectionObserver hook — no Motion dependency).
- Audit every headline: max 6 words, max 2 lines. Apple writes "Think different," not paragraphs.
- Replace any remaining "Get started" / "Learn more" CTAs with verbs that match the page ("Begin today," "Read our promises," "Say hello").

## Step 5 — Per-route metadata & SEO

Every marketing leaf route gets:
- Unique `<title>` (~50 chars, includes "Purple")
- Unique meta description (~150 chars, human voice, not feature-list)
- `og:image` pointing at that page's hero image
- Canonical URL
- JSON-LD where it earns its place (`Organization` on `/about`, `Product`+`Offer` on `/pricing`)

Audit `public/sitemap.xml` against actual routes.

## Step 6 — Accessibility pass on the new image-heavy layouts

- Meaningful `alt` on every human/detail image (not decorative — these carry meaning).
- Contrast check on light type over dimmed photos (`overlay="dim"` may need to go to 0.55 in places).
- Visible focus rings on every CTA over a photo background.
- Reduced-motion: disable scroll fade-ins under `prefers-reduced-motion`.

## Step 7 — Promote `/home2` to `/`

Once steps 1–6 land, swap `/home2` content into `/` and delete `/home2`. Keep route history clean.

## Step 8 — E2E smoke

Extend `tests/e2e/routes-smoke.spec.ts` to load each marketing route, check `<h1>` exists, hero image loads, no console errors.

---

## Out of scope for this plan

- Wave 1 deploy (still blocked on Supabase access).
- New product features.
- App-shell (signed-in) pages — this is marketing only.

## Files touched

- `src/components/marketing/calm-scene.tsx` — add HumanMoment, QuietStat, StillLife
- `src/lib/calm-images.ts` — add `humanImages` export
- `src/assets/human-*.jpg` — 6 new images via imagegen (premium)
- `src/routes/index.tsx`, `home2.tsx`, `features.tsx`, `about.tsx`, `pricing.tsx`, `contact.tsx`
- `public/sitemap.xml`
- `tests/e2e/routes-smoke.spec.ts`

## Order of work

I'll do steps 1 → 2 → 3 (page by page, pausing after each so you can react to tone) → 4 → 5 → 6 → 7 → 8. Tone is the risky part — we'll know after `/about` whether the human voice is landing.

Approve and I'll start with Step 1 (the Human layer components) + Step 2 (generate the 6 images) in parallel.

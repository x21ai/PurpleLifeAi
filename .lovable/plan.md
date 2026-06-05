## Goal

Walk through the open work in a sensible order. Each step is a separate turn — I'll plan, you approve, I build, we verify, then move to the next. Steps that need you (Supabase access, secrets) are flagged so we can park them until you're ready.

## Sequence

### Step 1 — Roll the calm system into `/features`
Replace the current `/features` hero with `<CalmHero>` (calm landscape, eyebrow, serif headline, body, CTA). Keep the existing feature content below. Give the route its own `head()` — unique title, description, og:title, og:description, og:url, canonical. No copy rewrite beyond what the hero needs.

### Step 2 — `/about`
Same treatment: `<CalmHero>` at the top using a different calm image (e.g. `mist`), keep the story body, add a `<CalmBand>` between sections if it earns its place. Per-route metadata. Leave existing `about-craft.jpg` for now.

### Step 3 — `/pricing`
`<CalmHero>` (smaller, `variant="band"` height) above the "Free forever" content. Per-route metadata + `Product` / `Offer` JSON-LD so search engines see the price.

### Step 4 — `/contact`
Quiet `<CalmHero band>` over the form. Per-route metadata. No JSON-LD needed.

### Step 5 — Generate 2–3 fresh calm landscapes
After the four pages are wired, the reuse of `dawn` / `coast` / `mist` will be visible. Generate on-brand alternates (dawn-meadow, coast-fog, forest-quiet) at 1920×1280, add to `src/lib/calm-images.ts`, and distribute them so no two adjacent routes share a photo.

### Step 6 — Promote or retire `/home2`
Decide together: either swap `/home2` → `/` (and delete the typographic version), or keep both and link `/home2` only from internal QA. Default recommendation after step 5 looks right: promote.

### Step 7 — SEO + sitemap pass
- Audit `public/sitemap.xml` against the now-final route list.
- Add per-leaf `og:image` (using each page's calm hero image — the content image IS the share image).
- Confirm canonical is on leaves only (TanStack dedupe caveat).
- Resolve any open findings via `seo_chat--list_findings` / `update_findings`.

### Step 8 — E2E smoke for marketing routes
Extend `tests/e2e/routes-smoke.spec.ts` to cover `/features`, `/about`, `/pricing`, `/contact`, `/home2` (or its replacement) — assert 200, h1 present, no console errors.

### Step 9 — Accessibility pass on image-heavy sections
Check contrast of light type over `overlay="dim"` bands, add meaningful `alt` text where the image carries meaning (decorative stays `alt=""`), verify focus rings on CTAs over photos.

### Step 10 — Wave 1 deploy (needs you)
Parked until you can act on `docs/wave-1-final.md`:
- Grant Supabase access on `lzuodgpqseijhhyzgfky`, then apply `docs/manual-deploy-bundle.md` Section 1 SQL.
- Set Edge Function secrets (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`); deploy functions per Section 2.
- Run `bun run seed:research`, smoke-test Ask with a levetiracetam question, confirm citation chip.
- Configure Google + Apple OAuth per `docs/oauth-provider-setup.md`.

I can't do step 10 myself — it requires dashboard access. Ping me when ready and I'll write the verification scripts.

### Step 11 — Product polish (queue, pick later)
Not blocking, worth knowing about:
- Empty / first-run states for Today, Journal, Reports.
- Caregiver "confirm to write" UX review.
- `/community` and `/resources` content pass.
- Travel mode end-to-end test with a multi-leg trip.

## How we'll work it

Approve this plan and I'll start with **Step 1 (`/features`)**. After each step lands and you confirm it looks right, I'll propose the next one. If you'd rather jump to a specific step or reorder, just say which.

## Files touched per step (technical)

- Steps 1–4: edit `src/routes/{features,about,pricing,contact}.tsx`; possibly add image keys to `src/lib/calm-images.ts`.
- Step 5: add `src/assets/calm-*.jpg` via imagegen; extend `src/lib/calm-images.ts`.
- Step 6: edit `src/routes/index.tsx` + `src/routes/home2.tsx` (or delete one).
- Step 7: edit `public/sitemap.xml`, leaf route `head()` blocks.
- Step 8: edit `tests/e2e/routes-smoke.spec.ts`.
- Step 9: small edits across the marketing routes + `src/components/marketing/calm-scene.tsx` if contrast needs tuning.

## Out of scope this plan

- Native mobile work (PWA only).
- New AI features beyond Wave 1.
- Marketing copy rewrite — only the lines the new layout needs.

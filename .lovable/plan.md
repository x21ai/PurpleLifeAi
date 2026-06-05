## What's left

1. **Revert `/` (home) to the pre-imagery version** — the typographic layout that worked before I added the editorial photo hero, zigzag scenes, and the coastal "your data stays yours" band. Keep the shared `MarketingHeader` and `SiteFooter` so nav stays consistent with the rest of the marketing site.

2. **Create `/home2` as the imagery playground** — move the current image-heavy index (hero photo, zigzag FeatureScenes, device showcase, coast band, final CTA) into a new route `src/routes/home2.tsx` so we can keep iterating without touching the live home. Add `noindex` on `/home2` so it doesn't get crawled.

3. **Establish a calm-nature image system** — like the sign-in page and the mountain/cloud screenshot you shared. Use soft, atmospheric landscapes (mist, coast, dawn light, alpine clouds) as **backgrounds with heavy darkening overlays**, not as foreground subject matter. Type sits over them quietly, the way Oura does. I'll standardize three reusable patterns:
   - **Atmospheric hero band** — full-bleed landscape, 50–60% dark overlay, serif headline + one line of body.
   - **Quiet section background** — landscape behind a centered statement, used sparingly between text sections.
   - **Editorial portrait** — only when the page genuinely needs a human moment (about page, caregiver section).
   
   Generate 2–3 new calm-nature images (alpine clouds at dawn, soft coastal mist, quiet forest light) and retire the lifestyle/hands photography from the home2 page where it feels staged.

4. **Apply the pattern where it earns its place** (after /home2 is approved):
   - `/features` — one atmospheric band between sections, otherwise text-first.
   - `/about` — keep the human portrait, swap the craft image for a calm landscape.
   - `/pricing` — keep the mist hero + coast band (already on-pattern).
   - `/contact` — add one quiet landscape band, otherwise text-first.

### Technical notes

- Move the existing `src/routes/index.tsx` body verbatim into a new `src/routes/home2.tsx` (route id `/home2`, `meta` with `robots: noindex`).
- Rewrite `src/routes/index.tsx` back to the typographic version: `MarketingHeader`, eyebrow + serif H1 + body + CTAs, the "Epilepsy. Migraine. Diabetes…" promise band, three short text feature blocks, a privacy line, and the final CTA — no `<img>` tags, no `FeatureScene`.
- Leave the home-* image assets in `src/assets/` for `/home2` to keep using; nothing to delete.
- No changes to backend, routes, or other pages in this step.

### Open question

Are you good with route name `/home2`, or do you prefer `/preview-home`, `/v2`, or something else? I'll use `/home2` if you don't say.

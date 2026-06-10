## What's actually wrong

I inspected the running app, the image pipeline, and the page weight. The dev preview shows 240 script requests, that's just Vite dev mode and not what visitors get, so ignore it. The real production-affecting issues are:

1. **Marketing images have no responsive widths.** Every asset in `src/lib/calm-images.ts` is imported as a single width (`?w=1600` for heroes, `?w=1280` for moments). The `<picture>` ships AVIF/WebP/JPG, but a 390px iPhone still downloads the 1600px hero. No `srcset` with multiple widths means no real device adaptation.
2. **A `.jpeg` → `.jpg` rewrite hack lives in `responsive-image.tsx`** to work around the deployed Cloudflare host renaming the file. It only rewrites the `<img>` fallback and the `image/jpeg` source; AVIF/WebP entries are fine but the workaround is fragile. Moving to a stable filename via `&imgname=` (or using consistent extensions) removes the moving part that "images aren't loading" reports keep hitting.
3. **In-app routes import raw `.jpg` files** (`src/components/today/hero-score-card.tsx`, `src/routes/_app/welcome.tsx`). No format negotiation, no width variants, no width/height attrs, so mobile pays the full JPEG and risks CLS.
4. **Fonts are render-blocking.** `__root.tsx` loads Inter + Source Serif 4 with five weights + italic axis from Google Fonts as a blocking stylesheet. On 3G/4G this delays FCP. Needs `media="print" onload` swap, or self-hosted subset, plus a `preconnect` (already there) + `preload` for one weight.
5. **Stale og:image** in `__root.tsx` points to a Lovable preview screenshot URL (`pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/...id-preview-...png`). Shares look broken/generic.
6. **Service worker (`public/sw.js`) precaches only the manifest + icons.** Hero AVIFs are not cached, so the second visit re-downloads them. Low priority but easy.

No actual 404s were captured in console/network for the home route — but the `.jpeg`/`.jpg` mismatch is a known historic failure mode on the deployed host and likely the "images not loading" you're seeing on specific routes.

## The plan

### A. Real responsive marketing images (the big win)
- Rewrite `src/lib/calm-images.ts` so every asset uses multi-width AVIF + WebP + JPG via `vite-imagetools`:
  - Heroes: `?w=640;960;1280;1600;1920&format=avif;webp;jpg&as=picture`
  - Moments / bands: `?w=480;768;1024;1280&format=avif;webp;jpg&as=picture`
- Update `src/components/marketing/responsive-image.tsx` to render the full `srcSet` from imagetools (it already does — confirm the multi-width output works and drop the `.jpeg→.jpg` rewrite if imagetools is configured to emit `.jpg`, or keep the rewrite but apply it to the AVIF/WebP srcsets too for safety).
- Set realistic `sizes` per slot (already mostly correct — full-bleed heroes `100vw`, side-by-side moments `(min-width: 1024px) 560px, (min-width: 640px) 420px, 88vw`).
- Keep `priority` only on the LCP hero per route.

### B. Stop shipping desktop images to in-app screens
- Move `hero-readiness-*.jpg` and `welcome.tsx` heroes to imagetools imports (`?w=640;960;1280&format=avif;webp;jpg&as=picture`) and render them via the same `ResponsiveImage` component. Add explicit `width`/`height` so they don't cause CLS.

### C. Fonts
- In `__root.tsx`, drop the italic axis and trim to the weights we actually use (likely 400, 500, 600, 700 for Inter; 400, 600 for Source Serif 4 — I'll grep usage and pick the minimum).
- Load Google Fonts non-blocking: `media="print"` + `onload="this.media='all'"` with a `<noscript>` fallback, and keep the existing `preconnect`.

### D. Share metadata
- Replace the stale `og:image` / `twitter:image` in `src/routes/__root.tsx` with a real hero (use the home AVIF/JPG export from `homeImages.hero` or upload a dedicated 1200x630 share card via the assets CDN). Per-route og:images stay as-is.

### E. Service worker (small)
- Extend `SHELL` in `public/sw.js` to runtime-cache successful image responses from `/@imagetools/` and `/_build/assets/` with stale-while-revalidate. Skip if the SW behavior is touchy — I'll keep this change behind a feature check.

### F. Verify
- `bun run build` to confirm imagetools generates the new variants without errors.
- Re-run `browser--performance_profile` at 390px and at 1366px on the home + features pages, and report transfer sizes / LCP before vs after.

## Out of scope (ask before doing)
- Migrating marketing JPGs to the Lovable assets CDN (would lose imagetools' build-time variants — net negative for marketing).
- A new `og:image` design — I'll reuse an existing hero unless you want a dedicated share card.

## Technical notes (for reference)
- `vite-imagetools` is already wired in `vite.config.ts` and the `&as=picture` pipeline is in `src/types/imagetools.d.ts`.
- The `.jpeg`/`.jpg` workaround lives in `src/components/marketing/responsive-image.tsx` lines 37-46.
- `src/routes/__root.tsx` lines 143-156 hold the og/twitter image and the Google Fonts `<link>`.

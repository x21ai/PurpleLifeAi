## The duplication today

`src/lib/calm-images.ts` exposes 4 calm landscapes and 6 human/still moments. Most marketing pages share the same handful, so heroes and section photos repeat across `/`, `/features`, `/pricing`, `/about`, `/community`, `/contact`:

```text
Image                  Used on
calmImages.dawn        index hero, sign-in hero, features hero
calmImages.mist        pricing hero, features mid-band, about hero
calmImages.coast       index footer, pricing footer, features footer, community hero
calmImages.dawnAlt     features, about
humanImages.caregiverHand  index, features, about
humanImages.pillOrganizer  pricing, features
humanImages.walkGrass  contact, community
humanImages.mugMorning index only
humanImages.bedsideDusk about only
humanImages.nightstand index only
```

The user-visible result: pricing's hero is identical to features', the coast plate closes three different pages, and the caregiver hand appears in three places.

## Approach

Generate one fresh image per slot so every page has its own hero and its own section moments, while staying inside Purple's existing aesthetic: cinematic, soft, dawn/dusk light, no faces (or backs-of-heads only), no medical imagery. Then remap `calm-images.ts` so each page imports per-page exports — that makes future drift impossible.

Generation uses `imagegen--generate_image` (`fast` tier, jpg, written to `src/assets/`). Heroes are 1920×1080; section/portrait moments are 1280×1280 or 1280×960 depending on slot.

## Image plan (one per slot)

Hero landscapes (one per page):

```text
File                                  Page       Subject
hero-home-mountains-dawn.jpg          /          Same mountain/cloud composition as today (keep current hero)
hero-features-misty-valley.jpg        /features  Layered misty valley, cool blue, pre-sunrise
hero-pricing-coastal-fog.jpg          /pricing   Soft headlands receding into fog, warm/cool blend
hero-about-quiet-hills.jpg            /about     Rolling hills at golden hour, low haze
hero-community-river-bend.jpg         /community Wide river bend through forest, soft overcast
hero-contact-lake-stillness.jpg       /contact   Glass-flat lake at first light, distant treeline
hero-signin-night-coast.jpg           /sign-in   Dusky coastline, deeper blues (distinct from home)
```

Human/still moments (one per use site):

```text
File                                  Replaces / used at
moment-home-mug-window.jpg            index "Last night I wrote three sentences"
moment-home-nightstand-notebook.jpg   index "A second is enough"
moment-home-shoulder-hand.jpg         index "No one should do this alone"
moment-features-phone-typing.jpg      features "Type it. Say it. Snap it."
moment-features-pill-organizer.jpg    features biometrics band (new shot, distinct from pricing)
moment-features-hand-on-shoulder.jpg  features caregiver mode
moment-pricing-pill-tray-window.jpg   pricing "Because nobody should pay…"
moment-about-bedside-lamp.jpg         about "It's here when I need it"
moment-about-arm-around.jpg           about "No one should do this alone"
moment-community-walking-path.jpg     community "For the people who help…"
moment-contact-handwritten-note.jpg   contact section
```

Style brief shared across every prompt: shot on a 35mm lens, natural light, muted palette, deep shadows that sit on Purple's near-black background, soft grain, no text, no logos, no recognizable faces. Hero images frame the subject so the page's serif headline reads cleanly over the upper-left.

## File changes

1. `src/lib/calm-images.ts` — replace the flat `calmImages` / `humanImages` maps with per-page named exports: `homeImages`, `featuresImages`, `pricingImages`, `aboutImages`, `communityImages`, `contactImages`, `signInImages`. Each holds only the images that page actually uses.
2. Update the six route files (`index.tsx`, `features.tsx`, `pricing.tsx`, `about.tsx`, `community.tsx`, `contact.tsx`, `sign-in.tsx`) to import their own page's image map.
3. Delete the now-unused asset files (`hero-readiness-dawn.jpg`, `hero-readiness-mist.jpg`, `hero-readiness-coast.jpg`, `human-mug-morning.jpg`, `human-bedside-dusk.jpg`, `human-caregiver-hand.jpg`, `human-walk-grass.jpg`, `still-pill-organizer.jpg`, `still-nightstand.jpg`, `sign-in-hero.jpg`).
4. Leave `src/routes/_app/welcome.tsx` alone — it imports `hero-readiness-dawn.jpg` / `hero-readiness-mist.jpg` directly. Either keep those two assets or update welcome to import from the new `homeImages` map; plan to do the latter to avoid keeping dead duplicates.

## Out of scope

- In-app routes under `/_app/*` (only marketing/landing pages are duplicating).
- Brand identity / wordmark / favicons.
- Generating multiple variants per slot — one image per slot, chosen for fit, not a gallery.

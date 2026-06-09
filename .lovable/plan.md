## Audit — what's actually still open

Walked the previous waves and the live `purplelife.org` build. Status:

| Item | Status |
|---|---|
| Wave 4 — duplicate-reports admin page + server fns | Shipped, empty state already present |
| Wave 4 — types regen after migration | Done (dna_files/dna_variants types are in `types.ts`, no `as any` casts in `admin-reports.functions.ts`) |
| Wave 5 — DNA tables + bucket + parser + UI + Care Profile hook | Shipped |
| Marketing image sizing pass (Apple-restraint) | Done in code (`calm-scene.tsx`, `calm-images.ts`) |
| Image 404 class-of-bug fix (single width per asset) | Done in code |
| **Care Profile dedupe — `generateCareProfile` is now called from 4 places** (welcome, condition-history, condition.$slug, my-health-dna) and can double-fire on first-run | **Open** |
| **Republish + verify** marketing image fixes on `www.purplelife.org` (live build still serves the old 3-width variants because we haven't shipped) | **Open** |
| **Full pre-launch QA sweep** | **Open** |

Re: "images broke" — the published site at `www.purplelife.org` is still the *old* build (3 width variants per asset, all 200 OK). The preview is on the *new* single-width code. If preview images look wrong, it's almost certainly that the dev cache hasn't picked up the new `vite-imagetools` query strings — a dev-server restart fixes it. Real verification happens after republish.

## Plan

### Step 1 — Care Profile regen dedupe (small)
Add a tiny debounce/coalesce in `src/lib/care-profile.functions.ts` (server-side: skip a regen if one ran for the same user in the last 30 s and `force: false` wasn't set). Keeps onboarding-finish + first-condition-pick + first-DNA-parse from triple-firing the AI call.

### Step 2 — Restart dev server + sanity-check preview images
Force-restart Vite so the new single-width `?w=1600&format=avif;webp;jpg&as=picture` imports re-emit cleanly. Visually confirm `/`, `/features`, `/pricing`, `/about`, `/contact` at 390, 820, 1440.

### Step 3 — Full pre-launch QA pass (read-only, no code unless something's broken)

Walked as a real user across the three device widths (390 / 820 / 1440):

1. **Marketing & auth** — `/`, `/features`, `/pricing`, `/about`, `/contact`, `/community`, `/charter`, `/privacy`, `/terms`, `/sign-in`, `/sign-up`, `/reset-password`. Check image weights in DevTools Network (target hero <120 KB AVIF, moments <90 KB).
2. **Onboarding** — `/welcome` end-to-end: name → conditions → done → lands on `/today`.
3. **Today + capture** — Today greeting, quick capture (text/voice/snap sheets open), condition tip card.
4. **Journal / Chat / Ask-Purple** — entry creation, condition-aware prompt, disclaimer footer present.
5. **My Health** — entry cards (incl. new DNA card), `/condition/$slug`, `/my-health/dna` upload + parse + sensitive toggle + delete + caregiver-share toggle.
6. **Meds** — list, add, scan sheet, voice sheet, reminders banner, dose marking.
7. **Reports** — `/reports`, trends, metrics, documents, medical history, new report, share link.
8. **Biometrics / Hydration / Vitals / Insights / Timeline / Tools / Travel / Seizures**.
9. **Care** — inbox, owner view, caregiver write-confirm path.
10. **Settings** — account, sharing, travel, conditions history, how-purple-thinks, locale.
11. **Admin** (admin user only) — users, reports/duplicates, rules, feedback, contact, community, promo, resources, messages.
12. **PWA / SW** — install prompt surface, offline journal queue banner.
13. **Smoke tests** — run the existing Playwright suite (`routes-smoke`, `theme-footer`, `onboarding`, `today`, `meds`, `journal`, `biometrics`, `community`, `sharing`, `admin`, `settings`, `auth`).

For each surface I'll log: ✓ OK / ⚠ minor / ✗ blocker. Anything that blocks go-live gets fixed in this same pass; minor polish gets a Wave 6 note.

### Step 4 — Final republish prep
- Confirm `mem://` core rules respected (no third-party trackers, private buckets, account menu top-right, wordmark left alone).
- Re-run `scripts/check-no-em-dash.mjs`, `scripts/check-no-test-data.mjs`, `scripts/check-unique-route-images.mjs`.
- Surface the publish action so you can ship.

### What I will NOT touch
- Auto-generated files (types.ts, routeTree.gen.ts, supabase client files, .env).
- New features outside the previous waves.
- The wordmark / account-menu placement.

### Order of execution
1. Care-profile dedupe (≤10 min).
2. Restart dev + preview image check.
3. Full QA walk (will take a chunk of tool calls — I'll batch where possible).
4. Fix any blockers found, re-verify, then surface Publish.

Reply **go** to start, or tell me to skip any section (e.g. "skip admin" or "skip Playwright").
## What's left from the previous phase

Two things didn't land cleanly, both visible on the screenshots you sent:

### A. Marketing images are too big on every breakpoint
Looking at `src/components/marketing/calm-scene.tsx`:

- `HumanMoment` (portrait) renders inside `aspect-[4/5]` — on mobile that becomes ~85% of viewport height for a single quote. Apple uses ~1:1 or 3:4 at most on phones.
- `HumanMoment` (quote-over-photo) is `h-[70vh] min-h-[480px] max-h-[820px]`. On a 13" laptop that's a 600px+ wall.
- `StillLife` is `h-[55vh] min-h-[360px]`. The notebook/mountain "punctuation" shots dominate scroll.
- `sizes="100vw"` everywhere even when the image visually occupies ~600px max, so browsers download the 1600w/1920w variant unnecessarily.
- No max-width cap on `HumanMoment` quote layout, so on desktop the hero image stretches edge-to-edge instead of sitting in a contained frame.

### B. Some image variants 404 on the published worker
`vite-imagetools` emits 3–4 widths × 3 formats per asset. The Cloudflare static-assets manifest in production drops some of the smaller width variants (sandbox preview is fine because Vite serves them live). You asked previously to pick option 1 or 2 — I'll go with **option 1** since it's deterministic and removes the class of bug entirely.

## The plan

### Step 1 — Right-size the marketing imagery (Apple-restraint pass)

In `src/components/marketing/calm-scene.tsx`:

- `HumanMoment` portrait layout: change the image frame from `aspect-[4/5]` to `aspect-[4/5] max-w-[420px] mx-auto lg:max-w-none lg:aspect-[3/4]`. Add `sizes="(min-width: 1024px) 560px, (min-width: 640px) 420px, 88vw"`.
- `HumanMoment` quote-over-photo layout: cap to `h-[clamp(420px,60vh,640px)]` and wrap in `max-w-6xl mx-auto rounded-3xl` so it's a framed cinematic moment, not a wall. Mobile-only override to `h-[clamp(360px,55vh,520px)]`.
- `StillLife`: `h-[clamp(280px,42vh,460px)]`, wrap in `max-w-5xl mx-auto rounded-3xl my-16`.
- `CalmHero`: shrink mobile hero to `min-h-[clamp(520px,78vh,720px)]` (currently fills the viewport, pushing all content below the fold).
- Tighten section vertical rhythm: replace `py-24 sm:py-32` on `HumanMoment` portrait with `py-16 sm:py-24 lg:py-28`.

In `src/components/marketing/responsive-image.tsx`: no API change; the new `sizes` props above shrink download weight automatically.

### Step 2 — Eliminate the 404 image variant class of bug

Switch `vite-imagetools` calls in `src/lib/calm-images.ts` from multi-width picture sets to a **single optimized width per format**, keeping AVIF/WebP/JPG fallback:

```ts
// before
"...?w=640;1024;1600;1920&format=avif;webp;jpg&as=picture"
// after
"...?w=1280&format=avif;webp;jpg&as=picture"
```

- Heroes: `w=1600`
- HumanMoment / StillLife: `w=1280`
- Inline quotes / small details: `w=900`

This produces 3 files per asset instead of 12, every one referenced and emitted, no missing widths. `ResponsiveImage` keeps its current `<picture>` shape so AVIF/WebP/JPG negotiation still works.

### Step 3 — Verify

- Build + open `/`, `/features`, `/pricing`, `/about`, `/contact` at 390×844, 820×1180, 1440×900.
- DevTools → Network: confirm AVIF served, payloads drop (target hero <120KB, moment shots <90KB).
- `curl -I` each emitted variant URL on the published worker after deploy to confirm no 404s.

---

## Wave 5 — DNA uploads (the next major slice)

Goal: let users upload a raw DNA file (23andMe, AncestryDNA, MyHeritage TSV/TXT, or generic VCF) and have Purple extract a small, condition-relevant set of variants — never a clinical report, always disclaimered.

### Scope (kept tight on purpose)

1. **Upload + storage**
   - Private bucket `dna-uploads/{user_id}/{file_id}` (signed URLs only, never public — matches existing journal-media/reports rules in memory).
   - New table `public.dna_files`: `user_id`, `provider` ('23andme' | 'ancestry' | 'myheritage' | 'vcf' | 'unknown'), `original_filename`, `storage_path`, `byte_size`, `status` ('uploaded' | 'parsing' | 'parsed' | 'error'), `error_message`, `parsed_at`.
   - Standard four-step pattern: CREATE TABLE → GRANT (authenticated + service_role only, no anon) → ENABLE RLS → policies scoped to `auth.uid()`.

2. **Parser** (`src/lib/dna-parse.server.ts`, called from `parseDnaFile` server fn)
   - Detects format by header line.
   - Streams the file from storage; extracts only SNPs in a curated **allow-list** of ~50 RSIDs tied to traits we already model (e.g. APOE for Alzheimer's risk awareness, MTHFR, HLA-B27 for autoimmune, CYP2D6 for med metabolism notes, F5 Leiden for clotting). No whole-genome ingestion.
   - Stores extracted rows in `dna_variants` (file_id, rsid, genotype, chromosome, position).

3. **UI**
   - New route `/_app/my-health/dna` with:
     - Upload card (drag-drop, accepts .txt/.tsv/.vcf/.zip, ≤30MB)
     - "What we look at and why" disclosure (lists the 50 RSIDs in plain language, links to evidence)
     - Results: grouped by trait, each row shows genotype + a calm "what this means" note from `condition_catalog.evidence_refs`
     - Delete-and-purge button (deletes file from storage + rows from both tables)
   - Entry from `/my-health` as a "DNA insights (optional)" card, off by default.

4. **AI integration**
   - On parse success, regenerate the Care Profile with a new `dnaContext` summary input so journal prompts can be subtly informed (e.g. "Your APOE pattern is associated with sleep being especially load-bearing — want to log last night?").
   - Same graceful fallback rules: if AI is down, the DNA page still shows the static catalog notes.

5. **Safety**
   - Hard-coded `MedicalDisclaimer` on every DNA surface with explicit "This is not a clinical genetic test. Do not make medical decisions from this."
   - Sensitive findings (APOE ε4/ε4, BRCA-related) gated behind an extra "Show sensitive results" toggle defaulted off, with crisis/genetic-counselor resource links.
   - No sharing to caregivers without explicit opt-in (new column `dna_files.share_with_caregivers boolean default false`).

### Out of scope for Wave 5 (call out so we don't drift)

- Pharmacogenomics dosing recommendations (medical-device territory).
- Ancestry / ethnicity breakdowns.
- Imputation or polygenic risk scores.
- Re-analysis of old files when the allow-list grows (we'll add a "re-scan" button in a later wave).

---

## Anything else outstanding

From previous waves I'm tracking:

- **Wave 4 type regen**: the `admin-reports.functions.ts` queries reference `duplicate_of` / `excluded_from_trends` / `identity_status` columns; once the migration runs and `src/integrations/supabase/types.ts` regenerates, confirm no `as any` casts slipped in.
- **`/admin/reports/duplicates` empty state**: needs a "Nothing to review" card — small polish, I'll fold it into Step 3 verification.
- **Care Profile cache invalidation**: when DNA finishes parsing OR conditions change, both call the same `regenerateCareProfile` helper. Need to make sure we're not double-firing on onboarding finish.

## Order of execution

1. Steps 1–3 above (images) — ship together, ~1 round of build + visual QA.
2. Wave 5 migration (DNA tables + bucket) for your approval.
3. Wave 5 parser + UI + AI hook.
4. Tiny polish pass: duplicates empty state + Care Profile dedupe.

Reply **go** to start with the image fixes, or tell me to reorder (e.g. "DNA first").

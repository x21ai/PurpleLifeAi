## What's in scope

Eleven distinct issues across marketing and app surfaces. Grouped into 6 phases so you can ship in order. Phases 1–4 I can do without further input. Phases 5–6 have product questions (asked at the end).

---

## Phase 1 — Quick polish (no questions)

### 1.1 Eyebrow contrast ("A quiet companion for your health")
The eyebrow on marketing hero sections renders at `text-muted-foreground` over a light landscape photo at the top edge of every CalmHero. It's used on Home, Features, Pricing, Privacy, Terms, About, Community, Sign-in, Reset-password.
- Increase eyebrow contrast to `text-white/85` with a subtle `mix-blend-multiply` / text-shadow when overlaid on a photo.
- Keep the eyebrow muted on dark-canvas pages where it sits below the hero (no photo behind it).
- Verify across all eight CalmHero usages.

### 1.2 Password show/hide toggle (eye icon)
Six password inputs missing the toggle:
`src/routes/sign-in.tsx`, `src/routes/reset-password.tsx` (×2), `src/components/account/password-section.tsx` (×2), `src/components/settings/data-section.tsx`.
- Build a small `PasswordInput` component (Input + Eye/EyeOff button, `type` switches, accessible label "Show password" / "Hide password").
- Replace all six call sites.

### 1.3 Remove test/demo content
The `Demo Title` / `Demo post data.` post is in the DB (`community_posts`), not code. Single row, ID `1fb64e76-…`. Delete it. Also audit:
- `community_posts` for any other demo rows.
- `community_resources`, `feature_suggestions`, `feedback`, `messages` for placeholder rows.
- Marketing eyebrows / hero copy: confirm no Lorem or "Sample" strings remain (scan was clean).

### 1.4 Journal sidebar simplification
In `src/components/layout/nav-items.ts`, the Journal group has `children: [All entries, New entry]`.
- Collapse to a single top-level `Journal` link pointing to `/journal`.
- `/journal` already has a floating "+ New entry" FAB — keep that as the only entry point.
- Apply same rule anywhere a parent route + duplicate child exists (audit My Body, Insights, Care, Community, Tools).

---

## Phase 2 — Sidebar group click behaviour

### 2.1 Closed/collapsed parent groups
Right now `My Body`, `Insights`, `Care`, `Community`, `Tools` are caret-only — clicking the label expands but doesn't navigate. Confusing because some have a natural landing page (e.g., `My Body` → biometrics overview, `Insights` → patterns, `Care` → caregivers).
- Convert each parent to a real link to its landing page AND keep the caret to expand children.
- Where no landing page exists (e.g., Tools is a grid hub already), keep current click-to-expand.
- Add a tiny chevron affordance distinct from the row hit-area so the click target is clear.

---

## Phase 3 — New entry page layout

### 3.1 `/journal/new` full-page treatment
Currently routes as a full page but the layout feels like an unfinished sheet (centered title bar, content adrift, mic+camera buttons floating at bottom).
- Re-template using the existing `SheetPage` pattern so it matches Account/Settings visual rhythm.
- Top bar: Close (X) left, "New entry" centered, Save right (current).
- Body: When/Date row, big serif textarea, then a tidy "Capture" toolbar (mic, photo, gallery, video) inside a card, not floating.
- Mobile: respect safe-area, keyboard-aware bottom toolbar.
- Same template used for `/seizures/new` for consistency.

---

## Phase 4 — Biometrics ("Your body") restructure

### 4.1 Bigger cards, grouped, drag-to-favorite, attention flags
Today every metric is a small card. User can't see numbers clearly, can't tell which device a reading came from, can't sort by importance, can't tell which need attention.
- **Categories** (rendered as section headers):
  - Recovery (Readiness, Recovery, Sleep score, HRV, Resting HR)
  - Sleep (Total, Deep, REM, Light, Efficiency, Sleep performance)
  - Cardio (HR variability, BPM trend, SpO₂, Respiratory)
  - Movement (Steps, Activity score, Calories)
  - Stress & Body (Skin temp, Stress, Resilience)
- **Sizing**: hero cards (2-up on desktop, 1-up mobile) for user's pinned favorites, then 3-up grid for the rest.
- **Pin/drag**: top "Pinned" section the user can reorder via dnd-kit (already a dep). Persist order in `profiles.biometrics_pinned` (text[]) and `biometrics_order` (jsonb).
- **Device chips per card**: show which source filled this reading (Oura / Whoop / Apple) with the existing colored letter chip, plus the timestamp.
- **Attention flag**: derive a per-metric status using existing baseline (`HIGH` / `LOW` / `IN RANGE`). When `status === "low"` or far from baseline, render an amber "Pay attention" pill with a one-line explanation from `biometric-metrics.ts`. Surface a top-of-page "3 metrics need a look" summary that scrolls to them.

(Backend: one migration to add `biometrics_pinned text[]` and `biometrics_order jsonb` to `profiles`.)

---

## Phase 5 — Hydration & food capture (needs Q1)

### 5.1 Photo-to-log
Today hydration is logged manually via `+ water` / `+ electrolyte` quick adds.
- Add a "Snap drink/meal" button on Hydration page that opens camera/gallery.
- Server fn `extractIntakeFromImage` → uploads to `journal-media` (private), calls Lovable AI Gateway (`google/gemini-3-flash-preview`) with image + structured-output schema `{ kind, volume_ml, sodium_mg, calories, items[], confidence }`, returns a draft.
- User reviews the draft sheet and confirms → writes to `hydration_intake` (existing) and a new `food_intake` table for solid food.
- Same flow on a new "Nutrition" tile, or reuse Hydration page (Q1).

### 5.2 Time-range filters
Day / Week / Month / Custom toggle at the top of Hydration (matches Biometrics).
- New util `useRangeFilter()` that drives all hydration queries.
- Re-render `HydrationTimeline` per range, with bar totals + AI-extracted calories if present.

---

## Phase 6 — Medications: scan + timeline integration (needs Q2 & Q3)

### 6.1 Scan a med / prescription
- "Scan medication" button on Meds. Opens camera/gallery.
- Server fn `extractMedFromImage` → Lovable AI with med-bottle/prescription schema (`name, strength, form, dose, frequency, refills, prescriber, rx_number`).
- If `med-dictionary.ts` has a fuzzy match, prefill brand/generic, side effects, interactions.
- User confirms in `medication-form-sheet` → writes to `medications`, regenerates `medication_doses`.

### 6.2 Timeline integrated into Meds + Today
- New `MedTimeline` component on `/meds`: 7-day grid of doses (taken / missed / upcoming) with reschedule from cell.
- On `/today`: collapse "Today's doses" + next-7-day strip into a single timeline view, with the rest of Today below.

---

## Files touched (high-level)

```
Phase 1: nav-items.ts, calm-hero.tsx (or wherever eyebrow lives),
         sign-in.tsx, reset-password.tsx, password-section.tsx,
         data-section.tsx, new components/ui/password-input.tsx,
         + DB cleanup migration.
Phase 2: sidebar-nav.tsx, nav-items.ts
Phase 3: routes/_app/journal.new.tsx, routes/_app/seizures.new.tsx,
         components/sheet/sheet-page.tsx (small additions)
Phase 4: routes/_app/biometrics.index.tsx, components/biometrics/*,
         + migration adding profiles.biometrics_pinned + _order
Phase 5: routes/_app/hydration.tsx, components/hydration/*,
         lib/hydration.functions.ts, new lib/intake-vision.functions.ts,
         + migration for food_intake
Phase 6: routes/_app/meds.tsx, components/meds/*,
         new lib/med-vision.functions.ts, MedTimeline component
```

---

## Questions I need answered before Phases 5–6

**Q1.** Hydration capture: do you want food (calories, macros) tracked as a separate "Nutrition" page in the sidebar, or rolled into Hydration as "What you took in today" (drinks + food)? I'd lean rolled-in for v1 to keep the surface area small.

**Q2.** Medications: when scanning a prescription, do you want it to auto-create the med immediately (with a "review" badge so the user can fix mistakes), or always show a confirm sheet first? Confirm-first is safer; auto-create is faster.

**Q3.** Timeline-in-meds: should the existing standalone `/timeline` page (which spans seizures + journal + doses) stay, or merge into the new MedTimeline on `/meds` and Today? I'd keep `/timeline` for the full cross-feature view and add a meds-only mini-timeline inline.

Once you answer Q1–Q3 I'll start at Phase 1 and ship through Phase 4 immediately, then Phases 5–6 with your direction.

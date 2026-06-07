## Phase 5 — Intake (drinks + food in one place)

Rename "Hydration" → "Intake" in nav and copy. One page covers water, electrolytes, other drinks, and food. No new sidebar entry.

**New: `food_entries` table**
- `user_id`, `consumed_at`, `name`, `portion` (text), `calories_kcal`, `protein_g`, `carbs_g`, `fat_g`, `photo_path` (storage), `source` ('manual' | 'photo' | 'voice'), `ai_confidence`, `note`
- RLS: owner-only. Grants for `authenticated` + `service_role`.

**Storage:** reuse private `journal-media` bucket under `food/{user_id}/...` (already private, signed-URL workflow).

**Capture flow (works for water/drink/food):**
1. Bottom action bar on `/intake`: `+ Water` | `+ Drink` | `+ Food` | `📷 Snap` | `🎙 Voice`
2. **Snap** → upload photo → call `recognizeIntakeFromPhoto` server fn → Lovable AI Gateway (`google/gemini-3-flash-preview`, vision) returns `{ kind: 'water'|'drink'|'food', items: [{name, portion, calories_kcal, macros}], confidence }`
3. Always show a **confirm sheet** with editable fields before save. Never silent-save. Adds disclaimer "AI estimate — please confirm".
4. **Voice** → existing transcription path → same AI extractor in text mode → confirm sheet.

**Day/Week/Month view (also Phase 5):**
- Add a segmented control `Day | Week | Month` at top of `/intake`.
- Day: existing timeline + new food/drink entries interleaved by `consumed_at`.
- Week/Month: small summary cards (water total, kcal total, top drinks, top foods) + a thin bar chart. Reuse `recharts` (already in stack).

**Files**
- migration: `food_entries` + grants + RLS + updated_at trigger
- `src/lib/food.functions.ts` — `listFoodForRange`, `createFoodEntry`, `recognizeIntakeFromPhoto`, `recognizeIntakeFromText`
- `src/lib/food.server.ts` — AI gateway call (vision)
- `src/components/intake/snap-intake-sheet.tsx` — capture + confirm
- `src/components/intake/intake-action-bar.tsx`
- `src/components/intake/intake-range-view.tsx` (day/week/month)
- update `src/routes/_app/hydration.tsx` → keep route id but rename page title/copy to "Intake"; add range view + action bar
- update sidebar nav label "Hydration" → "Intake"

(Keep the `/hydration` URL to avoid breaking existing links; add a small `/intake` redirect alias.)

## Phase 6 — Medications: scan + inline mini-timeline

**Scan / photo / prescription add**
- Add `+` menu on `/meds`: `Manual` | `📷 Scan bottle` | `📄 Upload prescription` | `🎙 Voice`
- Photo/PDF → upload to private storage → server fn `recognizeMedicationFromImage` calls Lovable AI vision → returns `{ name, strength, form, instructions, schedule_hint }`
- **Always opens the existing `medication-form-sheet` pre-filled** with a "Review AI suggestion" banner. User confirms before save. No silent create.

**Mini-timeline (today's doses only)**
- New `src/components/meds/meds-mini-timeline.tsx` — horizontal strip of today's scheduled `medication_doses` with `taken|due|missed` states.
- Embed on `/meds` (top of page) and `/today` (under greeting).
- Keep full `/timeline` page intact.

**Files**
- `src/lib/med-recognition.functions.ts` + `.server.ts`
- `src/components/meds/scan-med-sheet.tsx`
- `src/components/meds/meds-mini-timeline.tsx`
- update `src/routes/_app/meds.tsx` (add scan menu + mini-timeline)
- update `src/routes/_app/today.tsx` (embed mini-timeline)

## Out of scope (explicit)
- Barcode scanning (camera-only image recognition for now; barcode is a later iteration)
- Pharmacy API integrations
- Editing the auto-generated `/timeline` route's behaviour

## Order of execution
1. Phase 5 migration (food_entries) → wait for approval → app code
2. Phase 6 (no schema changes needed; reuses `medications` + `medication_doses`)

## Status
- Phase 5: **shipped** — `food_entries` table, AI photo recognition (Lovable AI Gateway, Gemini vision), Snap Intake sheet with confirm flow, food list under hydration timeline, nav renamed to "Intake".
- Phase 6: **shipped** — `scanMedicationFromPhoto` server fn (Gemini vision), `ScanMedSheet` with review step, `MedicationFormSheet` accepts `prefill` so scanned data flows into the existing safety-confirmed form. New `MedsMiniTimeline` horizontal day-strip embedded on `/meds` and above `TodayDoses` on `/today`. No silent creates — scan always lands in the editable form.

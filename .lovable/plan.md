
## Why
Sunday/Monday episode suggests a pattern: high water intake → low sodium → aura (déjà vu) → seizure risk. Purple needs to capture **what went in (water + electrolytes)** and **what came out as warning signs (déjà vu auras)** with precise timestamps, so the pattern is visible the next time it builds.

## What we'll build

### 1. Hydration log (new)
A lightweight log of every drink, timestamped to the minute.

- New table `hydration_intake`: `user_id`, `consumed_at`, `volume_ml`, `kind` (`water` | `electrolyte` | `coffee` | `tea` | `other`), `electrolyte_mg_sodium` (nullable), `notes`, `created_by_kind/_id` (so caregivers can log too).
- Quick-add chips on Today + a sheet: "250 ml water", "500 ml water", "Electrolyte drink", custom amount + time picker (defaults to now, editable like the biometric sheet).
- Caregiver can add from the care dashboard (same pattern as `AddBiometricSheet`).

### 2. Aura / déjà vu log (new)
Separate from full seizure events — these are the warning signs we want to catch *before* a seizure.

- New table `aura_events`: `user_id`, `occurred_at`, `kind` (`deja_vu` | `jamais_vu` | `epigastric` | `visual` | `other`), `duration_seconds` (nullable), `notes`, `led_to_seizure` (bool, default false, can be linked later), `created_by_kind/_id`.
- One-tap "Log aura" button on Today and on the caregiver dashboard. Time defaults to now, editable.
- When a seizure is logged within ~30 min of an aura, offer to link them.

### 3. Daily hydration + aura timeline (new view)
A single screen — `/vitals` gets a new "Hydration & auras" card, plus a dedicated `/hydration` route — that shows:

- **Today total**: total ml, water vs electrolyte split, estimated sodium intake, a soft target (default 2000 ml, configurable).
- **Hourly bars** (0–23h): stacked bar per hour showing water (blue) vs electrolyte (purple). Drinks render at their exact minute on a thin timeline underneath.
- **Aura markers**: small dots on the same timeline at the exact minute each déjà vu happened, with hover/tap to see kind + notes.
- **Day picker**: jump to any past day. Default: today.
- Caregiver dashboard gets the same card (read-only) under the existing tabs.

### 4. Pattern hint (light, non-medical)
On Today, if **>2 L water in the last 6 hours AND zero electrolytes AND ≥1 aura logged today**, show a quiet info card: *"You've had a lot of water today without electrolytes. Some people find this lowers sodium. Worth mentioning to your care team."* Always with the medical disclaimer. No alarms, no scoring.

## Files

**New**
- `supabase/migrations/<ts>_hydration_and_auras.sql` — both tables, RLS scoped to `auth.uid()`, grants for `authenticated` + `service_role`, indexes on `(user_id, consumed_at)` and `(user_id, occurred_at)`.
- `src/lib/hydration.functions.ts` — `logHydration`, `listHydrationForDay`, `deleteHydration`, caregiver variants.
- `src/lib/auras.functions.ts` — `logAura`, `listAurasForDay`, `deleteAura`, caregiver variants.
- `src/components/hydration/quick-add-water.tsx` — chip row + sheet.
- `src/components/hydration/log-aura-sheet.tsx`.
- `src/components/hydration/hydration-timeline.tsx` — hourly bars + minute-precision drink/aura markers, responsive (mobile stacks bars + scrollable timeline; tablet/desktop full-width).
- `src/routes/_app/hydration.tsx` — dedicated day view with picker.
- `src/components/care/hydration-timeline-readonly.tsx` — caregiver view.

**Edited**
- `src/routes/_app/today.tsx` — add quick-add water row + "Log aura" button + pattern hint.
- `src/routes/_app/vitals.tsx` — add hydration card linking to `/hydration`.
- `src/routes/_app/care.$ownerId.tsx` — add hydration to the dashboard (new tab or inside existing Vitals tab) + caregiver "Add drink" / "Log aura" sheets.
- `src/components/layout/nav-items.ts` — add Hydration link (mobile + desktop).

## Open questions
1. **Daily water target** — default to 2000 ml, or ask during onboarding? I'd default to 2000 ml and make it editable in Settings → Preferences.
2. **Sodium tracking depth** — full mg-per-drink (precise but tedious) or just a boolean "electrolytes yes/no" per drink (faster)? I'd do a hybrid: pick from preset electrolyte brands (LMNT, Liquid IV, Pedialyte, custom) that auto-fill sodium mg, with a manual override.
3. **Aura linking to seizures** — auto-suggest a link if a seizure is logged within 30 min of an aura, or always leave it manual?
4. **Pattern hint thresholds** — happy with >2 L water / 6 h + no electrolytes + aura present? Or should this just be a passive observation in the journal AI extraction rather than a Today card?

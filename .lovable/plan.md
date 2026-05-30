
# Plan — Reposition, condition-aware onboarding, real travel scheduler

Three independent slices. We'll ship them in order.

---

## 1. Reposition the homepage (and other public copy)

**Why:** Current hero pigeonholes Purple as "epilepsy journal" and uses em dashes that read like default AI output.

**New positioning:** Purple is a health companion for people managing complex or chronic conditions — and for the people who care for them. Epilepsy is the depth we're known for; migraine, diabetes, mental health, autoimmune, long COVID, dysautonomia, and caregiving are all welcome.

**Tone (Apple-style):**
- Short, declarative sentences. No em dashes. No "quietly notices." No "whatever's happening."
- Lead with what it does for *you*, not what it is.
- One idea per line.

**Draft hero (for approval during build):**
> Your health, remembered.
> Purple is a private journal for people living with conditions that need attention every day — from epilepsy and migraine to diabetes and mental health. Write it, say it, or snap it. Purple keeps it, and helps you see what matters.

(I'll finalize wording in build; the constraint is: no em dashes anywhere in marketing copy, no "—" used as a stylistic pause. Use periods or line breaks instead.)

**Files touched:**
- `src/routes/index.tsx` (hero, sub-hero, feature blurbs)
- `src/routes/features.tsx`, `src/routes/about.tsx`, `src/routes/pricing.tsx` — sweep em dashes, broaden language away from epilepsy-only
- `src/routes/_app/welcome.tsx` — same sweep
- Page `<title>` and meta descriptions updated to reflect broader positioning

---

## 2. Condition-aware onboarding (light tailoring)

**Why:** Today everyone gets the same epilepsy-shaped Today dashboard. We want signup to ask what each person is managing and lightly adapt.

**UX flow (added to signup → welcome):**
1. New "What brings you to Purple?" step after account creation.
2. Multi-select chips of common conditions + a free-text "Add your own" field.
   - Suggested chips: Epilepsy, Migraine, Diabetes, Mental health, Autoimmune, POTS / dysautonomia, Long COVID / ME-CFS, Chronic pain, Caregiver for someone else, General wellness.
3. Optional follow-up: "Anything else we should know?" (free text, stored as a note).
4. "You can change this anytime in Settings."

**What "Light tailoring" means (per your choice):**
- Stored on profile, no new trackers/tables built per condition.
- Affects:
  - Journal prompt suggestions ("How did your head feel today?" for migraine, "Any aura?" for epilepsy, "Glucose check?" for diabetes, etc.)
  - Today page greeting & empty-state copy
  - Which example tiles get highlighted first (e.g. seizure logger stays prominent only if Epilepsy is selected)
  - Ask-AI default system prompt gets the user's conditions as context so answers are relevant

**Data:**
- New columns on `profiles`: `conditions text[]` (the picked tags), `conditions_note text` (free text)
- Settings page gets a small "Your focus" card to edit later
- No new tables, no destructive migration

**Files touched:**
- Migration: add 2 columns to `profiles`
- `src/routes/sign-up.tsx` or `src/routes/_app/welcome.tsx` — new step
- `src/components/settings/preferences-section.tsx` — edit-later UI
- `src/routes/_app/today.tsx`, `src/components/journal/capture-sheet.tsx` — read `conditions` to pick prompts
- A small `src/lib/condition-prompts.ts` mapping condition → prompt suggestions

---

## 3. Itinerary-driven travel medication scheduler

**Why:** The current Travel tab just stores a destination timezone. You want a real "I'm Traveling" mode where Purple plans every dose across the trip.

**UX flow (in Settings → Travel, renamed "I'm Traveling"):**
1. **Plan a trip** button opens a wizard:
   - Trip name (e.g. "Tokyo for work")
   - Add flights one by one: departure city + airport (or just city), departure date/time (local), arrival city, arrival date/time (local). Add as many legs as you want — layovers are just flights with short gaps.
   - Optional: lodging timezone if different from final arrival city.
2. Purple computes a per-medication, per-dose schedule across the trip:
   - Before departure: home schedule.
   - In-flight & layovers: doses shifted by small increments (configurable: gradual shift over N days, vs. snap-to-destination on arrival).
   - At destination: destination-local times.
   - Return leg: shifts back to home time.
3. Preview screen shows a timeline of every dose with its new local time (and what it would have been at home), grouped by day.
4. "Activate trip" turns it on; medication reminders + push notifications fire on the new schedule. An "I'm Traveling" banner shows on Today with current trip + next dose.
5. Edit or cancel anytime; ending the trip restores home schedule.

**Defaults:** gradual shift = 1 hour per day until aligned with destination (well-supported for circadian meds). User can override per trip.

**Data:**
- Extend `trips` table: add `legs jsonb` (array of `{from_city, from_tz, depart_local, to_city, to_tz, arrive_local}`), `shift_strategy text` ('gradual' | 'snap'), `shift_hours_per_day int`.
- New table `trip_dose_overrides` — per-dose scheduled time during an active trip, so the existing reminders/cron just reads from here when a trip is active.
- Existing `medication_doses` and the `dose-reminders` cron keep working as-is; the trip layer just supplies different `scheduled_at` values for the trip window.

**Files touched:**
- Migration: extend `trips`, add `trip_dose_overrides` with RLS + GRANTs
- `src/lib/travel.functions.ts` — `createTripWithItinerary`, `previewTripSchedule`, `activateTrip`, `endTrip`
- `src/lib/travel-scheduler.ts` (pure function): inputs = home schedule + legs + strategy; output = list of `{dose_time, tz}` per med
- `src/routes/_app/settings.travel.tsx` — full rebuild as "I'm Traveling" with wizard + timeline preview
- `src/components/travel/trip-banner.tsx` — show active trip on Today
- `src/routes/api/public/cron/dose-reminders.ts` — read trip overrides when present

---

## Out of scope (for now)

- Heavy condition-specific trackers (glucose meter integration, migraine attack form, etc.) — your call was "Light." We can revisit later condition by condition.
- Pulling real flight data from an airline API — you type the flight times manually. (Can add a flight-lookup API later behind a feature flag.)
- Multi-trip overlap handling — we'll enforce one active trip at a time in v1.

---

## Suggested build order

**Phase A (small, fast win):** Section 1 — copy rewrite & em-dash sweep across public pages.
**Phase B:** Section 2 — conditions onboarding + light tailoring.
**Phase C (biggest):** Section 3 — travel scheduler, ending with the cron integration.

Reply "go" to start with Phase A, or tell me which phase to prioritize.

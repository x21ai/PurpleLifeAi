## Phase D — Surface what Phase B & C already built

Five small slices that make the existing plumbing visible. Caregiver audit (item 5) is already done — the proposeChange → pending_changes flow is the only write path from caregiver UI; no fixes needed.

---

### 1. Trip banner shows active leg city + next dose

**File:** `src/components/travel/trip-banner.tsx`

Today the banner only shows a generic "Travel mode" pill when a trip is active. Upgrade it to:

- Fetch `trips.legs`, `home_tz_snapshot`, plus the next pending `medication_doses` row inside the trip window.
- Compute the **active leg** = the leg with the latest `from_at <= now`.
- Render: `You're in {leg.label or short-tz}. Next dose 9:00 PM JST · 6:00 AM EST home`, using the existing `DualTime` component.
- Keep the "Manage" link to `/settings/travel`.
- Fall back to today's current behaviour when there are no legs or no upcoming dose.

Responsive: stack the dose line under the city line on narrow widths, inline on `sm+`.

---

### 2. Wire condition prompts into Today + Journal

**Files:** `src/routes/_app/today.tsx`, `src/components/journal/capture-sheet.tsx`

- Today already loads `profiles.first_name` — extend the same query to fetch `conditions`. When `forecast.ai_narrative` is empty, pick the first item from `promptsForConditions(conditions)` instead of the static "How's today feeling?".
- Capture sheet: load `profiles.conditions` once on open and rotate the `Textarea` placeholder through `promptsForConditions(...)` (deterministic by day-of-year so the same prompt sticks for the whole day, no jarring change between opens).

No new dependencies, no schema change.

---

### 3. Ask-Purple system prompt gets conditions context

**File:** `supabase/functions/ai-orchestrator/index.ts` (pre-existing edge function — keeps the chat layer where it already lives)

- Extend the `profiles` select in the chat handler to also pull `conditions, conditions_note`.
- Build `userSystem = SYSTEM_PROMPT + "\n\nThis person is managing: …. They also noted: …."` when present.
- Make `callClaudeOnce` and `callGeminiViaLovableAI` accept the system string as an argument (default to `SYSTEM_PROMPT` for the extractor path that already passes its own).

No tool changes, no behaviour change for users without conditions set.

---

### 4. Travel schedule preview before "Generate"

**Files:** `src/lib/travel.functions.ts`, `src/routes/_app/settings.travel.tsx`

- Add `previewTripSchedule` server fn — same body as `generateTripSchedule` but no DB writes; returns `{ homeTz, doses: [{ medication_id, medication_name, scheduled_at, leg_tz, amount, unit }], slotCount }`.
- In Settings → Travel, add a "Preview schedule" button next to each trip's "Generate" button. Opens a `Dialog` with doses grouped by local date (in the active leg's tz), each row showing medication name + DualTime (leg tz vs home tz).
- "Generate" button stays as-is; users can preview, tweak strategy, then generate.

Responsive: dialog uses `max-w-2xl`, body scrolls; on mobile the dialog goes full-height.

---

### 5. Caregiver "confirm to write" audit — DONE

Verified during exploration: the only caregiver write path is `ProposeChangeDialog` → `proposeChange` server fn → `pending_changes`. Owner approval applies via `decidePendingChange`. No direct DB writes from caregiver UI code. No fix required.

---

## Out of scope (intentional)

- No new tables, no migrations. Everything reuses existing columns.
- No model/provider changes — Ask-Purple stays on Claude/Gemini per user preference.
- Preview doesn't write `schedule_generated_at` — only "Generate" does.

Approve to switch to build mode and ship this.
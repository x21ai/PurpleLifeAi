# Phase 7 then Phase 8 — six stages, one at a time

I'll ship Phase 7 (travel) fully, then Phase 8 (Ask Purple). Each stage gates on a clean compile before the next.

---

## Phase 7 — Travel

### 7a. In-place trip editing
- New server fn `updateTrip(tripId, patch)` in `src/lib/travel.functions.ts` — owner-only, validates legs, updates `trips` row.
- `/settings/travel`: each existing trip card gets an **Edit** button opening a Dialog with the same form fields as create (label, destination tz, depart/return, strategy, legs).
- On save, if dose-affecting fields changed (`legs`, `shift_strategy`, `depart_at`, `return_at`, `destination_tz`) and `schedule_generated_at != null`, prompt the existing regenerate `AlertDialog` before calling `generateTripSchedule` against the same `trip_id` (delete-then-insert by `trip_id` already exists in the scheduler).
- No schema change.

### 7b. Multi-leg itinerary editor
- Extract the current inline legs list on `/settings/travel` into a reusable `<ItineraryEditor value onChange />` at `src/components/travel/itinerary-editor.tsx`. Used by both the create form and the new edit Dialog.
- Per-leg: label, destination tz (select from `COMMON_TZS` + free text), local arrival datetime, remove button.
- Add/Remove/Reorder (up/down arrow buttons — no drag lib, keeps it light).
- Validation: legs must be chronological by `from_at`; inline error under the offending row; Save disabled until valid.
- Mobile (390): stacked rows full-width; tablet/desktop: two-column rows.

### 7c. Active-trip surfacing polish
- Extend `src/components/travel/trip-banner.tsx`:
  - Show **next dose** local time in destination tz (query `medication_doses` for the active trip, `scheduled_at >= now()`, limit 1) plus med name.
  - Show a one-line shift nudge derived from `shift_strategy` (`snap` → "On destination time now", `gradual` → "Shifting Xh/day", `home` → "Staying on home time").
- Verify viewport at 390 / 820 / 1280+.

---

## Phase 8 — Ask Purple

### 8a. Persistent medical disclaimer in chat UI
- New thin footer in `/chat` above the composer: "Purple isn't a clinician. For medical decisions, talk to yours." — muted, dismissible per-session only (no DB, just `sessionStorage`), reappears next session. Always visible regardless of model output.

### 8b. Condition-aware Today greeting
- In `src/routes/_app/today.tsx`, load `profiles.conditions` (already partially loaded elsewhere — reuse if available).
- New helper `getTodayGreeting(conditions, timeOfDay)` in `src/lib/condition-prompts.ts`: returns a 1-line greeting + 1 suggested journal prompt tailored to top condition (epilepsy → "Any auras since yesterday?", migraine → "Any head pain or visual changes?", etc.). Generic fallback when no conditions.
- Wire into the existing `<EmptyState />` / hero area on `/today` — copy only, no layout change.

### 8c. Follow-up chips on chat replies
- After every assistant message in `/chat`, render 1–3 condition-aware follow-up chips below the reply. Source: new `getFollowUps(conditions, lastUserMessage)` in `condition-prompts.ts` — deterministic, keyword-matched against the user's question + their conditions list. Clicking sends as a new user message via the existing `send()`.
- Skip chips for messages that already have `proposals` (avoid double CTAs).
- Mobile: horizontal scroll; desktop: wrap.

---

## Files

**New**
- `src/components/travel/itinerary-editor.tsx`
- `src/components/travel/trip-edit-dialog.tsx`
- `src/components/chat/disclaimer-footer.tsx`
- `src/components/chat/follow-up-chips.tsx`

**Edited**
- `src/lib/travel.functions.ts` — add `updateTrip`
- `src/routes/_app/settings.travel.tsx` — Edit button + dialog, swap inline legs for `<ItineraryEditor />`
- `src/components/travel/trip-banner.tsx` — next-dose line + strategy nudge
- `src/routes/_app/today.tsx` — condition-aware greeting
- `src/lib/condition-prompts.ts` — `getTodayGreeting`, `getFollowUps`
- `src/routes/_app/chat.tsx` — disclaimer footer, follow-up chips
- `.lovable/plan.md` — append shipped log

**No** DB migrations. **No** new Edge Functions. **No** changes to `ai-orchestrator` (system prompt already loads conditions).

## Out of scope
- Drag-and-drop leg reorder (arrow buttons only)
- Multi-trip overlap
- Flight APIs
- Model/tool changes in `ai-orchestrator`

## Gate after each stage
1. **7a**: edit a trip's strategy → save → confirm regenerate → DB shows new `medication_doses` with same `trip_id`.
2. **7b**: add 3 legs out of order → save blocked with inline error; reorder fixes it.
3. **7c**: with an active trip, `/today` banner shows next dose in destination tz + strategy line.
4. **8a**: disclaimer visible in `/chat` on first load, dismissible, returns next session.
5. **8b**: `/today` greeting changes when `profiles.conditions` changes.
6. **8c**: ask Purple a question → 1–3 condition-relevant follow-up chips appear → clicking one sends it.

I'll also clear the lingering `Invariant failed: Expected to find a match below the root match in SPA mode` runtime error as part of stage 7a (likely a missing `<Outlet />` on a layout touched in earlier phases).

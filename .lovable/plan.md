
# Smarter Oura + Conversational AI + Pre-seizure Signals

Four threads, scoped to this round. All write actions are confirm-first. Tone stays warm and non-clinical — never "seizure imminent."

---

## 1. Honest Oura sync timestamps + Sync now

**Problem:** `recorded_at` is set to noon UTC of the Oura day, so "synced 5h ago" is a lie. The real last-pull time lives in `oura_tokens.updated_at`.

- Today tile shows two lines: **"Data through Tue 10:24am"** (from `recorded_at` / sleep end) and **"Last pulled 12m ago"** (from `oura_tokens.updated_at`).
- Add a small **Sync now** icon-button next to it → invokes `oura-sync` for the current user, refreshes the tile, toasts errors.
- Same dual-timestamp + Sync now button on Settings → Oura card and on the new `/biometrics` page.
- Apply across mobile / tablet / desktop layouts.

## 2. Deeper Oura — `/biometrics` index + per-metric drill-in

Expand Today tile and add a real biometrics surface.

**Today tile (`today-biometrics.tsx`)** — add 4 more metrics with tiny 7-day sparklines: Sleep stages (REM/Deep), HRV, Resting HR, Temp deviation, SpO2, Stress, Resilience. Tap any metric → drill page.

**`/biometrics` (new route)** — grid of all metrics, each card shows: current value, 14-day sparkline, baseline band (user's 30-day avg ± 1σ), delta vs baseline, status chip (in range / low / high).

**`/biometrics/$metric` (new dynamic route)** — full drill page:
- Big chart with 7d / 30d / 90d toggle (recharts).
- Baseline band overlay, anomaly dots highlighted in amber.
- Plain-language "What this means for you" block (rendered from a small mapping table — not an AI call, deterministic copy per metric).
- Linked context strip: any seizures, journal flags, or med changes in the same window.

Metrics covered: sleep total, sleep stages, sleep efficiency, sleep score, HRV (rmssd), resting HR, respiratory rate, SpO2, skin temp deviation, Oura readiness, Oura stress, Oura resilience, Oura activity, steps, active calories.

Responsive: 2-col grid mobile, 3-col tablet, 4-col desktop.

## 3. Conversational AI ("Ask Archie") with confirm-to-write actions

Promote chat to a first-class surface so the user can ask questions and request actions without hunting menus.

**Surface:** floating "Ask Archie" button on every authenticated route (bottom-right, above the bottom nav on mobile). Opens a side sheet on desktop/tablet, full-screen sheet on mobile. Chat history persists per-session.

**`ai-orchestrator` extension** — add new tools:
- `get_biometric_trend(metric, days)` — read trends, not just last row.
- `find_correlations(window_days)` — surface what shifted before recent seizures (sleep, HRV, temp, cycle phase, missed doses, journaled triggers).
- `propose_action(kind, payload)` — write-intent tool. Kinds: `create_journal_entry`, `log_med_dose_taken`, `log_med_dose_skipped`, `add_medication`, `archive_medication`, `log_seizure`, `set_reminder`.

**Confirm-to-write flow:** when the model calls `propose_action`, the orchestrator does NOT execute. It returns a structured proposal. The chat UI renders a confirm card ("Add Keppra 500mg, twice daily at 8am/8pm? [Confirm] [Edit] [Cancel]"). Confirm fires the matching server function. Edit opens the existing form sheet prefilled. Nothing writes without a tap.

**Historical reach:** orchestrator system prompt + tools query up to 90 days back (already there for ai_memory; extend biometrics/journal/seizure tools the same way). Includes pattern summaries, not raw rows, when context gets big.

**Smarter context:** every Archie reply has access to:
- Last 7d biometrics summary (already partial).
- Last 14d journal flags + behaviors.
- Last 90d seizure events.
- Current med list + today's dose status.
- Latest `risk_forecasts` row.

## 4. Pre-seizure signal detection — gentle stacked nudge

**Signals tracked** (per Oura research + epilepsy literature, all derived from existing biometric columns):

| Signal | Threshold (vs personal 30-day baseline) |
|---|---|
| Sleep deficit | < baseline − 90 min OR efficiency < 80% |
| HRV drop | rmssd < baseline − 15% over 2 nights |
| Resting HR rise | > baseline + 7 bpm |
| Temp deviation | abs(body_temp_deviation_c) > 0.4°C |
| Low readiness | oura_readiness_score < 65 |
| Stress spike | oura_stress_score > baseline + 25% |
| Cycle phase risk | menstrual_phase in ('late_luteal','menstrual') if tracked |
| Missed dose streak | ≥2 missed doses in last 24h on anticonvulsants |

**Detection:** extend `risk-forecaster` to evaluate each signal and store them as `top_factors` (already a jsonb column). Runs on the existing schedule + after each oura-sync.

**Surfacing rule (no false-positive panic):**
- 0–1 signals → silent, only feeds risk score.
- ≥2 signals same day → create one **gentle alert** (kind `pre_seizure_stack`, severity `info`) and a soft banner on Today. Copy example: *"Three things have shifted today — sleep, HRV, and skin temp. Nothing to panic about. Worth taking it easy, hydrating, staying on top of meds."* Never uses the word "seizure" in the nudge.
- ≥4 signals → severity `warn`, same warm tone, add a "Tell me more" link → `/today/risk` with the factor breakdown.
- Hard rate limit: max 1 stacked-signal alert per 24h. Suppress if a seizure was logged in the last 12h.

**User control:** Settings → Notifications gets a toggle "Gentle daily nudges when signals stack" (default on) and a "What signals does Purple watch?" link → static info page.

---

## Technical details

**New routes**
- `src/routes/_app/biometrics.index.tsx` — grid of metric cards.
- `src/routes/_app/biometrics.$metric.tsx` — drill-in page.
- Reuse `recharts` (already installed via shadcn/chart).

**New components**
- `src/components/biometrics/metric-card.tsx` (sparkline + baseline chip).
- `src/components/biometrics/metric-drill.tsx` (7/30/90 chart, anomaly dots).
- `src/components/biometrics/sync-status.tsx` (dual timestamp + Sync now).
- `src/components/archie/ask-archie-fab.tsx` (floating button).
- `src/components/archie/ask-archie-sheet.tsx` (chat shell, reuses existing chat plumbing if any, otherwise new minimal one wired to `ai-orchestrator`).
- `src/components/archie/action-confirm-card.tsx` (renders pending `propose_action` payloads).

**Edge function changes**
- `oura-sync` — add a single-user manual mode (already supported via POST body `{ user_id, days }`). Surface invocation via a server fn or direct supabase.functions.invoke from the Sync now button.
- `ai-orchestrator` — add the three new tools, add `propose_action` returning a structured proposal (do NOT execute). Add an `execute_action` endpoint that takes a signed proposal id + user confirmation and performs the write via service-role client with strict per-kind validation.
- `risk-forecaster` — expand factor evaluation (8 signals above), keep narrative tone instruction. Insert an `alerts` row when ≥2 signals stack, honoring the 24h rate limit and 12h post-seizure suppression.

**DB**
- No schema changes required. `alerts.kind` is free-text. `risk_forecasts.top_factors` is jsonb. `biometrics` already carries every column we need.
- Add a UNIQUE index suggestion only if we hit dedupe issues on `(user_id, source, recorded_at::date)` — out of scope this round unless asked.

**Out of scope this round**
- Push notifications (alerts surface in-app only; we can add web push next round).
- Editing historical biometrics.
- Native voice mode for Archie.
- Cycle phase auto-detection if user hasn't connected a source that provides it.

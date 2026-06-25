## Goal
1. Show correct Steps and Stress values on Today / Vitals (and Score Snapshot consumers).
2. Stop showing fabricated demo numbers to brand-new accounts — fresh users should see zeros/empty state, not "8,200 steps / 82 readiness" labelled "Demo".

## Findings

**Stress is wrong because of the Oura mapping.** In `supabase/functions/oura-sync/index.ts` we store
`oura_stress_score = daily_stress.stress_high`. Oura's `stress_high` is **seconds spent in high-stress** (e.g. `7200` = 2 h), not a 0-100 score. The Vitals tile then renders it raw, so the user sees a 4-5 digit number where they expect a score/level.

**Steps** itself looks correctly mapped (`activity.steps`, daily total). The "wrong value" symptom is most likely either (a) the snapshot picks the latest non-null row across all biometric sources (Oura/Whoop/Apple Health) so a partial-day or duplicate-source row wins, or (b) it's the same demo fallback issue (issue 2) — `5,511` / `8,200` from the demo block. We will confirm with a quick read against `biometrics` for the affected user before changing the steps logic; the plan only commits to a safe normalization if a real bug is confirmed.

**Demo data on new accounts.** `src/components/today/today-vitals.tsx` and `src/routes/_app/vitals.tsx` substitute a `DEMO` snapshot whenever `snap.hasData === false`. Per project rule "when real data is absent, show demo data clearly labeled as demo", demo is allowed on marketing/preview surfaces but the user wants a true empty state for their own signed-in account when they have not connected anything yet.

## Changes

### 1. Fix Oura stress mapping
In `supabase/functions/oura-sync/index.ts`:
- Stop writing seconds into `oura_stress_score`.
- Store a 0-100 daytime-stress score derived from Oura's `daily_stress` summary:
  - `day_summary === "restored"` → 90
  - `"normal"` → 70
  - `"stressful"` → 40
  - else: scale from `stress_high` seconds (cap at 4 h) into a 0-100 inverted score.
- Also expose the underlying seconds in `extra.daily_stress.stress_high_seconds` (already there via `extra`).
- Backfill: one-shot UPDATE to recompute `oura_stress_score` for existing rows where the value is `> 100` (clearly seconds, not score).

### 2. Steps display sanity-check
- Add a quick verify step (read latest 10 `biometrics` rows for the test account) to confirm whether steps mismatch is real.
- If real: change `getScoreSnapshot.steps` in `src/lib/health-scores.functions.ts` to prefer the **max** `steps` value within the most recent day (UTC) instead of just "latest non-null row", so a partial intraday Apple Health row never overrides Oura's full-day total.
- If not real, skip this sub-change.

### 3. Empty state for fresh accounts (no demo numbers)
- `src/components/today/today-vitals.tsx`: when `!data.hasData`, render a quiet "Connect a device to see your signals" card with a `Connect` link to `/settings` / integrations — instead of the `DEMO` substitution and `DemoNotice`. Remove the `DEMO` constant usage.
- `src/routes/_app/vitals.tsx`: when `!snap.hasData`, render every `MetricCard` value as `–` (already the `EMPTY` constant) and replace the "Sample day" tab + sample status labels with "No data yet" + a single "Connect a device" CTA at the top. Drop the hard-coded `"58"`, `"70"`, `"87"`, `"5,511"`, `"27"`, `"58"`, `"42"`, `"5,840"` fallbacks.
- `DemoBadge` / `DemoNotice` stay in the codebase for public/marketing surfaces; only the signed-in Today and Vitals screens stop using them.

### 4. Verify
- Build passes.
- Sign in with a brand-new account → Today "Your signals" shows the empty-state card, Vitals shows `–` across the board with a Connect CTA, no `Demo` chip.
- For an account with Oura connected, Stress reads as a 0-100 value (e.g. 70), not 7200.

## Out of scope
- Redesigning the empty/connect state visually beyond a single quiet card + CTA.
- Touching demo behavior on public marketing routes or `DemoBadge` itself.
- Whoop/Apple Health stress mapping (Oura is the only source writing `oura_stress_score`).

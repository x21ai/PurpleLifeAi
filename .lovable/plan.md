Three things, in the order that unblocks you fastest.

## 1. Why you "don't see design changes" — and the fix

You're sitting on `/sign-in` right now (and the app keeps sending you back here — see #2). The redesign pass touched Today, Welcome, Insights, Meds, Journal and Chat — but **never touched sign-in or the global app shell**. So every time you reload, the first thing you see is the *un-redesigned* sign-in page with small fonts and no hero, and it looks like nothing changed.

Fix:
- **Sign-in screen**: full Oura-style treatment. Landscape hero image on the left half (desktop) or top (mobile), serif headline at `text-5xl sm:text-7xl` "A quiet intelligence for your health.", PURPLE wordmark drops to a tracked-out eyebrow above it, email + magic-link form on the right with a 14px tracked-out label and a larger input.
- **App shell** (`src/components/layout/app-shell.tsx`, `bottom-nav.tsx`, `sidebar-nav.tsx`): replace the current nav typography with the same tracked-out 10.5px Inter eyebrow + serif active label, hairline borders instead of the current ones, cream surface.
- **Insights / Meds / Journal / Chat headers**: each gets the same large serif page title (`text-4xl sm:text-6xl`) and tracked-out date/eyebrow above it that Today and Welcome now use, so the whole app reads as one redesigned product.
- **Risk band card on Today** (new, see #3): the new card is itself a strong visual moment — colored ring, serif score, chevron — that ties the design language together.

## 2. The logout loop

Symptom: app sends you back to `/sign-in` repeatedly. Likely causes worth checking in order:

1. **Magic-link redirect**: `signInWithOtp` uses `emailRedirectTo = window.location.origin + "/"`. When you click the link in a different browser/tab, the session lands there and other tabs stay logged out until a refresh.
2. **Session not persisting**: the Supabase browser client uses localStorage by default. If you're in an incognito/private window or have site data blocked, the session evaporates on reload.
3. **A 401 from a server function tearing down the session**: I want to scan for any `supabase.auth.signOut()` call paths and add a console log on auth state changes so the next reload shows what's happening.

Plan: add a one-line `console.log("auth", event, !!session)` inside `onAuthStateChange`, then ask you to reproduce once. The next message will have the events in console logs and I can fix the actual cause instead of guessing. No UI change needed for this step.

## 3. Risk forecaster — full build

### Edge function `supabase/functions/risk-forecaster/index.ts`

Two invocation modes:
- `POST { action: "run-all" }` — called by pg_cron at 06:00 UTC, iterates every profile and runs the per-user pipeline.
- `POST { action: "run-user", user_id }` — manual / testing.

Per-user pipeline:
1. Fetch the last 14 days of `biometrics` rows for the user, ordered by `recorded_at`.
2. Split into `recent` (rows where `recorded_at >= now() - 3 days`) and `baseline` (the remaining 4–14 day window). If baseline has < 4 rows, skip the user (insufficient signal — log and continue).
3. Compute averages for both buckets: `sleep_total_min`, `hrv_rmssd_ms`, `oura_readiness_score`, and the absolute `body_temp_deviation_c` for recent only.
4. Pull `medication_doses` for the user in the last 48 hours, count `status = 'missed'`.
5. Scorecard, starting at **30**:
   - `+15` if `recent.sleep_avg < baseline.sleep_avg - 60` (minutes)
   - `+15` if `recent.hrv_avg < baseline.hrv_avg * 0.85`
   - `+10` if max `|body_temp_deviation_c|` in recent > 0.4
   - `+10` per missed dose in last 48h, capped at `+20`
   - `+8` if any recent `oura_readiness_score < 70`
   - clamp to `[0, 100]`
6. Band: `0–29 low`, `30–54 moderate`, `55–74 elevated`, `75–100 high`.
7. Build a `top_factors` JSON array — only push the rules that actually fired:
   ```json
   [
     { "key": "sleep_deficit", "label": "Sleep is short",
       "detail": "You're averaging 5h 50m vs. your usual 6h 55m.",
       "weight": 15 }
   ]
   ```
8. Call Lovable AI Gateway (`google/gemini-3-flash-preview`) with a system prompt: "You are Purple. Reply in 1–2 warm, non-clinical sentences. Never use medical advice language. Example: '…just worth slowing down today.'". User content is the score + band + the firing factors. Use `LOVABLE_API_KEY`.
9. `upsert` into `risk_forecasts` (one row per `user_id` + `for_date`, today's date) with `risk_score`, `band`, `ai_narrative`, `top_factors`, `model_version = "v1-scorecard-2026.05"`, `computed_at = now()`.
10. If band ∈ `{elevated, high}`, insert an `alerts` row (`kind = "risk_forecast"`, `severity = band`, title + body derived from narrative).

Uses `supabaseAdmin` (service role) — bypasses RLS so the cron can write for every user.

### Database
Add a unique index `(user_id, for_date)` on `risk_forecasts` to enable the upsert. Done via migration.

### Cron
Public TanStack server route `src/routes/api/public/hooks/risk-forecaster.ts` that verifies the `apikey` header (Supabase anon) and `POSTs` to the edge function with `action: "run-all"`. Then a `pg_cron` job:
```sql
select cron.schedule('risk-forecaster-daily', '0 6 * * *', $$
  select net.http_post(
    url := 'https://project--f43135c6-2e21-4f4c-9c81-6a19bf99587f.lovable.app/api/public/hooks/risk-forecaster',
    headers := '{"Content-Type":"application/json","apikey":"<anon>"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
$$);
```

### Today screen integration
- Replace the current `<HeroScoreCard>` with a new structure:
  - **Above the card**: the AI narrative rendered as the main "Good morning. " serif paragraph (`font-serif text-2xl sm:text-3xl`).
  - **Risk band card**: cream surface, hairline border, left side has a 56px colored circle (green / amber / orange / coral mapped to band) with the score in serif, middle is band label in tracked-out eyebrow + "Today's reading" serif, right side is a chevron. Tappable.
- **Detail view** at `src/routes/_app/today.risk.tsx`: same hero score arc on top, then a vertical list of `top_factors` rendered as `<ProgressPill>`-style rows with the `detail` string under each label, model version + `computed_at` shown muted at the bottom.

### Files
- `supabase/functions/risk-forecaster/index.ts` (new, with `verify_jwt = false` block in `supabase/config.toml`)
- `src/routes/api/public/hooks/risk-forecaster.ts` (new)
- `src/routes/_app/today.risk.tsx` (new)
- `src/components/today/risk-band-card.tsx` (new)
- `src/routes/_app/index.tsx` (replace HeroScoreCard usage)
- `src/components/today/hero-score-card.tsx` (deleted — narrative-above-card pattern replaces it)
- migration: unique index on `risk_forecasts(user_id, for_date)`
- cron insert via supabase insert tool

### Out of scope for this loop
- v2/v3 model. Stored as `model_version` so future versions can coexist.
- Backfilling historical forecasts.
- Push notifications when an `alerts` row is created (separate task).

---

Before I switch to build mode, two quick checks I'd like your call on:
- Sign-in redesign — go full landscape hero like the rest of the app, or keep it minimal (cream surface, big serif, no image)?
- Logout debugging — OK to add the one-line `console.log` to auth state changes so I can see the exact event sequence on your next reload? It'll only stay in until we identify the cause.

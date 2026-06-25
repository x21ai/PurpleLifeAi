## Problem
The "You had <med> at <time>" catch-up card on Today re-appears after you tap **I took it** / **I missed it** and navigate away and back.

## Root cause
`src/components/today/missed-dose-catchup.tsx` finds doses by querying `medication_doses` where `status = 'pending'` AND there is no row in `notification_delivery_log` with a `fired_at` for that dose. When you act on the card, it does either:
- `update({ status: 'taken', taken_at: now })`, or
- `update({ status: 'skipped' })` — **no `skipped_at`/`updated_at` written**.

On return to Today the component remounts and re-runs the query. It should exclude the dose because `status != 'pending'`. The most likely reasons it still re-appears in your case:

1. There are several past pending doses in the 24h–1h window; acting on one only removes that one from local state, the next-oldest immediately takes its place and looks like "the same reminder" (same med name, same wording).
2. The `dismiss` ("Not now") flag is `sessionStorage`-scoped, so closing the tab or a hard refresh wipes it and the card returns.
3. The card doesn't optimistically suppress the dose before the DB write resolves, so a slow round-trip + quick navigation can let the next render re-query and re-include it.

## Fix (UI/presentation only)

Edit `src/components/today/missed-dose-catchup.tsx`:

1. **Persist per-dose dismissals** in `localStorage` (not just `sessionStorage`), keyed by dose id with a 48h TTL:
   - Key: `purple-dose-catchup-acted` → `{ [doseId]: expiresAtMs }`.
   - On mount, prune expired entries.
   - Filter the fetched `silent` list to exclude any dose id present in this map.
2. **Record the dose id immediately** when the user taps **I took it** or **I missed it** (before the Supabase update resolves), so a fast navigation can't bring it back.
3. **Move "Not now" dismissal to the same `localStorage` map** as a single sentinel (`__all__` with 12h TTL) instead of `sessionStorage`, so a refresh respects it.
4. **Mirror Today's-doses behavior** by also calling `cancelDoseReminder(doseId)` after a successful `taken`/`skipped` update (already exported from `@/lib/med-notifications`) so any service-worker notification for that dose is closed too.
5. Keep all copy, layout, icon, spacing, and tokens exactly as today (no visual changes). Works the same on mobile, tablet, and desktop since the card is fluid.

## Verify
- Sign in, open Today with at least one past-pending dose, tap **I took it** → card hides; refresh page → card stays hidden; navigate to Meds and back → card stays hidden.
- Tap **I missed it** → same behavior.
- Tap **Not now** → card hides; refresh → still hidden (until TTL expires or a new past-pending dose appears).
- New past-pending dose tomorrow → card shows again.

## Out of scope
The center popup dialog and the inline Today's-doses rows (those already filter by `status='pending'` and update the DB correctly; no reports of them re-popping on this request).

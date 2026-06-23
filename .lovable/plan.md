## What "Sync now" does today

Right now the **Sync now** button on the biometrics page only calls the Oura edge function. The component is literally `OuraSyncStatus` (`src/components/biometrics/sync-status.tsx`) — it reads `oura_tokens` + Oura biometrics and invokes `oura-sync` on click. Whoop is not touched, and Apple Health is push-only (the Health Auto Export webhook delivers data; Purple can't pull it).

The only place that already syncs every connected wearable is the **Today page pull-to-refresh** gesture, which loops `WEARABLE_PROVIDERS` and fires Oura + Whoop in parallel.

So your expectation is correct — the button should sync all — but the code doesn't yet.

## Fix

Turn `OuraSyncStatus` into a generic `WearableSyncStatus` that:

1. **Reads status for every connected pull provider** (Oura + Whoop via `WEARABLE_PROVIDERS`):
   - `last_sync_at` (fallback `updated_at`) from each `*_tokens` row → pick the most recent across providers for the "Last pulled" line.
   - Latest `biometrics.recorded_at` filtered by `source in ('oura','whoop')` → "Data through".
   - If Apple Health token exists, also include `apple_health_tokens.last_webhook_at` in the "Last pulled" calculation so the label reflects passive receipt too (no button action for it).

2. **On click, sync every connected pull provider in parallel** (same pattern as Today pull-to-refresh):
   - Oura → `supabase.functions.invoke("oura-sync", { body: { action: "incremental" } })`
   - Whoop → `useServerFn(whoopIncrementalSync)()`
   - Apple Health → skipped (push-only); if connected, toast note "Apple Health pushes automatically".
   - Use `Promise.allSettled` so a single provider failure doesn't block the others; toast a per-provider summary (e.g. "Synced Oura, Whoop" or "Oura synced; Whoop failed").

3. **Render nothing only when no pull provider is connected** (today it hides when Oura isn't connected, which wrongly hides the button for Whoop-only users).

4. Keep both `variant="compact"` (Today tile) and `variant="detailed"` (biometrics pages) layouts. Update `aria-label` from "Sync Oura now" to "Sync wearables now".

5. Update the three call sites to the new name: `src/routes/_app/today.tsx`, `src/routes/_app/biometrics.index.tsx`, `src/routes/_app/biometrics.$metric.tsx`. Keep a thin `OuraSyncStatus` re-export alias for one release to avoid breakage, or rename directly — your call.

## Files touched

- `src/components/biometrics/sync-status.tsx` — rewrite to multi-provider.
- `src/routes/_app/today.tsx`, `src/routes/_app/biometrics.index.tsx`, `src/routes/_app/biometrics.$metric.tsx` — update import/usage name.

## Out of scope

- No backend or schema changes.
- No change to autosync hook or pull-to-refresh (they already sync all).
- Apple Health remains push-only; not adding a fake pull.

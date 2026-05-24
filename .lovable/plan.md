## Goal

Oura OAuth works. Now polish the connected state so it clearly shows what was imported, lets the user pick how often to sync, and runs that sync automatically server-side.

## Default sync frequency

**Every 12 hours** — confirmed. User can change to 1h / 6h / 12h / 24h / manual.

## Changes

### 1. Connected card (Settings + Welcome) — compact summary

Replace the current `Connected · last sync …` line with a small summary fetched from the DB:

- **Status row**: "Connected" + last sync time (relative: "5 min ago", "2h ago")
- **Imported counts** (last 90 days from `biometrics` where `source='oura'`):
  - Sleep nights: N
  - Readiness days: N
  - Activity days: N
- **Sync frequency dropdown**: Every hour · Every 6 hours · **Every 12 hours** (default) · Every 24 hours · Manual only
- Buttons: `Sync now` · `Disconnect`

Reuse the same component on both Settings and Welcome onboarding.

### 2. Persist user preference

New column `oura_tokens.sync_interval_hours` (smallint, default 12, allowed 0/1/6/12/24 where 0 = manual). Save via simple update from the dropdown.

### 3. Automatic sync (server-side)

Use `pg_cron` + `pg_net` to call the existing `oura-sync` edge function with `{ action: "incremental", all: true }` **every hour**. Inside the function, filter users by:

```
now() - last_sync >= sync_interval_hours
```

So one hourly cron job services 1h / 6h / 12h / 24h preferences without multiple schedules. Manual (0) is skipped.

### 4. Live progress after connect

Right now the popup says "Connected. Syncing your last 90 days…" then closes. The 90-day backfill happens inside `exchange` and can take ~15s. Change `oura-connection.tsx`:

- After receiving `oura-connected` postMessage, set a `backfilling` state
- Poll `biometrics` count every 2s for 30s, show "Imported N of ~90 days…"
- When count stabilizes or 30s elapses, switch to the normal summary

## Files

- `src/components/connections/oura-connection.tsx` — summary UI, dropdown, polling
- `src/routes/_app/welcome.tsx` — uses the same component (already does)
- `supabase/functions/oura-sync/index.ts` — honor `sync_interval_hours` in the `all: true` branch
- Migration: add `sync_interval_hours` column
- Cron: schedule hourly `oura-sync` call

## Out of scope

- Whoop (still "Coming soon")
- Per-metric sync toggles
- Push notifications when sync completes

Ready to implement on approval.
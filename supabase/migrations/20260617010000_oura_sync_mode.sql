-- Oura sync trigger modes. `sync_mode` decides how a sync is triggered:
--   manual   -> only the Sync button (sync_interval_hours = 0, cron skips)
--   interval -> scheduled cron every sync_interval_hours (1/6/12)
--   visit    -> client syncs on app open, throttled to once per 3h (default)
--   pull     -> client syncs on pull-to-refresh gesture
-- Non-interval modes keep sync_interval_hours = 0 so the oura-sync cron
-- (which skips interval 0) never auto-syncs them.
ALTER TABLE public.oura_tokens
  ADD COLUMN IF NOT EXISTS sync_mode TEXT NOT NULL DEFAULT 'visit';

-- New connections default to on-open (visit) mode.
ALTER TABLE public.oura_tokens
  ALTER COLUMN sync_interval_hours SET DEFAULT 0;

-- Preserve existing users' behavior: anyone on a positive interval stays on a
-- scheduled cadence; everyone else (manual) keeps manual.
UPDATE public.oura_tokens
  SET sync_mode = CASE WHEN sync_interval_hours > 0 THEN 'interval' ELSE 'manual' END
  WHERE sync_mode = 'visit';

-- Whoop sync trigger modes, mirroring oura_tokens. `sync_mode` decides how a
-- sync is triggered:
--   manual   -> only the Sync button (sync_interval_hours = 0, cron skips)
--   interval -> scheduled cron every sync_interval_hours (1/6/12)
--   visit    -> client syncs on app open, throttled to once per 3h (default)
--   pull     -> client syncs on pull-to-refresh gesture
-- Non-interval modes keep sync_interval_hours = 0 so syncAllConnectedUsers
-- (which skips interval 0) never auto-syncs them.
ALTER TABLE public.whoop_tokens
  ADD COLUMN IF NOT EXISTS sync_mode TEXT NOT NULL DEFAULT 'visit';

-- New connections default to on-open (visit) mode.
ALTER TABLE public.whoop_tokens
  ALTER COLUMN sync_interval_hours SET DEFAULT 0;

-- Preserve existing users' behavior: positive interval stays scheduled,
-- everyone else stays manual.
UPDATE public.whoop_tokens
  SET sync_mode = CASE WHEN sync_interval_hours > 0 THEN 'interval' ELSE 'manual' END
  WHERE sync_mode = 'visit';


-- Phase 7d: quiet hours, weekly digest opt-in, missed-dose escalation tracking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS quiet_hours_start time,
  ADD COLUMN IF NOT EXISTS quiet_hours_end time,
  ADD COLUMN IF NOT EXISTS weekly_digest_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE public.medication_doses
  ADD COLUMN IF NOT EXISTS missed_notified_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_med_doses_pending_missed
  ON public.medication_doses (scheduled_at)
  WHERE status = 'pending' AND missed_notified_at IS NULL;

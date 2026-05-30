ALTER TABLE public.medication_doses ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_medication_doses_pending_due
  ON public.medication_doses (scheduled_at)
  WHERE status = 'pending' AND notified_at IS NULL;
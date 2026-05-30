ALTER TABLE public.email_send_log ADD COLUMN IF NOT EXISTS sent_by uuid;
CREATE INDEX IF NOT EXISTS idx_email_send_log_sent_by_created
  ON public.email_send_log (sent_by, created_at DESC);
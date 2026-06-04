ALTER TABLE public.whoop_tokens
  ADD COLUMN IF NOT EXISTS sync_interval_hours smallint NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS last_sync_at timestamptz;

ALTER TABLE public.whoop_tokens
  DROP CONSTRAINT IF EXISTS whoop_tokens_sync_interval_hours_check;

ALTER TABLE public.whoop_tokens
  ADD CONSTRAINT whoop_tokens_sync_interval_hours_check
  CHECK (sync_interval_hours = ANY (ARRAY[0, 1, 6, 12, 24]));

DROP TRIGGER IF EXISTS whoop_tokens_set_updated_at ON public.whoop_tokens;
CREATE TRIGGER whoop_tokens_set_updated_at
  BEFORE UPDATE ON public.whoop_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
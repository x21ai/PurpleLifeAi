ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS purge_after timestamptz;

CREATE INDEX IF NOT EXISTS profiles_purge_after_idx
  ON public.profiles (purge_after)
  WHERE deleted_at IS NOT NULL;
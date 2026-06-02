ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS care_daily_digest_enabled boolean NOT NULL DEFAULT true;
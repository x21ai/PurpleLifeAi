ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suggestions_dismissed jsonb NOT NULL DEFAULT '[]'::jsonb;
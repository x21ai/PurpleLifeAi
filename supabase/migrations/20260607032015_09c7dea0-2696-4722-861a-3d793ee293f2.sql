ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS biometrics_pinned text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS biometrics_order jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS conditions text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS conditions_note text;
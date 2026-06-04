ALTER TABLE public.care_relationships
  ADD COLUMN IF NOT EXISTS digest_muted boolean NOT NULL DEFAULT false;
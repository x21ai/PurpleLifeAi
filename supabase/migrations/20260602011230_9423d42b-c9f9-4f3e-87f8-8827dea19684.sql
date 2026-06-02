ALTER TABLE public.care_relationships
  ADD COLUMN IF NOT EXISTS relationship_label TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS pronouns TEXT;
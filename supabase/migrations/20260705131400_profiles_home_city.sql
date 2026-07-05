-- User-entered home city, separate from IANA timezone (e.g. Brooklyn vs America/New_York).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS home_city text;

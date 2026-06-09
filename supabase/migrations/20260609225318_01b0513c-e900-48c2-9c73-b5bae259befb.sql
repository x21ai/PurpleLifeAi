ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS pronouns;
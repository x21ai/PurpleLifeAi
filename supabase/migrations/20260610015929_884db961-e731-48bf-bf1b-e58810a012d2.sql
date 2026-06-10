ALTER TABLE public.dna_files
  ADD COLUMN IF NOT EXISTS compression text,
  ADD COLUMN IF NOT EXISTS kind text;
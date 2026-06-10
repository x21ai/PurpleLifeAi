ALTER TABLE public.dna_files
  ADD COLUMN IF NOT EXISTS parse_stats jsonb NOT NULL DEFAULT '{"rowsScanned":0,"curatedMatches":0}'::jsonb;
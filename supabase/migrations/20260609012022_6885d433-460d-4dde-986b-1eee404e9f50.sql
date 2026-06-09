
-- =========================================================
-- dna_files
-- =========================================================
CREATE TABLE public.dna_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'unknown',
  original_filename text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  byte_size bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'uploaded',
  error_message text,
  parsed_at timestamptz,
  share_with_caregivers boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dna_files_provider_chk CHECK (provider IN ('23andme','ancestry','myheritage','vcf','unknown')),
  CONSTRAINT dna_files_status_chk CHECK (status IN ('uploaded','parsing','parsed','error'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dna_files TO authenticated;
GRANT ALL ON public.dna_files TO service_role;

ALTER TABLE public.dna_files ENABLE ROW LEVEL SECURITY;

-- Owner full access
CREATE POLICY "Owners manage their DNA files"
  ON public.dna_files
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Caregiver read access: requires both an active care relationship with the
-- "reports" scope AND the owner having opted in via share_with_caregivers.
CREATE POLICY "Caregivers may read shared DNA files"
  ON public.dna_files
  FOR SELECT
  TO authenticated
  USING (
    share_with_caregivers = true
    AND public.has_care_scope(user_id, auth.uid(), 'reports')
  );

CREATE INDEX dna_files_user_id_created_at_idx
  ON public.dna_files (user_id, created_at DESC);

CREATE TRIGGER dna_files_set_updated_at
  BEFORE UPDATE ON public.dna_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- dna_variants
-- =========================================================
CREATE TABLE public.dna_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES public.dna_files(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rsid text NOT NULL,
  genotype text NOT NULL,
  chromosome text,
  position bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (file_id, rsid)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dna_variants TO authenticated;
GRANT ALL ON public.dna_variants TO service_role;

ALTER TABLE public.dna_variants ENABLE ROW LEVEL SECURITY;

-- Owner full access
CREATE POLICY "Owners manage their DNA variants"
  ON public.dna_variants
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Caregiver read mirrors the file-level rule
CREATE POLICY "Caregivers may read shared DNA variants"
  ON public.dna_variants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dna_files f
      WHERE f.id = dna_variants.file_id
        AND f.share_with_caregivers = true
        AND public.has_care_scope(f.user_id, auth.uid(), 'reports')
    )
  );

CREATE INDEX dna_variants_file_id_idx ON public.dna_variants (file_id);
CREATE INDEX dna_variants_user_rsid_idx ON public.dna_variants (user_id, rsid);

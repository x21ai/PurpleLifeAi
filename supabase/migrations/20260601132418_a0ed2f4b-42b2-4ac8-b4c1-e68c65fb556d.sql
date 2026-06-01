-- Add created_by provenance to all tables caregivers may write to.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'journal_entries',
    'medication_doses',
    'seizure_events',
    'medications',
    'biometrics',
    'report_documents'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS created_by_id uuid', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS created_by_kind text NOT NULL DEFAULT ''self''', t);
    EXECUTE format('UPDATE public.%I SET created_by_id = user_id WHERE created_by_id IS NULL', t);
  END LOOP;
END
$$;

-- Validation trigger (more flexible than a CHECK constraint).
CREATE OR REPLACE FUNCTION public.validate_created_by_kind()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by_kind NOT IN ('self','caregiver','system') THEN
    RAISE EXCEPTION 'created_by_kind must be self, caregiver, or system (got %)', NEW.created_by_kind;
  END IF;
  RETURN NEW;
END
$$;

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'journal_entries',
    'medication_doses',
    'seizure_events',
    'medications',
    'biometrics',
    'report_documents'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'trg_validate_created_by_kind_' || t, t);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE INSERT OR UPDATE OF created_by_kind ON public.%I FOR EACH ROW EXECUTE FUNCTION public.validate_created_by_kind()',
      'trg_validate_created_by_kind_' || t, t
    );
  END LOOP;
END
$$;
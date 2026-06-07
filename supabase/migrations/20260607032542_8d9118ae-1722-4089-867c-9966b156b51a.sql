CREATE TABLE public.food_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consumed_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  portion text,
  calories_kcal numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  photo_path text,
  source text NOT NULL DEFAULT 'manual',
  ai_confidence numeric,
  note text,
  created_by_id uuid,
  created_by_kind text NOT NULL DEFAULT 'self',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_entries TO authenticated;
GRANT ALL ON public.food_entries TO service_role;

ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY food_entries_own ON public.food_entries
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY food_entries_caregiver_select ON public.food_entries
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM care_relationships r
    WHERE r.owner_id = food_entries.user_id
      AND r.caregiver_id = auth.uid()
      AND r.status = 'active'
  ));

CREATE POLICY food_entries_caregiver_insert ON public.food_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM care_relationships r
      WHERE r.owner_id = food_entries.user_id
        AND r.caregiver_id = auth.uid()
        AND r.status = 'active'
    ) AND created_by_id = auth.uid()
  );

CREATE INDEX food_entries_user_consumed_idx ON public.food_entries (user_id, consumed_at DESC);

CREATE TRIGGER food_entries_set_updated_at
  BEFORE UPDATE ON public.food_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
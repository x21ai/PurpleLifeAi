
CREATE TABLE public.hydration_intake (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  consumed_at timestamptz NOT NULL DEFAULT now(),
  volume_ml integer NOT NULL CHECK (volume_ml > 0 AND volume_ml <= 5000),
  kind text NOT NULL DEFAULT 'water' CHECK (kind IN ('water','electrolyte','coffee','tea','other')),
  electrolyte_brand text,
  sodium_mg integer CHECK (sodium_mg IS NULL OR (sodium_mg >= 0 AND sodium_mg <= 10000)),
  notes text,
  created_by_kind text NOT NULL DEFAULT 'self',
  created_by_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_hydration_user_time ON public.hydration_intake(user_id, consumed_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hydration_intake TO authenticated;
GRANT ALL ON public.hydration_intake TO service_role;
ALTER TABLE public.hydration_intake ENABLE ROW LEVEL SECURITY;
CREATE POLICY hydration_own ON public.hydration_intake FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Caregivers with active relationship + biometrics-style scope can read/write
CREATE POLICY hydration_caregiver_select ON public.hydration_intake FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM care_relationships r
    WHERE r.owner_id = hydration_intake.user_id
      AND r.caregiver_id = auth.uid()
      AND r.status = 'active'
  ));
CREATE POLICY hydration_caregiver_insert ON public.hydration_intake FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM care_relationships r
    WHERE r.owner_id = hydration_intake.user_id
      AND r.caregiver_id = auth.uid()
      AND r.status = 'active'
  ) AND created_by_id = auth.uid());

CREATE TABLE public.aura_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  kind text NOT NULL DEFAULT 'deja_vu' CHECK (kind IN ('deja_vu','jamais_vu','epigastric','visual','olfactory','emotional','other')),
  duration_seconds integer CHECK (duration_seconds IS NULL OR (duration_seconds >= 0 AND duration_seconds <= 3600)),
  notes text,
  led_to_seizure boolean NOT NULL DEFAULT false,
  linked_seizure_id uuid,
  created_by_kind text NOT NULL DEFAULT 'self',
  created_by_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_aura_user_time ON public.aura_events(user_id, occurred_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aura_events TO authenticated;
GRANT ALL ON public.aura_events TO service_role;
ALTER TABLE public.aura_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY aura_own ON public.aura_events FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY aura_caregiver_select ON public.aura_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM care_relationships r
    WHERE r.owner_id = aura_events.user_id
      AND r.caregiver_id = auth.uid()
      AND r.status = 'active'
  ));
CREATE POLICY aura_caregiver_insert ON public.aura_events FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM care_relationships r
    WHERE r.owner_id = aura_events.user_id
      AND r.caregiver_id = auth.uid()
      AND r.status = 'active'
  ) AND created_by_id = auth.uid());

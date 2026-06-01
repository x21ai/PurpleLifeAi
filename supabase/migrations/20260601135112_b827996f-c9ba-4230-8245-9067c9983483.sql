CREATE TABLE public.care_caregiver_visits (
  relationship_id uuid PRIMARY KEY REFERENCES public.care_relationships(id) ON DELETE CASCADE,
  caregiver_id uuid NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_by_tab jsonb NOT NULL DEFAULT '{}'::jsonb,
  dismissed_alert_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_caregiver_visits TO authenticated;
GRANT ALL ON public.care_caregiver_visits TO service_role;
ALTER TABLE public.care_caregiver_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "caregiver reads own visits" ON public.care_caregiver_visits
  FOR SELECT TO authenticated USING (caregiver_id = auth.uid());
CREATE POLICY "caregiver writes own visits" ON public.care_caregiver_visits
  FOR ALL TO authenticated USING (caregiver_id = auth.uid()) WITH CHECK (caregiver_id = auth.uid());
CREATE INDEX care_caregiver_visits_caregiver_idx ON public.care_caregiver_visits(caregiver_id);
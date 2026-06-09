
DROP POLICY IF EXISTS "aura_caregiver_select" ON public.aura_events;
CREATE POLICY "aura_caregiver_select" ON public.aura_events
FOR SELECT TO authenticated
USING (public.has_care_scope(user_id, auth.uid(), 'seizures:read'));

DROP POLICY IF EXISTS "food_entries_caregiver_select" ON public.food_entries;
CREATE POLICY "food_entries_caregiver_select" ON public.food_entries
FOR SELECT TO authenticated
USING (public.has_care_scope(user_id, auth.uid(), 'journal:read'));

DROP POLICY IF EXISTS "hydration_caregiver_select" ON public.hydration_intake;
CREATE POLICY "hydration_caregiver_select" ON public.hydration_intake
FOR SELECT TO authenticated
USING (public.has_care_scope(user_id, auth.uid(), 'journal:read'));

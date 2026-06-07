
-- 1. Prevent caregivers from reading invite_token column
REVOKE SELECT (invite_token) ON public.care_relationships FROM authenticated;
REVOKE SELECT (invite_token) ON public.care_relationships FROM anon;

-- 2. Require care_scopes write grant on caregiver inserts
DROP POLICY IF EXISTS aura_caregiver_insert ON public.aura_events;
CREATE POLICY aura_caregiver_insert ON public.aura_events
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by_id = auth.uid()
    AND public.has_care_scope(user_id, auth.uid(), 'seizures:write')
  );

DROP POLICY IF EXISTS hydration_caregiver_insert ON public.hydration_intake;
CREATE POLICY hydration_caregiver_insert ON public.hydration_intake
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by_id = auth.uid()
    AND public.has_care_scope(user_id, auth.uid(), 'journal:write')
  );

DROP POLICY IF EXISTS food_entries_caregiver_insert ON public.food_entries;
CREATE POLICY food_entries_caregiver_insert ON public.food_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by_id = auth.uid()
    AND public.has_care_scope(user_id, auth.uid(), 'journal:write')
  );

-- 3. Restrictive guard on promo_codes so only admins can read, even if a permissive policy is added later
CREATE POLICY promo_codes_admins_only ON public.promo_codes
  AS RESTRICTIVE
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

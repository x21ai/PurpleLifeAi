
-- 1) Revoke user_id column SELECT from anon on community tables
REVOKE SELECT (user_id) ON public.community_posts FROM anon;
REVOKE SELECT (user_id) ON public.community_comments FROM anon;

-- 2) Care relationships: hide invite_token from caregivers, and clear after acceptance
REVOKE SELECT (invite_token) ON public.care_relationships FROM authenticated;
GRANT SELECT (invite_token) ON public.care_relationships TO service_role;

-- Nullify any already-accepted/declined/revoked invite tokens still lingering
UPDATE public.care_relationships
  SET invite_token = NULL
  WHERE status <> 'pending' AND invite_token IS NOT NULL;

-- Attach trigger so invite_token is cleared on status change (function already exists)
DROP TRIGGER IF EXISTS trg_care_clear_invite_token ON public.care_relationships;
CREATE TRIGGER trg_care_clear_invite_token
  BEFORE INSERT OR UPDATE ON public.care_relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.care_clear_invite_token_on_accept();

-- 3) Care scopes: require active relationship for caregiver reads
DROP POLICY IF EXISTS care_scopes_caregiver_select ON public.care_scopes;
CREATE POLICY care_scopes_caregiver_select ON public.care_scopes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.care_relationships r
      WHERE r.id = care_scopes.relationship_id
        AND r.caregiver_id = auth.uid()
        AND r.status = 'active'
        AND (r.expires_at IS NULL OR r.expires_at > now())
    )
  );

-- 4) Platform rules: admins only
DROP POLICY IF EXISTS platform_rules_read ON public.platform_rules;
CREATE POLICY platform_rules_read ON public.platform_rules
  FOR SELECT
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

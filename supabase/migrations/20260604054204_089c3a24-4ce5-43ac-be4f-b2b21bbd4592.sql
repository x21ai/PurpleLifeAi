-- Tighten pending_changes INSERT: ensure owner_id matches the relationship's owner_id
DROP POLICY IF EXISTS pending_caregiver_insert ON public.pending_changes;
CREATE POLICY pending_caregiver_insert ON public.pending_changes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = caregiver_id
    AND EXISTS (
      SELECT 1 FROM public.care_relationships r
      WHERE r.id = pending_changes.relationship_id
        AND r.caregiver_id = auth.uid()
        AND r.owner_id = pending_changes.owner_id
        AND r.status = 'active'::care_relationship_status
    )
  );

-- Tighten care_audit_log INSERT: actor must be related to owner_id (as owner or active caregiver)
DROP POLICY IF EXISTS audit_actor_insert ON public.care_audit_log;
CREATE POLICY audit_actor_insert ON public.care_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = actor_id
    AND (
      auth.uid() = owner_id
      OR EXISTS (
        SELECT 1 FROM public.care_relationships r
        WHERE r.owner_id = care_audit_log.owner_id
          AND r.caregiver_id = auth.uid()
          AND r.status = 'active'::care_relationship_status
          AND (relationship_id IS NULL OR r.id = care_audit_log.relationship_id)
      )
    )
  );

-- Restrict phi_access_log INSERT to service_role only (logs should be server-written)
DROP POLICY IF EXISTS phi_log_actor_insert ON public.phi_access_log;
CREATE POLICY phi_log_service_insert ON public.phi_access_log
  FOR INSERT TO public
  WITH CHECK (auth.role() = 'service_role');
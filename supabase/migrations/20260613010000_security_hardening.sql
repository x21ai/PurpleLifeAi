-- Security hardening: care invite RPC, token expiry, community column grants,
-- search_path pinning on SECURITY DEFINER helpers, reporter privacy.

-- 1) Care invite acceptance via security-definer RPC (token never in client SELECT)
CREATE OR REPLACE FUNCTION public.accept_care_invite(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rel public.care_relationships%ROWTYPE;
  v_email text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_token IS NULL OR length(trim(p_token)) < 20 THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;

  SELECT * INTO v_rel
  FROM public.care_relationships
  WHERE invite_token = p_token
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;

  IF v_rel.status <> 'pending' THEN
    RAISE EXCEPTION 'Invite is no longer pending';
  END IF;

  IF v_rel.owner_id = v_uid THEN
    RAISE EXCEPTION 'You cannot accept your own invite';
  END IF;

  IF v_rel.created_at + interval '7 days' < now() THEN
    RAISE EXCEPTION 'Invite expired';
  END IF;

  IF v_rel.expires_at IS NOT NULL AND v_rel.expires_at < now() THEN
    RAISE EXCEPTION 'Invite expired';
  END IF;

  IF v_rel.invite_email IS NOT NULL AND trim(v_rel.invite_email) <> '' THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
    IF v_email IS NULL OR lower(trim(v_email)) <> lower(trim(v_rel.invite_email)) THEN
      RAISE EXCEPTION 'This invite was sent to a different email address';
    END IF;
  END IF;

  UPDATE public.care_relationships
  SET
    caregiver_id = v_uid,
    status = 'active',
    accepted_at = now(),
    invite_token = NULL
  WHERE id = v_rel.id;

  INSERT INTO public.care_audit_log (relationship_id, owner_id, actor_id, action)
  VALUES (v_rel.id, v_rel.owner_id, v_uid, 'accepted');

  RETURN jsonb_build_object('relationship_id', v_rel.id, 'owner_id', v_rel.owner_id);
END;
$$;

REVOKE ALL ON FUNCTION public.accept_care_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_care_invite(text) TO authenticated;

-- Pre-assigned caregiver can accept without reading invite_token
CREATE OR REPLACE FUNCTION public.accept_assigned_care_invite(p_relationship_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rel public.care_relationships%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_rel
  FROM public.care_relationships
  WHERE id = p_relationship_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;

  IF v_rel.caregiver_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF v_rel.status <> 'pending' THEN
    RAISE EXCEPTION 'Invite is no longer pending';
  END IF;

  IF v_rel.created_at + interval '7 days' < now() THEN
    RAISE EXCEPTION 'Invite expired';
  END IF;

  UPDATE public.care_relationships
  SET
    status = 'active',
    accepted_at = now(),
    invite_token = NULL
  WHERE id = v_rel.id;

  INSERT INTO public.care_audit_log (relationship_id, owner_id, actor_id, action)
  VALUES (v_rel.id, v_rel.owner_id, v_uid, 'accepted');

  RETURN jsonb_build_object('relationship_id', v_rel.id, 'owner_id', v_rel.owner_id);
END;
$$;

REVOKE ALL ON FUNCTION public.accept_assigned_care_invite(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_assigned_care_invite(uuid) TO authenticated;

-- Re-assert invite_token column is service_role only
REVOKE SELECT (invite_token) ON public.care_relationships FROM anon, authenticated;
GRANT SELECT (invite_token) ON public.care_relationships TO service_role;

-- Default pending invite expiry to 7 days when not explicitly set
UPDATE public.care_relationships
SET expires_at = created_at + interval '7 days'
WHERE status = 'pending'
  AND expires_at IS NULL
  AND invite_token IS NOT NULL;

-- 2) Community: hide internal UUIDs from anon; reporter identity admin-only
REVOKE SELECT (user_id) ON public.community_posts FROM anon;
REVOKE SELECT (user_id) ON public.community_comments FROM anon;
REVOKE SELECT (user_id) ON public.community_reactions FROM anon;
REVOKE SELECT (reporter_id) ON public.community_reports FROM authenticated;
GRANT SELECT (reporter_id) ON public.community_reports TO service_role;

-- 3) Pin search_path on email queue SECURITY DEFINER wrappers
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, int, int) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

ALTER FUNCTION public.care_clear_invite_token_on_accept() SET search_path = public;

-- 4) Journal-media and reports storage: existing owner-folder policies verified;
--    no caregiver read path at the storage layer (caregivers use signed URLs).

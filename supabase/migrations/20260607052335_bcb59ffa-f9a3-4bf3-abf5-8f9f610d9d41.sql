
-- 1. Revoke caregiver/anon read access to the invite_token column.
-- The owner (auth.uid() = owner_id) policy still works because UPDATE/INSERT
-- happens through the owner-all policy, and service_role retains full access.
REVOKE SELECT (invite_token) ON public.care_relationships FROM authenticated;
REVOKE SELECT (invite_token) ON public.care_relationships FROM anon;

-- Re-grant SELECT on all other columns to authenticated so caregivers can
-- still read their relationship row via care_rel_caregiver_select.
GRANT SELECT (
  id, created_at, accepted_at, owner_id, revoked_at, status, role,
  invite_email, caregiver_id, expires_at, relationship_label,
  caregiver_hidden_features, digest_muted
) ON public.care_relationships TO authenticated;

-- 2. Explicit deny-UPDATE policy on the care-chat-attachments storage bucket
-- to make immutability of attachments explicit (not just implicit default-deny).
DROP POLICY IF EXISTS "care_chat_attachments_no_update" ON storage.objects;
CREATE POLICY "care_chat_attachments_no_update"
ON storage.objects
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (bucket_id <> 'care-chat-attachments')
WITH CHECK (bucket_id <> 'care-chat-attachments');

-- Lock down sensitive columns at the column-grant level.
-- RLS policies cannot exclude individual columns; column GRANTs can.

-- 1) care_relationships.invite_token must only be readable by service_role.
--    Caregivers currently match `care_rel_caregiver_select` and can see every
--    column on their own row. Revoke column-level SELECT so the policy can no
--    longer expose the token even when the row is readable.
REVOKE SELECT (invite_token) ON public.care_relationships FROM anon, authenticated;

-- 2) community_posts.user_id and community_comments.user_id are internal
--    UUIDs. Anon traffic can enumerate them via the public-read policies.
--    Authenticated callers still need user_id (to know which posts are theirs
--    and to enforce edit rules in the UI), so we only revoke from anon.
REVOKE SELECT (user_id) ON public.community_posts FROM anon;
REVOKE SELECT (user_id) ON public.community_comments FROM anon;

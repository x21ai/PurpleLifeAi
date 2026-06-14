-- 1) Hide community author UUIDs from anonymous visitors (defense in depth at column-grant level)
REVOKE SELECT (user_id) ON public.community_posts FROM anon;
REVOKE SELECT (user_id) ON public.community_comments FROM anon;

-- 2) Restrict raw invite_token on care_relationships: only service_role may read it.
--    Owners and caregivers can still see every other column via their existing RLS policies;
--    owners receive the token via the createInvite server function (returned at creation time)
--    and never need to re-read it from the row.
REVOKE SELECT (invite_token) ON public.care_relationships FROM anon, authenticated;

-- 3) Wire the existing care_clear_invite_token_on_accept() function as an actual trigger,
--    so any non-pending status nullifies the token at the database level.
DROP TRIGGER IF EXISTS care_relationships_clear_invite_token ON public.care_relationships;
CREATE TRIGGER care_relationships_clear_invite_token
  BEFORE UPDATE ON public.care_relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.care_clear_invite_token_on_accept();

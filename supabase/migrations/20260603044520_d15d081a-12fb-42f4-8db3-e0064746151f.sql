DROP POLICY IF EXISTS community_reactions_read ON public.community_reactions;
CREATE POLICY community_reactions_read
  ON public.community_reactions
  FOR SELECT
  TO authenticated
  USING (true);
REVOKE SELECT ON public.community_reactions FROM anon;
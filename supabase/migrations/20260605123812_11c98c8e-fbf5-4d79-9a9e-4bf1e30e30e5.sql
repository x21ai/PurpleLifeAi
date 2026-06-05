DROP POLICY IF EXISTS community_reactions_read ON public.community_reactions;
CREATE POLICY community_reactions_read
  ON public.community_reactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.community_posts p
      WHERE p.id = community_reactions.post_id
        AND p.hidden = false
    )
  );
-- Drop overly-broad SELECT policies that expose user_id on community tables.
DROP POLICY IF EXISTS community_posts_authenticated_read ON public.community_posts;
DROP POLICY IF EXISTS community_comments_authenticated_read ON public.community_comments;
DROP POLICY IF EXISTS community_reactions_read ON public.community_reactions;

-- Replace with own-rows-only SELECT policies. Browsing goes through the
-- sanitized *_public views, which omit user_id.
CREATE POLICY community_posts_select_own
  ON public.community_posts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY community_comments_select_own
  ON public.community_comments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY community_reactions_select_own
  ON public.community_reactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
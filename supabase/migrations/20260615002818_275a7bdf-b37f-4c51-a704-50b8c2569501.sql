
-- Drop anon access from base tables; keep authenticated access intact.
DROP POLICY IF EXISTS "community_posts_public_read" ON public.community_posts;
CREATE POLICY "community_posts_authenticated_read"
  ON public.community_posts FOR SELECT
  TO authenticated
  USING (hidden = false);

DROP POLICY IF EXISTS "community_comments_public_read" ON public.community_comments;
CREATE POLICY "community_comments_authenticated_read"
  ON public.community_comments FOR SELECT
  TO authenticated
  USING (hidden = false);

-- Public views without user_id. Default view security uses the view owner's
-- privileges, so anon can read these without needing direct table access.
CREATE OR REPLACE VIEW public.community_posts_public
WITH (security_invoker = false) AS
SELECT id, topic, title, body, image_url, pinned, created_at, updated_at
FROM public.community_posts
WHERE hidden = false;

CREATE OR REPLACE VIEW public.community_comments_public
WITH (security_invoker = false) AS
SELECT id, post_id, body, created_at
FROM public.community_comments
WHERE hidden = false;

REVOKE ALL ON public.community_posts_public FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.community_comments_public FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.community_posts_public TO anon, authenticated;
GRANT SELECT ON public.community_comments_public TO anon, authenticated;

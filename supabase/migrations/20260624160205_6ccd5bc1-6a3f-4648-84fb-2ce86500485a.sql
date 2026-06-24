REVOKE SELECT ON public.community_posts FROM authenticated;
GRANT SELECT (id, topic, title, body, image_url, pinned, hidden, created_at, updated_at)
  ON public.community_posts TO authenticated;

REVOKE SELECT ON public.community_comments FROM authenticated;
GRANT SELECT (id, post_id, body, hidden, created_at)
  ON public.community_comments TO authenticated;
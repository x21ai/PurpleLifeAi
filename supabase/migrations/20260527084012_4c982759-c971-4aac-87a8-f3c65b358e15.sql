-- Remove overly-permissive public read on profiles that exposed sensitive fields
DROP POLICY IF EXISTS profiles_public_community_read ON public.profiles;

-- Create a safe public view exposing only community-safe profile fields
CREATE OR REPLACE VIEW public.community_profiles
WITH (security_invoker = true) AS
SELECT id, community_display_name, community_bio, community_opted_in
FROM public.profiles
WHERE community_opted_in = true;

GRANT SELECT ON public.community_profiles TO anon, authenticated;

-- Defense in depth: explicitly deny non-admins from inserting into user_roles
CREATE POLICY user_roles_block_self_insert
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));
-- Restrict column-level SELECT on invite_token. Server functions read it via the
-- service-role client (supabaseAdmin); no client-side code reads it directly.
REVOKE SELECT (invite_token) ON public.care_relationships FROM authenticated;
REVOKE SELECT (invite_token) ON public.care_relationships FROM anon;
GRANT SELECT (invite_token) ON public.care_relationships TO service_role;
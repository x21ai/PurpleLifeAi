-- Restrict promo_codes SELECT to admins only. Redemption lookups happen
-- server-side via supabaseAdmin (service role), so authenticated end users
-- never need to read the table directly.
DROP POLICY IF EXISTS "promo_codes_read_active" ON public.promo_codes;
DROP POLICY IF EXISTS promo_codes_read_active ON public.promo_codes;

CREATE POLICY "promo_codes_admin_read"
ON public.promo_codes
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
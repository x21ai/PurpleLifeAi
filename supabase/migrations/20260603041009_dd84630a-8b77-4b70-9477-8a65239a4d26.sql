
CREATE TYPE public.promo_code_kind AS ENUM ('invite','discount','share');

CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text,
  kind public.promo_code_kind NOT NULL DEFAULT 'invite',
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY promo_codes_admin_all ON public.promo_codes
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY promo_codes_read_active ON public.promo_codes
  FOR SELECT TO authenticated
  USING (active = true);

CREATE TABLE public.promo_code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (promo_code_id, user_id)
);

GRANT SELECT, INSERT ON public.promo_code_redemptions TO authenticated;
GRANT ALL ON public.promo_code_redemptions TO service_role;

ALTER TABLE public.promo_code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY promo_redemptions_own_insert ON public.promo_code_redemptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY promo_redemptions_own_select ON public.promo_code_redemptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_promo_redemptions_code ON public.promo_code_redemptions(promo_code_id);

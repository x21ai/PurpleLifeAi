
-- 1. Identity + duplicate fields on report_documents
ALTER TABLE public.report_documents
  ADD COLUMN IF NOT EXISTS patient_name text,
  ADD COLUMN IF NOT EXISTS patient_dob date,
  ADD COLUMN IF NOT EXISTS identity_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS duplicate_of uuid REFERENCES public.report_documents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_report_documents_identity_status
  ON public.report_documents(user_id, identity_status);
CREATE INDEX IF NOT EXISTS idx_report_documents_duplicate_of
  ON public.report_documents(duplicate_of);

-- 2. Cache for AI insights per (user, metric, latest reading anchor)
CREATE TABLE IF NOT EXISTS public.metric_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_key text NOT NULL,
  latest_at text NOT NULL,
  summary text,
  bullets jsonb NOT NULL DEFAULT '[]'::jsonb,
  suggested_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, metric_key, latest_at)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.metric_insights TO authenticated;
GRANT ALL ON public.metric_insights TO service_role;
ALTER TABLE public.metric_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY metric_insights_own ON public.metric_insights
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Platform rules (super-admin managed)
CREATE TABLE IF NOT EXISTS public.platform_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('platform','role','user')),
  scope_value text,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT 'true'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_rules_scope_key
  ON public.platform_rules(scope, COALESCE(scope_value, ''), key);

GRANT SELECT ON public.platform_rules TO authenticated;
GRANT ALL ON public.platform_rules TO service_role;
ALTER TABLE public.platform_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_rules_read ON public.platform_rules
  FOR SELECT TO authenticated USING (enabled = true);
CREATE POLICY platform_rules_admin_write ON public.platform_rules
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin'::app_role));

CREATE OR REPLACE FUNCTION public.platform_rules_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_platform_rules_updated_at ON public.platform_rules;
CREATE TRIGGER trg_platform_rules_updated_at
  BEFORE UPDATE ON public.platform_rules
  FOR EACH ROW EXECUTE FUNCTION public.platform_rules_touch_updated_at();

-- Seed the first rule that the report processor reads.
INSERT INTO public.platform_rules (scope, scope_value, key, value, description)
VALUES ('platform', NULL, 'require_identity_match_for_metrics', 'true'::jsonb,
        'When true, lab readings from a report whose patient name or DOB does not match the user profile are hidden from trends until the user approves them.')
ON CONFLICT (scope, COALESCE(scope_value, ''), key) DO NOTHING;


-- 1. Platform rule audit
CREATE TABLE public.platform_rule_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id uuid,
  scope text,
  scope_value text,
  key text NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('create','update','delete','enable','disable')),
  before jsonb,
  after jsonb,
  at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.platform_rule_audit TO authenticated;
GRANT ALL ON public.platform_rule_audit TO service_role;

ALTER TABLE public.platform_rule_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_rule_audit_super_admin_read"
  ON public.platform_rule_audit FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "platform_rule_audit_super_admin_insert"
  ON public.platform_rule_audit FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()) AND actor_id = auth.uid());

CREATE INDEX idx_platform_rule_audit_at ON public.platform_rule_audit (at DESC);
CREATE INDEX idx_platform_rule_audit_rule ON public.platform_rule_audit (rule_id, at DESC);

-- 2. report_documents: content hash + user decision memory
ALTER TABLE public.report_documents
  ADD COLUMN IF NOT EXISTS content_hash text,
  ADD COLUMN IF NOT EXISTS user_decision text CHECK (user_decision IN ('kept','rejected'));

CREATE INDEX IF NOT EXISTS idx_report_documents_content_hash
  ON public.report_documents (user_id, content_hash);

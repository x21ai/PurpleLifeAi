
-- Care relationship status
CREATE TYPE public.care_relationship_status AS ENUM ('pending', 'active', 'revoked');
CREATE TYPE public.care_role AS ENUM ('emergency', 'caregiver', 'provider', 'viewer');
CREATE TYPE public.pending_change_status AS ENUM ('pending', 'approved', 'rejected');

-- 1) care_relationships
CREATE TABLE public.care_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  caregiver_id uuid,
  invite_email text NOT NULL,
  invite_token text NOT NULL UNIQUE,
  role public.care_role NOT NULL DEFAULT 'caregiver',
  status public.care_relationship_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz,
  CONSTRAINT no_self_share CHECK (caregiver_id IS NULL OR caregiver_id <> owner_id)
);

CREATE INDEX idx_care_rel_owner ON public.care_relationships(owner_id);
CREATE INDEX idx_care_rel_caregiver ON public.care_relationships(caregiver_id);
CREATE INDEX idx_care_rel_token ON public.care_relationships(invite_token);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_relationships TO authenticated;
GRANT ALL ON public.care_relationships TO service_role;

ALTER TABLE public.care_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY care_rel_owner_all ON public.care_relationships
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY care_rel_caregiver_select ON public.care_relationships
  FOR SELECT TO authenticated
  USING (auth.uid() = caregiver_id);

-- caregiver can update their row only to set accepted_at via accept flow (via server fn using service role; this select-only policy is the safety net)

-- 2) care_scopes
CREATE TABLE public.care_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid NOT NULL REFERENCES public.care_relationships(id) ON DELETE CASCADE,
  scope text NOT NULL,
  granted boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (relationship_id, scope)
);

CREATE INDEX idx_care_scopes_rel ON public.care_scopes(relationship_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_scopes TO authenticated;
GRANT ALL ON public.care_scopes TO service_role;

ALTER TABLE public.care_scopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY care_scopes_owner_all ON public.care_scopes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.care_relationships r
      WHERE r.id = relationship_id AND r.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.care_relationships r
      WHERE r.id = relationship_id AND r.owner_id = auth.uid()
    )
  );

CREATE POLICY care_scopes_caregiver_select ON public.care_scopes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.care_relationships r
      WHERE r.id = relationship_id AND r.caregiver_id = auth.uid()
    )
  );

-- 3) pending_changes
CREATE TABLE public.pending_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid NOT NULL REFERENCES public.care_relationships(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  caregiver_id uuid NOT NULL,
  type text NOT NULL,
  target_table text,
  target_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.pending_change_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decision_note text
);

CREATE INDEX idx_pending_owner_status ON public.pending_changes(owner_id, status);
CREATE INDEX idx_pending_caregiver ON public.pending_changes(caregiver_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_changes TO authenticated;
GRANT ALL ON public.pending_changes TO service_role;

ALTER TABLE public.pending_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY pending_owner_all ON public.pending_changes
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY pending_caregiver_select ON public.pending_changes
  FOR SELECT TO authenticated
  USING (auth.uid() = caregiver_id);

CREATE POLICY pending_caregiver_insert ON public.pending_changes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = caregiver_id
    AND EXISTS (
      SELECT 1 FROM public.care_relationships r
      WHERE r.id = relationship_id
        AND r.caregiver_id = auth.uid()
        AND r.status = 'active'
    )
  );

-- 4) care_audit_log
CREATE TABLE public.care_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid REFERENCES public.care_relationships(id) ON DELETE SET NULL,
  owner_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_owner_at ON public.care_audit_log(owner_id, at DESC);
CREATE INDEX idx_audit_rel ON public.care_audit_log(relationship_id);

GRANT SELECT, INSERT ON public.care_audit_log TO authenticated;
GRANT ALL ON public.care_audit_log TO service_role;

ALTER TABLE public.care_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_owner_select ON public.care_audit_log
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY audit_actor_insert ON public.care_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = actor_id);

-- 5) Security-definer helper: does caregiver have an active scope on owner?
CREATE OR REPLACE FUNCTION public.has_care_scope(_owner_id uuid, _caregiver_id uuid, _scope text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.care_relationships r
    JOIN public.care_scopes s ON s.relationship_id = r.id
    WHERE r.owner_id = _owner_id
      AND r.caregiver_id = _caregiver_id
      AND r.status = 'active'
      AND (r.expires_at IS NULL OR r.expires_at > now())
      AND s.scope = _scope
      AND s.granted = true
  )
$$;

GRANT EXECUTE ON FUNCTION public.has_care_scope(uuid, uuid, text) TO authenticated, service_role;

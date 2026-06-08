CREATE TABLE public.report_identity_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name_normalized text NOT NULL,
  dob date,
  source text NOT NULL DEFAULT 'approval',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX report_identity_aliases_unique
  ON public.report_identity_aliases (user_id, name_normalized, COALESCE(dob, '0001-01-01'::date));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_identity_aliases TO authenticated;
GRANT ALL ON public.report_identity_aliases TO service_role;

ALTER TABLE public.report_identity_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "report_identity_aliases_own"
  ON public.report_identity_aliases
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
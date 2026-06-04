
CREATE TABLE public.medical_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  window_from date NOT NULL,
  window_to date NOT NULL,
  file_path text NOT NULL,
  sections jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary text,
  share_token text UNIQUE,
  share_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX medical_reports_user_id_idx ON public.medical_reports(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_reports TO authenticated;
GRANT ALL ON public.medical_reports TO service_role;

ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own medical reports"
  ON public.medical_reports FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER medical_reports_updated_at
  BEFORE UPDATE ON public.medical_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.medical_report_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.medical_reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('download','email_self','email_provider','care_thread')),
  recipient_email text,
  recipient_user_id uuid,
  thread_id uuid,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX medical_report_shares_report_id_idx ON public.medical_report_shares(report_id, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.medical_report_shares TO authenticated;
GRANT ALL ON public.medical_report_shares TO service_role;

ALTER TABLE public.medical_report_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own report shares"
  ON public.medical_report_shares FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

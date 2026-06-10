CREATE TABLE public.vitals_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('weight','bp','glucose','spo2','temp','resp_rate')),
  value NUMERIC,
  value2 NUMERIC,
  unit TEXT,
  notes TEXT,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX vitals_log_user_kind_time_idx ON public.vitals_log (user_id, kind, measured_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vitals_log TO authenticated;
GRANT ALL ON public.vitals_log TO service_role;

ALTER TABLE public.vitals_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own vitals log"
  ON public.vitals_log FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
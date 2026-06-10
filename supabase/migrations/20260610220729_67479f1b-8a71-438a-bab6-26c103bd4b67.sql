-- Phase 4: AI summary cache on reports
ALTER TABLE public.report_documents
  ADD COLUMN IF NOT EXISTS ai_summary jsonb,
  ADD COLUMN IF NOT EXISTS ai_summary_at timestamptz;

-- Phase 7: Vital goals / targets
CREATE TABLE IF NOT EXISTS public.vital_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('weight','bp','glucose','spo2','temp','resp_rate')),
  target_min numeric,
  target_max numeric,
  target_min2 numeric,
  target_max2 numeric,
  unit text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vital_goals TO authenticated;
GRANT ALL ON public.vital_goals TO service_role;

ALTER TABLE public.vital_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vital_goals_own" ON public.vital_goals
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER vital_goals_updated_at
  BEFORE UPDATE ON public.vital_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
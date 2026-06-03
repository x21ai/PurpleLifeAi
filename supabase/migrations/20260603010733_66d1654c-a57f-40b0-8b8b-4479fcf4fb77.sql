CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.report_metric_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  metric_key text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  hidden boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, metric_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_metric_preferences TO authenticated;
GRANT ALL ON public.report_metric_preferences TO service_role;

ALTER TABLE public.report_metric_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rmp_own_select" ON public.report_metric_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "rmp_own_insert" ON public.report_metric_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rmp_own_update" ON public.report_metric_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rmp_own_delete" ON public.report_metric_preferences FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_rmp_user_order ON public.report_metric_preferences (user_id, sort_order);

CREATE TRIGGER trg_rmp_updated_at BEFORE UPDATE ON public.report_metric_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
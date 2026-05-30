
-- Alarm sound + idle timeout preferences
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS alarm_sound text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_alarm_sound text NOT NULL DEFAULT 'gentle-chime';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS idle_timeout_minutes integer NOT NULL DEFAULT 15;

-- Push subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_subs_own" ON public.push_subscriptions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Metric dictionary (public read, admin-managed)
CREATE TABLE public.metric_dictionary (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_key text NOT NULL UNIQUE,
  display_name text NOT NULL,
  category text NOT NULL,
  default_unit text,
  default_ref_low numeric,
  default_ref_high numeric,
  hints text,
  aliases text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.metric_dictionary TO anon, authenticated;
GRANT ALL ON public.metric_dictionary TO service_role;
ALTER TABLE public.metric_dictionary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "metric_dict_read" ON public.metric_dictionary FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "metric_dict_admin_write" ON public.metric_dictionary FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Report documents
CREATE TABLE public.report_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  report_type text,
  report_date date,
  file_path text NOT NULL,
  file_mime text NOT NULL,
  ocr_text text,
  status text NOT NULL DEFAULT 'processing',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_documents TO authenticated;
GRANT ALL ON public.report_documents TO service_role;
ALTER TABLE public.report_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "report_docs_own" ON public.report_documents FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_report_documents_user ON public.report_documents(user_id, report_date DESC);

-- Report metrics
CREATE TABLE public.report_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES public.report_documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  metric_key text NOT NULL,
  display_name text,
  value numeric,
  value_text text,
  unit text,
  reference_low numeric,
  reference_high numeric,
  flag text,
  measured_at timestamptz,
  user_corrected boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_metrics TO authenticated;
GRANT ALL ON public.report_metrics TO service_role;
ALTER TABLE public.report_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "report_metrics_own" ON public.report_metrics FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_report_metrics_trend ON public.report_metrics(user_id, metric_key, measured_at DESC);

-- PHI access audit log (append-only)
CREATE TABLE public.phi_access_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  ip_address text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}',
  at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.phi_access_log TO authenticated;
GRANT ALL ON public.phi_access_log TO service_role;
ALTER TABLE public.phi_access_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "phi_log_own_select" ON public.phi_access_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "phi_log_actor_insert" ON public.phi_access_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);
CREATE INDEX idx_phi_access_log_user ON public.phi_access_log(user_id, at DESC);

-- Private storage bucket for reports
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "reports_own_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "reports_own_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "reports_own_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "reports_own_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Seed common metric dictionary
INSERT INTO public.metric_dictionary (metric_key, display_name, category, default_unit, default_ref_low, default_ref_high, hints, aliases) VALUES
  ('vitamin_d', 'Vitamin D (25-OH)', 'vitamins', 'ng/mL', 30, 100, 'Low Vitamin D is common and often improves with sunlight exposure and supplementation. Ask your doctor about dosage.', ARRAY['25-hydroxyvitamin d','25(oh)d','vit d']),
  ('vitamin_b12', 'Vitamin B12', 'vitamins', 'pg/mL', 200, 900, 'B12 supports nerve and brain function. Low levels can affect mood and energy.', ARRAY['b12','cobalamin']),
  ('ferritin', 'Ferritin', 'cbc', 'ng/mL', 30, 300, 'Ferritin reflects iron stores. Low ferritin can cause fatigue.', ARRAY['iron stores']),
  ('hemoglobin', 'Hemoglobin', 'cbc', 'g/dL', 12, 17, NULL, ARRAY['hgb','hb']),
  ('hematocrit', 'Hematocrit', 'cbc', '%', 36, 50, NULL, ARRAY['hct']),
  ('wbc', 'White Blood Cells', 'cbc', 'x10^9/L', 4, 11, NULL, ARRAY['white blood cell count']),
  ('platelets', 'Platelets', 'cbc', 'x10^9/L', 150, 400, NULL, ARRAY['plt']),
  ('ldl', 'LDL Cholesterol', 'lipids', 'mg/dL', 0, 100, 'Lower LDL is generally better. Diet, exercise, and medication can lower LDL.', ARRAY['ldl-c','bad cholesterol']),
  ('hdl', 'HDL Cholesterol', 'lipids', 'mg/dL', 40, 100, 'Higher HDL is generally protective.', ARRAY['hdl-c','good cholesterol']),
  ('triglycerides', 'Triglycerides', 'lipids', 'mg/dL', 0, 150, NULL, ARRAY['trig','tg']),
  ('total_cholesterol', 'Total Cholesterol', 'lipids', 'mg/dL', 0, 200, NULL, ARRAY['tc']),
  ('tsh', 'TSH', 'thyroid', 'mIU/L', 0.4, 4.0, 'TSH outside range may indicate thyroid dysfunction.', ARRAY['thyroid stimulating hormone']),
  ('free_t4', 'Free T4', 'thyroid', 'ng/dL', 0.8, 1.8, NULL, ARRAY['ft4']),
  ('free_t3', 'Free T3', 'thyroid', 'pg/mL', 2.3, 4.2, NULL, ARRAY['ft3']),
  ('hba1c', 'HbA1c', 'glucose', '%', 4, 5.6, '5.7-6.4% is prediabetic range; 6.5%+ indicates diabetes. Discuss with your doctor.', ARRAY['a1c','glycated hemoglobin']),
  ('glucose_fasting', 'Fasting Glucose', 'glucose', 'mg/dL', 70, 99, NULL, ARRAY['fasting blood sugar','fbs']),
  ('alt', 'ALT', 'liver', 'U/L', 0, 45, NULL, ARRAY['sgpt','alanine aminotransferase']),
  ('ast', 'AST', 'liver', 'U/L', 0, 40, NULL, ARRAY['sgot','aspartate aminotransferase']),
  ('creatinine', 'Creatinine', 'kidney', 'mg/dL', 0.6, 1.3, NULL, ARRAY[]::text[]),
  ('egfr', 'eGFR', 'kidney', 'mL/min/1.73m2', 60, 200, 'eGFR estimates kidney filtration. Below 60 sustained suggests kidney disease.', ARRAY['estimated gfr']),
  ('crp', 'C-Reactive Protein', 'inflammation', 'mg/L', 0, 3, 'High CRP suggests inflammation. Discuss persistent elevation with your doctor.', ARRAY['c reactive protein']),
  ('magnesium', 'Magnesium', 'minerals', 'mg/dL', 1.7, 2.2, 'Magnesium supports nerve and muscle function. Sometimes relevant for seizure stability.', ARRAY['mg']),
  ('sodium', 'Sodium', 'electrolytes', 'mmol/L', 135, 145, NULL, ARRAY['na']),
  ('potassium', 'Potassium', 'electrolytes', 'mmol/L', 3.5, 5.1, NULL, ARRAY['k'])
ON CONFLICT (metric_key) DO NOTHING;

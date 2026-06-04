
-- 1) metric_dictionary: panel category + SI unit
ALTER TABLE public.metric_dictionary
  ADD COLUMN IF NOT EXISTS panel TEXT,
  ADD COLUMN IF NOT EXISTS unit_si TEXT;

-- Backfill panel for common keys (idempotent; only fills NULLs)
UPDATE public.metric_dictionary SET panel = 'lipids'
  WHERE panel IS NULL AND metric_key IN ('total_cholesterol','ldl','ldl_cholesterol','hdl','hdl_cholesterol','triglycerides','non_hdl','vldl','apo_b','lipoprotein_a');
UPDATE public.metric_dictionary SET panel = 'cardiometabolic'
  WHERE panel IS NULL AND metric_key IN ('glucose','fasting_glucose','hba1c','insulin','homa_ir','c_peptide','blood_pressure_systolic','blood_pressure_diastolic');
UPDATE public.metric_dictionary SET panel = 'thyroid'
  WHERE panel IS NULL AND metric_key IN ('tsh','t3','t4','free_t3','free_t4','reverse_t3','thyroid_antibodies','anti_tpo','anti_tg');
UPDATE public.metric_dictionary SET panel = 'liver'
  WHERE panel IS NULL AND metric_key IN ('alt','ast','alp','ggt','bilirubin','total_bilirubin','direct_bilirubin','albumin','total_protein');
UPDATE public.metric_dictionary SET panel = 'kidney'
  WHERE panel IS NULL AND metric_key IN ('creatinine','egfr','bun','urea','uric_acid','sodium','potassium','chloride','co2','calcium','phosphorus','magnesium');
UPDATE public.metric_dictionary SET panel = 'hematology'
  WHERE panel IS NULL AND metric_key IN ('hemoglobin','hematocrit','wbc','rbc','platelets','mcv','mch','mchc','rdw','neutrophils','lymphocytes','monocytes','eosinophils','basophils','ferritin','iron','tibc','transferrin_saturation');
UPDATE public.metric_dictionary SET panel = 'vitamins'
  WHERE panel IS NULL AND metric_key IN ('vitamin_d','vitamin_b12','b12','folate','vitamin_a','vitamin_e','vitamin_k');
UPDATE public.metric_dictionary SET panel = 'hormones'
  WHERE panel IS NULL AND metric_key IN ('testosterone','free_testosterone','estradiol','progesterone','cortisol','dhea_s','shbg','fsh','lh','prolactin');
UPDATE public.metric_dictionary SET panel = 'inflammation'
  WHERE panel IS NULL AND metric_key IN ('crp','hs_crp','esr','homocysteine');
UPDATE public.metric_dictionary SET panel = 'other'
  WHERE panel IS NULL;

CREATE INDEX IF NOT EXISTS metric_dictionary_panel_idx ON public.metric_dictionary(panel);

-- 2) report_documents: synopsis + panel hints + narrative findings
ALTER TABLE public.report_documents
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS panel_keys TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS findings JSONB,
  ADD COLUMN IF NOT EXISTS impressions JSONB;

-- 3) medical_report_schedules — opt-in monthly auto-send
CREATE TABLE IF NOT EXISTS public.medical_report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cadence TEXT NOT NULL DEFAULT 'monthly',
  day_of_month INTEGER NOT NULL DEFAULT 1 CHECK (day_of_month BETWEEN 1 AND 28),
  window_days INTEGER NOT NULL DEFAULT 30 CHECK (window_days BETWEEN 7 AND 365),
  sections JSONB NOT NULL DEFAULT '{}'::jsonb,
  recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_report_schedules TO authenticated;
GRANT ALL ON public.medical_report_schedules TO service_role;

ALTER TABLE public.medical_report_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their schedules"
  ON public.medical_report_schedules FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_medical_report_schedules_updated_at
  BEFORE UPDATE ON public.medical_report_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS medical_report_schedules_user_active_idx
  ON public.medical_report_schedules(user_id, active);

-- 4) medical_report_public_links — clinician share links
CREATE TABLE IF NOT EXISTS public.medical_report_public_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.medical_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  viewer_label TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  opened_count INTEGER NOT NULL DEFAULT 0,
  last_opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_report_public_links TO authenticated;
GRANT ALL ON public.medical_report_public_links TO service_role;

ALTER TABLE public.medical_report_public_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their share links"
  ON public.medical_report_public_links FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS medical_report_public_links_token_idx
  ON public.medical_report_public_links(token);
CREATE INDEX IF NOT EXISTS medical_report_public_links_user_idx
  ON public.medical_report_public_links(user_id, created_at DESC);

-- Add report_category column for Health Records hub categorization.
ALTER TABLE public.report_documents
  ADD COLUMN IF NOT EXISTS report_category text;

CREATE INDEX IF NOT EXISTS report_documents_user_category_idx
  ON public.report_documents (user_id, report_category);

-- Backfill existing rows from report_type + title using simple keyword rules.
UPDATE public.report_documents
SET report_category = CASE
  WHEN report_type IN ('imaging_mri') THEN 'mri'
  WHEN report_type IN ('imaging_ct') THEN 'ct'
  WHEN report_type IN ('imaging_xray') THEN 'xray'
  WHEN report_type IN ('imaging_ultrasound') THEN 'ultrasound'
  WHEN report_type IN ('blood_panel','lipid_panel','thyroid_panel','metabolic_panel','vitamin_panel','hormone_panel') THEN 'blood'
  WHEN lower(coalesce(title,'')) ~ '\m(mri)\M' THEN 'mri'
  WHEN lower(coalesce(title,'')) ~ '\m(ct|cat scan)\M' THEN 'ct'
  WHEN lower(coalesce(title,'')) ~ '\m(x[- ]?ray|xray|radiograph)\M' THEN 'xray'
  WHEN lower(coalesce(title,'')) ~ '\m(ultrasound|sonogram|echo)\M' THEN 'ultrasound'
  WHEN lower(coalesce(title,'')) ~ '\m(ecg|ekg|holter|cardiac)\M' THEN 'cardiology'
  WHEN lower(coalesce(title,'')) ~ '\m(biopsy|pathology|cytology|histology)\M' THEN 'pathology'
  WHEN lower(coalesce(title,'')) ~ '\m(prescription|discharge|referral|note|consult)\M' THEN 'notes'
  WHEN lower(coalesce(title,'')) ~ '\m(cbc|lipid|panel|glucose|iron|vitamin|thyroid|tsh|metabolic|hormone|blood)\M' THEN 'blood'
  ELSE 'other'
END
WHERE report_category IS NULL;
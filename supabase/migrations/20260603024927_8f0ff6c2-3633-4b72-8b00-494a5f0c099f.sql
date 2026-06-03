ALTER TABLE public.care_relationships
ADD COLUMN IF NOT EXISTS caregiver_hidden_features jsonb NOT NULL DEFAULT '[]'::jsonb;
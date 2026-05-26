
CREATE TABLE public.behavior_taxonomy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('drugs_medication','health_symptoms','hormonal_health','lifestyle','mental_wellbeing','nutrition','recovery','sleep_circadian','supplements','epilepsy_specific')),
  behavior_key text UNIQUE NOT NULL,
  behavior_label text NOT NULL,
  prompt_example text NOT NULL,
  data_type text NOT NULL CHECK (data_type IN ('boolean','count','numeric','scale_1_10','time_of_day','duration_minutes','text')),
  unit text,
  aliases text[] NOT NULL DEFAULT ARRAY[]::text[],
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.behavior_taxonomy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "behavior_taxonomy_public_read"
  ON public.behavior_taxonomy FOR SELECT
  USING (true);

CREATE INDEX idx_behavior_taxonomy_category ON public.behavior_taxonomy(category);

CREATE TABLE public.daily_behaviors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journal_entry_id uuid REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  date date NOT NULL,
  behavior_key text NOT NULL REFERENCES public.behavior_taxonomy(behavior_key) ON UPDATE CASCADE,
  value jsonb NOT NULL,
  extraction_confidence numeric CHECK (extraction_confidence IS NULL OR (extraction_confidence >= 0 AND extraction_confidence <= 1)),
  user_corrected boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date, behavior_key)
);

ALTER TABLE public.daily_behaviors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_behaviors_all_own"
  ON public.daily_behaviors FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_daily_behaviors_user_date ON public.daily_behaviors(user_id, date DESC);
CREATE INDEX idx_daily_behaviors_behavior_key ON public.daily_behaviors(behavior_key);

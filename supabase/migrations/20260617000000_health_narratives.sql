-- Daily-cached AI health narrative for the My Health hero.
-- One row per user per day so the model is called at most once a day per user.
CREATE TABLE IF NOT EXISTS public.health_narratives (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  narrative TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day)
);

ALTER TABLE public.health_narratives ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.health_narratives TO service_role;

DO $$ BEGIN
  CREATE POLICY "Users read own health narrative"
    ON public.health_narratives FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users insert own health narrative"
    ON public.health_narratives FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users update own health narrative"
    ON public.health_narratives FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

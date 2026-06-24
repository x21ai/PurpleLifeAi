
-- 1. sync_mode on wearable token tables
ALTER TABLE public.oura_tokens
  ADD COLUMN IF NOT EXISTS sync_mode text NOT NULL DEFAULT 'visit';
ALTER TABLE public.whoop_tokens
  ADD COLUMN IF NOT EXISTS sync_mode text NOT NULL DEFAULT 'visit';

-- 2. health_narratives cache table
CREATE TABLE IF NOT EXISTS public.health_narratives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL,
  narrative text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_narratives TO authenticated;
GRANT ALL ON public.health_narratives TO service_role;

ALTER TABLE public.health_narratives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own health narratives"
  ON public.health_narratives
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER health_narratives_set_updated_at
  BEFORE UPDATE ON public.health_narratives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

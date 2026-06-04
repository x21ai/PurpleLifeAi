
-- Allow apple_health source
ALTER TABLE public.biometrics DROP CONSTRAINT IF EXISTS biometrics_source_check;
ALTER TABLE public.biometrics ADD CONSTRAINT biometrics_source_check
  CHECK (source = ANY (ARRAY['oura'::text, 'whoop'::text, 'apple_health'::text, 'manual'::text, 'computed'::text]));

-- New metric column
ALTER TABLE public.biometrics ADD COLUMN IF NOT EXISTS vo2_max numeric;

-- Tokens / per-user webhook secret
CREATE TABLE IF NOT EXISTS public.apple_health_tokens (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  webhook_secret text NOT NULL,
  last_sync_at timestamptz,
  last_webhook_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.apple_health_tokens TO authenticated;
GRANT ALL ON public.apple_health_tokens TO service_role;

ALTER TABLE public.apple_health_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "apple_health_tokens_own"
  ON public.apple_health_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_apple_health_tokens_updated_at ON public.apple_health_tokens;
CREATE TRIGGER update_apple_health_tokens_updated_at
  BEFORE UPDATE ON public.apple_health_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Quick lookup by secret for webhook auth
CREATE UNIQUE INDEX IF NOT EXISTS apple_health_tokens_secret_idx
  ON public.apple_health_tokens(webhook_secret);

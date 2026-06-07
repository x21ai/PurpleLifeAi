ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_provider text NOT NULL DEFAULT 'claude';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_ai_provider_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_ai_provider_check
  CHECK (ai_provider IN ('claude','openai','gemini','grok','maya','lovable'));
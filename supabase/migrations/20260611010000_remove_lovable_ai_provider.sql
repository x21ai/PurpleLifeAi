-- The Lovable AI Gateway provider option was removed; Anthropic Claude is the
-- platform default. Migrate any stored 'lovable' preference and tighten the
-- CHECK constraint to the remaining providers.

UPDATE public.profiles
  SET ai_provider = 'claude'
  WHERE ai_provider = 'lovable';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_ai_provider_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_ai_provider_check
  CHECK (ai_provider IN ('claude','openai','gemini','grok','maya'));

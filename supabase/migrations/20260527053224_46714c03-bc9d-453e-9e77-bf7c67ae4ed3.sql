ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_model_preference text NOT NULL DEFAULT 'gemini-flash',
  ADD COLUMN IF NOT EXISTS floating_ask_enabled boolean NOT NULL DEFAULT true;
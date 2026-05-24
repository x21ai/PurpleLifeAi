ALTER TABLE public.oura_tokens
ADD COLUMN IF NOT EXISTS sync_interval_hours smallint NOT NULL DEFAULT 12
CHECK (sync_interval_hours IN (0, 1, 6, 12, 24));
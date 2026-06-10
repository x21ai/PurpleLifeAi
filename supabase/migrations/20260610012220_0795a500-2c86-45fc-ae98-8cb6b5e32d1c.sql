ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_nudge_dismissed_at timestamptz;

ALTER TABLE public.friendships
  ADD COLUMN IF NOT EXISTS share_basics boolean NOT NULL DEFAULT false;
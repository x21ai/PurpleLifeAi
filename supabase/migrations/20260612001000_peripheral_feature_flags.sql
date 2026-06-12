-- Dark-launch flags for peripheral surfaces graded B/C in docs/LAUNCH-AUDIT.md.
-- Same pattern as pro_free_for_everyone: columns on the app_settings singleton,
-- readable by everyone, writable by super admins.

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS feature_community_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_dna_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_friends_enabled boolean NOT NULL DEFAULT false;

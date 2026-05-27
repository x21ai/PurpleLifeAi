DELETE FROM public.daily_behaviors a
USING public.daily_behaviors b
WHERE a.ctid < b.ctid
  AND a.user_id = b.user_id
  AND a.journal_entry_id = b.journal_entry_id
  AND a.behavior_key = b.behavior_key
  AND a.journal_entry_id IS NOT NULL;

ALTER TABLE public.daily_behaviors
  ADD CONSTRAINT daily_behaviors_user_entry_key_uniq
  UNIQUE (user_id, journal_entry_id, behavior_key);
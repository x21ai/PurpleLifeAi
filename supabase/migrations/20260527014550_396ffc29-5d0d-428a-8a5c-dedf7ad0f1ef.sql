ALTER TABLE public.journal_entries ADD COLUMN archived_at timestamptz;
CREATE INDEX journal_entries_user_archived_idx ON public.journal_entries (user_id, archived_at);
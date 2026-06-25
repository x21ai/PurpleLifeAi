alter table public.hydration_intake add column if not exists journal_entry_id uuid references public.journal_entries(id) on delete cascade;
alter table public.vitals_log       add column if not exists journal_entry_id uuid references public.journal_entries(id) on delete cascade;
alter table public.food_entries     add column if not exists journal_entry_id uuid references public.journal_entries(id) on delete cascade;
create index if not exists hydration_intake_journal_idx on public.hydration_intake(journal_entry_id);
create index if not exists vitals_log_journal_idx       on public.vitals_log(journal_entry_id);
create index if not exists food_entries_journal_idx     on public.food_entries(journal_entry_id);
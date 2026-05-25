-- Workstream B: medications, supplements, side effects tracking
alter table public.medications
  add column if not exists kind text not null default 'medication'
    check (kind in ('medication','supplement','vitamin','herbal','rescue')),
  add column if not exists dosage_form text
    check (dosage_form in ('pill','capsule','tablet','liquid','injection','drops','patch','inhaler','powder','gummy','other')),
  add column if not exists dosage_amount numeric,
  add column if not exists dosage_unit text,
  add column if not exists with_food boolean default false,
  add column if not exists refill_threshold int default 7,
  add column if not exists prescriber_name text,
  add column if not exists pharmacy_name text,
  add column if not exists prescription_number text,
  add column if not exists side_effects_tracked text[] default array[]::text[];

-- Backfill kind from legacy is_rescue flag
update public.medications
set kind = 'rescue'
where is_rescue = true and kind = 'medication';

-- Copy legacy prescriber into prescriber_name when empty
update public.medications
set prescriber_name = prescriber
where prescriber_name is null and prescriber is not null;

create table if not exists public.medication_side_effects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete cascade,
  side_effect text not null,
  severity int check (severity between 1 and 10),
  noted_at timestamptz default now() not null
);

alter table public.medication_side_effects enable row level security;

create policy "side_effects_owner" on public.medication_side_effects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists medication_side_effects_med_idx
  on public.medication_side_effects (medication_id, noted_at desc);

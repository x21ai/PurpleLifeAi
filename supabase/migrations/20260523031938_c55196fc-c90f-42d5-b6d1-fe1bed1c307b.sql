
-- =========================================================================
-- PROFILES
-- =========================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  date_of_birth date,
  diagnosis text,
  timezone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  consent_research boolean not null default false,
  consent_share_with_caregivers boolean not null default false,
  caregiver_emails text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

-- =========================================================================
-- SEIZURE EVENTS
-- =========================================================================
create table public.seizure_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer,
  type text,
  witnessed boolean not null default false,
  witness_name text,
  location_lat double precision,
  location_lng double precision,
  recovery_minutes integer,
  rescue_med_given boolean not null default false,
  rescue_med_name text,
  injury boolean not null default false,
  injury_description text,
  severity smallint check (severity is null or (severity between 1 and 10)),
  video_url text,
  photo_urls text[] not null default '{}',
  notes text,
  auto_detected boolean not null default false,
  detection_source text,
  pre_ictal_snapshot jsonb,
  created_at timestamptz not null default now()
);
alter table public.seizure_events enable row level security;
create policy "seizure_events_all_own" on public.seizure_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index seizure_events_user_started_idx on public.seizure_events (user_id, started_at desc);

-- =========================================================================
-- MEDICATIONS
-- =========================================================================
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  dosage text,
  prescriber text,
  times_of_day text[] not null default '{}',
  start_date date,
  end_date date,
  refill_date date,
  pills_remaining integer,
  notes text,
  is_rescue boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.medications enable row level security;
create policy "medications_all_own" on public.medications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index medications_user_active_idx on public.medications (user_id, active);

-- =========================================================================
-- MEDICATION DOSES
-- =========================================================================
create table public.medication_doses (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  scheduled_at timestamptz not null,
  taken_at timestamptz,
  status text not null default 'pending' check (status in ('pending','taken','missed','skipped')),
  notes text,
  created_at timestamptz not null default now()
);
alter table public.medication_doses enable row level security;
create policy "medication_doses_all_own" on public.medication_doses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index medication_doses_user_scheduled_idx on public.medication_doses (user_id, scheduled_at);

-- =========================================================================
-- JOURNAL ENTRIES
-- =========================================================================
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  captured_at timestamptz not null default now(),
  kind text not null default 'text' check (kind in ('text','voice','photo','video','mixed')),
  status text not null default 'processing' check (status in ('processing','processed','failed')),
  text text,
  voice_transcript text,
  media_urls text[] not null default '{}',
  ai_summary text,
  ai_tags text[] not null default '{}',
  ai_extracted jsonb,
  linked_seizure_id uuid references public.seizure_events(id) on delete set null,
  linked_medication_dose_id uuid references public.medication_doses(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.journal_entries enable row level security;
create policy "journal_entries_all_own" on public.journal_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index journal_entries_user_captured_idx on public.journal_entries (user_id, captured_at desc);

-- =========================================================================
-- BIOMETRICS
-- =========================================================================
create table public.biometrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recorded_at timestamptz not null,
  source text not null check (source in ('oura','whoop','manual','computed')),
  hr_bpm numeric,
  hrv_rmssd_ms numeric,
  hrv_sdnn_ms numeric,
  resting_hr_bpm numeric,
  spo2_pct numeric,
  respiratory_rate_bpm numeric,
  body_temp_deviation_c numeric,
  skin_temp_c numeric,
  sleep_total_min numeric,
  sleep_rem_min numeric,
  sleep_deep_min numeric,
  sleep_light_min numeric,
  sleep_awake_min numeric,
  sleep_latency_min numeric,
  sleep_efficiency_pct numeric,
  sleep_score numeric,
  oura_readiness_score numeric,
  oura_stress_score numeric,
  oura_resilience_level text,
  oura_activity_score numeric,
  whoop_recovery_pct numeric,
  whoop_strain numeric,
  whoop_sleep_performance_pct numeric,
  menstrual_phase text,
  cycle_day integer,
  steps integer,
  active_calories numeric,
  workout_minutes numeric,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);
alter table public.biometrics enable row level security;
create policy "biometrics_all_own" on public.biometrics for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index biometrics_user_recorded_idx on public.biometrics (user_id, recorded_at desc);

-- =========================================================================
-- OURA TOKENS
-- =========================================================================
create table public.oura_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  token_type text,
  expires_at timestamptz,
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.oura_tokens enable row level security;
create policy "oura_tokens_all_own" on public.oura_tokens for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================================
-- WHOOP TOKENS
-- =========================================================================
create table public.whoop_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  token_type text,
  expires_at timestamptz,
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.whoop_tokens enable row level security;
create policy "whoop_tokens_all_own" on public.whoop_tokens for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================================
-- RISK FORECASTS
-- =========================================================================
create table public.risk_forecasts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  for_date date not null,
  risk_score smallint not null check (risk_score between 0 and 100),
  band text not null check (band in ('low','moderate','elevated','high')),
  top_factors jsonb,
  ai_narrative text,
  model_version text,
  computed_at timestamptz not null default now(),
  unique (user_id, for_date)
);
alter table public.risk_forecasts enable row level security;
create policy "risk_forecasts_all_own" on public.risk_forecasts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index risk_forecasts_user_date_idx on public.risk_forecasts (user_id, for_date desc);

-- =========================================================================
-- ALERTS
-- =========================================================================
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  severity text not null default 'info' check (severity in ('info','attention','urgent')),
  title text not null,
  body text,
  acknowledged boolean not null default false,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.alerts enable row level security;
create policy "alerts_all_own" on public.alerts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index alerts_user_unack_idx on public.alerts (user_id, created_at desc) where acknowledged = false;

-- =========================================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- STORAGE: private bucket + per-user folder policies
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('journal-media', 'journal-media', false)
on conflict (id) do nothing;

create policy "journal_media_select_own"
on storage.objects for select to authenticated
using (
  bucket_id = 'journal-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "journal_media_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'journal-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "journal_media_update_own"
on storage.objects for update to authenticated
using (
  bucket_id = 'journal-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'journal-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "journal_media_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'journal-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

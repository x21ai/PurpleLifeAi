-- Consolidated Purple schema. Generated 2026-06-15T00:21:29Z
-- Run with: psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 -f 01-schema.sql

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists vector;
create extension if not exists pgmq;


-- === 20260523031938_c55196fc-c90f-42d5-b6d1-fe1bed1c307b.sql ===

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

-- === 20260523031955_b8d29471-642f-4b14-adb1-8c13d862aef2.sql ===

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- === 20260523032649_b9be34a7-f8cc-40ea-aac0-ce8267c32225.sql ===
ALTER TABLE public.journal_entries REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.journal_entries;
-- === 20260523081851_fdbd4c1c-974c-4ffe-baeb-fc4ee9cd0cee.sql ===

create extension if not exists vector;

create table if not exists public.ai_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  source_table text not null,
  source_id uuid not null,
  recorded_at timestamptz not null default now(),
  content text not null,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (source_table, source_id)
);

create index if not exists ai_memory_user_id_idx on public.ai_memory (user_id);
create index if not exists ai_memory_recorded_at_idx on public.ai_memory (recorded_at desc);
create index if not exists ai_memory_embedding_idx
  on public.ai_memory using hnsw (embedding vector_cosine_ops);

alter table public.ai_memory enable row level security;

create policy ai_memory_all_own on public.ai_memory
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.match_ai_memory(
  query_embedding vector(1536),
  match_user_id uuid,
  days_back int default 90,
  match_count int default 8
)
returns table (
  id uuid,
  source_table text,
  source_id uuid,
  recorded_at timestamptz,
  content text,
  similarity float
)
language sql stable
security definer
set search_path = public
as $$
  select
    m.id,
    m.source_table,
    m.source_id,
    m.recorded_at,
    m.content,
    1 - (m.embedding <=> query_embedding) as similarity
  from public.ai_memory m
  where m.user_id = match_user_id
    and m.embedding is not null
    and m.recorded_at >= now() - make_interval(days => days_back)
  order by m.embedding <=> query_embedding
  limit match_count;
$$;

-- === 20260523081909_53af920d-8a72-4fe7-99e0-6332569bdf6b.sql ===

revoke execute on function public.match_ai_memory(vector, uuid, int, int) from public;
revoke execute on function public.match_ai_memory(vector, uuid, int, int) from anon;
revoke execute on function public.match_ai_memory(vector, uuid, int, int) from authenticated;

-- === 20260523111655_028423e8-a70d-46b7-b502-57c513489b9b.sql ===

-- Seed today's medication_doses rows and reconcile yesterday's misses.
create or replace function public.seed_daily_medication_doses()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  med record;
  t text;
  scheduled timestamptz;
begin
  -- Mark previous still-pending doses as missed.
  update public.medication_doses
  set status = 'missed'
  where status = 'pending'
    and scheduled_at < date_trunc('day', now());

  for med in
    select id, user_id, times_of_day, start_date, end_date
    from public.medications
    where active = true
      and is_rescue = false
      and (start_date is null or start_date <= current_date)
      and (end_date is null or end_date >= current_date)
  loop
    if med.times_of_day is null then continue; end if;
    foreach t in array med.times_of_day
    loop
      begin
        scheduled := (current_date::text || ' ' || t)::timestamptz;
      exception when others then
        continue;
      end;

      insert into public.medication_doses (user_id, medication_id, scheduled_at, status)
      select med.user_id, med.id, scheduled, 'pending'
      where not exists (
        select 1 from public.medication_doses d
        where d.medication_id = med.id
          and d.scheduled_at = scheduled
      );
    end loop;
  end loop;
end;
$$;

-- Adherence over the last N days for a single medication.
create or replace function public.medication_adherence(med_id uuid, days_back integer default 14)
returns table(scheduled_count bigint, taken_count bigint, adherence_pct numeric)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*)::bigint as scheduled_count,
    count(*) filter (where status = 'taken')::bigint as taken_count,
    case when count(*) = 0 then 0
         else round((count(*) filter (where status = 'taken'))::numeric * 100 / count(*), 0)
    end as adherence_pct
  from public.medication_doses d
  where d.medication_id = med_id
    and d.scheduled_at >= now() - make_interval(days => days_back)
    and d.scheduled_at < now() + interval '1 day';
$$;

-- === 20260523111720_20a9100a-6745-44e3-ad71-26c1f26c6835.sql ===

-- Seed routine is only ever invoked by the scheduled job; lock public access.
revoke execute on function public.seed_daily_medication_doses() from public, anon, authenticated;

-- Adherence helper should run as the caller so existing RLS applies.
create or replace function public.medication_adherence(med_id uuid, days_back integer default 14)
returns table(scheduled_count bigint, taken_count bigint, adherence_pct numeric)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*)::bigint as scheduled_count,
    count(*) filter (where status = 'taken')::bigint as taken_count,
    case when count(*) = 0 then 0
         else round((count(*) filter (where status = 'taken'))::numeric * 100 / count(*), 0)
    end as adherence_pct
  from public.medication_doses d
  where d.medication_id = med_id
    and d.scheduled_at >= now() - make_interval(days => days_back)
    and d.scheduled_at < now() + interval '1 day';
$$;

-- === 20260524015024_d598ed75-5326-4ab5-8655-f2a5c909586d.sql ===
-- Restrict Realtime channel access to topics that end with the authenticated user's ID.
-- Wrapped in DO block because realtime.messages may not exist on every project version.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'realtime' AND c.relname = 'messages'
  ) THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Users can only access their own realtime channels" ON realtime.messages';
    EXECUTE $p$
      CREATE POLICY "Users can only access their own realtime channels"
      ON realtime.messages
      FOR SELECT
      TO authenticated
      USING ( realtime.topic() LIKE '%' || (auth.uid())::text )
    $p$;

    EXECUTE 'DROP POLICY IF EXISTS "Users can only broadcast on their own realtime channels" ON realtime.messages';
    EXECUTE $p$
      CREATE POLICY "Users can only broadcast on their own realtime channels"
      ON realtime.messages
      FOR INSERT
      TO authenticated
      WITH CHECK ( realtime.topic() LIKE '%' || (auth.uid())::text )
    $p$;
  END IF;
END
$$;
-- === 20260524022536_4c29ef19-2e45-49cc-914a-9f92fb0a1000.sql ===
CREATE UNIQUE INDEX IF NOT EXISTS risk_forecasts_user_for_date_uniq
  ON public.risk_forecasts (user_id, for_date);
-- === 20260524075249_e73e2cfe-adf0-4ae7-9bbb-d1256ea1f3e5.sql ===
ALTER TABLE public.oura_tokens
ADD COLUMN IF NOT EXISTS sync_interval_hours smallint NOT NULL DEFAULT 12
CHECK (sync_interval_hours IN (0, 1, 6, 12, 24));
-- === 20260524102829_c29fc111-402b-47ce-96aa-0c673a4a6029.sql ===
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;
-- === 20260525033739_592424d4-7e71-4370-8fb0-f93e9504d8d1.sql ===

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

update public.medications
set kind = 'rescue'
where is_rescue = true and kind = 'medication';

update public.medications
set prescriber_name = prescriber
where prescriber_name is null and prescriber is not null;

create table if not exists public.medication_side_effects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
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

-- Research library
create table if not exists public.research_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  authors text,
  publication text,
  year int,
  url text not null,
  source_type text check (source_type in ('peer_review','guideline','foundation','government','review')),
  evidence_grade text check (evidence_grade in ('A','B','C','expert')),
  abstract text not null,
  content text not null,
  embedding vector(1536),
  created_at timestamptz default now() not null
);

create unique index if not exists research_sources_url_idx on public.research_sources (url);

create index if not exists research_sources_embedding_idx on public.research_sources
  using hnsw (embedding vector_cosine_ops);

alter table public.research_sources enable row level security;

create policy "research_public_read" on public.research_sources
  for select using (true);

create or replace function public.match_research_library(
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  id uuid,
  title text,
  authors text,
  publication text,
  year int,
  url text,
  source_type text,
  evidence_grade text,
  abstract text,
  content text,
  similarity float
)
language sql stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.title,
    r.authors,
    r.publication,
    r.year,
    r.url,
    r.source_type,
    r.evidence_grade,
    r.abstract,
    r.content,
    1 - (r.embedding <=> query_embedding) as similarity
  from public.research_sources r
  where r.embedding is not null
  order by r.embedding <=> query_embedding
  limit match_count;
$$;

revoke execute on function public.match_research_library(vector, int) from public;
revoke execute on function public.match_research_library(vector, int) from anon;
revoke execute on function public.match_research_library(vector, int) from authenticated;

-- === 20260525040727_7cf4943b-536f-480d-b900-497690f468d2.sql ===
-- Enable RLS on realtime.messages and restrict topic access to channels ending with the user's own ID
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "realtime_own_topic_select" ON realtime.messages;
DROP POLICY IF EXISTS "realtime_own_topic_insert" ON realtime.messages;

CREATE POLICY "realtime_own_topic_select"
ON realtime.messages
FOR SELECT
TO authenticated
USING (realtime.topic() LIKE '%' || auth.uid()::text);

CREATE POLICY "realtime_own_topic_insert"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (realtime.topic() LIKE '%' || auth.uid()::text);
-- === 20260525120000_meds_supplements_and_side_effects.sql ===
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

-- === 20260525140000_research_sources.sql ===
create table if not exists public.research_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  authors text,
  publication text,
  year int,
  url text not null,
  source_type text check (source_type in ('peer_review','guideline','foundation','government','review')),
  evidence_grade text check (evidence_grade in ('A','B','C','expert')),
  abstract text not null,
  content text not null,
  embedding vector(1536),
  created_at timestamptz default now() not null
);

create unique index if not exists research_sources_url_idx on public.research_sources (url);

-- HNSW works with small seed sizes; ivfflat needs substantially more rows than lists.
create index if not exists research_sources_embedding_idx on public.research_sources
  using hnsw (embedding vector_cosine_ops);

alter table public.research_sources enable row level security;

create policy "research_public_read" on public.research_sources
  for select using (true);

create or replace function public.match_research_library(
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  id uuid,
  title text,
  authors text,
  publication text,
  year int,
  url text,
  source_type text,
  evidence_grade text,
  abstract text,
  content text,
  similarity float
)
language sql stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.title,
    r.authors,
    r.publication,
    r.year,
    r.url,
    r.source_type,
    r.evidence_grade,
    r.abstract,
    r.content,
    1 - (r.embedding <=> query_embedding) as similarity
  from public.research_sources r
  where r.embedding is not null
  order by r.embedding <=> query_embedding
  limit match_count;
$$;

revoke execute on function public.match_research_library(vector, int) from public;
revoke execute on function public.match_research_library(vector, int) from anon;
revoke execute on function public.match_research_library(vector, int) from authenticated;

-- === 20260526010923_2b27aade-c466-414a-a726-767ce55da7f5.sql ===

CREATE TABLE public.behavior_taxonomy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('drugs_medication','health_symptoms','hormonal_health','lifestyle','mental_wellbeing','nutrition','recovery','sleep_circadian','supplements','epilepsy_specific')),
  behavior_key text UNIQUE NOT NULL,
  behavior_label text NOT NULL,
  prompt_example text NOT NULL,
  data_type text NOT NULL CHECK (data_type IN ('boolean','count','numeric','scale_1_10','time_of_day','duration_minutes','text')),
  unit text,
  aliases text[] NOT NULL DEFAULT ARRAY[]::text[],
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.behavior_taxonomy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "behavior_taxonomy_public_read"
  ON public.behavior_taxonomy FOR SELECT
  USING (true);

CREATE INDEX idx_behavior_taxonomy_category ON public.behavior_taxonomy(category);

CREATE TABLE public.daily_behaviors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journal_entry_id uuid REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  date date NOT NULL,
  behavior_key text NOT NULL REFERENCES public.behavior_taxonomy(behavior_key) ON UPDATE CASCADE,
  value jsonb NOT NULL,
  extraction_confidence numeric CHECK (extraction_confidence IS NULL OR (extraction_confidence >= 0 AND extraction_confidence <= 1)),
  user_corrected boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date, behavior_key)
);

ALTER TABLE public.daily_behaviors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_behaviors_all_own"
  ON public.daily_behaviors FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_daily_behaviors_user_date ON public.daily_behaviors(user_id, date DESC);
CREATE INDEX idx_daily_behaviors_behavior_key ON public.daily_behaviors(behavior_key);

-- === 20260526074450_0168c10d-7c60-4bb5-a3d7-ba9581570afe.sql ===

ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS schedule jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.medication_doses
  ADD COLUMN IF NOT EXISTS amount numeric,
  ADD COLUMN IF NOT EXISTS unit text;

-- Backfill schedule from existing times_of_day + dosage_amount + dosage_unit
UPDATE public.medications m
SET schedule = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'time', t,
        'amount', m.dosage_amount,
        'unit', COALESCE(m.dosage_unit, 'mg')
      )
      ORDER BY t
    ),
    '[]'::jsonb
  )
  FROM unnest(COALESCE(m.times_of_day, ARRAY[]::text[])) AS t
)
WHERE jsonb_array_length(m.schedule) = 0
  AND COALESCE(array_length(m.times_of_day, 1), 0) > 0;

-- Replace seed_daily_medication_doses to populate amount/unit per scheduled time
CREATE OR REPLACE FUNCTION public.seed_daily_medication_doses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  med record;
  slot jsonb;
  scheduled timestamptz;
  t text;
  amt numeric;
  un text;
begin
  update public.medication_doses
  set status = 'missed'
  where status = 'pending'
    and scheduled_at < date_trunc('day', now());

  for med in
    select id, user_id, times_of_day, schedule, dosage_amount, dosage_unit, start_date, end_date
    from public.medications
    where active = true
      and is_rescue = false
      and (start_date is null or start_date <= current_date)
      and (end_date is null or end_date >= current_date)
  loop
    if jsonb_array_length(coalesce(med.schedule, '[]'::jsonb)) > 0 then
      for slot in select * from jsonb_array_elements(med.schedule)
      loop
        t := slot->>'time';
        if t is null or t !~ '^\d{1,2}:\d{2}$' then continue; end if;
        begin
          scheduled := (current_date::text || ' ' || t)::timestamptz;
        exception when others then
          continue;
        end;
        amt := nullif(slot->>'amount','')::numeric;
        un := nullif(slot->>'unit','');
        insert into public.medication_doses (user_id, medication_id, scheduled_at, status, amount, unit)
        select med.user_id, med.id, scheduled, 'pending', amt, un
        where not exists (
          select 1 from public.medication_doses d
          where d.medication_id = med.id and d.scheduled_at = scheduled
        );
      end loop;
    else
      if med.times_of_day is null then continue; end if;
      foreach t in array med.times_of_day
      loop
        begin
          scheduled := (current_date::text || ' ' || t)::timestamptz;
        exception when others then
          continue;
        end;
        insert into public.medication_doses (user_id, medication_id, scheduled_at, status, amount, unit)
        select med.user_id, med.id, scheduled, 'pending', med.dosage_amount, med.dosage_unit
        where not exists (
          select 1 from public.medication_doses d
          where d.medication_id = med.id and d.scheduled_at = scheduled
        );
      end loop;
    end if;
  end loop;
end;
$function$;

-- === 20260527013214_68a4226a-085a-4448-9a59-f7b8a98af6a0.sql ===
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
-- === 20260527014550_396ffc29-5d0d-428a-8a5c-dedf7ad0f1ef.sql ===
ALTER TABLE public.journal_entries ADD COLUMN archived_at timestamptz;
CREATE INDEX journal_entries_user_archived_idx ON public.journal_entries (user_id, archived_at);
-- === 20260527053224_46714c03-bc9d-453e-9e77-bf7c67ae4ed3.sql ===
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_model_preference text NOT NULL DEFAULT 'gemini-flash',
  ADD COLUMN IF NOT EXISTS floating_ask_enabled boolean NOT NULL DEFAULT true;
-- === 20260527064252_c1766b54-350b-4167-98de-37f795f63002.sql ===

-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'super_admin');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin')
$$;

CREATE POLICY "user_roles_super_admin_all" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Seed first super admin if they already exist
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role FROM auth.users WHERE email = 'pmt@eigital.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Extend handle_new_user to auto-assign super_admin for that email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (new.id) ON CONFLICT (id) DO NOTHING;
  IF new.email = 'pmt@eigital.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN new;
END;
$$;

-- ============ PROFILES ADDITIONS (community fields) ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS community_display_name TEXT,
  ADD COLUMN IF NOT EXISTS community_bio TEXT,
  ADD COLUMN IF NOT EXISTS community_opted_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

-- Allow anyone (including anon for SEO) to read public community profile fields when opted in
CREATE POLICY "profiles_public_community_read" ON public.profiles
  FOR SELECT TO anon, authenticated USING (community_opted_in = true);

GRANT SELECT ON public.profiles TO anon;

-- ============ ADMIN: CONTACT MESSAGES ============
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  handled BOOLEAN NOT NULL DEFAULT false,
  handled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  handled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_messages_insert_any" ON public.contact_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "contact_messages_admin_all" ON public.contact_messages
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- ============ ADMIN: FEEDBACK ============
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.feedback TO authenticated;
GRANT UPDATE ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_insert_own" ON public.feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feedback_select_own_or_admin" ON public.feedback
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "feedback_admin_update" ON public.feedback
  FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- ============ ADMIN: BROADCAST MESSAGES ============
CREATE TABLE public.admin_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_broadcast BOOLEAN NOT NULL DEFAULT false,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_messages TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.admin_messages TO authenticated;
GRANT ALL ON public.admin_messages TO service_role;

ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_messages_select" ON public.admin_messages
  FOR SELECT TO authenticated
  USING (
    is_broadcast = true
    OR recipient_id = auth.uid()
    OR sender_id = auth.uid()
    OR public.is_super_admin(auth.uid())
  );
CREATE POLICY "admin_messages_admin_write" ON public.admin_messages
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_messages_admin_modify" ON public.admin_messages
  FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()));
CREATE POLICY "admin_messages_admin_delete" ON public.admin_messages
  FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE TABLE public.admin_message_reads (
  message_id UUID NOT NULL REFERENCES public.admin_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);
GRANT SELECT, INSERT ON public.admin_message_reads TO authenticated;
GRANT ALL ON public.admin_message_reads TO service_role;
ALTER TABLE public.admin_message_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_message_reads_own" ON public.admin_message_reads
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ COMMUNITY ============
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  hidden BOOLEAN NOT NULL DEFAULT false,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_community_posts_created ON public.community_posts (created_at DESC);
CREATE INDEX idx_community_posts_topic ON public.community_posts (topic);

GRANT SELECT ON public.community_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT ALL ON public.community_posts TO service_role;

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_posts_public_read" ON public.community_posts
  FOR SELECT TO anon, authenticated USING (hidden = false);
CREATE POLICY "community_posts_admin_read_all" ON public.community_posts
  FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "community_posts_insert_own" ON public.community_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "community_posts_update_own" ON public.community_posts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "community_posts_delete_own_or_admin" ON public.community_posts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "community_posts_admin_update" ON public.community_posts
  FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.community_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_community_comments_post ON public.community_comments (post_id, created_at);

GRANT SELECT ON public.community_comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.community_comments TO authenticated;
GRANT ALL ON public.community_comments TO service_role;

ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_comments_public_read" ON public.community_comments
  FOR SELECT TO anon, authenticated USING (hidden = false);
CREATE POLICY "community_comments_insert_own" ON public.community_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "community_comments_modify_own_or_admin" ON public.community_comments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "community_comments_delete_own_or_admin" ON public.community_comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.community_reactions (
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('heart','hug','helpful')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id, kind)
);
GRANT SELECT ON public.community_reactions TO anon, authenticated;
GRANT INSERT, DELETE ON public.community_reactions TO authenticated;
GRANT ALL ON public.community_reactions TO service_role;
ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_reactions_read" ON public.community_reactions
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "community_reactions_own" ON public.community_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "community_reactions_delete_own" ON public.community_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.community_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.community_reports TO authenticated;
GRANT ALL ON public.community_reports TO service_role;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_reports_insert_own" ON public.community_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "community_reports_admin_read" ON public.community_reports
  FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "community_reports_admin_update" ON public.community_reports
  FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.community_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.community_resources TO anon, authenticated;
GRANT ALL ON public.community_resources TO service_role;
ALTER TABLE public.community_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_resources_public_read" ON public.community_resources
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "community_resources_admin_write" ON public.community_resources
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- Seed a few starter resources
INSERT INTO public.community_resources (title, description, url, category, sort_order) VALUES
  ('Epilepsy Foundation', 'Education, advocacy, and 24/7 helpline.', 'https://www.epilepsy.com', 'foundation', 1),
  ('CURE Epilepsy', 'Research-focused nonprofit funding the search for cures.', 'https://www.cureepilepsy.org', 'foundation', 2),
  ('988 Suicide & Crisis Lifeline', '24/7 free and confidential support in the US.', 'https://988lifeline.org', 'crisis', 3),
  ('Epilepsy Action (UK)', 'Information, support, and a freephone helpline.', 'https://www.epilepsy.org.uk', 'foundation', 4),
  ('Seizure first aid (CDC)', 'What to do when someone has a seizure.', 'https://www.cdc.gov/epilepsy/about/first-aid.htm', 'first-aid', 5)
ON CONFLICT DO NOTHING;

-- === 20260527084012_4c982759-c971-4aac-87a8-f3c65b358e15.sql ===
-- Remove overly-permissive public read on profiles that exposed sensitive fields
DROP POLICY IF EXISTS profiles_public_community_read ON public.profiles;

-- Create a safe public view exposing only community-safe profile fields
CREATE OR REPLACE VIEW public.community_profiles
WITH (security_invoker = true) AS
SELECT id, community_display_name, community_bio, community_opted_in
FROM public.profiles
WHERE community_opted_in = true;

GRANT SELECT ON public.community_profiles TO anon, authenticated;

-- Defense in depth: explicitly deny non-admins from inserting into user_roles
CREATE POLICY user_roles_block_self_insert
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));
-- === 20260527094605_cef296c1-ee63-4e9c-aad3-5889b2085126.sql ===

-- Care relationship status
CREATE TYPE public.care_relationship_status AS ENUM ('pending', 'active', 'revoked');
CREATE TYPE public.care_role AS ENUM ('emergency', 'caregiver', 'provider', 'viewer');
CREATE TYPE public.pending_change_status AS ENUM ('pending', 'approved', 'rejected');

-- 1) care_relationships
CREATE TABLE public.care_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  caregiver_id uuid,
  invite_email text NOT NULL,
  invite_token text NOT NULL UNIQUE,
  role public.care_role NOT NULL DEFAULT 'caregiver',
  status public.care_relationship_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz,
  CONSTRAINT no_self_share CHECK (caregiver_id IS NULL OR caregiver_id <> owner_id)
);

CREATE INDEX idx_care_rel_owner ON public.care_relationships(owner_id);
CREATE INDEX idx_care_rel_caregiver ON public.care_relationships(caregiver_id);
CREATE INDEX idx_care_rel_token ON public.care_relationships(invite_token);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_relationships TO authenticated;
GRANT ALL ON public.care_relationships TO service_role;

ALTER TABLE public.care_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY care_rel_owner_all ON public.care_relationships
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY care_rel_caregiver_select ON public.care_relationships
  FOR SELECT TO authenticated
  USING (auth.uid() = caregiver_id);

-- caregiver can update their row only to set accepted_at via accept flow (via server fn using service role; this select-only policy is the safety net)

-- 2) care_scopes
CREATE TABLE public.care_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid NOT NULL REFERENCES public.care_relationships(id) ON DELETE CASCADE,
  scope text NOT NULL,
  granted boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (relationship_id, scope)
);

CREATE INDEX idx_care_scopes_rel ON public.care_scopes(relationship_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_scopes TO authenticated;
GRANT ALL ON public.care_scopes TO service_role;

ALTER TABLE public.care_scopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY care_scopes_owner_all ON public.care_scopes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.care_relationships r
      WHERE r.id = relationship_id AND r.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.care_relationships r
      WHERE r.id = relationship_id AND r.owner_id = auth.uid()
    )
  );

CREATE POLICY care_scopes_caregiver_select ON public.care_scopes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.care_relationships r
      WHERE r.id = relationship_id AND r.caregiver_id = auth.uid()
    )
  );

-- 3) pending_changes
CREATE TABLE public.pending_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid NOT NULL REFERENCES public.care_relationships(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  caregiver_id uuid NOT NULL,
  type text NOT NULL,
  target_table text,
  target_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.pending_change_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decision_note text
);

CREATE INDEX idx_pending_owner_status ON public.pending_changes(owner_id, status);
CREATE INDEX idx_pending_caregiver ON public.pending_changes(caregiver_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_changes TO authenticated;
GRANT ALL ON public.pending_changes TO service_role;

ALTER TABLE public.pending_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY pending_owner_all ON public.pending_changes
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY pending_caregiver_select ON public.pending_changes
  FOR SELECT TO authenticated
  USING (auth.uid() = caregiver_id);

CREATE POLICY pending_caregiver_insert ON public.pending_changes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = caregiver_id
    AND EXISTS (
      SELECT 1 FROM public.care_relationships r
      WHERE r.id = relationship_id
        AND r.caregiver_id = auth.uid()
        AND r.status = 'active'
    )
  );

-- 4) care_audit_log
CREATE TABLE public.care_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid REFERENCES public.care_relationships(id) ON DELETE SET NULL,
  owner_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_owner_at ON public.care_audit_log(owner_id, at DESC);
CREATE INDEX idx_audit_rel ON public.care_audit_log(relationship_id);

GRANT SELECT, INSERT ON public.care_audit_log TO authenticated;
GRANT ALL ON public.care_audit_log TO service_role;

ALTER TABLE public.care_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_owner_select ON public.care_audit_log
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY audit_actor_insert ON public.care_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = actor_id);

-- 5) Security-definer helper: does caregiver have an active scope on owner?
CREATE OR REPLACE FUNCTION public.has_care_scope(_owner_id uuid, _caregiver_id uuid, _scope text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.care_relationships r
    JOIN public.care_scopes s ON s.relationship_id = r.id
    WHERE r.owner_id = _owner_id
      AND r.caregiver_id = _caregiver_id
      AND r.status = 'active'
      AND (r.expires_at IS NULL OR r.expires_at > now())
      AND s.scope = _scope
      AND s.granted = true
  )
$$;

GRANT EXECUTE ON FUNCTION public.has_care_scope(uuid, uuid, text) TO authenticated, service_role;

-- === 20260527110205_email_infra.sql ===
-- Email infrastructure
-- Creates the queue system, send log, send state, suppression, and unsubscribe
-- tables used by both auth and transactional emails.

-- Extensions required for queue processing
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION pg_cron;
  END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS supabase_vault;
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create email queues (auth = high priority, transactional = normal)
-- Wrapped in DO blocks to handle "queue already exists" errors idempotently.
DO $$ BEGIN PERFORM pgmq.create('auth_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Dead-letter queues for messages that exceed max retries
DO $$ BEGIN PERFORM pgmq.create('auth_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Email send log table (audit trail for all send attempts)
-- UPDATE is allowed for the service role so the suppression edge function
-- can update a log record's status when a bounce/complaint/unsubscribe occurs.
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT,
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supabase no longer grants public-schema access to service_role by default;
-- emit the grant explicitly so edge functions can reach the table via PostgREST.
GRANT ALL ON public.email_send_log TO service_role;

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read send log"
    ON public.email_send_log FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert send log"
    ON public.email_send_log FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can update send log"
    ON public.email_send_log FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_created ON public.email_send_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_send_log_recipient ON public.email_send_log(recipient_email);

-- Backfill: add message_id column to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_log ADD COLUMN message_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_message ON public.email_send_log(message_id);

-- Prevent duplicate sends: only one 'sent' row per message_id.
-- If VT expires and another worker picks up the same message, the pre-send
-- check catches it. This index is a DB-level safety net for race conditions.
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_send_log_message_sent_unique
  ON public.email_send_log(message_id) WHERE status = 'sent';

-- Backfill: update status CHECK constraint for existing tables that predate new statuses
DO $$ BEGIN
  ALTER TABLE public.email_send_log DROP CONSTRAINT IF EXISTS email_send_log_status_check;
  ALTER TABLE public.email_send_log ADD CONSTRAINT email_send_log_status_check
    CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq'));
END $$;

-- Rate-limit state and queue config (single row, tracks Retry-After cooldown + throughput settings)
CREATE TABLE IF NOT EXISTS public.email_send_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  retry_after_until TIMESTAMPTZ,
  batch_size INTEGER NOT NULL DEFAULT 10,
  send_delay_ms INTEGER NOT NULL DEFAULT 200,
  auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15,
  transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.email_send_state (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Backfill: add config columns to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN batch_size INTEGER NOT NULL DEFAULT 10;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN send_delay_ms INTEGER NOT NULL DEFAULT 200;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

GRANT ALL ON public.email_send_state TO service_role;

ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage send state"
    ON public.email_send_state FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RPC wrappers so Edge Functions can interact with pgmq via supabase.rpc()
-- (PostgREST only exposes functions in the public schema; pgmq functions are in the pgmq schema)
-- All wrappers auto-create the queue on undefined_table (42P01) so emails
-- are never lost if the queue was dropped (extension upgrade, restore, etc.).
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name TEXT, payload JSONB)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name TEXT, batch_size INT, vt INT)
RETURNS TABLE(msg_id BIGINT, read_ct INT, message JSONB)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name TEXT, message_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(
  source_queue TEXT, dlq_name TEXT, message_id BIGINT, payload JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$$;

-- Restrict queue RPC wrappers to service_role only (SECURITY DEFINER runs as owner,
-- so without this any authenticated user could manipulate the email queues)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) TO service_role;

-- Suppressed emails table (tracks unsubscribes, bounces, complaints)
-- Append-only: no DELETE or UPDATE policies to prevent bypassing suppression.
CREATE TABLE IF NOT EXISTS public.suppressed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribe', 'bounce', 'complaint')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);

GRANT ALL ON public.suppressed_emails TO service_role;

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read suppressed emails"
    ON public.suppressed_emails FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert suppressed emails"
    ON public.suppressed_emails FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_suppressed_emails_email ON public.suppressed_emails(email);

-- Email unsubscribe tokens table (one token per email address for unsubscribe links)
-- No DELETE policy to prevent removing tokens. UPDATE allowed only to mark tokens as used.
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

GRANT ALL ON public.email_unsubscribe_tokens TO service_role;

ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read tokens"
    ON public.email_unsubscribe_tokens FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert tokens"
    ON public.email_unsubscribe_tokens FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can mark tokens as used"
    ON public.email_unsubscribe_tokens FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON public.email_unsubscribe_tokens(token);

-- ============================================================
-- POST-MIGRATION STEPS (applied dynamically by setup_email_infra)
-- These steps contain project-specific secrets and URLs and
-- cannot be expressed as static SQL. They are applied via the
-- Supabase Management API (ExecuteSQL) each time the tool runs.
-- ============================================================
--
-- 1. VAULT SECRET
--    Stores (or updates) the Supabase service_role key in
--    vault as 'email_queue_service_role_key'.
--    Uses vault.create_secret / vault.update_secret (upsert).
--    To revert: DELETE FROM vault.secrets WHERE name = 'email_queue_service_role_key';
--
-- 2. CRON JOB (pg_cron)
--    Creates job 'process-email-queue' with a 5-second interval.
--    The job checks:
--      a) rate-limit cooldown (email_send_state.retry_after_until)
--      b) whether auth_emails or transactional_emails queues have messages
--    If conditions are met, it calls the process-email-queue Edge Function
--    via net.http_post using the vault-stored service_role key.
--    To revert: SELECT cron.unschedule('process-email-queue');

-- === 20260527110223_email_infra.sql ===
-- Email infrastructure
-- Creates the queue system, send log, send state, suppression, and unsubscribe
-- tables used by both auth and transactional emails.

-- Extensions required for queue processing
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION pg_cron;
  END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS supabase_vault;
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create email queues (auth = high priority, transactional = normal)
-- Wrapped in DO blocks to handle "queue already exists" errors idempotently.
DO $$ BEGIN PERFORM pgmq.create('auth_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Dead-letter queues for messages that exceed max retries
DO $$ BEGIN PERFORM pgmq.create('auth_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Email send log table (audit trail for all send attempts)
-- UPDATE is allowed for the service role so the suppression edge function
-- can update a log record's status when a bounce/complaint/unsubscribe occurs.
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT,
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supabase no longer grants public-schema access to service_role by default;
-- emit the grant explicitly so edge functions can reach the table via PostgREST.
GRANT ALL ON public.email_send_log TO service_role;

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read send log"
    ON public.email_send_log FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert send log"
    ON public.email_send_log FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can update send log"
    ON public.email_send_log FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_created ON public.email_send_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_send_log_recipient ON public.email_send_log(recipient_email);

-- Backfill: add message_id column to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_log ADD COLUMN message_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_message ON public.email_send_log(message_id);

-- Prevent duplicate sends: only one 'sent' row per message_id.
-- If VT expires and another worker picks up the same message, the pre-send
-- check catches it. This index is a DB-level safety net for race conditions.
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_send_log_message_sent_unique
  ON public.email_send_log(message_id) WHERE status = 'sent';

-- Backfill: update status CHECK constraint for existing tables that predate new statuses
DO $$ BEGIN
  ALTER TABLE public.email_send_log DROP CONSTRAINT IF EXISTS email_send_log_status_check;
  ALTER TABLE public.email_send_log ADD CONSTRAINT email_send_log_status_check
    CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq'));
END $$;

-- Rate-limit state and queue config (single row, tracks Retry-After cooldown + throughput settings)
CREATE TABLE IF NOT EXISTS public.email_send_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  retry_after_until TIMESTAMPTZ,
  batch_size INTEGER NOT NULL DEFAULT 10,
  send_delay_ms INTEGER NOT NULL DEFAULT 200,
  auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15,
  transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.email_send_state (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Backfill: add config columns to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN batch_size INTEGER NOT NULL DEFAULT 10;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN send_delay_ms INTEGER NOT NULL DEFAULT 200;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

GRANT ALL ON public.email_send_state TO service_role;

ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage send state"
    ON public.email_send_state FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RPC wrappers so Edge Functions can interact with pgmq via supabase.rpc()
-- (PostgREST only exposes functions in the public schema; pgmq functions are in the pgmq schema)
-- All wrappers auto-create the queue on undefined_table (42P01) so emails
-- are never lost if the queue was dropped (extension upgrade, restore, etc.).
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name TEXT, payload JSONB)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name TEXT, batch_size INT, vt INT)
RETURNS TABLE(msg_id BIGINT, read_ct INT, message JSONB)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name TEXT, message_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(
  source_queue TEXT, dlq_name TEXT, message_id BIGINT, payload JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$$;

-- Restrict queue RPC wrappers to service_role only (SECURITY DEFINER runs as owner,
-- so without this any authenticated user could manipulate the email queues)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) TO service_role;

-- Suppressed emails table (tracks unsubscribes, bounces, complaints)
-- Append-only: no DELETE or UPDATE policies to prevent bypassing suppression.
CREATE TABLE IF NOT EXISTS public.suppressed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribe', 'bounce', 'complaint')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);

GRANT ALL ON public.suppressed_emails TO service_role;

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read suppressed emails"
    ON public.suppressed_emails FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert suppressed emails"
    ON public.suppressed_emails FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_suppressed_emails_email ON public.suppressed_emails(email);

-- Email unsubscribe tokens table (one token per email address for unsubscribe links)
-- No DELETE policy to prevent removing tokens. UPDATE allowed only to mark tokens as used.
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

GRANT ALL ON public.email_unsubscribe_tokens TO service_role;

ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read tokens"
    ON public.email_unsubscribe_tokens FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert tokens"
    ON public.email_unsubscribe_tokens FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can mark tokens as used"
    ON public.email_unsubscribe_tokens FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON public.email_unsubscribe_tokens(token);

-- ============================================================
-- POST-MIGRATION STEPS (applied dynamically by setup_email_infra)
-- These steps contain project-specific secrets and URLs and
-- cannot be expressed as static SQL. They are applied via the
-- Supabase Management API (ExecuteSQL) each time the tool runs.
-- ============================================================
--
-- 1. VAULT SECRET
--    Stores (or updates) the Supabase service_role key in
--    vault as 'email_queue_service_role_key'.
--    Uses vault.create_secret / vault.update_secret (upsert).
--    To revert: DELETE FROM vault.secrets WHERE name = 'email_queue_service_role_key';
--
-- 2. CRON JOB (pg_cron)
--    Creates job 'process-email-queue' with a 5-second interval.
--    The job checks:
--      a) rate-limit cooldown (email_send_state.retry_after_until)
--      b) whether auth_emails or transactional_emails queues have messages
--    If conditions are met, it calls the process-email-queue Edge Function
--    via net.http_post using the vault-stored service_role key.
--    To revert: SELECT cron.unschedule('process-email-queue');

-- === 20260527110657_email_infra.sql ===
-- Email infrastructure
-- Creates the queue system, send log, send state, suppression, and unsubscribe
-- tables used by both auth and transactional emails.

-- Extensions required for queue processing
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION pg_cron;
  END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS supabase_vault;
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create email queues (auth = high priority, transactional = normal)
-- Wrapped in DO blocks to handle "queue already exists" errors idempotently.
DO $$ BEGIN PERFORM pgmq.create('auth_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Dead-letter queues for messages that exceed max retries
DO $$ BEGIN PERFORM pgmq.create('auth_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Email send log table (audit trail for all send attempts)
-- UPDATE is allowed for the service role so the suppression edge function
-- can update a log record's status when a bounce/complaint/unsubscribe occurs.
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT,
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supabase no longer grants public-schema access to service_role by default;
-- emit the grant explicitly so edge functions can reach the table via PostgREST.
GRANT ALL ON public.email_send_log TO service_role;

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read send log"
    ON public.email_send_log FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert send log"
    ON public.email_send_log FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can update send log"
    ON public.email_send_log FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_created ON public.email_send_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_send_log_recipient ON public.email_send_log(recipient_email);

-- Backfill: add message_id column to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_log ADD COLUMN message_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_message ON public.email_send_log(message_id);

-- Prevent duplicate sends: only one 'sent' row per message_id.
-- If VT expires and another worker picks up the same message, the pre-send
-- check catches it. This index is a DB-level safety net for race conditions.
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_send_log_message_sent_unique
  ON public.email_send_log(message_id) WHERE status = 'sent';

-- Backfill: update status CHECK constraint for existing tables that predate new statuses
DO $$ BEGIN
  ALTER TABLE public.email_send_log DROP CONSTRAINT IF EXISTS email_send_log_status_check;
  ALTER TABLE public.email_send_log ADD CONSTRAINT email_send_log_status_check
    CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq'));
END $$;

-- Rate-limit state and queue config (single row, tracks Retry-After cooldown + throughput settings)
CREATE TABLE IF NOT EXISTS public.email_send_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  retry_after_until TIMESTAMPTZ,
  batch_size INTEGER NOT NULL DEFAULT 10,
  send_delay_ms INTEGER NOT NULL DEFAULT 200,
  auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15,
  transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.email_send_state (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Backfill: add config columns to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN batch_size INTEGER NOT NULL DEFAULT 10;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN send_delay_ms INTEGER NOT NULL DEFAULT 200;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

GRANT ALL ON public.email_send_state TO service_role;

ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage send state"
    ON public.email_send_state FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RPC wrappers so Edge Functions can interact with pgmq via supabase.rpc()
-- (PostgREST only exposes functions in the public schema; pgmq functions are in the pgmq schema)
-- All wrappers auto-create the queue on undefined_table (42P01) so emails
-- are never lost if the queue was dropped (extension upgrade, restore, etc.).
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name TEXT, payload JSONB)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name TEXT, batch_size INT, vt INT)
RETURNS TABLE(msg_id BIGINT, read_ct INT, message JSONB)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name TEXT, message_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(
  source_queue TEXT, dlq_name TEXT, message_id BIGINT, payload JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$$;

-- Restrict queue RPC wrappers to service_role only (SECURITY DEFINER runs as owner,
-- so without this any authenticated user could manipulate the email queues)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) TO service_role;

-- Suppressed emails table (tracks unsubscribes, bounces, complaints)
-- Append-only: no DELETE or UPDATE policies to prevent bypassing suppression.
CREATE TABLE IF NOT EXISTS public.suppressed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribe', 'bounce', 'complaint')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);

GRANT ALL ON public.suppressed_emails TO service_role;

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read suppressed emails"
    ON public.suppressed_emails FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert suppressed emails"
    ON public.suppressed_emails FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_suppressed_emails_email ON public.suppressed_emails(email);

-- Email unsubscribe tokens table (one token per email address for unsubscribe links)
-- No DELETE policy to prevent removing tokens. UPDATE allowed only to mark tokens as used.
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

GRANT ALL ON public.email_unsubscribe_tokens TO service_role;

ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read tokens"
    ON public.email_unsubscribe_tokens FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert tokens"
    ON public.email_unsubscribe_tokens FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can mark tokens as used"
    ON public.email_unsubscribe_tokens FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON public.email_unsubscribe_tokens(token);

-- ============================================================
-- POST-MIGRATION STEPS (applied dynamically by setup_email_infra)
-- These steps contain project-specific secrets and URLs and
-- cannot be expressed as static SQL. They are applied via the
-- Supabase Management API (ExecuteSQL) each time the tool runs.
-- ============================================================
--
-- 1. VAULT SECRET
--    Stores (or updates) the Supabase service_role key in
--    vault as 'email_queue_service_role_key'.
--    Uses vault.create_secret / vault.update_secret (upsert).
--    To revert: DELETE FROM vault.secrets WHERE name = 'email_queue_service_role_key';
--
-- 2. CRON JOB (pg_cron)
--    Creates job 'process-email-queue' with a 5-second interval.
--    The job checks:
--      a) rate-limit cooldown (email_send_state.retry_after_until)
--      b) whether auth_emails or transactional_emails queues have messages
--    If conditions are met, it calls the process-email-queue Edge Function
--    via net.http_post using the vault-stored service_role key.
--    To revert: SELECT cron.unschedule('process-email-queue');

-- === 20260527114506_email_infra.sql ===
-- Email infrastructure
-- Creates the queue system, send log, send state, suppression, and unsubscribe
-- tables used by both auth and transactional emails.

-- Extensions required for queue processing
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION pg_cron;
  END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS supabase_vault;
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create email queues (auth = high priority, transactional = normal)
-- Wrapped in DO blocks to handle "queue already exists" errors idempotently.
DO $$ BEGIN PERFORM pgmq.create('auth_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Dead-letter queues for messages that exceed max retries
DO $$ BEGIN PERFORM pgmq.create('auth_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Email send log table (audit trail for all send attempts)
-- UPDATE is allowed for the service role so the suppression edge function
-- can update a log record's status when a bounce/complaint/unsubscribe occurs.
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT,
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supabase no longer grants public-schema access to service_role by default;
-- emit the grant explicitly so edge functions can reach the table via PostgREST.
GRANT ALL ON public.email_send_log TO service_role;

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read send log"
    ON public.email_send_log FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert send log"
    ON public.email_send_log FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can update send log"
    ON public.email_send_log FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_created ON public.email_send_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_send_log_recipient ON public.email_send_log(recipient_email);

-- Backfill: add message_id column to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_log ADD COLUMN message_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_message ON public.email_send_log(message_id);

-- Prevent duplicate sends: only one 'sent' row per message_id.
-- If VT expires and another worker picks up the same message, the pre-send
-- check catches it. This index is a DB-level safety net for race conditions.
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_send_log_message_sent_unique
  ON public.email_send_log(message_id) WHERE status = 'sent';

-- Backfill: update status CHECK constraint for existing tables that predate new statuses
DO $$ BEGIN
  ALTER TABLE public.email_send_log DROP CONSTRAINT IF EXISTS email_send_log_status_check;
  ALTER TABLE public.email_send_log ADD CONSTRAINT email_send_log_status_check
    CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq'));
END $$;

-- Rate-limit state and queue config (single row, tracks Retry-After cooldown + throughput settings)
CREATE TABLE IF NOT EXISTS public.email_send_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  retry_after_until TIMESTAMPTZ,
  batch_size INTEGER NOT NULL DEFAULT 10,
  send_delay_ms INTEGER NOT NULL DEFAULT 200,
  auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15,
  transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.email_send_state (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Backfill: add config columns to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN batch_size INTEGER NOT NULL DEFAULT 10;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN send_delay_ms INTEGER NOT NULL DEFAULT 200;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

GRANT ALL ON public.email_send_state TO service_role;

ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage send state"
    ON public.email_send_state FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RPC wrappers so Edge Functions can interact with pgmq via supabase.rpc()
-- (PostgREST only exposes functions in the public schema; pgmq functions are in the pgmq schema)
-- All wrappers auto-create the queue on undefined_table (42P01) so emails
-- are never lost if the queue was dropped (extension upgrade, restore, etc.).
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name TEXT, payload JSONB)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name TEXT, batch_size INT, vt INT)
RETURNS TABLE(msg_id BIGINT, read_ct INT, message JSONB)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name TEXT, message_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(
  source_queue TEXT, dlq_name TEXT, message_id BIGINT, payload JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$$;

-- Restrict queue RPC wrappers to service_role only (SECURITY DEFINER runs as owner,
-- so without this any authenticated user could manipulate the email queues)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) TO service_role;

-- Suppressed emails table (tracks unsubscribes, bounces, complaints)
-- Append-only: no DELETE or UPDATE policies to prevent bypassing suppression.
CREATE TABLE IF NOT EXISTS public.suppressed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribe', 'bounce', 'complaint')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);

GRANT ALL ON public.suppressed_emails TO service_role;

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read suppressed emails"
    ON public.suppressed_emails FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert suppressed emails"
    ON public.suppressed_emails FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_suppressed_emails_email ON public.suppressed_emails(email);

-- Email unsubscribe tokens table (one token per email address for unsubscribe links)
-- No DELETE policy to prevent removing tokens. UPDATE allowed only to mark tokens as used.
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

GRANT ALL ON public.email_unsubscribe_tokens TO service_role;

ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read tokens"
    ON public.email_unsubscribe_tokens FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert tokens"
    ON public.email_unsubscribe_tokens FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can mark tokens as used"
    ON public.email_unsubscribe_tokens FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON public.email_unsubscribe_tokens(token);

-- ============================================================
-- POST-MIGRATION STEPS (applied dynamically by setup_email_infra)
-- These steps contain project-specific secrets and URLs and
-- cannot be expressed as static SQL. They are applied via the
-- Supabase Management API (ExecuteSQL) each time the tool runs.
-- ============================================================
--
-- 1. VAULT SECRET
--    Stores (or updates) the Supabase service_role key in
--    vault as 'email_queue_service_role_key'.
--    Uses vault.create_secret / vault.update_secret (upsert).
--    To revert: DELETE FROM vault.secrets WHERE name = 'email_queue_service_role_key';
--
-- 2. CRON JOB (pg_cron)
--    Creates job 'process-email-queue' with a 5-second interval.
--    The job checks:
--      a) rate-limit cooldown (email_send_state.retry_after_until)
--      b) whether auth_emails or transactional_emails queues have messages
--    If conditions are met, it calls the process-email-queue Edge Function
--    via net.http_post using the vault-stored service_role key.
--    To revert: SELECT cron.unschedule('process-email-queue');

-- === 20260530003008_3cec020b-f9b7-461b-b8a3-1c70158a46b4.sql ===
-- 1. Timezone-aware daily dose seeding
CREATE OR REPLACE FUNCTION public.seed_daily_medication_doses()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  med record;
  slot jsonb;
  scheduled timestamptz;
  t text;
  amt numeric;
  un text;
  tz text;
  user_today date;
begin
  -- mark prior-day pending as missed (UTC-based bound, fine: gives users full day)
  update public.medication_doses
  set status = 'missed'
  where status = 'pending'
    and scheduled_at < date_trunc('day', now());

  for med in
    select m.id, m.user_id, m.times_of_day, m.schedule, m.dosage_amount, m.dosage_unit,
           m.start_date, m.end_date, coalesce(p.timezone, 'UTC') as tz
    from public.medications m
    left join public.profiles p on p.id = m.user_id
    where m.active = true
      and m.is_rescue = false
      and (m.start_date is null or m.start_date <= current_date)
      and (m.end_date is null or m.end_date >= current_date)
  loop
    tz := med.tz;
    -- today in the user's local timezone
    user_today := (now() at time zone tz)::date;

    if jsonb_array_length(coalesce(med.schedule, '[]'::jsonb)) > 0 then
      for slot in select * from jsonb_array_elements(med.schedule)
      loop
        t := slot->>'time';
        if t is null or t !~ '^\d{1,2}:\d{2}$' then continue; end if;
        begin
          -- interpret "HH:MM" as local time in user's tz, then convert to UTC tstz
          scheduled := (user_today::text || ' ' || t)::timestamp at time zone tz;
        exception when others then
          continue;
        end;
        amt := nullif(slot->>'amount','')::numeric;
        un := nullif(slot->>'unit','');
        insert into public.medication_doses (user_id, medication_id, scheduled_at, status, amount, unit)
        select med.user_id, med.id, scheduled, 'pending', amt, un
        where not exists (
          select 1 from public.medication_doses d
          where d.medication_id = med.id and d.scheduled_at = scheduled
        );
      end loop;
    else
      if med.times_of_day is null then continue; end if;
      foreach t in array med.times_of_day
      loop
        begin
          scheduled := (user_today::text || ' ' || t)::timestamp at time zone tz;
        exception when others then
          continue;
        end;
        insert into public.medication_doses (user_id, medication_id, scheduled_at, status, amount, unit)
        select med.user_id, med.id, scheduled, 'pending', med.dosage_amount, med.dosage_unit
        where not exists (
          select 1 from public.medication_doses d
          where d.medication_id = med.id and d.scheduled_at = scheduled
        );
      end loop;
    end if;
  end loop;
end;
$function$;

-- 2. One-shot helper to regenerate today's PENDING doses for a single user
--    after their timezone changes or after a schedule edit.
CREATE OR REPLACE FUNCTION public.regenerate_today_pending_doses(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  tz text;
  user_today date;
  med record;
  slot jsonb;
  scheduled timestamptz;
  t text;
  amt numeric;
  un text;
  day_start timestamptz;
  day_end timestamptz;
begin
  select coalesce(timezone, 'UTC') into tz from public.profiles where id = _user_id;
  if tz is null then tz := 'UTC'; end if;
  user_today := (now() at time zone tz)::date;
  day_start := (user_today::text || ' 00:00')::timestamp at time zone tz;
  day_end := ((user_today + 1)::text || ' 00:00')::timestamp at time zone tz;

  -- delete only pending doses for today's window (preserve taken/missed/skipped history)
  delete from public.medication_doses
  where user_id = _user_id
    and status = 'pending'
    and scheduled_at >= day_start
    and scheduled_at < day_end;

  for med in
    select id, times_of_day, schedule, dosage_amount, dosage_unit
    from public.medications
    where user_id = _user_id
      and active = true
      and is_rescue = false
      and (start_date is null or start_date <= user_today)
      and (end_date is null or end_date >= user_today)
  loop
    if jsonb_array_length(coalesce(med.schedule, '[]'::jsonb)) > 0 then
      for slot in select * from jsonb_array_elements(med.schedule)
      loop
        t := slot->>'time';
        if t is null or t !~ '^\d{1,2}:\d{2}$' then continue; end if;
        begin
          scheduled := (user_today::text || ' ' || t)::timestamp at time zone tz;
        exception when others then continue; end;
        amt := nullif(slot->>'amount','')::numeric;
        un := nullif(slot->>'unit','');
        insert into public.medication_doses (user_id, medication_id, scheduled_at, status, amount, unit)
        values (_user_id, med.id, scheduled, 'pending', amt, un)
        on conflict do nothing;
      end loop;
    elsif med.times_of_day is not null then
      foreach t in array med.times_of_day
      loop
        begin
          scheduled := (user_today::text || ' ' || t)::timestamp at time zone tz;
        exception when others then continue; end;
        insert into public.medication_doses (user_id, medication_id, scheduled_at, status, amount, unit)
        values (_user_id, med.id, scheduled, 'pending', med.dosage_amount, med.dosage_unit)
        on conflict do nothing;
      end loop;
    end if;
  end loop;
end;
$function$;

GRANT EXECUTE ON FUNCTION public.regenerate_today_pending_doses(uuid) TO authenticated;

-- 3. Auto-fail stuck journal entries (running 'processing' for >15 min).
CREATE OR REPLACE FUNCTION public.cleanup_stuck_journal_entries()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  affected integer;
begin
  update public.journal_entries
  set status = 'failed'
  where status = 'processing'
    and created_at < now() - interval '15 minutes';
  GET DIAGNOSTICS affected = ROW_COUNT;
  return affected;
end;
$function$;

GRANT EXECUTE ON FUNCTION public.cleanup_stuck_journal_entries() TO authenticated, service_role;
-- === 20260530013239_d3b219bb-79fd-4997-8c44-e5daef9209b3.sql ===
-- Profile reminder preferences (wake/sleep window + snooze duration)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wake_time time NOT NULL DEFAULT '07:00',
  ADD COLUMN IF NOT EXISTS sleep_time time NOT NULL DEFAULT '23:00',
  ADD COLUMN IF NOT EXISTS snooze_minutes int NOT NULL DEFAULT 10;

-- Per-medication reminder style: 'standard' = single notification, 'critical' = persistent alarm
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS reminder_style text NOT NULL DEFAULT 'standard'
  CHECK (reminder_style IN ('standard', 'critical'));

-- Trips: planned travel to another timezone (schedule still anchors to profile home tz)
CREATE TABLE IF NOT EXISTS public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text,
  destination_tz text NOT NULL,
  depart_at timestamptz NOT NULL,
  return_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','ended','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trips_user_dates ON public.trips(user_id, depart_at, return_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY trips_all_own ON public.trips
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- === 20260530021522_bfe5afc3-8ecc-411e-b4d3-9e7f9e6e747f.sql ===

-- Alarm sound + idle timeout preferences
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS alarm_sound text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_alarm_sound text NOT NULL DEFAULT 'gentle-chime';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS idle_timeout_minutes integer NOT NULL DEFAULT 15;

-- Push subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_subs_own" ON public.push_subscriptions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Metric dictionary (public read, admin-managed)
CREATE TABLE public.metric_dictionary (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_key text NOT NULL UNIQUE,
  display_name text NOT NULL,
  category text NOT NULL,
  default_unit text,
  default_ref_low numeric,
  default_ref_high numeric,
  hints text,
  aliases text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.metric_dictionary TO anon, authenticated;
GRANT ALL ON public.metric_dictionary TO service_role;
ALTER TABLE public.metric_dictionary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "metric_dict_read" ON public.metric_dictionary FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "metric_dict_admin_write" ON public.metric_dictionary FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Report documents
CREATE TABLE public.report_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  report_type text,
  report_date date,
  file_path text NOT NULL,
  file_mime text NOT NULL,
  ocr_text text,
  status text NOT NULL DEFAULT 'processing',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_documents TO authenticated;
GRANT ALL ON public.report_documents TO service_role;
ALTER TABLE public.report_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "report_docs_own" ON public.report_documents FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_report_documents_user ON public.report_documents(user_id, report_date DESC);

-- Report metrics
CREATE TABLE public.report_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES public.report_documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  metric_key text NOT NULL,
  display_name text,
  value numeric,
  value_text text,
  unit text,
  reference_low numeric,
  reference_high numeric,
  flag text,
  measured_at timestamptz,
  user_corrected boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_metrics TO authenticated;
GRANT ALL ON public.report_metrics TO service_role;
ALTER TABLE public.report_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "report_metrics_own" ON public.report_metrics FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_report_metrics_trend ON public.report_metrics(user_id, metric_key, measured_at DESC);

-- PHI access audit log (append-only)
CREATE TABLE public.phi_access_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  ip_address text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}',
  at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.phi_access_log TO authenticated;
GRANT ALL ON public.phi_access_log TO service_role;
ALTER TABLE public.phi_access_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "phi_log_own_select" ON public.phi_access_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "phi_log_actor_insert" ON public.phi_access_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);
CREATE INDEX idx_phi_access_log_user ON public.phi_access_log(user_id, at DESC);

-- Private storage bucket for reports
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "reports_own_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "reports_own_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "reports_own_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "reports_own_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Seed common metric dictionary
INSERT INTO public.metric_dictionary (metric_key, display_name, category, default_unit, default_ref_low, default_ref_high, hints, aliases) VALUES
  ('vitamin_d', 'Vitamin D (25-OH)', 'vitamins', 'ng/mL', 30, 100, 'Low Vitamin D is common and often improves with sunlight exposure and supplementation. Ask your doctor about dosage.', ARRAY['25-hydroxyvitamin d','25(oh)d','vit d']),
  ('vitamin_b12', 'Vitamin B12', 'vitamins', 'pg/mL', 200, 900, 'B12 supports nerve and brain function. Low levels can affect mood and energy.', ARRAY['b12','cobalamin']),
  ('ferritin', 'Ferritin', 'cbc', 'ng/mL', 30, 300, 'Ferritin reflects iron stores. Low ferritin can cause fatigue.', ARRAY['iron stores']),
  ('hemoglobin', 'Hemoglobin', 'cbc', 'g/dL', 12, 17, NULL, ARRAY['hgb','hb']),
  ('hematocrit', 'Hematocrit', 'cbc', '%', 36, 50, NULL, ARRAY['hct']),
  ('wbc', 'White Blood Cells', 'cbc', 'x10^9/L', 4, 11, NULL, ARRAY['white blood cell count']),
  ('platelets', 'Platelets', 'cbc', 'x10^9/L', 150, 400, NULL, ARRAY['plt']),
  ('ldl', 'LDL Cholesterol', 'lipids', 'mg/dL', 0, 100, 'Lower LDL is generally better. Diet, exercise, and medication can lower LDL.', ARRAY['ldl-c','bad cholesterol']),
  ('hdl', 'HDL Cholesterol', 'lipids', 'mg/dL', 40, 100, 'Higher HDL is generally protective.', ARRAY['hdl-c','good cholesterol']),
  ('triglycerides', 'Triglycerides', 'lipids', 'mg/dL', 0, 150, NULL, ARRAY['trig','tg']),
  ('total_cholesterol', 'Total Cholesterol', 'lipids', 'mg/dL', 0, 200, NULL, ARRAY['tc']),
  ('tsh', 'TSH', 'thyroid', 'mIU/L', 0.4, 4.0, 'TSH outside range may indicate thyroid dysfunction.', ARRAY['thyroid stimulating hormone']),
  ('free_t4', 'Free T4', 'thyroid', 'ng/dL', 0.8, 1.8, NULL, ARRAY['ft4']),
  ('free_t3', 'Free T3', 'thyroid', 'pg/mL', 2.3, 4.2, NULL, ARRAY['ft3']),
  ('hba1c', 'HbA1c', 'glucose', '%', 4, 5.6, '5.7-6.4% is prediabetic range; 6.5%+ indicates diabetes. Discuss with your doctor.', ARRAY['a1c','glycated hemoglobin']),
  ('glucose_fasting', 'Fasting Glucose', 'glucose', 'mg/dL', 70, 99, NULL, ARRAY['fasting blood sugar','fbs']),
  ('alt', 'ALT', 'liver', 'U/L', 0, 45, NULL, ARRAY['sgpt','alanine aminotransferase']),
  ('ast', 'AST', 'liver', 'U/L', 0, 40, NULL, ARRAY['sgot','aspartate aminotransferase']),
  ('creatinine', 'Creatinine', 'kidney', 'mg/dL', 0.6, 1.3, NULL, ARRAY[]::text[]),
  ('egfr', 'eGFR', 'kidney', 'mL/min/1.73m2', 60, 200, 'eGFR estimates kidney filtration. Below 60 sustained suggests kidney disease.', ARRAY['estimated gfr']),
  ('crp', 'C-Reactive Protein', 'inflammation', 'mg/L', 0, 3, 'High CRP suggests inflammation. Discuss persistent elevation with your doctor.', ARRAY['c reactive protein']),
  ('magnesium', 'Magnesium', 'minerals', 'mg/dL', 1.7, 2.2, 'Magnesium supports nerve and muscle function. Sometimes relevant for seizure stability.', ARRAY['mg']),
  ('sodium', 'Sodium', 'electrolytes', 'mmol/L', 135, 145, NULL, ARRAY['na']),
  ('potassium', 'Potassium', 'electrolytes', 'mmol/L', 3.5, 5.1, NULL, ARRAY['k'])
ON CONFLICT (metric_key) DO NOTHING;

-- === 20260530023021_3ca9706a-b612-466b-b12d-40393afdf136.sql ===
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
-- === 20260530024256_06e3d71d-792d-4ac5-a89f-f10d35f31353.sql ===
-- Add owner check to regenerate_today_pending_doses to prevent cross-user mutation
CREATE OR REPLACE FUNCTION public.regenerate_today_pending_doses(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  tz text;
  user_today date;
  med record;
  slot jsonb;
  scheduled timestamptz;
  t text;
  amt numeric;
  un text;
  day_start timestamptz;
  day_end timestamptz;
begin
  -- Owner check: only allow regenerating one's own doses
  if _user_id is null or _user_id <> auth.uid() then
    raise exception 'Forbidden: cannot regenerate doses for another user';
  end if;

  select coalesce(timezone, 'UTC') into tz from public.profiles where id = _user_id;
  if tz is null then tz := 'UTC'; end if;
  user_today := (now() at time zone tz)::date;
  day_start := (user_today::text || ' 00:00')::timestamp at time zone tz;
  day_end := ((user_today + 1)::text || ' 00:00')::timestamp at time zone tz;

  delete from public.medication_doses
  where user_id = _user_id
    and status = 'pending'
    and scheduled_at >= day_start
    and scheduled_at < day_end;

  for med in
    select id, times_of_day, schedule, dosage_amount, dosage_unit
    from public.medications
    where user_id = _user_id
      and active = true
      and is_rescue = false
      and (start_date is null or start_date <= user_today)
      and (end_date is null or end_date >= user_today)
  loop
    if jsonb_array_length(coalesce(med.schedule, '[]'::jsonb)) > 0 then
      for slot in select * from jsonb_array_elements(med.schedule)
      loop
        t := slot->>'time';
        if t is null or t !~ '^\d{1,2}:\d{2}$' then continue; end if;
        begin
          scheduled := (user_today::text || ' ' || t)::timestamp at time zone tz;
        exception when others then continue; end;
        amt := nullif(slot->>'amount','')::numeric;
        un := nullif(slot->>'unit','');
        insert into public.medication_doses (user_id, medication_id, scheduled_at, status, amount, unit)
        values (_user_id, med.id, scheduled, 'pending', amt, un)
        on conflict do nothing;
      end loop;
    elsif med.times_of_day is not null then
      foreach t in array med.times_of_day
      loop
        begin
          scheduled := (user_today::text || ' ' || t)::timestamp at time zone tz;
        exception when others then continue; end;
        insert into public.medication_doses (user_id, medication_id, scheduled_at, status, amount, unit)
        values (_user_id, med.id, scheduled, 'pending', med.dosage_amount, med.dosage_unit)
        on conflict do nothing;
      end loop;
    end if;
  end loop;
end;
$function$;

-- Restrict cleanup_stuck_journal_entries to service_role only (maintenance/cron)
REVOKE EXECUTE ON FUNCTION public.cleanup_stuck_journal_entries() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_stuck_journal_entries() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_stuck_journal_entries() TO service_role;
-- === 20260530024344_069770e0-0f88-4e52-857c-94bdaae3dc51.sql ===
ALTER TABLE public.email_send_log ADD COLUMN IF NOT EXISTS sent_by uuid;
CREATE INDEX IF NOT EXISTS idx_email_send_log_sent_by_created
  ON public.email_send_log (sent_by, created_at DESC);
-- === 20260530024527_242fc945-7eb7-4f92-b01d-f1b232561b45.sql ===
-- 1. Auto-clear invite_token once a care relationship leaves 'pending' status.
CREATE OR REPLACE FUNCTION public.care_clear_invite_token_on_accept()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM 'pending' AND NEW.invite_token IS NOT NULL THEN
    NEW.invite_token := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_care_clear_invite_token ON public.care_relationships;
CREATE TRIGGER trg_care_clear_invite_token
BEFORE INSERT OR UPDATE ON public.care_relationships
FOR EACH ROW EXECUTE FUNCTION public.care_clear_invite_token_on_accept();

-- Backfill: clear tokens on all non-pending relationships
UPDATE public.care_relationships
SET invite_token = NULL
WHERE status <> 'pending' AND invite_token IS NOT NULL;

-- 2. Tighten realtime topic policies: require a fixed "user:<uid>" prefix
--    instead of a loose suffix match anywhere in the topic name.
DROP POLICY IF EXISTS realtime_own_topic_select ON realtime.messages;
DROP POLICY IF EXISTS realtime_own_topic_insert ON realtime.messages;

CREATE POLICY realtime_own_topic_select
ON realtime.messages
FOR SELECT
TO authenticated
USING (realtime.topic() = ('user:' || (auth.uid())::text));

CREATE POLICY realtime_own_topic_insert
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (realtime.topic() = ('user:' || (auth.uid())::text));
-- === 20260530030550_460ed353-f638-40b3-9beb-a199e381a528.sql ===
ALTER TABLE public.medication_doses ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_medication_doses_pending_due
  ON public.medication_doses (scheduled_at)
  WHERE status = 'pending' AND notified_at IS NULL;
-- === 20260530060328_7d375f6c-8227-4b18-8301-0fb2ce968aec.sql ===
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS conditions text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS conditions_note text;
-- === 20260530063845_e1689937-193e-4bb5-873e-825dd5b0861c.sql ===

-- Phase C: itinerary-driven travel scheduling
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS legs jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS shift_strategy text NOT NULL DEFAULT 'snap',
  ADD COLUMN IF NOT EXISTS shift_hours_per_day numeric NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS home_tz_snapshot text,
  ADD COLUMN IF NOT EXISTS schedule_generated_at timestamptz;

ALTER TABLE public.trips
  DROP CONSTRAINT IF EXISTS trips_shift_strategy_check;
ALTER TABLE public.trips
  ADD CONSTRAINT trips_shift_strategy_check
  CHECK (shift_strategy IN ('home','snap','gradual'));

-- Tag pending doses generated for a trip so we can regenerate cleanly.
ALTER TABLE public.medication_doses
  ADD COLUMN IF NOT EXISTS trip_id uuid;

CREATE INDEX IF NOT EXISTS medication_doses_trip_id_idx
  ON public.medication_doses(trip_id);

-- === 20260530200640_8f673f9c-6a44-4eb0-989b-1b1b80e7b5e9.sql ===
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS purge_after timestamptz;

CREATE INDEX IF NOT EXISTS profiles_purge_after_idx
  ON public.profiles (purge_after)
  WHERE deleted_at IS NOT NULL;
-- === 20260530213156_c8505820-5c3b-4fca-ad32-078454a52b57.sql ===
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'en';
-- === 20260601030719_e194574a-3336-4914-8915-8415c431b506.sql ===
ALTER TABLE public.care_relationships ALTER COLUMN invite_token DROP NOT NULL;
-- === 20260601132418_a0ed2f4b-42b2-4ac8-b4c1-e68c65fb556d.sql ===
-- Add created_by provenance to all tables caregivers may write to.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'journal_entries',
    'medication_doses',
    'seizure_events',
    'medications',
    'biometrics',
    'report_documents'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS created_by_id uuid', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS created_by_kind text NOT NULL DEFAULT ''self''', t);
    EXECUTE format('UPDATE public.%I SET created_by_id = user_id WHERE created_by_id IS NULL', t);
  END LOOP;
END
$$;

-- Validation trigger (more flexible than a CHECK constraint).
CREATE OR REPLACE FUNCTION public.validate_created_by_kind()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by_kind NOT IN ('self','caregiver','system') THEN
    RAISE EXCEPTION 'created_by_kind must be self, caregiver, or system (got %)', NEW.created_by_kind;
  END IF;
  RETURN NEW;
END
$$;

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'journal_entries',
    'medication_doses',
    'seizure_events',
    'medications',
    'biometrics',
    'report_documents'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'trg_validate_created_by_kind_' || t, t);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE INSERT OR UPDATE OF created_by_kind ON public.%I FOR EACH ROW EXECUTE FUNCTION public.validate_created_by_kind()',
      'trg_validate_created_by_kind_' || t, t
    );
  END LOOP;
END
$$;
-- === 20260601135112_b827996f-c9ba-4230-8245-9067c9983483.sql ===
CREATE TABLE public.care_caregiver_visits (
  relationship_id uuid PRIMARY KEY REFERENCES public.care_relationships(id) ON DELETE CASCADE,
  caregiver_id uuid NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_by_tab jsonb NOT NULL DEFAULT '{}'::jsonb,
  dismissed_alert_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_caregiver_visits TO authenticated;
GRANT ALL ON public.care_caregiver_visits TO service_role;
ALTER TABLE public.care_caregiver_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "caregiver reads own visits" ON public.care_caregiver_visits
  FOR SELECT TO authenticated USING (caregiver_id = auth.uid());
CREATE POLICY "caregiver writes own visits" ON public.care_caregiver_visits
  FOR ALL TO authenticated USING (caregiver_id = auth.uid()) WITH CHECK (caregiver_id = auth.uid());
CREATE INDEX care_caregiver_visits_caregiver_idx ON public.care_caregiver_visits(caregiver_id);
-- === 20260602001436_7109d7bc-648b-4d23-9dbc-8f8b23e35364.sql ===
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS care_daily_digest_enabled boolean NOT NULL DEFAULT true;
-- === 20260602011230_9423d42b-c9f9-4f3e-87f8-8827dea19684.sql ===
ALTER TABLE public.care_relationships
  ADD COLUMN IF NOT EXISTS relationship_label TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS pronouns TEXT;
-- === 20260602011831_108a7b83-4beb-4a75-b178-67d2c11be202.sql ===

-- Care chat: 1:1 + optional group threads between owners and caregivers

CREATE TABLE public.care_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('direct', 'group')),
  relationship_id uuid REFERENCES public.care_relationships(id) ON DELETE CASCADE,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX care_threads_direct_unique
  ON public.care_threads(owner_id, relationship_id)
  WHERE kind = 'direct';
CREATE UNIQUE INDEX care_threads_group_unique
  ON public.care_threads(owner_id)
  WHERE kind = 'group';

CREATE TABLE public.care_thread_participants (
  thread_id uuid NOT NULL REFERENCES public.care_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'caregiver')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz,
  PRIMARY KEY (thread_id, user_id)
);
CREATE INDEX care_thread_participants_user_idx
  ON public.care_thread_participants(user_id);

CREATE TABLE public.care_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.care_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX care_messages_thread_idx
  ON public.care_messages(thread_id, created_at DESC);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_threads TO authenticated;
GRANT ALL ON public.care_threads TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_thread_participants TO authenticated;
GRANT ALL ON public.care_thread_participants TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_messages TO authenticated;
GRANT ALL ON public.care_messages TO service_role;

-- RLS
ALTER TABLE public.care_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_messages ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user a participant in a thread?
CREATE OR REPLACE FUNCTION public.is_care_thread_participant(_thread_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.care_thread_participants
    WHERE thread_id = _thread_id AND user_id = _user_id
  );
$$;

-- care_threads policies
CREATE POLICY care_threads_select ON public.care_threads
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR public.is_care_thread_participant(id, auth.uid())
  );

CREATE POLICY care_threads_owner_all ON public.care_threads
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- care_thread_participants policies
CREATE POLICY care_thread_participants_select ON public.care_thread_participants
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.care_threads t
      WHERE t.id = care_thread_participants.thread_id AND t.owner_id = auth.uid()
    )
  );

CREATE POLICY care_thread_participants_owner_write ON public.care_thread_participants
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.care_threads t WHERE t.id = thread_id AND t.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.care_threads t WHERE t.id = thread_id AND t.owner_id = auth.uid())
  );

CREATE POLICY care_thread_participants_self_update ON public.care_thread_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- care_messages policies
CREATE POLICY care_messages_select ON public.care_messages
  FOR SELECT TO authenticated
  USING (public.is_care_thread_participant(thread_id, auth.uid()));

CREATE POLICY care_messages_insert ON public.care_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_care_thread_participant(thread_id, auth.uid())
  );

CREATE POLICY care_messages_soft_delete ON public.care_messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Trigger: bump care_threads.last_message_at on new message
CREATE OR REPLACE FUNCTION public.bump_care_thread_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.care_threads
    SET last_message_at = NEW.created_at
    WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER care_messages_bump_thread
  AFTER INSERT ON public.care_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_care_thread_last_message();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.care_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.care_threads;

-- === 20260602020933_294ae466-6df3-4e0c-829a-f3aa277644bd.sql ===

CREATE TABLE public.hydration_intake (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  consumed_at timestamptz NOT NULL DEFAULT now(),
  volume_ml integer NOT NULL CHECK (volume_ml > 0 AND volume_ml <= 5000),
  kind text NOT NULL DEFAULT 'water' CHECK (kind IN ('water','electrolyte','coffee','tea','other')),
  electrolyte_brand text,
  sodium_mg integer CHECK (sodium_mg IS NULL OR (sodium_mg >= 0 AND sodium_mg <= 10000)),
  notes text,
  created_by_kind text NOT NULL DEFAULT 'self',
  created_by_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_hydration_user_time ON public.hydration_intake(user_id, consumed_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hydration_intake TO authenticated;
GRANT ALL ON public.hydration_intake TO service_role;
ALTER TABLE public.hydration_intake ENABLE ROW LEVEL SECURITY;
CREATE POLICY hydration_own ON public.hydration_intake FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Caregivers with active relationship + biometrics-style scope can read/write
CREATE POLICY hydration_caregiver_select ON public.hydration_intake FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM care_relationships r
    WHERE r.owner_id = hydration_intake.user_id
      AND r.caregiver_id = auth.uid()
      AND r.status = 'active'
  ));
CREATE POLICY hydration_caregiver_insert ON public.hydration_intake FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM care_relationships r
    WHERE r.owner_id = hydration_intake.user_id
      AND r.caregiver_id = auth.uid()
      AND r.status = 'active'
  ) AND created_by_id = auth.uid());

CREATE TABLE public.aura_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  kind text NOT NULL DEFAULT 'deja_vu' CHECK (kind IN ('deja_vu','jamais_vu','epigastric','visual','olfactory','emotional','other')),
  duration_seconds integer CHECK (duration_seconds IS NULL OR (duration_seconds >= 0 AND duration_seconds <= 3600)),
  notes text,
  led_to_seizure boolean NOT NULL DEFAULT false,
  linked_seizure_id uuid,
  created_by_kind text NOT NULL DEFAULT 'self',
  created_by_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_aura_user_time ON public.aura_events(user_id, occurred_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aura_events TO authenticated;
GRANT ALL ON public.aura_events TO service_role;
ALTER TABLE public.aura_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY aura_own ON public.aura_events FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY aura_caregiver_select ON public.aura_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM care_relationships r
    WHERE r.owner_id = aura_events.user_id
      AND r.caregiver_id = auth.uid()
      AND r.status = 'active'
  ));
CREATE POLICY aura_caregiver_insert ON public.aura_events FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM care_relationships r
    WHERE r.owner_id = aura_events.user_id
      AND r.caregiver_id = auth.uid()
      AND r.status = 'active'
  ) AND created_by_id = auth.uid());

-- === 20260602092051_a3c08150-07d4-48ac-ab78-c0f6a11453c5.sql ===

-- 1. Per-user hydration goal
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_water_goal_ml integer NOT NULL DEFAULT 2000
  CHECK (daily_water_goal_ml >= 250 AND daily_water_goal_ml <= 10000);

-- 2. Auto-link recent auras to a newly-logged seizure
CREATE OR REPLACE FUNCTION public.link_recent_aura_to_seizure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.aura_events
  SET linked_seizure_id = NEW.id,
      led_to_seizure = true
  WHERE user_id = NEW.user_id
    AND linked_seizure_id IS NULL
    AND occurred_at >= NEW.started_at - INTERVAL '30 minutes'
    AND occurred_at <= NEW.started_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_recent_aura_to_seizure ON public.seizure_events;
CREATE TRIGGER trg_link_recent_aura_to_seizure
AFTER INSERT ON public.seizure_events
FOR EACH ROW
EXECUTE FUNCTION public.link_recent_aura_to_seizure();

-- === 20260602092115_025efcd4-4d6b-49d6-bc15-4275a786a4ec.sql ===

REVOKE EXECUTE ON FUNCTION public.link_recent_aura_to_seizure() FROM PUBLIC, anon, authenticated;

-- === 20260603004133_ba1f80f5-0f50-4bf3-bf7b-00ff55f71369.sql ===
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS feature_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS conditions_archived jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS family_history jsonb NOT NULL DEFAULT '[]'::jsonb;
-- === 20260603010733_66d1654c-a57f-40b0-8b8b-4479fcf4fb77.sql ===
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.report_metric_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  metric_key text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  hidden boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, metric_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_metric_preferences TO authenticated;
GRANT ALL ON public.report_metric_preferences TO service_role;

ALTER TABLE public.report_metric_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rmp_own_select" ON public.report_metric_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "rmp_own_insert" ON public.report_metric_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rmp_own_update" ON public.report_metric_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rmp_own_delete" ON public.report_metric_preferences FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_rmp_user_order ON public.report_metric_preferences (user_id, sort_order);

CREATE TRIGGER trg_rmp_updated_at BEFORE UPDATE ON public.report_metric_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- === 20260603024927_8f0ff6c2-3633-4b72-8b00-494a5f0c099f.sql ===
ALTER TABLE public.care_relationships
ADD COLUMN IF NOT EXISTS caregiver_hidden_features jsonb NOT NULL DEFAULT '[]'::jsonb;
-- === 20260603025738_5911f431-9f09-4922-80b7-0ada69c1a284.sql ===
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suggestions_dismissed jsonb NOT NULL DEFAULT '[]'::jsonb;
-- === 20260603035649_c8332fbe-98a6-4252-af7a-395a885aceee.sql ===
ALTER TABLE public.oura_tokens ADD COLUMN IF NOT EXISTS last_sync_at timestamptz;
-- === 20260603041009_dd84630a-8b77-4b70-9477-8a65239a4d26.sql ===

CREATE TYPE public.promo_code_kind AS ENUM ('invite','discount','share');

CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text,
  kind public.promo_code_kind NOT NULL DEFAULT 'invite',
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY promo_codes_admin_all ON public.promo_codes
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY promo_codes_read_active ON public.promo_codes
  FOR SELECT TO authenticated
  USING (active = true);

CREATE TABLE public.promo_code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (promo_code_id, user_id)
);

GRANT SELECT, INSERT ON public.promo_code_redemptions TO authenticated;
GRANT ALL ON public.promo_code_redemptions TO service_role;

ALTER TABLE public.promo_code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY promo_redemptions_own_insert ON public.promo_code_redemptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY promo_redemptions_own_select ON public.promo_code_redemptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_promo_redemptions_code ON public.promo_code_redemptions(promo_code_id);

-- === 20260603043924_200a1f4b-52a6-4a1d-80be-7da49ecfea37.sql ===
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_path text;
-- === 20260603044520_d15d081a-12fb-42f4-8db3-e0064746151f.sql ===
DROP POLICY IF EXISTS community_reactions_read ON public.community_reactions;
CREATE POLICY community_reactions_read
  ON public.community_reactions
  FOR SELECT
  TO authenticated
  USING (true);
REVOKE SELECT ON public.community_reactions FROM anon;
-- === 20260604022534_fe7aeaa5-dc9f-4a7b-b2e7-12904eb785f4.sql ===
ALTER TABLE public.whoop_tokens
  ADD COLUMN IF NOT EXISTS sync_interval_hours smallint NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS last_sync_at timestamptz;

ALTER TABLE public.whoop_tokens
  DROP CONSTRAINT IF EXISTS whoop_tokens_sync_interval_hours_check;

ALTER TABLE public.whoop_tokens
  ADD CONSTRAINT whoop_tokens_sync_interval_hours_check
  CHECK (sync_interval_hours = ANY (ARRAY[0, 1, 6, 12, 24]));

DROP TRIGGER IF EXISTS whoop_tokens_set_updated_at ON public.whoop_tokens;
CREATE TRIGGER whoop_tokens_set_updated_at
  BEFORE UPDATE ON public.whoop_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- === 20260604032530_4246749c-563f-4f77-ac2f-427eb8ee5c01.sql ===

-- Allow apple_health source
ALTER TABLE public.biometrics DROP CONSTRAINT IF EXISTS biometrics_source_check;
ALTER TABLE public.biometrics ADD CONSTRAINT biometrics_source_check
  CHECK (source = ANY (ARRAY['oura'::text, 'whoop'::text, 'apple_health'::text, 'manual'::text, 'computed'::text]));

-- New metric column
ALTER TABLE public.biometrics ADD COLUMN IF NOT EXISTS vo2_max numeric;

-- Tokens / per-user webhook secret
CREATE TABLE IF NOT EXISTS public.apple_health_tokens (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  webhook_secret text NOT NULL,
  last_sync_at timestamptz,
  last_webhook_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.apple_health_tokens TO authenticated;
GRANT ALL ON public.apple_health_tokens TO service_role;

ALTER TABLE public.apple_health_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "apple_health_tokens_own"
  ON public.apple_health_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_apple_health_tokens_updated_at ON public.apple_health_tokens;
CREATE TRIGGER update_apple_health_tokens_updated_at
  BEFORE UPDATE ON public.apple_health_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Quick lookup by secret for webhook auth
CREATE UNIQUE INDEX IF NOT EXISTS apple_health_tokens_secret_idx
  ON public.apple_health_tokens(webhook_secret);

-- === 20260604044433_667e5725-2ccc-43fb-9e3b-92f07c1962d8.sql ===
-- Restrict promo_codes SELECT to admins only. Redemption lookups happen
-- server-side via supabaseAdmin (service role), so authenticated end users
-- never need to read the table directly.
DROP POLICY IF EXISTS "promo_codes_read_active" ON public.promo_codes;
DROP POLICY IF EXISTS promo_codes_read_active ON public.promo_codes;

CREATE POLICY "promo_codes_admin_read"
ON public.promo_codes
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
-- === 20260604054204_089c3a24-4ce5-43ac-be4f-b2b21bbd4592.sql ===
-- Tighten pending_changes INSERT: ensure owner_id matches the relationship's owner_id
DROP POLICY IF EXISTS pending_caregiver_insert ON public.pending_changes;
CREATE POLICY pending_caregiver_insert ON public.pending_changes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = caregiver_id
    AND EXISTS (
      SELECT 1 FROM public.care_relationships r
      WHERE r.id = pending_changes.relationship_id
        AND r.caregiver_id = auth.uid()
        AND r.owner_id = pending_changes.owner_id
        AND r.status = 'active'::care_relationship_status
    )
  );

-- Tighten care_audit_log INSERT: actor must be related to owner_id (as owner or active caregiver)
DROP POLICY IF EXISTS audit_actor_insert ON public.care_audit_log;
CREATE POLICY audit_actor_insert ON public.care_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = actor_id
    AND (
      auth.uid() = owner_id
      OR EXISTS (
        SELECT 1 FROM public.care_relationships r
        WHERE r.owner_id = care_audit_log.owner_id
          AND r.caregiver_id = auth.uid()
          AND r.status = 'active'::care_relationship_status
          AND (relationship_id IS NULL OR r.id = care_audit_log.relationship_id)
      )
    )
  );

-- Restrict phi_access_log INSERT to service_role only (logs should be server-written)
DROP POLICY IF EXISTS phi_log_actor_insert ON public.phi_access_log;
CREATE POLICY phi_log_service_insert ON public.phi_access_log
  FOR INSERT TO public
  WITH CHECK (auth.role() = 'service_role');
-- === 20260604060341_0fad251b-19d1-4a31-973d-b42050d3a2bf.sql ===
ALTER TABLE public.care_thread_participants
  ADD COLUMN IF NOT EXISTS muted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS muted_until timestamptz;

-- Allow participants to delete (leave) their own membership row.
DROP POLICY IF EXISTS care_thread_participants_self_delete ON public.care_thread_participants;
CREATE POLICY care_thread_participants_self_delete
  ON public.care_thread_participants
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
-- === 20260604063800_ad98a3b7-1ff9-4d0e-9d4d-5535387fe08f.sql ===

CREATE TABLE public.medical_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  window_from date NOT NULL,
  window_to date NOT NULL,
  file_path text NOT NULL,
  sections jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary text,
  share_token text UNIQUE,
  share_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX medical_reports_user_id_idx ON public.medical_reports(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_reports TO authenticated;
GRANT ALL ON public.medical_reports TO service_role;

ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own medical reports"
  ON public.medical_reports FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER medical_reports_updated_at
  BEFORE UPDATE ON public.medical_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.medical_report_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.medical_reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('download','email_self','email_provider','care_thread')),
  recipient_email text,
  recipient_user_id uuid,
  thread_id uuid,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX medical_report_shares_report_id_idx ON public.medical_report_shares(report_id, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.medical_report_shares TO authenticated;
GRANT ALL ON public.medical_report_shares TO service_role;

ALTER TABLE public.medical_report_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own report shares"
  ON public.medical_report_shares FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- === 20260604063830_4c32fd5c-38f5-49a8-9de1-2dfd959816c7.sql ===

CREATE POLICY "Users read own medical-reports files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'medical-reports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users upload own medical-reports files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'medical-reports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own medical-reports files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'medical-reports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own medical-reports files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'medical-reports' AND (storage.foldername(name))[1] = auth.uid()::text);

-- === 20260604080531_b3b644bd-41a6-4e45-8058-287b10e1254b.sql ===

-- 1) metric_dictionary: panel category + SI unit
ALTER TABLE public.metric_dictionary
  ADD COLUMN IF NOT EXISTS panel TEXT,
  ADD COLUMN IF NOT EXISTS unit_si TEXT;

-- Backfill panel for common keys (idempotent; only fills NULLs)
UPDATE public.metric_dictionary SET panel = 'lipids'
  WHERE panel IS NULL AND metric_key IN ('total_cholesterol','ldl','ldl_cholesterol','hdl','hdl_cholesterol','triglycerides','non_hdl','vldl','apo_b','lipoprotein_a');
UPDATE public.metric_dictionary SET panel = 'cardiometabolic'
  WHERE panel IS NULL AND metric_key IN ('glucose','fasting_glucose','hba1c','insulin','homa_ir','c_peptide','blood_pressure_systolic','blood_pressure_diastolic');
UPDATE public.metric_dictionary SET panel = 'thyroid'
  WHERE panel IS NULL AND metric_key IN ('tsh','t3','t4','free_t3','free_t4','reverse_t3','thyroid_antibodies','anti_tpo','anti_tg');
UPDATE public.metric_dictionary SET panel = 'liver'
  WHERE panel IS NULL AND metric_key IN ('alt','ast','alp','ggt','bilirubin','total_bilirubin','direct_bilirubin','albumin','total_protein');
UPDATE public.metric_dictionary SET panel = 'kidney'
  WHERE panel IS NULL AND metric_key IN ('creatinine','egfr','bun','urea','uric_acid','sodium','potassium','chloride','co2','calcium','phosphorus','magnesium');
UPDATE public.metric_dictionary SET panel = 'hematology'
  WHERE panel IS NULL AND metric_key IN ('hemoglobin','hematocrit','wbc','rbc','platelets','mcv','mch','mchc','rdw','neutrophils','lymphocytes','monocytes','eosinophils','basophils','ferritin','iron','tibc','transferrin_saturation');
UPDATE public.metric_dictionary SET panel = 'vitamins'
  WHERE panel IS NULL AND metric_key IN ('vitamin_d','vitamin_b12','b12','folate','vitamin_a','vitamin_e','vitamin_k');
UPDATE public.metric_dictionary SET panel = 'hormones'
  WHERE panel IS NULL AND metric_key IN ('testosterone','free_testosterone','estradiol','progesterone','cortisol','dhea_s','shbg','fsh','lh','prolactin');
UPDATE public.metric_dictionary SET panel = 'inflammation'
  WHERE panel IS NULL AND metric_key IN ('crp','hs_crp','esr','homocysteine');
UPDATE public.metric_dictionary SET panel = 'other'
  WHERE panel IS NULL;

CREATE INDEX IF NOT EXISTS metric_dictionary_panel_idx ON public.metric_dictionary(panel);

-- 2) report_documents: synopsis + panel hints + narrative findings
ALTER TABLE public.report_documents
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS panel_keys TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS findings JSONB,
  ADD COLUMN IF NOT EXISTS impressions JSONB;

-- 3) medical_report_schedules — opt-in monthly auto-send
CREATE TABLE IF NOT EXISTS public.medical_report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cadence TEXT NOT NULL DEFAULT 'monthly',
  day_of_month INTEGER NOT NULL DEFAULT 1 CHECK (day_of_month BETWEEN 1 AND 28),
  window_days INTEGER NOT NULL DEFAULT 30 CHECK (window_days BETWEEN 7 AND 365),
  sections JSONB NOT NULL DEFAULT '{}'::jsonb,
  recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_report_schedules TO authenticated;
GRANT ALL ON public.medical_report_schedules TO service_role;

ALTER TABLE public.medical_report_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their schedules"
  ON public.medical_report_schedules FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_medical_report_schedules_updated_at
  BEFORE UPDATE ON public.medical_report_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS medical_report_schedules_user_active_idx
  ON public.medical_report_schedules(user_id, active);

-- 4) medical_report_public_links — clinician share links
CREATE TABLE IF NOT EXISTS public.medical_report_public_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.medical_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  viewer_label TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  opened_count INTEGER NOT NULL DEFAULT 0,
  last_opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_report_public_links TO authenticated;
GRANT ALL ON public.medical_report_public_links TO service_role;

ALTER TABLE public.medical_report_public_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their share links"
  ON public.medical_report_public_links FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS medical_report_public_links_token_idx
  ON public.medical_report_public_links(token);
CREATE INDEX IF NOT EXISTS medical_report_public_links_user_idx
  ON public.medical_report_public_links(user_id, created_at DESC);

-- === 20260604161138_fafc0bc9-c790-4cff-903b-5af1979dc15c.sql ===
ALTER TABLE public.care_relationships
  ADD COLUMN IF NOT EXISTS digest_muted boolean NOT NULL DEFAULT false;
-- === 20260604195114_4106b94a-66bc-4591-b17b-22419c815c0f.sql ===
ALTER PUBLICATION supabase_realtime ADD TABLE public.seizure_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.medication_doses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_changes;
-- === 20260605102606_1b090b14-13ad-4d4b-850f-115a2016e3bb.sql ===
-- Restrict column-level SELECT on invite_token. Server functions read it via the
-- service-role client (supabaseAdmin); no client-side code reads it directly.
REVOKE SELECT (invite_token) ON public.care_relationships FROM authenticated;
REVOKE SELECT (invite_token) ON public.care_relationships FROM anon;
GRANT SELECT (invite_token) ON public.care_relationships TO service_role;
-- === 20260605110443_7ddeb601-7941-4d5f-a2bf-8291a30affd5.sql ===

-- Phase 7d: quiet hours, weekly digest opt-in, missed-dose escalation tracking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS quiet_hours_start time,
  ADD COLUMN IF NOT EXISTS quiet_hours_end time,
  ADD COLUMN IF NOT EXISTS weekly_digest_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE public.medication_doses
  ADD COLUMN IF NOT EXISTS missed_notified_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_med_doses_pending_missed
  ON public.medication_doses (scheduled_at)
  WHERE status = 'pending' AND missed_notified_at IS NULL;

-- === 20260605123812_11c98c8e-fbf5-4d79-9a9e-4bf1e30e30e5.sql ===
DROP POLICY IF EXISTS community_reactions_read ON public.community_reactions;
CREATE POLICY community_reactions_read
  ON public.community_reactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.community_posts p
      WHERE p.id = community_reactions.post_id
        AND p.hidden = false
    )
  );
-- === 20260605173721_701a9baf-4551-4e50-beec-0209ba3573d7.sql ===
-- Lock down sensitive columns at the column-grant level.
-- RLS policies cannot exclude individual columns; column GRANTs can.

-- 1) care_relationships.invite_token must only be readable by service_role.
--    Caregivers currently match `care_rel_caregiver_select` and can see every
--    column on their own row. Revoke column-level SELECT so the policy can no
--    longer expose the token even when the row is readable.
REVOKE SELECT (invite_token) ON public.care_relationships FROM anon, authenticated;

-- 2) community_posts.user_id and community_comments.user_id are internal
--    UUIDs. Anon traffic can enumerate them via the public-read policies.
--    Authenticated callers still need user_id (to know which posts are theirs
--    and to enforce edit rules in the UI), so we only revoke from anon.
REVOKE SELECT (user_id) ON public.community_posts FROM anon;
REVOKE SELECT (user_id) ON public.community_comments FROM anon;

-- === 20260607032015_09c7dea0-2696-4722-861a-3d793ee293f2.sql ===
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS biometrics_pinned text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS biometrics_order jsonb NOT NULL DEFAULT '{}'::jsonb;
-- === 20260607032542_8d9118ae-1722-4089-867c-9966b156b51a.sql ===
CREATE TABLE public.food_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consumed_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  portion text,
  calories_kcal numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  photo_path text,
  source text NOT NULL DEFAULT 'manual',
  ai_confidence numeric,
  note text,
  created_by_id uuid,
  created_by_kind text NOT NULL DEFAULT 'self',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_entries TO authenticated;
GRANT ALL ON public.food_entries TO service_role;

ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY food_entries_own ON public.food_entries
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY food_entries_caregiver_select ON public.food_entries
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM care_relationships r
    WHERE r.owner_id = food_entries.user_id
      AND r.caregiver_id = auth.uid()
      AND r.status = 'active'
  ));

CREATE POLICY food_entries_caregiver_insert ON public.food_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM care_relationships r
      WHERE r.owner_id = food_entries.user_id
        AND r.caregiver_id = auth.uid()
        AND r.status = 'active'
    ) AND created_by_id = auth.uid()
  );

CREATE INDEX food_entries_user_consumed_idx ON public.food_entries (user_id, consumed_at DESC);

CREATE TRIGGER food_entries_set_updated_at
  BEFORE UPDATE ON public.food_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- === 20260607040527_118810d7-257e-4e3e-8217-4658f1648d28.sql ===

-- 1. Prevent caregivers from reading invite_token column
REVOKE SELECT (invite_token) ON public.care_relationships FROM authenticated;
REVOKE SELECT (invite_token) ON public.care_relationships FROM anon;

-- 2. Require care_scopes write grant on caregiver inserts
DROP POLICY IF EXISTS aura_caregiver_insert ON public.aura_events;
CREATE POLICY aura_caregiver_insert ON public.aura_events
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by_id = auth.uid()
    AND public.has_care_scope(user_id, auth.uid(), 'seizures:write')
  );

DROP POLICY IF EXISTS hydration_caregiver_insert ON public.hydration_intake;
CREATE POLICY hydration_caregiver_insert ON public.hydration_intake
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by_id = auth.uid()
    AND public.has_care_scope(user_id, auth.uid(), 'journal:write')
  );

DROP POLICY IF EXISTS food_entries_caregiver_insert ON public.food_entries;
CREATE POLICY food_entries_caregiver_insert ON public.food_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by_id = auth.uid()
    AND public.has_care_scope(user_id, auth.uid(), 'journal:write')
  );

-- 3. Restrictive guard on promo_codes so only admins can read, even if a permissive policy is added later
CREATE POLICY promo_codes_admins_only ON public.promo_codes
  AS RESTRICTIVE
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

-- === 20260607043353_1c40e699-7456-4f3b-896e-d0b64c66ec15.sql ===

-- Care chat attachments: scope to thread participants only.
-- Path layout: {thread_id}/{message_id_or_pending}/{filename}

CREATE POLICY "care_chat_attachments_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'care-chat-attachments'
    AND public.is_care_thread_participant(
      ((storage.foldername(name))[1])::uuid,
      auth.uid()
    )
  );

CREATE POLICY "care_chat_attachments_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'care-chat-attachments'
    AND public.is_care_thread_participant(
      ((storage.foldername(name))[1])::uuid,
      auth.uid()
    )
    AND owner = auth.uid()
  );

CREATE POLICY "care_chat_attachments_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'care-chat-attachments'
    AND owner = auth.uid()
  );

-- === 20260607052335_bcb59ffa-f9a3-4bf3-abf5-8f9f610d9d41.sql ===

-- 1. Revoke caregiver/anon read access to the invite_token column.
-- The owner (auth.uid() = owner_id) policy still works because UPDATE/INSERT
-- happens through the owner-all policy, and service_role retains full access.
REVOKE SELECT (invite_token) ON public.care_relationships FROM authenticated;
REVOKE SELECT (invite_token) ON public.care_relationships FROM anon;

-- Re-grant SELECT on all other columns to authenticated so caregivers can
-- still read their relationship row via care_rel_caregiver_select.
GRANT SELECT (
  id, created_at, accepted_at, owner_id, revoked_at, status, role,
  invite_email, caregiver_id, expires_at, relationship_label,
  caregiver_hidden_features, digest_muted
) ON public.care_relationships TO authenticated;

-- 2. Explicit deny-UPDATE policy on the care-chat-attachments storage bucket
-- to make immutability of attachments explicit (not just implicit default-deny).
DROP POLICY IF EXISTS "care_chat_attachments_no_update" ON storage.objects;
CREATE POLICY "care_chat_attachments_no_update"
ON storage.objects
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (bucket_id <> 'care-chat-attachments')
WITH CHECK (bucket_id <> 'care-chat-attachments');

-- === 20260607224715_4dca58e6-182a-43fe-8e98-14e678a3d098.sql ===
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_provider text NOT NULL DEFAULT 'claude';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_ai_provider_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_ai_provider_check
  CHECK (ai_provider IN ('claude','openai','gemini','grok','maya','lovable'));
-- === 20260608015157_e7f72097-545c-42b8-a8f7-6e4e05724659.sql ===

-- 1. Identity + duplicate fields on report_documents
ALTER TABLE public.report_documents
  ADD COLUMN IF NOT EXISTS patient_name text,
  ADD COLUMN IF NOT EXISTS patient_dob date,
  ADD COLUMN IF NOT EXISTS identity_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS duplicate_of uuid REFERENCES public.report_documents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_report_documents_identity_status
  ON public.report_documents(user_id, identity_status);
CREATE INDEX IF NOT EXISTS idx_report_documents_duplicate_of
  ON public.report_documents(duplicate_of);

-- 2. Cache for AI insights per (user, metric, latest reading anchor)
CREATE TABLE IF NOT EXISTS public.metric_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_key text NOT NULL,
  latest_at text NOT NULL,
  summary text,
  bullets jsonb NOT NULL DEFAULT '[]'::jsonb,
  suggested_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, metric_key, latest_at)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.metric_insights TO authenticated;
GRANT ALL ON public.metric_insights TO service_role;
ALTER TABLE public.metric_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY metric_insights_own ON public.metric_insights
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Platform rules (super-admin managed)
CREATE TABLE IF NOT EXISTS public.platform_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('platform','role','user')),
  scope_value text,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT 'true'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_rules_scope_key
  ON public.platform_rules(scope, COALESCE(scope_value, ''), key);

GRANT SELECT ON public.platform_rules TO authenticated;
GRANT ALL ON public.platform_rules TO service_role;
ALTER TABLE public.platform_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_rules_read ON public.platform_rules
  FOR SELECT TO authenticated USING (enabled = true);
CREATE POLICY platform_rules_admin_write ON public.platform_rules
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(),'admin'::app_role));

CREATE OR REPLACE FUNCTION public.platform_rules_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_platform_rules_updated_at ON public.platform_rules;
CREATE TRIGGER trg_platform_rules_updated_at
  BEFORE UPDATE ON public.platform_rules
  FOR EACH ROW EXECUTE FUNCTION public.platform_rules_touch_updated_at();

-- Seed the first rule that the report processor reads.
INSERT INTO public.platform_rules (scope, scope_value, key, value, description)
VALUES ('platform', NULL, 'require_identity_match_for_metrics', 'true'::jsonb,
        'When true, lab readings from a report whose patient name or DOB does not match the user profile are hidden from trends until the user approves them.')
ON CONFLICT (scope, COALESCE(scope_value, ''), key) DO NOTHING;

-- === 20260608015911_7840fe18-ba70-4b75-a4ce-9d63d5310f89.sql ===

-- 1. Platform rule audit
CREATE TABLE public.platform_rule_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id uuid,
  scope text,
  scope_value text,
  key text NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('create','update','delete','enable','disable')),
  before jsonb,
  after jsonb,
  at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.platform_rule_audit TO authenticated;
GRANT ALL ON public.platform_rule_audit TO service_role;

ALTER TABLE public.platform_rule_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_rule_audit_super_admin_read"
  ON public.platform_rule_audit FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "platform_rule_audit_super_admin_insert"
  ON public.platform_rule_audit FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()) AND actor_id = auth.uid());

CREATE INDEX idx_platform_rule_audit_at ON public.platform_rule_audit (at DESC);
CREATE INDEX idx_platform_rule_audit_rule ON public.platform_rule_audit (rule_id, at DESC);

-- 2. report_documents: content hash + user decision memory
ALTER TABLE public.report_documents
  ADD COLUMN IF NOT EXISTS content_hash text,
  ADD COLUMN IF NOT EXISTS user_decision text CHECK (user_decision IN ('kept','rejected'));

CREATE INDEX IF NOT EXISTS idx_report_documents_content_hash
  ON public.report_documents (user_id, content_hash);

-- === 20260608023134_ba61c3c2-64be-4a13-8128-f57981a8a120.sql ===
CREATE TABLE public.report_identity_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name_normalized text NOT NULL,
  dob date,
  source text NOT NULL DEFAULT 'approval',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX report_identity_aliases_unique
  ON public.report_identity_aliases (user_id, name_normalized, COALESCE(dob, '0001-01-01'::date));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_identity_aliases TO authenticated;
GRANT ALL ON public.report_identity_aliases TO service_role;

ALTER TABLE public.report_identity_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "report_identity_aliases_own"
  ON public.report_identity_aliases
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- === 20260608031520_5db84231-136f-4afd-bcf9-b4563c2536c0.sql ===

WITH fingerprints AS (
  SELECT
    d.id,
    d.user_id,
    d.report_date,
    d.created_at,
    COUNT(m.id) AS metric_count,
    md5(string_agg(m.metric_key || ':' || COALESCE(m.value::text, m.value_text, ''), '|' ORDER BY m.metric_key, m.value, m.value_text)) AS sig
  FROM public.report_documents d
  LEFT JOIN public.report_metrics m ON m.report_id = d.id
  WHERE d.duplicate_of IS NULL AND d.report_date IS NOT NULL
  GROUP BY d.id, d.user_id, d.report_date, d.created_at
),
ranked AS (
  SELECT
    id, user_id, report_date, sig, created_at,
    FIRST_VALUE(id) OVER (PARTITION BY user_id, report_date, sig ORDER BY created_at, id) AS keeper_id,
    ROW_NUMBER() OVER (PARTITION BY user_id, report_date, sig ORDER BY created_at, id) AS rn
  FROM fingerprints
  WHERE metric_count > 0
)
UPDATE public.report_documents d
SET duplicate_of = r.keeper_id
FROM ranked r
WHERE d.id = r.id
  AND r.rn > 1
  AND d.duplicate_of IS NULL;

-- === 20260608194238_13b6e5da-8ad0-45b8-bfa3-f4b133ca1611.sql ===
ALTER TABLE public.report_metrics ADD COLUMN source_text TEXT;
GRANT SELECT, INSERT, UPDATE ON public.report_metrics TO authenticated;
GRANT ALL ON public.report_metrics TO service_role;
-- === 20260608230051_4472d5b5-8ff5-4b50-ab84-04cc5730a583.sql ===
ALTER TABLE public.report_documents ADD COLUMN IF NOT EXISTS excluded_from_trends boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_report_documents_excluded ON public.report_documents (user_id, excluded_from_trends);
-- === 20260609002833_3c068525-0b3c-4562-964f-362098863a53.sql ===

-- 1) Condition catalog
CREATE TABLE public.condition_catalog (
  slug TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  short_label TEXT NOT NULL,
  aka TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL,
  traits TEXT[] NOT NULL DEFAULT '{}',
  common_symptoms TEXT[] NOT NULL DEFAULT '{}',
  common_meds TEXT[] NOT NULL DEFAULT '{}',
  key_metrics TEXT[] NOT NULL DEFAULT '{}',
  monitoring_cadence TEXT NOT NULL DEFAULT 'asneeded',
  red_flags TEXT[] NOT NULL DEFAULT '{}',
  disclaimer_tier TEXT NOT NULL DEFAULT 'general',
  sort_order INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.condition_catalog TO anon;
GRANT SELECT ON public.condition_catalog TO authenticated;
GRANT ALL ON public.condition_catalog TO service_role;

ALTER TABLE public.condition_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Condition catalog is public read"
  ON public.condition_catalog
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TRIGGER condition_catalog_set_updated_at
  BEFORE UPDATE ON public.condition_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Profile columns for cached AI care profile
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_care_profile JSONB,
  ADD COLUMN IF NOT EXISTS care_profile_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS care_profile_conditions_hash TEXT;

-- 3) Seed 40 conditions
INSERT INTO public.condition_catalog
  (slug, label, short_label, aka, category, traits, common_symptoms, common_meds, key_metrics, monitoring_cadence, red_flags, disclaimer_tier, sort_order)
VALUES
-- Neurology
('epilepsy','Epilepsy / seizures','Epilepsy',ARRAY['seizures','convulsions'],'neuro',ARRAY['seizure_prone','neuro','sleep_critical'],ARRAY['aura','seizure','postictal fatigue','memory gaps'],ARRAY['levetiracetam','lamotrigine','valproate','clobazam'],ARRAY['seizure_count','aura_count','sleep_hours','med_adherence'],'daily',ARRAY['status epilepticus','seizure longer than 5 minutes','injury during seizure','first ever seizure'],'general',10),
('migraine','Migraine','Migraine',ARRAY['headache'],'neuro',ARRAY['headache','sensory','autonomic'],ARRAY['head pain','aura','nausea','photophobia'],ARRAY['sumatriptan','rizatriptan','propranolol','topiramate'],ARRAY['attack_count','attack_duration','abortive_uses'],'daily',ARRAY['thunderclap headache','worst headache of life','headache with weakness or vision loss','fever and stiff neck'],'general',20),
('cluster_headache','Cluster headache','Cluster',ARRAY['suicide headache'],'neuro',ARRAY['headache','autonomic'],ARRAY['severe one-sided pain','tearing','restlessness'],ARRAY['oxygen','sumatriptan injection','verapamil'],ARRAY['attack_count','bout_length'],'daily',ARRAY['neurological deficits','first ever severe headache'],'general',30),
('parkinsons','Parkinson''s disease','Parkinson''s',ARRAY['PD'],'neuro',ARRAY['neuro','motor','cognitive_load'],ARRAY['tremor','rigidity','slowness','off periods','freezing'],ARRAY['carbidopa-levodopa','ropinirole','rasagiline'],ARRAY['on_off_log','med_adherence','falls'],'daily',ARRAY['fall with injury','severe confusion','swallowing trouble'],'general',40),
('multiple_sclerosis','Multiple sclerosis','MS',ARRAY['MS'],'neuro',ARRAY['neuro','inflammatory','pacing_required','sensory'],ARRAY['fatigue','numbness','vision change','spasticity','heat sensitivity'],ARRAY['ocrelizumab','natalizumab','glatiramer','interferon beta'],ARRAY['fatigue_level','flare_count','mobility'],'weekly',ARRAY['sudden vision loss','new severe weakness','loss of bladder control'],'general',50),
('stroke_recovery','Stroke recovery','Stroke',ARRAY['post-stroke','TIA recovery'],'neuro',ARRAY['neuro','cardiovascular','cognitive_load','pacing_required'],ARRAY['weakness','aphasia','fatigue','vision changes'],ARRAY['aspirin','clopidogrel','atorvastatin','antihypertensives'],ARRAY['bp','adherence','therapy_sessions'],'daily',ARRAY['FAST symptoms returning','sudden severe headache','new weakness or numbness'],'general',60),
('neuropathy','Peripheral neuropathy','Neuropathy',ARRAY['nerve pain'],'neuro',ARRAY['pain','neuro','sensory'],ARRAY['burning','tingling','numbness','balance trouble'],ARRAY['gabapentin','pregabalin','duloxetine'],ARRAY['pain_level','sleep_disruption'],'weekly',ARRAY['sudden new weakness','foot ulcer','loss of bowel/bladder control'],'general',70),

-- Neurodevelopmental
('autism','Autism / ASD','Autism',ARRAY['ASD','autism spectrum','autistic'],'neurodevelopmental',ARRAY['neurodevelopmental','sensory','routine_sensitive','cognitive_load'],ARRAY['sensory overload','meltdown','shutdown','burnout','social fatigue'],ARRAY[]::text[],ARRAY['sensory_load','energy_level','routine_disruption','sleep_quality'],'daily',ARRAY['severe shutdown lasting days','self-injury','suicidal thoughts'],'sensitive',80),
('adhd','ADHD','ADHD',ARRAY['attention deficit','ADD'],'neurodevelopmental',ARRAY['neurodevelopmental','cognitive_load','mood'],ARRAY['focus difficulty','executive function','restlessness','rejection sensitivity'],ARRAY['methylphenidate','lisdexamfetamine','atomoxetine'],ARRAY['focus_rating','sleep_hours','med_adherence'],'daily',ARRAY['severe mood crash','stimulant side effects (chest pain, racing heart)','suicidal thoughts'],'sensitive',90),
('dementia','Alzheimer''s & dementia','Dementia',ARRAY['Alzheimer''s','memory loss'],'neurodevelopmental',ARRAY['cognitive_load','neuro','caregiver_helpful'],ARRAY['memory loss','confusion','wandering','sundowning'],ARRAY['donepezil','memantine','rivastigmine'],ARRAY['orientation','behavioral_episodes','sleep'],'daily',ARRAY['sudden severe confusion','falls','wandering at night'],'sensitive',100),

-- Mental health
('depression','Depression','Depression',ARRAY['major depressive disorder','MDD'],'mental_health',ARRAY['mood','sleep_critical','pacing_required'],ARRAY['low mood','anhedonia','fatigue','sleep changes','appetite changes'],ARRAY['sertraline','escitalopram','bupropion','fluoxetine'],ARRAY['mood_rating','sleep_hours','energy_level'],'daily',ARRAY['suicidal thoughts','plan or means to harm self','psychosis'],'sensitive',110),
('anxiety','Anxiety','Anxiety',ARRAY['generalized anxiety','GAD','panic'],'mental_health',ARRAY['mood','autonomic','sleep_critical'],ARRAY['worry','racing thoughts','panic','restlessness','muscle tension'],ARRAY['sertraline','escitalopram','buspirone','propranolol prn'],ARRAY['anxiety_rating','panic_count','sleep'],'daily',ARRAY['panic with chest pain not relieved','suicidal thoughts','can''t function'],'sensitive',120),
('bipolar','Bipolar disorder','Bipolar',ARRAY['manic depression'],'mental_health',ARRAY['mood','sleep_critical'],ARRAY['mood swings','elevated energy','reduced sleep need','depressive episodes'],ARRAY['lithium','lamotrigine','quetiapine','valproate'],ARRAY['mood_rating','sleep_hours','med_adherence'],'daily',ARRAY['suicidal thoughts','psychosis','dangerous impulsivity','severe mania'],'sensitive',130),
('ptsd','PTSD','PTSD',ARRAY['post traumatic stress'],'mental_health',ARRAY['mood','autonomic','sleep_critical'],ARRAY['flashbacks','nightmares','hypervigilance','dissociation'],ARRAY['sertraline','paroxetine','prazosin'],ARRAY['mood_rating','sleep_quality','trigger_log'],'daily',ARRAY['suicidal thoughts','severe dissociation','self-harm urges'],'sensitive',140),
('ocd','OCD','OCD',ARRAY['obsessive compulsive'],'mental_health',ARRAY['mood','cognitive_load'],ARRAY['intrusive thoughts','compulsions','ritualizing'],ARRAY['fluoxetine','sertraline','clomipramine'],ARRAY['compulsion_time','distress_rating'],'daily',ARRAY['suicidal thoughts','self-harm','severe functional impairment'],'sensitive',150),
('eating_disorder','Eating disorder','Eating',ARRAY['anorexia','bulimia','BED','ARFID'],'mental_health',ARRAY['mood','nutritional','sensory'],ARRAY['restriction','bingeing','purging','body image distress'],ARRAY[]::text[],ARRAY['meals_logged','distress_rating','behaviors'],'daily',ARRAY['fainting','chest pain','severe electrolyte symptoms','suicidal thoughts','rapid weight loss'],'sensitive',160),

-- Cardio / metabolic
('hypertension','High blood pressure','Hypertension',ARRAY['HTN','high BP'],'cardio_metabolic',ARRAY['cardiovascular'],ARRAY['headaches','dizziness','often silent'],ARRAY['lisinopril','amlodipine','losartan','hydrochlorothiazide'],ARRAY['bp_systolic','bp_diastolic','heart_rate'],'daily',ARRAY['BP above 180/120','chest pain','severe headache','vision changes'],'general',170),
('t1_diabetes','Type 1 diabetes','T1D',ARRAY['type 1','insulin dependent'],'cardio_metabolic',ARRAY['glycemic','autoimmune'],ARRAY['highs','lows','ketones','fatigue'],ARRAY['insulin'],ARRAY['glucose','hba1c','time_in_range','insulin_dose'],'daily',ARRAY['DKA symptoms (nausea, fruity breath)','severe hypoglycemia','glucose unmeasurable'],'general',180),
('t2_diabetes','Type 2 diabetes','T2D',ARRAY['type 2','adult onset'],'cardio_metabolic',ARRAY['glycemic'],ARRAY['highs','fatigue','increased thirst'],ARRAY['metformin','semaglutide','empagliflozin','insulin'],ARRAY['glucose','hba1c','weight','bp'],'daily',ARRAY['glucose > 300 with symptoms','foot ulcer','vision change'],'general',190),
('prediabetes','Pre-diabetes','Pre-diabetes',ARRAY[]::text[],'cardio_metabolic',ARRAY['glycemic'],ARRAY['elevated fasting glucose','elevated A1c'],ARRAY[]::text[],ARRAY['fasting_glucose','hba1c','weight'],'weekly',ARRAY[]::text[],'general',200),
('high_cholesterol','High cholesterol','Cholesterol',ARRAY['hyperlipidemia','dyslipidemia'],'cardio_metabolic',ARRAY['cardiovascular'],ARRAY['often silent'],ARRAY['atorvastatin','rosuvastatin','ezetimibe'],ARRAY['ldl','hdl','triglycerides','total_cholesterol'],'asneeded',ARRAY['chest pain','muscle pain on statin'],'general',210),
('afib','Atrial fibrillation','AFib',ARRAY['AFib','atrial fib'],'cardio_metabolic',ARRAY['cardiovascular','autonomic'],ARRAY['palpitations','fatigue','breathlessness','dizziness'],ARRAY['apixaban','metoprolol','diltiazem','flecainide'],ARRAY['heart_rate','rhythm_episodes','bp'],'daily',ARRAY['chest pain','stroke symptoms (FAST)','fainting'],'general',220),
('heart_failure','Heart failure','Heart failure',ARRAY['CHF','HFrEF','HFpEF'],'cardio_metabolic',ARRAY['cardiovascular','pacing_required'],ARRAY['shortness of breath','swelling','fatigue','weight gain'],ARRAY['furosemide','sacubitril-valsartan','metoprolol','spironolactone'],ARRAY['weight','bp','swelling','breathlessness'],'daily',ARRAY['weight up >2lb/day or 5lb/week','severe breathlessness','chest pain'],'general',230),

-- Autoimmune / inflammatory
('rheumatoid_arthritis','Rheumatoid arthritis','RA',ARRAY['RA'],'autoimmune',ARRAY['autoimmune','inflammatory','pain','pacing_required'],ARRAY['joint pain','morning stiffness','swelling','fatigue'],ARRAY['methotrexate','adalimumab','etanercept','prednisone'],ARRAY['joint_pain','stiffness_minutes','flare_count'],'daily',ARRAY['high fever on biologic','severe new joint redness','infection signs'],'general',240),
('lupus','Lupus (SLE)','Lupus',ARRAY['SLE'],'autoimmune',ARRAY['autoimmune','inflammatory','pacing_required'],ARRAY['fatigue','joint pain','rash','sun sensitivity','flares'],ARRAY['hydroxychloroquine','prednisone','mycophenolate'],ARRAY['fatigue_level','flare_count','rash'],'daily',ARRAY['chest pain','severe headache','high fever','new neurologic symptoms'],'general',250),
('crohns','Crohn''s disease','Crohn''s',ARRAY['IBD'],'autoimmune',ARRAY['autoimmune','inflammatory','gi','pacing_required'],ARRAY['abdominal pain','diarrhea','weight loss','fatigue'],ARRAY['infliximab','adalimumab','azathioprine','budesonide'],ARRAY['bowel_movements','pain_level','flare_count','weight'],'daily',ARRAY['blood in stool with weakness','severe abdominal pain','high fever','dehydration'],'general',260),
('ulcerative_colitis','Ulcerative colitis','UC',ARRAY['IBD','colitis'],'autoimmune',ARRAY['autoimmune','inflammatory','gi'],ARRAY['bloody diarrhea','urgency','abdominal pain'],ARRAY['mesalamine','infliximab','prednisone'],ARRAY['bowel_movements','blood','flare_count'],'daily',ARRAY['heavy bleeding','severe abdominal distension','high fever'],'general',270),
('psoriasis','Psoriasis','Psoriasis',ARRAY[]::text[],'autoimmune',ARRAY['autoimmune','inflammatory','sensory'],ARRAY['plaques','itching','joint pain'],ARRAY['adalimumab','secukinumab','methotrexate','topical steroids'],ARRAY['flare_area','itch_level','joint_pain'],'weekly',ARRAY['widespread red skin','signs of infection in lesions'],'general',280),
('hashimotos','Hashimoto''s / hypothyroidism','Hashimoto''s',ARRAY['hypothyroid','underactive thyroid'],'autoimmune',ARRAY['autoimmune','mood','pacing_required'],ARRAY['fatigue','cold intolerance','weight gain','brain fog'],ARRAY['levothyroxine'],ARRAY['tsh','energy_level','weight'],'asneeded',ARRAY['severe fatigue with cold','myxedema symptoms'],'general',290),
('celiac','Celiac disease','Celiac',ARRAY['gluten intolerance (celiac)'],'autoimmune',ARRAY['autoimmune','gi','nutritional'],ARRAY['diarrhea','bloating','fatigue after gluten','skin rash'],ARRAY[]::text[],ARRAY['gluten_exposures','symptom_score'],'daily',ARRAY['severe dehydration','chronic weight loss'],'general',300),

-- Respiratory
('asthma','Asthma','Asthma',ARRAY[]::text[],'respiratory',ARRAY['respiratory','autonomic'],ARRAY['wheezing','shortness of breath','cough','chest tightness'],ARRAY['albuterol','fluticasone','montelukast','budesonide-formoterol'],ARRAY['peak_flow','rescue_uses','attacks'],'daily',ARRAY['rescue inhaler not working','can''t speak full sentence','lips bluish'],'general',310),
('copd','COPD','COPD',ARRAY['emphysema','chronic bronchitis'],'respiratory',ARRAY['respiratory','pacing_required'],ARRAY['breathlessness','chronic cough','sputum','fatigue'],ARRAY['tiotropium','salbutamol','fluticasone-salmeterol','prednisone bursts'],ARRAY['breathlessness','rescue_uses','sputum_color'],'daily',ARRAY['severe breathlessness','color change in sputum with fever','confusion'],'general',320),
('sleep_apnea','Sleep apnea','Sleep apnea',ARRAY['OSA','obstructive sleep apnea'],'respiratory',ARRAY['respiratory','sleep_critical'],ARRAY['daytime sleepiness','snoring','witnessed apneas','morning headache'],ARRAY[]::text[],ARRAY['cpap_hours','ahi','sleep_quality'],'daily',ARRAY['falling asleep while driving','severe morning headaches'],'general',330),

-- Pain / fatigue / autonomic
('fibromyalgia','Fibromyalgia','Fibro',ARRAY['fibro'],'pain_fatigue',ARRAY['pain','pacing_required','sleep_critical'],ARRAY['widespread pain','fatigue','brain fog','tender points','poor sleep'],ARRAY['duloxetine','pregabalin','amitriptyline'],ARRAY['pain_level','fatigue_level','sleep_quality'],'daily',ARRAY['new severe localized pain','fever with widespread pain'],'general',340),
('chronic_pain','Chronic pain','Chronic pain',ARRAY[]::text[],'pain_fatigue',ARRAY['pain','pacing_required'],ARRAY['persistent pain','fatigue','mood impact','sleep disruption'],ARRAY['gabapentin','duloxetine','NSAIDs'],ARRAY['pain_level','flare_count','mood_rating'],'daily',ARRAY['sudden severe new pain','loss of bowel/bladder control','weakness'],'general',350),
('long_covid','Long COVID / ME-CFS','Long COVID',ARRAY['ME/CFS','chronic fatigue syndrome','post viral'],'pain_fatigue',ARRAY['pacing_required','autonomic','cognitive_load'],ARRAY['fatigue','PEM','brain fog','orthostatic intolerance'],ARRAY['low-dose naltrexone','beta blockers prn'],ARRAY['energy_level','pem_events','activity_load'],'daily',ARRAY['chest pain','fainting','severe new weakness'],'general',360),
('pots','POTS / dysautonomia','POTS',ARRAY['postural tachycardia','dysautonomia'],'pain_fatigue',ARRAY['autonomic','cardiovascular','pacing_required'],ARRAY['lightheadedness on standing','tachycardia','fatigue','brain fog'],ARRAY['midodrine','fludrocortisone','beta blockers','salt tablets'],ARRAY['standing_heart_rate','fluids','salt','dizzy_episodes'],'daily',ARRAY['fainting with injury','chest pain','severe palpitations'],'general',370),
('eds','Ehlers-Danlos (hypermobility)','EDS',ARRAY['hEDS','HSD','hypermobility'],'pain_fatigue',ARRAY['pain','autonomic','pacing_required'],ARRAY['joint pain','subluxations','fatigue','GI issues','dizziness'],ARRAY['gabapentin','PT'],ARRAY['pain_level','subluxations','fatigue_level'],'daily',ARRAY['joint dislocation needing reduction','chest pain','severe GI symptoms'],'general',380),

-- GI / renal / oncology
('ibs','IBS','IBS',ARRAY['irritable bowel'],'gi',ARRAY['gi','autonomic'],ARRAY['abdominal pain','bloating','diarrhea','constipation'],ARRAY['hyoscine','loperamide','linaclotide','peppermint oil'],ARRAY['bowel_movements','pain_level','triggers'],'daily',ARRAY['blood in stool','unexplained weight loss','nighttime symptoms'],'general',390),
('gerd','GERD','GERD',ARRAY['reflux','heartburn'],'gi',ARRAY['gi'],ARRAY['heartburn','regurgitation','cough','sleep disruption'],ARRAY['omeprazole','famotidine','pantoprazole'],ARRAY['reflux_episodes','triggers'],'asneeded',ARRAY['trouble swallowing','blood in vomit','chest pain'],'general',400),
('ckd','Chronic kidney disease','CKD',ARRAY['kidney disease'],'cardio_metabolic',ARRAY['cardiovascular','pacing_required','nutritional'],ARRAY['fatigue','swelling','reduced urine','itch'],ARRAY['lisinopril','furosemide','sevelamer','epoetin'],ARRAY['weight','bp','urine_output','potassium'],'daily',ARRAY['little or no urine','severe shortness of breath','confusion'],'general',410),
('cancer','Cancer (in treatment / survivorship)','Cancer',ARRAY['oncology','chemo','radiation'],'oncology',ARRAY['pacing_required','mood','pain','nutritional'],ARRAY['fatigue','pain','nausea','neuropathy','sleep disruption'],ARRAY[]::text[],ARRAY['fatigue_level','pain_level','treatment_side_effects'],'daily',ARRAY['fever during chemo','uncontrolled bleeding','severe new pain'],'sensitive',420),

-- Special
('caregiver','Caregiving for someone','Caregiver',ARRAY['carer','family caregiver'],'caregiver',ARRAY['caregiver','mood','pacing_required'],ARRAY['caregiver fatigue','sleep loss','overwhelm'],ARRAY[]::text[],ARRAY['hours_caring','self_care','sleep'],'daily',ARRAY['caregiver burnout','suicidal thoughts'],'sensitive',900),
('general','General wellness','General',ARRAY[]::text[],'general',ARRAY['mood','pacing_required'],ARRAY['stress','sleep','habits'],ARRAY[]::text[],ARRAY['sleep_hours','mood_rating','energy_level'],'asneeded',ARRAY[]::text[],'general',999);

-- === 20260609012022_6885d433-460d-4dde-986b-1eee404e9f50.sql ===

-- =========================================================
-- dna_files
-- =========================================================
CREATE TABLE public.dna_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'unknown',
  original_filename text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  byte_size bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'uploaded',
  error_message text,
  parsed_at timestamptz,
  share_with_caregivers boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dna_files_provider_chk CHECK (provider IN ('23andme','ancestry','myheritage','vcf','unknown')),
  CONSTRAINT dna_files_status_chk CHECK (status IN ('uploaded','parsing','parsed','error'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dna_files TO authenticated;
GRANT ALL ON public.dna_files TO service_role;

ALTER TABLE public.dna_files ENABLE ROW LEVEL SECURITY;

-- Owner full access
CREATE POLICY "Owners manage their DNA files"
  ON public.dna_files
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Caregiver read access: requires both an active care relationship with the
-- "reports" scope AND the owner having opted in via share_with_caregivers.
CREATE POLICY "Caregivers may read shared DNA files"
  ON public.dna_files
  FOR SELECT
  TO authenticated
  USING (
    share_with_caregivers = true
    AND public.has_care_scope(user_id, auth.uid(), 'reports')
  );

CREATE INDEX dna_files_user_id_created_at_idx
  ON public.dna_files (user_id, created_at DESC);

CREATE TRIGGER dna_files_set_updated_at
  BEFORE UPDATE ON public.dna_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- dna_variants
-- =========================================================
CREATE TABLE public.dna_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES public.dna_files(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rsid text NOT NULL,
  genotype text NOT NULL,
  chromosome text,
  position bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (file_id, rsid)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dna_variants TO authenticated;
GRANT ALL ON public.dna_variants TO service_role;

ALTER TABLE public.dna_variants ENABLE ROW LEVEL SECURITY;

-- Owner full access
CREATE POLICY "Owners manage their DNA variants"
  ON public.dna_variants
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Caregiver read mirrors the file-level rule
CREATE POLICY "Caregivers may read shared DNA variants"
  ON public.dna_variants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dna_files f
      WHERE f.id = dna_variants.file_id
        AND f.share_with_caregivers = true
        AND public.has_care_scope(f.user_id, auth.uid(), 'reports')
    )
  );

CREATE INDEX dna_variants_file_id_idx ON public.dna_variants (file_id);
CREATE INDEX dna_variants_user_rsid_idx ON public.dna_variants (user_id, rsid);

-- === 20260609012059_a1060b21-5b07-4b91-8aca-b579fda54fad.sql ===

-- Owner-scoped storage policies for the dna-uploads bucket.
-- Path convention: {user_id}/{file_id}/...
CREATE POLICY "Owners read their DNA files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'dna-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Owners upload their DNA files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'dna-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Owners update their DNA files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'dna-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'dna-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Owners delete their DNA files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'dna-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- === 20260609115227_52d2f97a-2bb2-4a96-a861-31d0f0d5d2d2.sql ===

DROP POLICY IF EXISTS "aura_caregiver_select" ON public.aura_events;
CREATE POLICY "aura_caregiver_select" ON public.aura_events
FOR SELECT TO authenticated
USING (public.has_care_scope(user_id, auth.uid(), 'seizures:read'));

DROP POLICY IF EXISTS "food_entries_caregiver_select" ON public.food_entries;
CREATE POLICY "food_entries_caregiver_select" ON public.food_entries
FOR SELECT TO authenticated
USING (public.has_care_scope(user_id, auth.uid(), 'journal:read'));

DROP POLICY IF EXISTS "hydration_caregiver_select" ON public.hydration_intake;
CREATE POLICY "hydration_caregiver_select" ON public.hydration_intake
FOR SELECT TO authenticated
USING (public.has_care_scope(user_id, auth.uid(), 'journal:read'));

-- === 20260609213735_bd9c5b4a-b8a2-42f0-bc1c-a45b4a34e205.sql ===
-- Friendships: zero-data social connections, fully separate from caregivers.
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL,              -- smaller uuid (canonical order)
  user_b uuid,                       -- larger uuid; null until invitee joins
  requested_by uuid NOT NULL,        -- who sent the invite
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','blocked')),
  invite_email text,                 -- invitee email (until they accept)
  invite_token text,                 -- one-time accept token, cleared on accept
  note_a text,                       -- user_a's private nickname for the friendship
  note_b text,                       -- user_b's private nickname for the friendship
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);

CREATE UNIQUE INDEX friendships_pair_unique
  ON public.friendships (user_a, user_b)
  WHERE user_b IS NOT NULL;

CREATE INDEX friendships_user_a_idx ON public.friendships (user_a);
CREATE INDEX friendships_user_b_idx ON public.friendships (user_b);
CREATE INDEX friendships_invite_token_idx ON public.friendships (invite_token) WHERE invite_token IS NOT NULL;
CREATE INDEX friendships_invite_email_idx ON public.friendships (lower(invite_email)) WHERE invite_email IS NOT NULL;

-- Canonical-order trigger: keep user_a < user_b so the pair is unique.
CREATE OR REPLACE FUNCTION public.friendships_normalize_pair()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.user_b IS NOT NULL AND NEW.user_a > NEW.user_b THEN
    -- swap
    DECLARE
      tmp_id uuid := NEW.user_a;
      tmp_note text := NEW.note_a;
    BEGIN
      NEW.user_a := NEW.user_b;
      NEW.user_b := tmp_id;
      NEW.note_a := NEW.note_b;
      NEW.note_b := tmp_note;
    END;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER friendships_normalize_pair_trg
BEFORE INSERT OR UPDATE ON public.friendships
FOR EACH ROW EXECUTE FUNCTION public.friendships_normalize_pair();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- SELECT: only participants can see the row.
CREATE POLICY "Friends can read their own friendships"
ON public.friendships
FOR SELECT
TO authenticated
USING (auth.uid() = user_a OR auth.uid() = user_b OR auth.uid() = requested_by);

-- INSERT: only the inviter, and they must be one of user_a/user_b (or user_b null for email invite).
CREATE POLICY "Users can create their own friendship invites"
ON public.friendships
FOR INSERT
TO authenticated
WITH CHECK (
  requested_by = auth.uid()
  AND (auth.uid() = user_a OR auth.uid() = user_b OR user_b IS NULL)
);

-- UPDATE: participants only (accept, change nickname, block).
CREATE POLICY "Participants can update friendship"
ON public.friendships
FOR UPDATE
TO authenticated
USING (auth.uid() = user_a OR auth.uid() = user_b OR auth.uid() = requested_by)
WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b OR auth.uid() = requested_by);

-- DELETE: either side can remove the friendship.
CREATE POLICY "Participants can delete friendship"
ON public.friendships
FOR DELETE
TO authenticated
USING (auth.uid() = user_a OR auth.uid() = user_b OR auth.uid() = requested_by);
-- === 20260609214536_04c6b833-013a-4c57-a739-c142ce35d100.sql ===
ALTER TABLE public.friendships ADD COLUMN IF NOT EXISTS refer_code text;
CREATE UNIQUE INDEX IF NOT EXISTS friendships_refer_code_unique ON public.friendships (refer_code) WHERE refer_code IS NOT NULL;
ALTER TABLE public.friendships ALTER COLUMN invite_email DROP NOT NULL;
-- === 20260609225318_01b0513c-e900-48c2-9c73-b5bae259befb.sql ===
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS pronouns;
-- === 20260610012220_0795a500-2c86-45fc-ae98-8cb6b5e32d1c.sql ===
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_nudge_dismissed_at timestamptz;

ALTER TABLE public.friendships
  ADD COLUMN IF NOT EXISTS share_basics boolean NOT NULL DEFAULT false;
-- === 20260610015929_884db961-e731-48bf-bf1b-e58810a012d2.sql ===
ALTER TABLE public.dna_files
  ADD COLUMN IF NOT EXISTS compression text,
  ADD COLUMN IF NOT EXISTS kind text;
-- === 20260610104014_b4b27cb6-ed4a-41b4-a590-6528f8e83dd2.sql ===

-- subscriptions
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  price_id text,
  status text NOT NULL DEFAULT 'inactive',
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own subscription" ON public.subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- app_settings (singleton)
CREATE TABLE public.app_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  pro_free_for_everyone boolean NOT NULL DEFAULT true,
  pro_features jsonb NOT NULL DEFAULT '{"dna":true,"ask_unlimited":true,"report_sharing":true,"caregiver_seats":true}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO authenticated, anon;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read app_settings" ON public.app_settings
  FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "super admins update app_settings" ON public.app_settings
  FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "super admins insert app_settings" ON public.app_settings
  FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()));

INSERT INTO public.app_settings (id) VALUES (true) ON CONFLICT DO NOTHING;

CREATE TRIGGER app_settings_set_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- has_pro
CREATE OR REPLACE FUNCTION public.has_pro(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE((SELECT pro_free_for_everyone FROM public.app_settings WHERE id = true), false)
    OR public.is_super_admin(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.user_id = _user_id
        AND s.status IN ('active','trialing','past_due')
        AND (s.current_period_end IS NULL OR s.current_period_end > now())
    );
$$;

-- === 20260610210541_dbc80d9d-7f5b-4ea4-a347-0f3a5378afda.sql ===
-- Backfill dna_files.kind from filename for old rows that predate the kind column.
UPDATE public.dna_files
SET kind = CASE
  WHEN original_filename ~* '\.bam$'                       THEN 'bam'
  WHEN original_filename ~* '\.cram$'                      THEN 'cram'
  WHEN original_filename ~* '\.(tbi|crai|bai|csi)$'        THEN 'index'
  WHEN original_filename ~* '\.vcf(\.gz)?$'                THEN 'vcf'
  WHEN original_filename ~* '\.json(\.gz)?$'               THEN 'json'
  WHEN original_filename ~* '\.(txt|tsv|csv)(\.gz)?$'      THEN 'genotype'
  ELSE 'unknown'
END
WHERE kind IS NULL;
-- === 20260610211312_5585c532-9787-45e1-bb94-5f8f8aa5b246.sql ===
DELETE FROM public.dna_variants
WHERE file_id IN (
  '83d55def-56c7-4c73-b1cb-fcbb48d7ebd6',
  '52461e70-ba6f-4ac3-81dc-506854be84e2'
);

DELETE FROM public.dna_files
WHERE id IN (
  '83d55def-56c7-4c73-b1cb-fcbb48d7ebd6',
  '52461e70-ba6f-4ac3-81dc-506854be84e2'
);
-- === 20260610213000_b8552115-baf6-412d-8366-753f209c3186.sql ===
ALTER TABLE public.dna_files
  ADD COLUMN IF NOT EXISTS parse_stats jsonb NOT NULL DEFAULT '{"rowsScanned":0,"curatedMatches":0}'::jsonb;
-- === 20260610214706_e959a35b-c9b9-4969-b715-5b1b44af3597.sql ===
-- Add report_category column for Health Records hub categorization.
ALTER TABLE public.report_documents
  ADD COLUMN IF NOT EXISTS report_category text;

CREATE INDEX IF NOT EXISTS report_documents_user_category_idx
  ON public.report_documents (user_id, report_category);

-- Backfill existing rows from report_type + title using simple keyword rules.
UPDATE public.report_documents
SET report_category = CASE
  WHEN report_type IN ('imaging_mri') THEN 'mri'
  WHEN report_type IN ('imaging_ct') THEN 'ct'
  WHEN report_type IN ('imaging_xray') THEN 'xray'
  WHEN report_type IN ('imaging_ultrasound') THEN 'ultrasound'
  WHEN report_type IN ('blood_panel','lipid_panel','thyroid_panel','metabolic_panel','vitamin_panel','hormone_panel') THEN 'blood'
  WHEN lower(coalesce(title,'')) ~ '\m(mri)\M' THEN 'mri'
  WHEN lower(coalesce(title,'')) ~ '\m(ct|cat scan)\M' THEN 'ct'
  WHEN lower(coalesce(title,'')) ~ '\m(x[- ]?ray|xray|radiograph)\M' THEN 'xray'
  WHEN lower(coalesce(title,'')) ~ '\m(ultrasound|sonogram|echo)\M' THEN 'ultrasound'
  WHEN lower(coalesce(title,'')) ~ '\m(ecg|ekg|holter|cardiac)\M' THEN 'cardiology'
  WHEN lower(coalesce(title,'')) ~ '\m(biopsy|pathology|cytology|histology)\M' THEN 'pathology'
  WHEN lower(coalesce(title,'')) ~ '\m(prescription|discharge|referral|note|consult)\M' THEN 'notes'
  WHEN lower(coalesce(title,'')) ~ '\m(cbc|lipid|panel|glucose|iron|vitamin|thyroid|tsh|metabolic|hormone|blood)\M' THEN 'blood'
  ELSE 'other'
END
WHERE report_category IS NULL;
-- === 20260610215440_2c9a8564-a2ec-47de-9b9c-1f7f07a77c6a.sql ===
CREATE TABLE public.vitals_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('weight','bp','glucose','spo2','temp','resp_rate')),
  value NUMERIC,
  value2 NUMERIC,
  unit TEXT,
  notes TEXT,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX vitals_log_user_kind_time_idx ON public.vitals_log (user_id, kind, measured_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vitals_log TO authenticated;
GRANT ALL ON public.vitals_log TO service_role;

ALTER TABLE public.vitals_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own vitals log"
  ON public.vitals_log FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- === 20260610220729_67479f1b-8a71-438a-bab6-26c103bd4b67.sql ===
-- Phase 4: AI summary cache on reports
ALTER TABLE public.report_documents
  ADD COLUMN IF NOT EXISTS ai_summary jsonb,
  ADD COLUMN IF NOT EXISTS ai_summary_at timestamptz;

-- Phase 7: Vital goals / targets
CREATE TABLE IF NOT EXISTS public.vital_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('weight','bp','glucose','spo2','temp','resp_rate')),
  target_min numeric,
  target_max numeric,
  target_min2 numeric,
  target_max2 numeric,
  unit text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vital_goals TO authenticated;
GRANT ALL ON public.vital_goals TO service_role;

ALTER TABLE public.vital_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vital_goals_own" ON public.vital_goals
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER vital_goals_updated_at
  BEFORE UPDATE ON public.vital_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- === 20260610224921_5d3ed7fc-77ce-414c-aa70-88c8b8bc150f.sql ===

-- 1) Revoke user_id column SELECT from anon on community tables
REVOKE SELECT (user_id) ON public.community_posts FROM anon;
REVOKE SELECT (user_id) ON public.community_comments FROM anon;

-- 2) Care relationships: hide invite_token from caregivers, and clear after acceptance
REVOKE SELECT (invite_token) ON public.care_relationships FROM authenticated;
GRANT SELECT (invite_token) ON public.care_relationships TO service_role;

-- Nullify any already-accepted/declined/revoked invite tokens still lingering
UPDATE public.care_relationships
  SET invite_token = NULL
  WHERE status <> 'pending' AND invite_token IS NOT NULL;

-- Attach trigger so invite_token is cleared on status change (function already exists)
DROP TRIGGER IF EXISTS trg_care_clear_invite_token ON public.care_relationships;
CREATE TRIGGER trg_care_clear_invite_token
  BEFORE INSERT OR UPDATE ON public.care_relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.care_clear_invite_token_on_accept();

-- 3) Care scopes: require active relationship for caregiver reads
DROP POLICY IF EXISTS care_scopes_caregiver_select ON public.care_scopes;
CREATE POLICY care_scopes_caregiver_select ON public.care_scopes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.care_relationships r
      WHERE r.id = care_scopes.relationship_id
        AND r.caregiver_id = auth.uid()
        AND r.status = 'active'
        AND (r.expires_at IS NULL OR r.expires_at > now())
    )
  );

-- 4) Platform rules: admins only
DROP POLICY IF EXISTS platform_rules_read ON public.platform_rules;
CREATE POLICY platform_rules_read ON public.platform_rules
  FOR SELECT
  USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

-- === 20260610231240_2f09f1b5-d48f-4171-a00e-e298f5060606.sql ===
CREATE POLICY report_metrics_caregiver_select ON public.report_metrics
  FOR SELECT
  USING (public.has_care_scope(user_id, auth.uid(), 'reports:read'));
-- === 20260611010000_remove_lovable_ai_provider.sql ===
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

-- === 20260612001000_peripheral_feature_flags.sql ===
-- Dark-launch flags for peripheral surfaces graded B/C in docs/LAUNCH-AUDIT.md.
-- Same pattern as pro_free_for_everyone: columns on the app_settings singleton,
-- readable by everyone, writable by super admins.

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS feature_community_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_dna_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_friends_enabled boolean NOT NULL DEFAULT false;

-- === 20260612002000_notification_delivery_log.sql ===
-- Medication reminder delivery instrumentation (docs/RELIABILITY.md).
-- One row per notification fire (or per acknowledgment when the fire was
-- never logged, e.g. notification clicked after a device restart).

CREATE TABLE public.notification_delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dose_id uuid REFERENCES public.medication_doses(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  fired_at timestamptz,
  delivery_channel text NOT NULL CHECK (delivery_channel IN ('sw_local', 'web_push')),
  acknowledged_at timestamptz,
  acknowledged_action text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_delivery_user_scheduled
  ON public.notification_delivery_log (user_id, scheduled_at DESC);
CREATE INDEX idx_notification_delivery_dose
  ON public.notification_delivery_log (dose_id);

ALTER TABLE public.notification_delivery_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners read own delivery log" ON public.notification_delivery_log
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "owners insert own delivery log" ON public.notification_delivery_log
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "owners update own delivery log" ON public.notification_delivery_log
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.notification_delivery_log TO authenticated;
GRANT ALL ON public.notification_delivery_log TO service_role;

-- === 20260614172907_dc22e2fc-3f4a-4a31-96db-7f5480df0146.sql ===
CREATE TABLE public.notification_delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dose_id uuid REFERENCES public.medication_doses(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  fired_at timestamptz,
  delivery_channel text NOT NULL CHECK (delivery_channel IN ('sw_local', 'web_push')),
  acknowledged_at timestamptz,
  acknowledged_action text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_delivery_user_scheduled
  ON public.notification_delivery_log (user_id, scheduled_at DESC);
CREATE INDEX idx_notification_delivery_dose
  ON public.notification_delivery_log (dose_id);

GRANT SELECT, INSERT, UPDATE ON public.notification_delivery_log TO authenticated;
GRANT ALL ON public.notification_delivery_log TO service_role;

ALTER TABLE public.notification_delivery_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners read own delivery log" ON public.notification_delivery_log
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "owners insert own delivery log" ON public.notification_delivery_log
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "owners update own delivery log" ON public.notification_delivery_log
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- === 20260614174317_2f1d28f4-5c40-4ecf-8285-a7ae6e1e323a.sql ===
-- 1) Hide community author UUIDs from anonymous visitors (defense in depth at column-grant level)
REVOKE SELECT (user_id) ON public.community_posts FROM anon;
REVOKE SELECT (user_id) ON public.community_comments FROM anon;

-- 2) Restrict raw invite_token on care_relationships: only service_role may read it.
--    Owners and caregivers can still see every other column via their existing RLS policies;
--    owners receive the token via the createInvite server function (returned at creation time)
--    and never need to re-read it from the row.
REVOKE SELECT (invite_token) ON public.care_relationships FROM anon, authenticated;

-- 3) Wire the existing care_clear_invite_token_on_accept() function as an actual trigger,
--    so any non-pending status nullifies the token at the database level.
DROP TRIGGER IF EXISTS care_relationships_clear_invite_token ON public.care_relationships;
CREATE TRIGGER care_relationships_clear_invite_token
  BEFORE UPDATE ON public.care_relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.care_clear_invite_token_on_accept();

# Manual deploy bundle (Wave 1)

Use this when Supabase CLI returns 403 or migrations cannot be pushed from CI. Apply in order.

---

## Section 1 — Run in Supabase SQL Editor

Open: https://supabase.com/dashboard/project/lzuodgpqseijhhyzgfky/sql/new

Paste and run the following blocks in filename order.

-- BEGIN 20260523031938_c55196fc-c90f-42d5-b6d1-fe1bed1c307b.sql

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

$$
;

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

-- END 20260523031938_c55196fc-c90f-42d5-b6d1-fe1bed1c307b.sql

-- BEGIN 20260523031955_b8d29471-642f-4b14-adb1-8c13d862aef2.sql

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- END 20260523031955_b8d29471-642f-4b14-adb1-8c13d862aef2.sql

-- BEGIN 20260523032649_b9be34a7-f8cc-40ea-aac0-ce8267c32225.sql
ALTER TABLE public.journal_entries REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.journal_entries;
-- END 20260523032649_b9be34a7-f8cc-40ea-aac0-ce8267c32225.sql

-- BEGIN 20260523081851_fdbd4c1c-974c-4ffe-baeb-fc4ee9cd0cee.sql

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
as
$$

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

$$
;

-- END 20260523081851_fdbd4c1c-974c-4ffe-baeb-fc4ee9cd0cee.sql

-- BEGIN 20260523081909_53af920d-8a72-4fe7-99e0-6332569bdf6b.sql

revoke execute on function public.match_ai_memory(vector, uuid, int, int) from public;
revoke execute on function public.match_ai_memory(vector, uuid, int, int) from anon;
revoke execute on function public.match_ai_memory(vector, uuid, int, int) from authenticated;

-- END 20260523081909_53af920d-8a72-4fe7-99e0-6332569bdf6b.sql

-- BEGIN 20260523111655_028423e8-a70d-46b7-b502-57c513489b9b.sql

-- Seed today's medication_doses rows and reconcile yesterday's misses.
create or replace function public.seed_daily_medication_doses()
returns void
language plpgsql
security definer
set search_path = public
as
$$

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

$$
;

-- Adherence over the last N days for a single medication.
create or replace function public.medication_adherence(med_id uuid, days_back integer default 14)
returns table(scheduled_count bigint, taken_count bigint, adherence_pct numeric)
language sql
stable
security definer
set search_path = public
as
$$

select
count(_)::bigint as scheduled_count,
count(_) filter (where status = 'taken')::bigint as taken_count,
case when count(_) = 0 then 0
else round((count(_) filter (where status = 'taken'))::numeric _ 100 / count(_), 0)
end as adherence_pct
from public.medication_doses d
where d.medication_id = med_id
and d.scheduled_at >= now() - make_interval(days => days_back)
and d.scheduled_at < now() + interval '1 day';

$$
;

-- END 20260523111655_028423e8-a70d-46b7-b502-57c513489b9b.sql

-- BEGIN 20260523111720_20a9100a-6745-44e3-ad71-26c1f26c6835.sql

-- Seed routine is only ever invoked by the scheduled job; lock public access.
revoke execute on function public.seed_daily_medication_doses() from public, anon, authenticated;

-- Adherence helper should run as the caller so existing RLS applies.
create or replace function public.medication_adherence(med_id uuid, days_back integer default 14)
returns table(scheduled_count bigint, taken_count bigint, adherence_pct numeric)
language sql
stable
security invoker
set search_path = public
as
$$

select
count(_)::bigint as scheduled_count,
count(_) filter (where status = 'taken')::bigint as taken_count,
case when count(_) = 0 then 0
else round((count(_) filter (where status = 'taken'))::numeric _ 100 / count(_), 0)
end as adherence_pct
from public.medication_doses d
where d.medication_id = med_id
and d.scheduled_at >= now() - make_interval(days => days_back)
and d.scheduled_at < now() + interval '1 day';

$$
;

-- END 20260523111720_20a9100a-6745-44e3-ad71-26c1f26c6835.sql

-- BEGIN 20260524015024_d598ed75-5326-4ab5-8655-f2a5c909586d.sql
-- Restrict Realtime channel access to topics that end with the authenticated user's ID.
-- Wrapped in DO block because realtime.messages may not exist on every project version.
DO
$$

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

$$
;
-- END 20260524015024_d598ed75-5326-4ab5-8655-f2a5c909586d.sql

-- BEGIN 20260524022536_4c29ef19-2e45-49cc-914a-9f92fb0a1000.sql
CREATE UNIQUE INDEX IF NOT EXISTS risk_forecasts_user_for_date_uniq
  ON public.risk_forecasts (user_id, for_date);
-- END 20260524022536_4c29ef19-2e45-49cc-914a-9f92fb0a1000.sql

-- BEGIN 20260524075249_e73e2cfe-adf0-4ae7-9bbb-d1256ea1f3e5.sql
ALTER TABLE public.oura_tokens
ADD COLUMN IF NOT EXISTS sync_interval_hours smallint NOT NULL DEFAULT 12
CHECK (sync_interval_hours IN (0, 1, 6, 12, 24));
-- END 20260524075249_e73e2cfe-adf0-4ae7-9bbb-d1256ea1f3e5.sql

-- BEGIN 20260524102829_c29fc111-402b-47ce-96aa-0c673a4a6029.sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;
-- END 20260524102829_c29fc111-402b-47ce-96aa-0c673a4a6029.sql

-- BEGIN 20260525120000_meds_supplements_and_side_effects.sql
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

-- END 20260525120000_meds_supplements_and_side_effects.sql

-- BEGIN 20260525140000_research_sources.sql
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
as
$$

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

$$
;

revoke execute on function public.match_research_library(vector, int) from public;
revoke execute on function public.match_research_library(vector, int) from anon;
revoke execute on function public.match_research_library(vector, int) from authenticated;

-- END 20260525140000_research_sources.sql

---

## Section 2 — Deploy edge functions

Dashboard: https://supabase.com/dashboard/project/lzuodgpqseijhhyzgfky/functions

Functions new or modified in the last 48 hours (Wave 1 PRs):

- **ai-orchestrator**: `supabase functions deploy ai-orchestrator`
- **journal-processor**: `supabase functions deploy journal-processor`
- **med-dose-action**: `supabase functions deploy med-dose-action`
- **oura-sync**: `supabase functions deploy oura-sync`
- **risk-forecaster**: `supabase functions deploy risk-forecaster`

---

## Section 3 — Required env vars (Edge Functions)

Set in: https://supabase.com/dashboard/project/lzuodgpqseijhhyzgfky/settings/functions

Unique `Deno.env.get()` names found in `supabase/functions/`:

| Variable | Likely required |
|----------|-----------------|
| `SUPABASE_URL` | Yes (auto-injected) |
| `SUPABASE_ANON_KEY` | Yes (auto-injected) |
| `SUPABASE_PUBLISHABLE_KEY` | Fallback for anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes — cross-table writes |
| `ANTHROPIC_API_KEY` | Yes — ai-orchestrator, journal-processor, risk-forecaster |
| `OPENAI_API_KEY` | Yes — embeddings + Whisper |
| `OURA_CLIENT_ID` | If using Oura sync |
| `OURA_CLIENT_SECRET` | If using Oura sync |
| `LOVABLE_API_KEY` | Legacy fallback in some functions — prefer Anthropic |

**Minimum for research + Ask:** `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## Section 4 — Run the research seed

After migrations and `ai-orchestrator` deploy:

```bash
bun run seed:research
```

Equivalent:

```bash
bun run supabase/seeds/research_sources.ts
```

**Required in `.env` (repo root):**

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

Idempotent; safe to re-run.


$$

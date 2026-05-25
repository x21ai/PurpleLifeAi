
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

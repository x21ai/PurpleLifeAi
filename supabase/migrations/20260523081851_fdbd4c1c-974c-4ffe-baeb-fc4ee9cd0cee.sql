
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

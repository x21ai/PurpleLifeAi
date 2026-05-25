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


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
